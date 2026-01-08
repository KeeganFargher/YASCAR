/**
 * Stats cluster - displays key metrics cards
 */

import { Loader2, Gift, RefreshCw } from 'lucide-react';

interface StatsClusterProps {
    totalRedeemed: number;
    availableCount: number;
    failedCount: number;
    autoRedeemEnabled: boolean;
    isLoading: boolean;
    isRedeeming: boolean;
    isAuthenticated: boolean;
    onRedeemAll: () => void;
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
    onRedeemAll,
    onRefresh,
}: StatsClusterProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="card-bl-asymmetric group hover:border-bl-orange transition-colors duration-300">
                <div className="absolute top-2 right-4 font-display text-bl-gray-dark text-4xl opacity-20 group-hover:opacity-40 transition-opacity">01</div>
                <div className="text-bl-gray-light text-xs font-bold uppercase tracking-widest mb-1">Total Redeemed</div>
                <div className="font-display text-5xl text-bl-orange text-cel">{totalRedeemed}</div>
            </div>

            <div className="card-bl-asymmetric group hover:border-bl-green transition-colors duration-300">
                <div className="absolute top-2 right-4 font-display text-bl-gray-dark text-4xl opacity-20 group-hover:opacity-40 transition-opacity">02</div>
                <div className="text-bl-gray-light text-xs font-bold uppercase tracking-widest mb-1">Available Loot</div>
                <div className="font-display text-5xl text-bl-green text-cel">
                    {isLoading ? '...' : availableCount}
                </div>
            </div>

            <div className="card-bl-asymmetric group hover:border-bl-red transition-colors duration-300">
                <div className="absolute top-2 right-4 font-display text-bl-gray-dark text-4xl opacity-20 group-hover:opacity-40 transition-opacity">03</div>
                <div className="text-bl-gray-light text-xs font-bold uppercase tracking-widest mb-1">Failed Attempts</div>
                <div className="font-display text-5xl text-bl-red text-cel">
                    {isLoading ? '...' : failedCount}
                </div>
            </div>

            <div className="card-bl-asymmetric bg-gradient-to-br from-bl-black-card to-bl-black flex flex-col justify-center items-center gap-4">
                <button
                    onClick={onRedeemAll}
                    disabled={isRedeeming || !isAuthenticated || availableCount === 0}
                    className="btn-bl-legendary w-full disabled:opacity-30 disabled:animate-none flex items-center justify-center gap-2"
                >
                    {isRedeeming ? (
                        <span className="flex items-center justify-center gap-3">
                            <Loader2 className="animate-spin w-5 h-5" />
                            REDEEMING...
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
                    className="btn-bl-secondary w-full text-sm py-2 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="animate-spin w-4 h-4" />
                            REFRESHING...
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
