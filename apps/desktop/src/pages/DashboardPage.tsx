/**
 * Dashboard Page - refactored to use Zustand store, TanStack Query, and split components
 */

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ShiftCode } from '@yascar/types';
import { getShiftClient } from '../lib/shift';
import { redeemShiftCode } from '../lib/redemption';
import { useAppStore, selectRedemptionProgress, selectIsOnline } from '../stores/useAppStore';
import { useCodes, useConfig, queryKeys } from '../hooks/useQueries';
import { getUserMessage, isRetryableError } from '../lib/errors';
import {
  OfflineBanner,
  ErrorAlert,
  StatsCluster,
  CodeCard,
  EchoFeed,
  type ErrorInfo
} from '../components/dashboard';
import { AlertTriangle, Loader2, Inbox, Check } from 'lucide-react';

type FilterType = 'all' | 'new' | 'failed' | 'redeemed';

export function DashboardPage() {
  const queryClient = useQueryClient();
  const [error, setError] = useState<ErrorInfo | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');

  // Zustand store
  const redemptionProgress = useAppStore(selectRedemptionProgress);
  const setRedemptionProgress = useAppStore(state => state.setRedemptionProgress);
  const resetRedemptionProgress = useAppStore(state => state.resetRedemptionProgress);
  const isOnline = useAppStore(selectIsOnline);

  // TanStack Query
  const { data: config } = useConfig();
  const { data: codesData, isLoading, refetch } = useCodes(config?.games || []);

  const isAuthenticated = getShiftClient().isAuthenticated();
  const isRedeeming = redemptionProgress.status === 'checking' || redemptionProgress.status === 'redeeming';

  const stats = {
    totalRedeemed: codesData?.redeemed.length || 0,
    availableCount: codesData?.available.length || 0,
    failedCount: codesData?.failed.length || 0,
    autoRedeemEnabled: config?.autoRedeem || false,
  };

  const handleCopy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 1500);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  const handleRefresh = async () => {
    setError(null);
    try {
      await refetch();
    } catch (err) {
      setError({
        message: getUserMessage(err),
        retryable: isRetryableError(err)
      });
    }
  };

  const handleRedeemAll = async () => {
    const availableCodes = codesData?.available || [];
    if (availableCodes.length === 0) return;

    if (!isAuthenticated) {
      setError({ message: 'Not authenticated. Please log in again.', retryable: false });
      return;
    }

    setRedemptionProgress({
      current: 0,
      total: availableCodes.length,
      status: 'checking',
      results: [],
    });

    const results: { code: string; success: boolean; message: string }[] = [];

    for (let i = 0; i < availableCodes.length; i++) {
      const code = availableCodes[i];

      setRedemptionProgress({
        current: i + 1,
        total: availableCodes.length,
        currentCode: code.code,
        status: 'redeeming',
        results: [...results],
      });

      try {
        const result = await redeemShiftCode(code);
        results.push({ code: code.code, ...result });
      } catch (err) {
        const errMsg = getUserMessage(err);
        results.push({ code: code.code, success: false, message: errMsg });
      }
    }

    setRedemptionProgress({
      current: availableCodes.length,
      total: availableCodes.length,
      status: 'done',
      results,
    });

    // Refresh data after redemption
    queryClient.invalidateQueries({ queryKey: ['codes'] });
  };

  const handleRedeemSingle = async (code: ShiftCode, isRetry: boolean = false) => {
    if (!isAuthenticated) {
      setError({ message: 'Not authenticated. Please log in again.', retryable: false });
      return;
    }

    setRedemptionProgress({
      current: 1,
      total: 1,
      currentCode: code.code,
      status: 'redeeming',
      results: [],
    });

    try {
      const result = await redeemShiftCode(code, isRetry);
      setRedemptionProgress({
        current: 1,
        total: 1,
        status: 'done',
        results: [{ code: code.code, ...result }],
      });
    } catch (err) {
      const errMsg = getUserMessage(err);
      setRedemptionProgress({
        current: 1,
        total: 1,
        status: 'error',
        results: [{ code: code.code, success: false, message: errMsg }],
      });
    }

    queryClient.invalidateQueries({ queryKey: ['codes'] });
  };

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

      {/* Offline Banner */}
      <OfflineBanner onRetry={handleRefresh} />

      {/* Error Alert - only show when online */}
      {error && isOnline && (
        <ErrorAlert
          error={error}
          isLoading={isLoading}
          onRetry={handleRefresh}
          onDismiss={() => setError(null)}
        />
      )}

      {/* Stats Cluster */}
      <StatsCluster
        totalRedeemed={stats.totalRedeemed}
        availableCount={stats.availableCount}
        failedCount={stats.failedCount}
        autoRedeemEnabled={stats.autoRedeemEnabled}
        isLoading={isLoading}
        isRedeeming={isRedeeming}
        isAuthenticated={isAuthenticated}
        onRedeemAll={handleRedeemAll}
        onRefresh={handleRefresh}
      />

      {/* Redemption HUD Container */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Loot Drops List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b-2 border-bl-gray-dark pb-2">
            <h2 className="font-display text-3xl text-white tracking-tight">Available Loot</h2>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as FilterType)}
              className="bg-bl-black border border-bl-gray-dark text-bl-gray-light text-xs font-bold uppercase py-1 px-2 focus:outline-none focus:border-bl-yellow"
            >
              <option value="all">ALL ({(codesData?.available.length || 0) + (codesData?.failed.length || 0) + (codesData?.redeemed.length || 0)})</option>
              <option value="new">NEW ({codesData?.available.length || 0})</option>
              <option value="failed">FAILED ({codesData?.failed.length || 0})</option>
              <option value="redeemed">REDEEMED ({codesData?.redeemed.length || 0})</option>
            </select>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-50">
              <Loader2 className="animate-spin w-10 h-10 text-bl-yellow" />
              <span className="font-display text-xl tracking-widest">SCANNING ECHO SPECTRA...</span>
            </div>
          ) : (codesData?.available.length === 0 && codesData?.failed.length === 0) ? (
            <div className="card-bl text-bl-gray-light text-center py-12 border-dashed flex flex-col items-center">
              <Inbox className="w-12 h-12 mb-4 opacity-50" />
              <p className="font-display text-xl uppercase tracking-wide">No loot detected in this sector.</p>
              <p className="text-sm mt-2">Adjust your game preferences in settings.</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 scrollbar-bl">
              {/* Available codes */}
              {(filter === 'all' || filter === 'new') && codesData?.available.map((code) => (
                <CodeCard
                  key={code.code}
                  code={code}
                  status="available"
                  copiedCode={copiedCode}
                  isRedeeming={isRedeeming}
                  isAuthenticated={isAuthenticated}
                  onCopy={handleCopy}
                  onRedeem={handleRedeemSingle}
                />
              ))}

              {/* Failed codes */}
              {(filter === 'all' || filter === 'failed') && (codesData?.failed.length || 0) > 0 && (
                <>
                  <div className="border-t border-bl-gray-dark pt-4 mt-4 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-bl-red" />
                    <span className="font-display text-sm text-bl-red uppercase tracking-widest">Failed Attempts ({codesData?.failed.length})</span>
                  </div>
                  {codesData?.failed.map((code) => (
                    <CodeCard
                      key={code.code}
                      code={code}
                      status="failed"
                      failedReason={code.failedReason}
                      attemptCount={code.attemptCount}
                      copiedCode={copiedCode}
                      isRedeeming={isRedeeming}
                      isAuthenticated={isAuthenticated}
                      onCopy={handleCopy}
                      onRedeem={handleRedeemSingle}
                    />
                  ))}
                </>
              )}

              {/* Redeemed codes */}
              {(filter === 'all' || filter === 'redeemed') && (codesData?.redeemed.length || 0) > 0 && (
                <>
                  <div className="border-t border-bl-gray-dark pt-4 mt-4 flex items-center gap-2">
                    <Check className="w-4 h-4 text-bl-gray-light" />
                    <span className="font-display text-sm text-bl-gray-light uppercase tracking-widest">Already Redeemed ({codesData?.redeemed.length})</span>
                  </div>
                  {codesData?.redeemed.slice(0, 10).map((code) => (
                    <CodeCard
                      key={code.code}
                      code={code}
                      status="redeemed"
                      copiedCode={copiedCode}
                      isRedeeming={isRedeeming}
                      isAuthenticated={isAuthenticated}
                      onCopy={handleCopy}
                      onRedeem={handleRedeemSingle}
                    />
                  ))}
                  {(codesData?.redeemed.length || 0) > 10 && (
                    <div className="text-center text-bl-gray-light text-xs py-2">
                      +{(codesData?.redeemed.length || 0) - 10} more redeemed codes
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Echo Feed */}
        <EchoFeed
          progress={redemptionProgress}
          onCloseResults={resetRedemptionProgress}
        />
      </div>
    </div>
  );
}
