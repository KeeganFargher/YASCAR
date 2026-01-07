import { useState, useEffect } from 'react';
import { getRedemptionHistory } from '../lib/store';
import { RedeemedCodeRecord } from '@yascar/user-config';

export function LogPage() {
  const [logs, setLogs] = useState<RedeemedCodeRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'success' | 'failed'>('all');

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      const history = await getRedemptionHistory();
      setLogs(history);
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    if (filter === 'all') return true;
    if (filter === 'success') return log.success;
    if (filter === 'failed') return !log.success;
    return true;
  });

  const getStatusBadge = (success: boolean) => {
    return success 
      ? <span className="badge-success">✓ Redeemed</span>
      : <span className="badge-error">✗ Failed</span>;
  };

  const formatTime = (iso: string) => {
    const date = new Date(iso);
    return date.toLocaleString();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-bl-yellow font-display text-xl animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-4xl text-bl-yellow text-cel">
          Redemption Log
        </h1>

        {/* Filter */}
        <div className="flex gap-2">
          {(['all', 'success', 'failed'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 text-sm font-semibold uppercase border-2 transition-colors ${
                filter === f 
                  ? 'bg-bl-yellow text-black border-black' 
                  : 'bg-bl-black-card text-bl-gray-light border-bl-gray hover:border-bl-yellow'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Log entries */}
      <div className="space-y-3">
        {filteredLogs.length === 0 ? (
          <div className="card-bl text-center text-bl-gray-light py-12">
            {logs.length === 0 
              ? 'No codes redeemed yet. Use the Dashboard to redeem codes!'
              : 'No entries match the current filter'
            }
          </div>
        ) : (
          filteredLogs.map((log, index) => (
            <div key={`${log.code}-${index}`} className="card-bl">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <code className="text-bl-yellow font-mono text-sm block truncate">
                    {log.code}
                  </code>
                  <div className="flex items-center gap-2 mt-1 text-sm text-bl-gray-light">
                    <span>{log.game}</span>
                    <span>•</span>
                    <span>{log.platform}</span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  {getStatusBadge(log.success)}
                  <div className="text-xs text-bl-gray-light mt-2">
                    {formatTime(log.redeemedAt)}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Stats footer */}
      <div className="flex justify-between text-sm text-bl-gray-light border-t border-bl-gray-dark pt-4">
        <span>Total: {logs.length} entries</span>
        <span>
          {logs.filter(l => l.success).length} successful
        </span>
      </div>
    </div>
  );
}
