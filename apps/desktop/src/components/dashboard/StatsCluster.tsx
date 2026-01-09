/**
 * Stats cluster - displays key metrics cards
 */

import { Loader2, Gift, RefreshCw, Check, Sparkles } from "lucide-react";

interface StatsClusterProps {
  totalRedeemed: number;
  availableCount: number;
  failedCount: number;
  autoRedeemEnabled: boolean;
  isLoading: boolean;
  isRedeeming: boolean;
  isAuthenticated: boolean;
  scanFeedback?: {
    type: "success" | "info";
    message: string;
  } | null;
  onRedeemAll: () => void;
  onCancel: () => void;
  onRefresh: () => void;
}

export function StatsCluster({
  totalRedeemed,
  availableCount,
  failedCount,
  autoRedeemEnabled,
  isLoading,
  isRedeeming,
  isAuthenticated,
  scanFeedback,
  onRedeemAll,
  onCancel,
  onRefresh,
}: StatsClusterProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <div className="card-bl-asymmetric flex flex-col items-center justify-center p-4">
        <div className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1 text-center">
          Total Redeemed
        </div>
        <div className="font-display text-5xl text-bl-orange text-cel">
          {totalRedeemed}
        </div>
      </div>

      <div className="card-bl-asymmetric flex flex-col items-center justify-center p-4">
        <div className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1 text-center">
          Available Loot
        </div>
        <div className="font-display text-5xl text-bl-green text-cel">
          {isLoading ? "..." : availableCount}
        </div>
      </div>

      <div className="card-bl-asymmetric flex flex-col items-center justify-center p-4">
        <div className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1 text-center">
          Failed Attempts
        </div>
        <div className="font-display text-5xl text-bl-red text-cel">
          {isLoading ? "..." : failedCount}
        </div>
      </div>

      <div className="card-bl-asymmetric bg-gradient-to-br from-bl-black-card to-bl-black flex flex-col justify-center items-center gap-4">
        <button
          onClick={isRedeeming ? onCancel : onRedeemAll}
          disabled={!isRedeeming && (!isAuthenticated || availableCount === 0)}
          className={`w-full disabled:opacity-30 disabled:animate-none flex items-center justify-center gap-2 ${
            isRedeeming
              ? "btn-bl-secondary border-bl-red text-bl-red hover:bg-bl-red/20 animate-pulse"
              : "btn-bl-legendary"
          }`}
        >
          {isRedeeming ? (
            <span className="flex items-center justify-center gap-3">
              <Loader2 className="animate-spin w-5 h-5" />
              CANCEL
            </span>
          ) : (
            <>
              <Gift className="w-5 h-5" />
              <span>REDEEM ALL</span>
            </>
          )}
        </button>
        <button
          onClick={onRefresh}
          disabled={isLoading || isRedeeming}
          className={`btn-bl-secondary w-full text-sm py-2 disabled:opacity-50 flex items-center justify-center gap-2 transition-all duration-300 ${
            scanFeedback?.type === "success"
              ? "border-bl-green text-bl-green bg-bl-green/10"
              : ""
          } ${
            scanFeedback?.type === "info"
              ? "border-bl-blue text-bl-blue bg-bl-blue/10"
              : ""
          }`}
        >
          {isLoading ? (
            <>
              <Loader2 className="animate-spin w-4 h-4" />
              REFRESHING...
            </>
          ) : scanFeedback ? (
            <>
              {scanFeedback.type === "success" ? (
                <Sparkles className="w-4 h-4 animate-bounce" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              <span className="uppercase">{scanFeedback.message}</span>
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4" />
              <span>SCAN FOR NEW CODES</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
