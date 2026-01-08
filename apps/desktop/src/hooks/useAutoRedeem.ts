import { useEffect, useRef } from 'react';
import { loadConfig } from '../lib/store';
import { getShiftClient } from '../lib/shift';
import { fetchAvailableCodes } from '../lib/api';
import { redeemShiftCode } from '../lib/redemption';
import { isRedemptionInProgress, setRedemptionInProgress } from '../lib/redemptionLock';
import { emitRedemptionProgress } from '../lib/redemptionEvents';
import { sendNotification, isPermissionGranted, requestPermission } from '@tauri-apps/plugin-notification';

async function notify(title: string, body: string) {
    try {
        let permissionGranted = await isPermissionGranted();
        if (!permissionGranted) {
            const permission = await requestPermission();
            permissionGranted = permission === 'granted';
        }

        if (permissionGranted) {
            sendNotification({ title, body });
        }
    } catch (err) {
        console.error('Failed to send notification:', err);
    }
}


export function useAutoRedeem() {
    const isRunning = useRef(false);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        const runAutoRedeem = async () => {
            // Skip if already running or manual redemption in progress
            if (isRunning.current || isRedemptionInProgress()) {
                console.log('[AutoRedeem] Skipped - redemption already in progress');
                return;
            }

            try {
                const client = getShiftClient();
                if (!client.isAuthenticated()) return;

                const config = await loadConfig();
                if (!config.autoRedeem) return;

                console.log('[AutoRedeem] Starting check...');
                isRunning.current = true;
                setRedemptionInProgress(true);

                // Fetch codes
                const { available } = await fetchAvailableCodes(config.games);

                if (available.length === 0) {
                    console.log('[AutoRedeem] No new codes found.');
                    return;
                }

                console.log(`[AutoRedeem] Found ${available.length} codes to redeem.`);

                console.log(`[AutoRedeem] Found ${available.length} codes to redeem.`);

                // Notify start
                if (config.notifyOnAutoRedeem) {
                    await notify('YASCAR Auto-Redeem', `Starting redemption of ${available.length} Shift codes...`);
                }

                const results: { code: string; success: boolean; message: string }[] = [];

                // Emit initial progress
                emitRedemptionProgress({
                    current: 0,
                    total: available.length,
                    status: 'checking',
                    results: [],
                });

                // Redeem each code sequentially
                for (let i = 0; i < available.length; i++) {
                    const code = available[i];

                    // Emit progress update
                    emitRedemptionProgress({
                        current: i + 1,
                        total: available.length,
                        currentCode: code.code,
                        status: 'redeeming',
                        results: [...results],
                    });

                    try {
                        console.log(`[AutoRedeem] Redeeming code: ${code.code}`);
                        const result = await redeemShiftCode(code);
                        console.log(`[AutoRedeem] Result for ${code.code}:`, result);
                        results.push({ code: code.code, ...result });
                    } catch (err) {
                        console.error(`[AutoRedeem] Error redeeming ${code.code}:`, err);
                        const errMsg = err instanceof Error ? err.message : 'Unknown error';
                        results.push({ code: code.code, success: false, message: errMsg });
                    }
                }


                // Notify complete
                if (config.notifyOnAutoRedeem) {
                    const successCount = results.filter(r => r.success).length;
                    await notify('YASCAR Auto-Redeem Complete', `Redeemed ${successCount}/${available.length} codes successfully.`);
                }

                // Emit completion
                emitRedemptionProgress({
                    current: available.length,
                    total: available.length,
                    status: 'done',
                    results,
                });

                console.log('[AutoRedeem] Cycle complete.');
            } catch (err) {
                console.error('[AutoRedeem] Error in auto-redeem cycle:', err);
            } finally {
                isRunning.current = false;
                setRedemptionInProgress(false);
            }
        };

        const scheduleNext = async () => {
            // Load config to get the user's interval setting
            const config = await loadConfig();
            const intervalMs = (config.checkIntervalMinutes || 60) * 60 * 1000;

            console.log(`[AutoRedeem] Next check in ${config.checkIntervalMinutes || 60} minutes`);

            timeoutRef.current = setTimeout(async () => {
                await runAutoRedeem();
                scheduleNext(); // Schedule next after completion
            }, intervalMs);
        };

        // Run once after a short delay, then schedule recurring
        const initialTimer = setTimeout(async () => {
            await runAutoRedeem();
            scheduleNext();
        }, 5000);

        return () => {
            clearTimeout(initialTimer);
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);
}
