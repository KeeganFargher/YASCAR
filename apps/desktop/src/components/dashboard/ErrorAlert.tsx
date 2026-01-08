/**
 * Error alert component - displays errors with optional retry
 */

import { AlertTriangle, RotateCcw, Loader2 } from 'lucide-react';

export interface ErrorInfo {
    message: string;
    retryable: boolean;
}

interface ErrorAlertProps {
    error: ErrorInfo;
    isLoading?: boolean;
    onRetry: () => void;
    onDismiss: () => void;
}

export function ErrorAlert({ error, isLoading, onRetry, onDismiss }: ErrorAlertProps) {
    return (
        <div className="bg-bl-red/20 border-l-4 border-bl-red text-bl-red px-6 py-4 flex items-center justify-between animate-glitch">
            <div className="flex items-center gap-3">
                <AlertTriangle className="w-8 h-8 flex-shrink-0" />
                <div>
                    <div className="font-display text-xl uppercase tracking-wide">SYSTEM ERROR</div>
                    <div className="text-sm text-white/80 mt-1">{error.message}</div>
                </div>
            </div>
            <div className="flex items-center gap-2">
                {error.retryable && (
                    <button
                        onClick={onRetry}
                        disabled={isLoading}
                        className="btn-bl-secondary text-xs px-4 py-2 flex items-center gap-2 border-bl-red text-bl-red hover:bg-bl-red/10"
                    >
                        {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RotateCcw className="w-3 h-3" />}
                        RETRY
                    </button>
                )}
                <button onClick={onDismiss} className="font-display text-sm hover:underline px-2">DISMISS</button>
            </div>
        </div>
    );
}
