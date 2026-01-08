import { useEffect, useRef } from 'react';
import { loadConfig } from '../lib/store';
import { getShiftClient } from '../lib/shift';
import { fetchAvailableCodes } from '../lib/api';
import { redeemShiftCode } from '../lib/redemption';
import { useAppStore } from '../stores/useAppStore';
import { getUserMessage } from '../lib/errors';
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
            const store = useAppStore.getState();

            // Skip if already running or manual redemption in progress
            if (isRunning.current || store.isRedemptionInProgress()) {
                console.log('[AutoRedeem] Skipped - redemption already in progress');
                return;
            }

            // Check network status before starting
            if (!store.isOnline) {
                console.log('[AutoRedeem] Skipped - offline');
                return;
            }

            try {
                const client = getShiftClient();
                if (!client.isAuthenticated()) return;

                const config = await loadConfig();
                if (!config.autoRedeem) return;

                console.log('[AutoRedeem] Starting check...');
                isRunning.current = true;

                // Fetch codes
                let available;
                try {
                    const result = await fetchAvailableCodes(config.games);
                    available = result.available;
                } catch (fetchErr) {
                    console.error('[AutoRedeem] Failed to fetch codes:', fetchErr);
                    if (config.notifyOnAutoRedeem) {
                        await notify('YASCAR Auto-Redeem Error', `Failed to check for new codes: ${getUserMessage(fetchErr)}`);
                    }
                    return;
                }

                if (available.length === 0) {
                    console.log('[AutoRedeem] No new codes found.');
                    return;
                }

                console.log(`[AutoRedeem] Found ${available.length} codes to redeem.`);

                if (config.notifyOnAutoRedeem) {
                    await notify('YASCAR Auto-Redeem', `Starting redemption of ${available.length} Shift codes...`);
                }

                const results: { code: string; success: boolean; message: string }[] = [];

                // Set initial progress using store
                store.setRedemptionProgress({
                    current: 0,
                    total: available.length,
                    status: 'checking',
                    results: [],
                });

                // Redeem each code sequentially
                for (let i = 0; i < available.length; i++) {
                    const code = available[i];

                    // Check network before each redemption
                    if (!useAppStore.getState().isOnline) {
                        console.log('[AutoRedeem] Connection lost, stopping...');
                        results.push({ code: code.code, success: false, message: 'Connection lost' });
                        break;
                    }

                    // Update progress using store
                    store.setRedemptionProgress({
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
                        const errMsg = getUserMessage(err);
                        results.push({ code: code.code, success: false, message: errMsg });
                    }
                }

                // Notify complete
                if (config.notifyOnAutoRedeem) {
                    const successCount = results.filter(r => r.success).length;
                    const failCount = results.filter(r => !r.success).length;

                    if (failCount > 0) {
                        await notify(
                            'YASCAR Auto-Redeem Complete',
                            `Redeemed ${successCount}/${available.length} codes. ${failCount} failed - check the app for details.`
                        );
                    } else {
                        await notify('YASCAR Auto-Redeem Complete', `Successfully redeemed ${successCount} codes!`);
                    }
                }

                // Set completion using store
                store.setRedemptionProgress({
                    current: available.length,
                    total: available.length,
                    status: 'done',
                    results,
                });

                console.log('[AutoRedeem] Cycle complete.');
            } catch (err) {
                console.error('[AutoRedeem] Error in auto-redeem cycle:', err);

                // Set error status using store
                useAppStore.getState().setRedemptionProgress({
                    current: 0,
                    total: 0,
                    status: 'error',
                    results: [{ code: '', success: false, message: getUserMessage(err) }],
                });

                try {
                    const config = await loadConfig();
                    if (config.notifyOnAutoRedeem) {
                        await notify('YASCAR Auto-Redeem Error', `An unexpected error occurred: ${getUserMessage(err)}`);
                    }
                } catch {
                    // Ignore notification errors
                }
            } finally {
                isRunning.current = false;
            }
        };

        const scheduleNext = async () => {
            const config = await loadConfig();
            const intervalMs = (config.checkIntervalMinutes || 60) * 60 * 1000;

            console.log(`[AutoRedeem] Next check in ${config.checkIntervalMinutes || 60} minutes`);

            timeoutRef.current = setTimeout(async () => {
                await runAutoRedeem();
                scheduleNext();
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

