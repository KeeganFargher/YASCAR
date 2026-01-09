/**
 * Offline banner component - shows when network connection is lost
 */

import { WifiOff, RotateCcw } from "lucide-react";
import { useAppStore, selectIsOnline } from "../../stores/useAppStore";

interface OfflineBannerProps {
  onRetry: () => void;
}

export function OfflineBanner({ onRetry }: OfflineBannerProps) {
  const isOnline = useAppStore(selectIsOnline);

  if (isOnline) return null;

  const handleRetry = async () => {
    const online = await useAppStore.getState().checkConnectivity();
    if (online) onRetry();
  };

  return (
    <div className="bg-bl-gray-dark/80 border-l-4 border-bl-orange text-bl-orange px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <WifiOff className="w-6 h-6" />
        <div>
          <div className="font-display text-lg uppercase tracking-wide">
            CONNECTION LOST
          </div>
          <div className="text-sm text-gray-400">
            You appear to be offline. Some features may be unavailable.
          </div>
        </div>
      </div>
      <button
        onClick={handleRetry}
        className="btn-bl-secondary text-xs px-4 py-2 flex items-center gap-2"
      >
        <RotateCcw className="w-3 h-3" />
        RETRY
      </button>
    </div>
  );
}
