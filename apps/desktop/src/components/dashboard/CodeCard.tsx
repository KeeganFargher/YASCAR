/**
 * Code card component - displays a single shift code with actions
 */

import { Copy, Check, RefreshCw } from 'lucide-react';
import { ShiftCode } from '@yascar/types';

type CodeStatus = 'available' | 'failed' | 'redeemed';

interface CodeCardProps {
    code: ShiftCode;
    status: CodeStatus;
    failedReason?: string;
    attemptCount?: number;
    copiedCode: string | null;
    isRedeeming: boolean;
    isAuthenticated: boolean;
    onCopy: (code: string) => void;
    onRedeem: (code: ShiftCode, isRetry?: boolean) => void;
}

export function CodeCard({
    code,
    status,
    failedReason,
    attemptCount,
    copiedCode,
    isRedeeming,
    isAuthenticated,
    onCopy,
    onRedeem,
}: CodeCardProps) {
    const isCopied = copiedCode === code.code;

    const borderColor = {
        available: 'border-l-bl-green',
        failed: 'border-l-bl-red',
        redeemed: 'border-l-bl-gray-dark',
    }[status];

    const textColor = {
        available: 'text-bl-green',
        failed: 'text-bl-red',
        redeemed: 'text-bl-gray-light',
    }[status];

    const statusLabel = {
        available: 'NEW // READY TO REDEEM',
        failed: `FAILED // ${attemptCount || 1} ATTEMPT${(attemptCount || 1) > 1 ? 'S' : ''}`,
        redeemed: 'REDEEMED // CLAIMED',
    }[status];

    return (
        <div className={`card-bl p-4 border-l-4 ${borderColor} group hover:translate-x-1 transition-all ${status === 'redeemed' ? 'opacity-50' : status === 'failed' ? 'opacity-80' : ''}`}>
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                    <div className={`text-[10px] font-bold uppercase mb-1 ${textColor} tracking-tighter ${status === 'available' ? 'opacity-70' : ''}`}>
                        {statusLabel}
                    </div>
                    <div className="flex items-center gap-2">
                        <code className={`${textColor} font-mono text-lg font-bold block truncate tracking-wider`}>
                            {code.code}
                        </code>
                        <button
                            onClick={() => onCopy(code.code)}
                            className={`${textColor}/50 hover:${textColor} transition-colors p-1 rounded-sm hover:bg-${textColor}/10`}
                            title="Copy Code"
                        >
                            <span className={`flex items-center transition-all ${isCopied ? 'scale-110' : ''}`}>
                                {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            </span>
                        </button>
                    </div>
                    {status === 'failed' && failedReason && (
                        <div className="text-xs text-bl-red/70 mt-1 truncate">
                            {failedReason}
                        </div>
                    )}
                    <div className="flex flex-wrap gap-2 mt-3">
                        {code.games.map((game) => (
                            <span
                                key={game}
                                className="text-[10px] bg-bl-black border border-bl-gray-dark px-2 py-0.5 text-bl-gray-light font-bold"
                            >
                                {game}
                            </span>
                        ))}
                    </div>
                </div>

                {status === 'available' && (
                    <button
                        onClick={() => onRedeem(code)}
                        disabled={isRedeeming || !isAuthenticated}
                        className="btn-bl-secondary text-xs px-4 py-2 self-center hover:bg-white/10"
                    >
                        REDEEM
                    </button>
                )}

                {status === 'failed' && (
                    <button
                        onClick={() => onRedeem(code, true)}
                        disabled={isRedeeming || !isAuthenticated}
                        className="btn-bl-secondary text-xs px-4 py-2 self-center border-bl-red text-bl-red hover:bg-bl-red/10 flex items-center gap-1"
                    >
                        <RefreshCw className="w-3 h-3" /> RETRY
                    </button>
                )}

                {status === 'redeemed' && (
                    <Check className="text-bl-gray-light w-5 h-5" />
                )}
            </div>
        </div>
    );
}
