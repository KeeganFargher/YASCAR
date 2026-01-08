/**
 * Echo feed component - shows redemption results and status
 */

import { Check, AlertTriangle, Terminal, Activity } from 'lucide-react';
import { RedemptionProgress } from '../../stores/useAppStore';
import { RedemptionProgressDisplay } from './RedemptionProgressDisplay';

interface EchoFeedProps {
    progress: RedemptionProgress;
    onCloseResults: () => void;
}

export function EchoFeed({ progress, onCloseResults }: EchoFeedProps) {
    const isRedeeming = progress.status === 'checking' || progress.status === 'redeeming';

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between border-b-2 border-bl-gray-dark pb-2">
                <h2 className="font-display text-3xl text-white tracking-tight">ECHO FEED</h2>
                <div className="flex gap-1">
                    <Activity className="w-4 h-4 text-bl-yellow animate-pulse" />
                </div>
            </div>

            {isRedeeming && <RedemptionProgressDisplay progress={progress} />}

            {progress.status === 'done' && progress.results.length > 0 ? (
                <div className="card-bl-asymmetric bg-bl-black/80 flex flex-col h-full max-h-[460px]">
                    <div className="flex-1 overflow-y-auto scrollbar-bl space-y-2 mb-4">
                        {progress.results.map((r, i) => (
                            <div key={i} className={`text-xs border-b border-bl-gray-dark/30 py-2 flex items-start gap-3 ${r.success ? 'text-bl-green' : 'text-bl-red'}`}>
                                {r.success ? <Check className="w-3 h-3 flex-shrink-0" /> : <AlertTriangle className="w-3 h-3 flex-shrink-0" />}
                                <div className="flex-1">
                                    <code className="block mb-1 text-white/90">{r.code}</code>
                                    <span className="opacity-70">{r.message}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                    <button
                        onClick={onCloseResults}
                        className="btn-bl-secondary w-full text-xs py-2 mt-auto"
                    >
                        CLOSE LOG
                    </button>
                </div>
            ) : !isRedeeming && (
                <div className="card-bl h-[460px] flex flex-col items-center justify-center opacity-30 gap-6 border-dashed">
                    <div className="w-32 h-32 border-4 border-bl-gray-dark rounded-full flex items-center justify-center">
                        <Terminal className="w-16 h-16 text-bl-gray-dark" />
                    </div>
                    <div className="text-center font-display tracking-widest text-xl">
                        STANDING BY FOR INPUT
                    </div>
                    <div className="w-1/2 h-px bg-bl-gray-dark" />
                </div>
            )}
        </div>
    );
}
