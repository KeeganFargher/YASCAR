import { useState, useEffect } from 'react';

interface DownloadLinks {
    windows: string | null;
    macos: string | null;
    macosArm: string | null;
    linux: string | null;
    version: string;
}

const GITHUB_REPO = 'KeeganFargher/YASCAR';
const RELEASES_URL = `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`;

export function useDownloadLinks() {
    const [links, setLinks] = useState<DownloadLinks>({
        windows: null,
        macos: null,
        macosArm: null,
        linux: null,
        version: 'latest',
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchLatestRelease() {
            try {
                const response = await fetch(RELEASES_URL);
                if (!response.ok) throw new Error('Failed to fetch release');

                const data = await response.json();
                const assets = data.assets || [];
                const version = data.tag_name?.replace('v', '') || 'latest';

                const findAsset = (patterns: string[]) => {
                    const asset = assets.find((a: { name: string }) =>
                        patterns.some(p => a.name.toLowerCase().includes(p.toLowerCase()))
                    );
                    return asset?.browser_download_url || null;
                };

                setLinks({
                    windows: findAsset(['.exe', 'x64-setup']),
                    macos: findAsset(['x64.dmg', 'x86_64.dmg']),
                    macosArm: findAsset(['aarch64.dmg', 'arm64.dmg']),
                    linux: findAsset(['.AppImage', 'amd64.appimage']),
                    version,
                });
            } catch (error) {
                console.error('Failed to fetch download links:', error);
                // Fallback to releases page
                const fallback = `https://github.com/${GITHUB_REPO}/releases/latest`;
                setLinks({
                    windows: fallback,
                    macos: fallback,
                    macosArm: fallback,
                    linux: fallback,
                    version: 'latest',
                });
            } finally {
                setLoading(false);
            }
        }

        fetchLatestRelease();
    }, []);

    return { links, loading };
}
