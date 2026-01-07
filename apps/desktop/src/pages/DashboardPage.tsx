import { useState, useEffect } from 'react';
import { getRedemptionHistory, getRedeemedCodes, loadConfig } from '../lib/store';
import { getShiftClient } from '../lib/shift';

export function DashboardPage() {
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [lastChecked, setLastChecked] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalRedeemed: 0,
    codesAvailable: 0,
    autoRedeemEnabled: false,
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [redeemed, config] = await Promise.all([
        getRedeemedCodes(),
        loadConfig(),
      ]);
      
      setStats({
        totalRedeemed: redeemed.length,
        codesAvailable: 0, // Will be fetched from API
        autoRedeemEnabled: config.autoRedeem,
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleRedeemNow = async () => {
    setIsRedeeming(true);
    try {
      // TODO: Fetch codes from API and redeem
      // For now, just simulate
      await new Promise(resolve => setTimeout(resolve, 2000));
      setLastChecked(new Date().toLocaleTimeString());
      await loadStats(); // Refresh stats
    } catch (error) {
      console.error('Redemption failed:', error);
    } finally {
      setIsRedeeming(false);
    }
  };

  const isAuthenticated = getShiftClient().isAuthenticated();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="font-display text-4xl text-bl-yellow text-cel">
          Dashboard
        </h1>
        <div className={`badge-${stats.autoRedeemEnabled ? 'success' : 'warning'}`}>
          {stats.autoRedeemEnabled ? '● Auto-Redeem ON' : '○ Auto-Redeem OFF'}
        </div>
      </div>

      {/* Connection status */}
      <div className={`px-4 py-2 border-2 ${isAuthenticated ? 'border-bl-green bg-bl-green/10' : 'border-bl-red bg-bl-red/10'}`}>
        <span className="text-sm font-semibold">
          {isAuthenticated ? '✓ Connected to SHiFT' : '✗ Not connected'}
        </span>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card-bl">
          <div className="text-bl-gray-light text-sm uppercase mb-1">Codes Redeemed</div>
          <div className="font-display text-5xl text-bl-orange">{stats.totalRedeemed}</div>
        </div>
        <div className="card-bl">
          <div className="text-bl-gray-light text-sm uppercase mb-1">Available Codes</div>
          <div className="font-display text-5xl text-bl-green">{stats.codesAvailable}</div>
          <div className="text-xs text-bl-gray-light mt-1">Fetched from API</div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="card-bl">
        <h2 className="font-display text-2xl text-white mb-4">Quick Actions</h2>
        
        <div className="space-y-4">
          <button
            onClick={handleRedeemNow}
            disabled={isRedeeming || !isAuthenticated}
            className="btn-bl-primary w-full disabled:opacity-50"
          >
            {isRedeeming ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin">⚡</span>
                Redeeming Codes...
              </span>
            ) : (
              '🎁 Redeem Codes Now'
            )}
          </button>

          {lastChecked && (
            <p className="text-sm text-bl-gray-light text-center">
              Last checked: {lastChecked}
            </p>
          )}
        </div>
      </div>

      {/* Status */}
      <div className="card-bl">
        <h2 className="font-display text-2xl text-white mb-4">Status</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-bl-gray-light">Auto-redeem:</span>
            <span className={stats.autoRedeemEnabled ? 'text-bl-green' : 'text-bl-gray-light'}>
              {stats.autoRedeemEnabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-bl-gray-light">Session:</span>
            <span className={isAuthenticated ? 'text-bl-green' : 'text-bl-red'}>
              {isAuthenticated ? 'Active' : 'Expired'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
