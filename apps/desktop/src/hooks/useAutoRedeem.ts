import { useEffect, useRef } from 'react';
import { loadConfig, getNextAutoRedeemAt, setNextAutoRedeemAt as persistNextAutoRedeemAt } from '../lib/store';
import { getShiftClient } from '../lib/shift';
import { fetchAvailableCodes } from '../lib/api';
import { redeemShiftCode } from '../lib/redemption';
import { useAppStore } from '../stores/useAppStore';
import { getUserMessage } from '../lib/errors';
import { sendNotification, isPermissionGranted, requestPermission } from '@tauri-apps/plugin-notification';

// Check interval: how often we poll to see if it's time to run (30 seconds)
const CHECK_INTERVAL_MS = 30 * 1000;

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

    useEffect(() => {
        const runAutoRedeem = async () => {
            const store = useAppStore.getState();

            // Skip if already running or manual redemption in progress
            if (isRunning.current || store.isRedemptionInProgress()) {
                console.log('[AutoRedeem] Skipped - redemption already in progress');
                return;
            }

            // Check network status
            if (!store.isOnline) {
                console.log('[AutoRedeem] Skipped - offline');
                return;
            }

            try {
                const client = getShiftClient();
                if (!client.isAuthenticated()) {
                    console.log('[AutoRedeem] Skipped - not authenticated');
                    return;
                }

                const config = await loadConfig();
                if (!config.autoRedeem) {
                    console.log('[AutoRedeem] Skipped - auto-redeem disabled');
                    return;
                }

                console.log('[AutoRedeem] Starting redemption cycle...');
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

                store.setRedemptionProgress({
                    current: 0,
                    total: available.length,
                    status: 'checking',
                    results: [],
                });

                for (let i = 0; i < available.length; i++) {
                    const code = available[i];

                    if (!useAppStore.getState().isOnline) {
                        console.log('[AutoRedeem] Connection lost, stopping...');
                        results.push({ code: code.code, success: false, message: 'Connection lost' });
                        break;
                    }

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
                        results.push({ code: code.code, success: false, message: getUserMessage(err) });
                    }
                }

                // Notify complete
                if (config.notifyOnAutoRedeem) {
                    const successCount = results.filter(r => r.success).length;
                    const failCount = results.filter(r => !r.success).length;

                    if (failCount > 0) {
                        await notify(
                            'YASCAR Auto-Redeem Complete',
                            `Redeemed ${successCount}/${available.length} codes. ${failCount} failed.`
                        );
                    } else {
                        await notify('YASCAR Auto-Redeem Complete', `Successfully redeemed ${successCount} codes!`);
                    }
                }

                store.setRedemptionProgress({
                    current: available.length,
                    total: available.length,
                    status: 'done',
                    results,
                });

                console.log('[AutoRedeem] Cycle complete.');
            } catch (err) {
                console.error('[AutoRedeem] Error in auto-redeem cycle:', err);
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

        const scheduleNextRun = async () => {
            const config = await loadConfig();
            const intervalMs = (config.checkIntervalMinutes || 60) * 60 * 1000;
            const nextTime = new Date(Date.now() + intervalMs);

            // Persist to storage (survives app restart)
            await persistNextAutoRedeemAt(nextTime);
            // Update React state for UI
            useAppStore.getState().setNextAutoRedeemAt(nextTime);

            console.log(`[AutoRedeem] Next run scheduled for ${nextTime.toLocaleTimeString()}`);
        };

        const checkAndRun = async () => {
            const config = await loadConfig();

            // Don't do anything if auto-redeem is disabled
            if (!config.autoRedeem) {
                useAppStore.getState().setNextAutoRedeemAt(null);
                return;
            }

            // Get the scheduled next run time
            let nextRunAt = await getNextAutoRedeemAt();

            // If no scheduled time or it's in the past, run now and schedule next
            if (!nextRunAt || nextRunAt <= new Date()) {
                console.log('[AutoRedeem] Time to run! Executing auto-redeem...');
                await runAutoRedeem();
                await scheduleNextRun();
            } else {
                // Just update the UI with current scheduled time
                useAppStore.getState().setNextAutoRedeemAt(nextRunAt);
            }
        };

        // Initial check shortly after mount
        const initialTimer = setTimeout(checkAndRun, 3000);

        // Set up recurring check interval
        const intervalId = setInterval(checkAndRun, CHECK_INTERVAL_MS);

        return () => {
            clearTimeout(initialTimer);
            clearInterval(intervalId);
        };
    }, []);
}
