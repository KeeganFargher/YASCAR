import { useState, useEffect, useCallback, useRef } from 'react';
import { getRedeemedCodes, loadConfig, addToHistory, addFailedCode, removeFailedCode, getFailedCodes, addRedeemedCode } from '../lib/store';
import { getShiftClient } from '../lib/shift';
import { fetchAvailableCodes, CodesFetchResult } from '../lib/api';
import { redeemShiftCode } from '../lib/redemption';
import { setRedemptionInProgress } from '../lib/redemptionLock';
import { subscribeToRedemptionProgress } from '../lib/redemptionEvents';
import { ShiftCode, GameTitle } from '@yascar/types';
import {
  AlertTriangle,
  Loader2,
  Gift,
  RefreshCw,
  Inbox,
  Copy,
  Check,
  ChevronRight,
  Terminal,
  Activity,
  Filter
} from 'lucide-react';

interface RedemptionProgress {
  current: number;
  total: number;
  currentCode?: string;
  status: 'idle' | 'checking' | 'redeeming' | 'done' | 'error';
  results: { code: string; success: boolean; message: string }[];
}

export function DashboardPage() {
  const [codesData, setCodesData] = useState<CodesFetchResult>({
    available: [],
    failed: [],
    redeemed: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<RedemptionProgress>({
    current: 0,
    total: 0,
    status: 'idle',
    results: [],
  });
  const [stats, setStats] = useState({
    totalRedeemed: 0,
    autoRedeemEnabled: false,
  });
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'new' | 'failed' | 'redeemed'>('all');

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const config = await loadConfig();

      // Fetch available codes filtered by user's games
      const result = await fetchAvailableCodes(config.games);
      setCodesData(result);

      setStats({
        totalRedeemed: result.redeemed.length,
        autoRedeemEnabled: config.autoRedeem,
      });
    } catch (err) {
      console.error('Failed to load data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Subscribe to background redemption progress events
  // Track processed results for incremental updates
  const lastProcessedRef = useRef(0);

  // Subscribe to background redemption progress events
  useEffect(() => {
    const unsubscribe = subscribeToRedemptionProgress((event) => {
      setProgress(event);

      // Reset tracking on new cycle start (or if results array shrank/reset)
      if (event.status === 'checking' || event.results.length < lastProcessedRef.current) {
        lastProcessedRef.current = 0;
      }

      // Process new results incrementally to update UI live
      const newResults = event.results.slice(lastProcessedRef.current);
      if (newResults.length > 0) {
        lastProcessedRef.current = event.results.length;

        setCodesData(prev => {
          const nextAvailable = [...prev.available];
          const nextRedeemed = [...prev.redeemed];
          const nextFailed = [...prev.failed];

          newResults.forEach(r => {
            const idx = nextAvailable.findIndex(c => c.code === r.code);
            if (idx !== -1) {
              const code = nextAvailable[idx];
              nextAvailable.splice(idx, 1);
              if (r.success) {
                nextRedeemed.unshift(code);
              } else {
                nextFailed.push({ ...code, failedReason: r.message, attemptCount: 1 });
              }
            }
          });

          return {
            available: nextAvailable,
            redeemed: nextRedeemed,
            failed: nextFailed
          };
        });

        // Update stats live
        const newSuccesses = newResults.filter(r => r.success).length;
        if (newSuccesses > 0) {
          setStats(prev => ({ ...prev, totalRedeemed: prev.totalRedeemed + newSuccesses }));
        }
      }

      // Reload data when background redemption completes to ensure consistency
      if (event.status === 'done') {
        loadData();
        lastProcessedRef.current = 0;
      }
    });
    return unsubscribe;
  }, [loadData]);

  const handleCopy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 1500);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  // redeemCode logic moved to lib/redemption.ts

  const handleRedeemAll = async () => {
    const availableCodes = codesData.available;
    if (availableCodes.length === 0) return;

    const client = getShiftClient();
    if (!client.isAuthenticated()) {
      setError('Not authenticated. Please log in again.');
      return;
    }

    setProgress({
      current: 0,
      total: availableCodes.length,
      status: 'checking',
      results: [],
    });

    // Lock to prevent auto-redeemer from running
    setRedemptionInProgress(true);

    const results: RedemptionProgress['results'] = [];

    for (let i = 0; i < availableCodes.length; i++) {
      const code = availableCodes[i];
      setProgress(prev => ({
        ...prev,
        current: i + 1,
        currentCode: code.code,
        status: 'redeeming',
      }));

      try {
        const result = await redeemShiftCode(code);
        results.push({ code: code.code, ...result });

        // Update stats and codesData in real-time on success or expired
        if (result.success || result.expired) {
          if (result.success) {
            setStats(prev => ({ ...prev, totalRedeemed: prev.totalRedeemed + 1 }));
          }
          setCodesData(prev => ({
            ...prev,
            available: prev.available.filter(c => c.code !== code.code),
            redeemed: [...prev.redeemed, code],
          }));
        }
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : 'Unknown error';
        await addFailedCode(code.code, errMsg);
        results.push({
          code: code.code,
          success: false,
          message: errMsg,
        });
        // Update codesData to show as failed
        setCodesData(prev => ({
          ...prev,
          available: prev.available.filter(c => c.code !== code.code),
          failed: [...prev.failed, { ...code, failedReason: errMsg, attemptCount: 1 }],
        }));
      }

      setProgress(prev => ({ ...prev, results: [...results] }));
    }

    setProgress(prev => ({ ...prev, status: 'done' }));

    // Unlock
    setRedemptionInProgress(false);

    // Refresh data after redemption
    await loadData();
  };

  const handleRedeemSingle = async (code: ShiftCode, isRetry: boolean = false) => {
    const client = getShiftClient();
    if (!client.isAuthenticated()) {
      setError('Not authenticated. Please log in again.');
      return;
    }

    setProgress({
      current: 1,
      total: 1,
      currentCode: code.code,
      status: 'redeeming',
      results: [],
    });

    try {
      const result = await redeemShiftCode(code, isRetry);
      setProgress({
        current: 1,
        total: 1,
        status: 'done',
        results: [{ code: code.code, ...result }],
      });

      // Update stats and codesData in real-time on success or expired
      if (result.success || result.expired) {
        if (result.success) {
          setStats(prev => ({ ...prev, totalRedeemed: prev.totalRedeemed + 1 }));
        }
        setCodesData(prev => ({
          ...prev,
          available: prev.available.filter(c => c.code !== code.code),
          failed: isRetry ? prev.failed.filter(c => c.code !== code.code) : prev.failed,
          redeemed: [...prev.redeemed, code],
        }));
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Unknown error';
      await addFailedCode(code.code, errMsg);
      setProgress({
        current: 1,
        total: 1,
        status: 'error',
        results: [{
          code: code.code,
          success: false,
          message: errMsg,
        }],
      });
      // Update codesData to show as failed (if not already a retry)
      if (!isRetry) {
        setCodesData(prev => ({
          ...prev,
          available: prev.available.filter(c => c.code !== code.code),
          failed: [...prev.failed, { ...code, failedReason: errMsg, attemptCount: 1 }],
        }));
      }
    }
  };

  const isRedeeming = progress.status === 'checking' || progress.status === 'redeeming';
  const isAuthenticated = getShiftClient().isAuthenticated();

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* HUD Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-l-4 border-bl-yellow pl-4 py-2 bg-gradient-to-r from-bl-yellow/5 to-transparent">
        <div>
          <h1 className="font-display text-5xl text-bl-yellow text-cel tracking-tighter">
            Dashboard
          </h1>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-xs font-bold uppercase text-bl-gray-light tracking-widest">Vault Hunter Active</span>
            <div className={`h-2 w-2 rounded-full shadow-glow-yellow animate-pulse ${isAuthenticated ? 'bg-bl-green' : 'bg-bl-red'}`} />
          </div>
        </div>
        <div className="flex gap-2">
          <div className={`badge-bl ${stats.autoRedeemEnabled ? 'bg-bl-green text-black' : 'bg-bl-orange text-black'}`}>
            {stats.autoRedeemEnabled ? 'AUTO-REDEEM: ACTIVE' : 'AUTO-REDEEM: STANDBY'}
          </div>
        </div>
      </div>

      {/* Alert display */}
      {error && (
        <div className="bg-bl-red/20 border-l-4 border-bl-red text-bl-red px-6 py-4 flex items-center justify-between animate-glitch">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-8 h-8" />
            <div className="font-display text-xl uppercase tracking-wide">{error}</div>
          </div>
          <button onClick={() => setError(null)} className="font-display text-sm hover:underline">DISMISS</button>
        </div>
      )}

      {/* Stats Cluster */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card-bl-asymmetric group hover:border-bl-orange transition-colors duration-300">
          <div className="absolute top-2 right-4 font-display text-bl-gray-dark text-4xl opacity-20 group-hover:opacity-40 transition-opacity">01</div>
          <div className="text-bl-gray-light text-xs font-bold uppercase tracking-widest mb-1">Total Redeemed</div>
          <div className="font-display text-5xl text-bl-orange text-cel">{stats.totalRedeemed}</div>
        </div>

        <div className="card-bl-asymmetric group hover:border-bl-green transition-colors duration-300">
          <div className="absolute top-2 right-4 font-display text-bl-gray-dark text-4xl opacity-20 group-hover:opacity-40 transition-opacity">02</div>
          <div className="text-bl-gray-light text-xs font-bold uppercase tracking-widest mb-1">Available Loot</div>
          <div className="font-display text-5xl text-bl-green text-cel">
            {isLoading ? '...' : codesData.available.length}
          </div>
        </div>

        <div className="card-bl-asymmetric group hover:border-bl-red transition-colors duration-300">
          <div className="absolute top-2 right-4 font-display text-bl-gray-dark text-4xl opacity-20 group-hover:opacity-40 transition-opacity">03</div>
          <div className="text-bl-gray-light text-xs font-bold uppercase tracking-widest mb-1">Failed Attempts</div>
          <div className="font-display text-5xl text-bl-red text-cel">
            {isLoading ? '...' : codesData.failed.length}
          </div>
        </div>

        <div className="card-bl-asymmetric bg-gradient-to-br from-bl-black-card to-bl-black flex flex-col justify-center items-center gap-4">
          <button
            onClick={handleRedeemAll}
            disabled={isRedeeming || !isAuthenticated || codesData.available.length === 0}
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
            onClick={loadData}
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

      {/* Redemption HUD Container */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Loot Drops List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b-2 border-bl-gray-dark pb-2">
            <h2 className="font-display text-3xl text-white tracking-tight">Available Loot</h2>
            <div className="flex items-center gap-2">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="bg-bl-black border border-bl-gray-dark text-bl-gray-light text-xs font-bold uppercase py-1 px-2 focus:outline-none focus:border-bl-yellow"
              >
                <option value="all">ALL ({codesData.available.length + codesData.failed.length + codesData.redeemed.length})</option>
                <option value="new">NEW ({codesData.available.length})</option>
                <option value="failed">FAILED ({codesData.failed.length})</option>
                <option value="redeemed">REDEEMED ({codesData.redeemed.length})</option>
              </select>
            </div>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-50">
              <Loader2 className="animate-spin w-10 h-10 text-bl-yellow" />
              <span className="font-display text-xl tracking-widest">SCANNING ECHO SPECTRA...</span>
            </div>
          ) : codesData.available.length === 0 && codesData.failed.length === 0 ? (
            <div className="card-bl text-bl-gray-light text-center py-12 border-dashed flex flex-col items-center">
              <Inbox className="w-12 h-12 mb-4 opacity-50" />
              <p className="font-display text-xl uppercase tracking-wide">No loot detected in this sector.</p>
              <p className="text-sm mt-2">Adjust your game preferences in settings.</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 scrollbar-bl">
              {/* Available codes - green/blue styling */}
              {(filter === 'all' || filter === 'new') && codesData.available.map((code) => (
                <div key={code.code} className="card-bl p-4 border-l-4 border-l-bl-green shadow-bl-green/5 group hover:translate-x-1 transition-all">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] font-bold uppercase mb-1 text-bl-green tracking-tighter opacity-70">
                        NEW // READY TO REDEEM
                      </div>
                      <div className="flex items-center gap-2">
                        <code className="text-bl-green font-mono text-lg font-bold block truncate tracking-wider">
                          {code.code}
                        </code>
                        <button
                          onClick={() => handleCopy(code.code)}
                          className="text-bl-green/50 hover:text-bl-green transition-colors p-1 rounded-sm hover:bg-bl-green/10"
                          title="Copy Code"
                        >
                          <span className={`flex items-center transition-all ${copiedCode === code.code ? 'scale-110' : ''}`}>
                            {copiedCode === code.code ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          </span>
                        </button>
                      </div>
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
                    <button
                      onClick={() => handleRedeemSingle(code)}
                      disabled={isRedeeming || !isAuthenticated}
                      className="btn-bl-secondary text-xs px-4 py-2 self-center hover:bg-white/10"
                    >
                      REDEEM
                    </button>
                  </div>
                </div>
              ))}

              {/* Failed codes - red styling with retry button */}
              {(filter === 'all' || filter === 'failed') && codesData.failed.length > 0 && (
                <>
                  <div className="border-t border-bl-gray-dark pt-4 mt-4 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-bl-red" />
                    <span className="font-display text-sm text-bl-red uppercase tracking-widest">Failed Attempts ({codesData.failed.length})</span>
                  </div>
                  {codesData.failed.map((code) => (
                    <div key={code.code} className="card-bl p-4 border-l-4 border-l-bl-red shadow-bl-red/5 group hover:translate-x-1 transition-all opacity-80">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="text-[10px] font-bold uppercase mb-1 text-bl-red tracking-tighter">
                            FAILED // {code.attemptCount} ATTEMPT{code.attemptCount > 1 ? 'S' : ''}
                          </div>
                          <div className="flex items-center gap-2">
                            <code className="text-bl-red font-mono text-lg font-bold block truncate tracking-wider">
                              {code.code}
                            </code>
                            <button
                              onClick={() => handleCopy(code.code)}
                              className="text-bl-red/50 hover:text-bl-red transition-colors p-1 rounded-sm hover:bg-bl-red/10"
                              title="Copy Code"
                            >
                              <span className={`flex items-center transition-all ${copiedCode === code.code ? 'scale-110' : ''}`}>
                                {copiedCode === code.code ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                              </span>
                            </button>
                          </div>
                          <div className="text-xs text-bl-red/70 mt-1 truncate">
                            {code.failedReason}
                          </div>
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
                        <button
                          onClick={() => handleRedeemSingle(code, true)}
                          disabled={isRedeeming || !isAuthenticated}
                          className="btn-bl-secondary text-xs px-4 py-2 self-center border-bl-red text-bl-red hover:bg-bl-red/10 flex items-center gap-1"
                        >
                          <RefreshCw className="w-3 h-3" /> RETRY
                        </button>
                      </div>
                    </div>
                  ))}
                </>
              )}

              {/* Redeemed codes - muted styling */}
              {(filter === 'all' || filter === 'redeemed') && codesData.redeemed.length > 0 && (
                <>
                  <div className="border-t border-bl-gray-dark pt-4 mt-4 flex items-center gap-2">
                    <Check className="w-4 h-4 text-bl-gray-light" />
                    <span className="font-display text-sm text-bl-gray-light uppercase tracking-widest">Already Redeemed ({codesData.redeemed.length})</span>
                  </div>
                  {codesData.redeemed.slice(0, 10).map((code) => (
                    <div key={code.code} className="card-bl p-4 border-l-4 border-l-bl-gray-dark opacity-50 group">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="text-[10px] font-bold uppercase mb-1 text-bl-gray-light tracking-tighter">
                            REDEEMED // CLAIMED
                          </div>
                          <div className="flex items-center gap-2">
                            <code className="text-bl-gray-light font-mono text-lg font-bold block truncate tracking-wider">
                              {code.code}
                            </code>
                            <button
                              onClick={() => handleCopy(code.code)}
                              className="text-bl-gray-light/50 hover:text-bl-gray-light transition-colors p-1 rounded-sm hover:bg-bl-gray/10"
                              title="Copy Code"
                            >
                              <span className={`flex items-center transition-all ${copiedCode === code.code ? 'scale-110' : ''}`}>
                                {copiedCode === code.code ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                              </span>
                            </button>
                          </div>
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
                        <Check className="text-bl-gray-light w-5 h-5" />
                      </div>
                    </div>
                  ))}
                  {codesData.redeemed.length > 10 && (
                    <div className="text-center text-bl-gray-light text-xs py-2">
                      +{codesData.redeemed.length - 10} more redeemed codes
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Console / Activity */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b-2 border-bl-gray-dark pb-2">
            <h2 className="font-display text-3xl text-white tracking-tight">ECHO FEED</h2>
            <div className="flex gap-1">
              <Activity className="w-4 h-4 text-bl-yellow animate-pulse" />
            </div>
          </div>

          {isRedeeming && (
            <div className="card-bl border-bl-yellow bg-bl-yellow/5 animate-pulse">
              <div className="flex justify-between items-end mb-2">
                <h3 className="font-display text-2xl text-bl-yellow">OPERATING...</h3>
                <span className="font-display text-bl-yellow">{Math.round((progress.current / progress.total) * 100)}%</span>
              </div>
              <p className="text-xs text-bl-gray-light mb-4">
                Redeeming {progress.total} code{progress.total !== 1 ? 's' : ''} — this may take a few minutes. Please don't close the app.
              </p>
              <div className="w-full bg-bl-gray-dark h-4 border-2 border-black mb-4 p-0.5">
                <div
                  className="bg-bl-yellow h-full transition-all duration-300 shadow-glow-yellow"
                  style={{ width: `${(progress.current / progress.total) * 100}%` }}
                />
              </div>
              {progress.currentCode && (
                <div className="flex items-center gap-2 text-bl-yellow/70 animate-glitch">
                  <ChevronRight className="w-3 h-3" />
                  <code className="text-xs font-mono truncate">{progress.currentCode}</code>
                </div>
              )}
            </div>
          )}

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
                onClick={() => setProgress({ current: 0, total: 0, status: 'idle', results: [] })}
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
      </div>
    </div>
  );
}
