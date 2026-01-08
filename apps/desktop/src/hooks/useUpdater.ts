import { useEffect, useState } from 'react';
import { check } from '@tauri-apps/plugin-updater';
import { ask } from '@tauri-apps/plugin-dialog';
import { relaunch } from '@tauri-apps/plugin-process';

export interface UpdateStatus {
    checking: boolean;
    available: boolean;
    downloading: boolean;
    progress: number;
    error: string | null;
}

export function useUpdater() {
    const [status, setStatus] = useState<UpdateStatus>({
        checking: false,
        available: false,
        downloading: false,
        progress: 0,
        error: null,
    });

    useEffect(() => {
        // Skip update check in dev mode
        if (import.meta.env.DEV) {
            console.log('[Updater] Skipping update check in dev mode');
            return;
        }
        checkForUpdates();
    }, []);

    const checkForUpdates = async () => {
        try {
            setStatus(s => ({ ...s, checking: true, error: null }));

            const update = await check();

            if (update) {
                setStatus(s => ({ ...s, checking: false, available: true }));

                const shouldUpdate = await ask(
                    `A new version (${update.version}) is available!\n\nWould you like to download and install it now?`,
                    {
                        title: 'YASCAR Update Available',
                        kind: 'info',
                        okLabel: 'Update Now',
                        cancelLabel: 'Later',
                    }
                );

                if (shouldUpdate) {
                    setStatus(s => ({ ...s, downloading: true }));

                    let downloaded = 0;
                    let contentLength = 0;

                    await update.downloadAndInstall((event) => {
                        switch (event.event) {
                            case 'Started':
                                contentLength = event.data.contentLength ?? 0;
                                break;
                            case 'Progress':
                                downloaded += event.data.chunkLength;
                                const progress = contentLength > 0
                                    ? Math.round((downloaded / contentLength) * 100)
                                    : 0;
                                setStatus(s => ({ ...s, progress }));
                                break;
                            case 'Finished':
                                setStatus(s => ({ ...s, downloading: false, progress: 100 }));
                                break;
                        }
                    });

                    // Relaunch the app after update
                    await relaunch();
                }
            } else {
                setStatus(s => ({ ...s, checking: false, available: false }));
            }
        } catch (error) {
            console.error('Update check failed:', error);
            setStatus(s => ({
                ...s,
                checking: false,
                downloading: false,
                error: error instanceof Error ? error.message : 'Update check failed'
            }));
        }
    };

    return { status, checkForUpdates };
}
