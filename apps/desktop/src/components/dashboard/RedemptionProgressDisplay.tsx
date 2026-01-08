/**
 * Redemption progress display - shows progress bar during redemption
 */

import { ChevronRight } from 'lucide-react';
import { RedemptionProgress } from '../../stores/useAppStore';

interface RedemptionProgressProps {
    progress: RedemptionProgress;
}

export function RedemptionProgressDisplay({ progress }: RedemptionProgressProps) {
    const { current, total, currentCode, status } = progress;

    if (status !== 'checking' && status !== 'redeeming') {
        return null;
    }

    const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

    return (
        <div className="card-bl border-bl-yellow bg-bl-yellow/5 animate-pulse">
            <div className="flex justify-between items-end mb-2">
                <h3 className="font-display text-2xl text-bl-yellow">OPERATING...</h3>
                <span className="font-display text-bl-yellow">{percentage}%</span>
            </div>
            <p className="text-xs text-bl-gray-light mb-4">
                Redeeming {total} code{total !== 1 ? 's' : ''} — this may take a few minutes. Please don't close the app.
            </p>
            <div className="w-full bg-bl-gray-dark h-4 border-2 border-black mb-4 p-0.5">
                <div
                    className="bg-bl-yellow h-full transition-all duration-300 shadow-glow-yellow"
                    style={{ width: `${percentage}%` }}
                />
            </div>
            {currentCode && (
                <div className="flex items-center gap-2 text-bl-yellow/70 animate-glitch">
                    <ChevronRight className="w-3 h-3" />
                    <code className="text-xs font-mono truncate">{currentCode}</code>
                </div>
            )}
        </div>
    );
}
