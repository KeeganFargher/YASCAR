import { useState, useEffect } from 'react';
import { getRedemptionHistory } from '../lib/store';
import { RedeemedCodeRecord } from '@yascar/user-config';

export function LogPage() {
  const [logs, setLogs] = useState<RedeemedCodeRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'success' | 'failed'>('all');
  const [searchTerm, setSearchTerm] = useState('');

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
    const matchesFilter = 
      filter === 'all' ? true :
      filter === 'success' ? log.success :
      filter === 'failed' ? !log.success : true;
    
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      log.code.toLowerCase().includes(searchLower) ||
      log.game?.toLowerCase().includes(searchLower) ||
      log.platform?.toLowerCase().includes(searchLower);

    return matchesFilter && matchesSearch;
  });

  const formatTime = (iso: string) => {
    try {
      return new Date(iso).toLocaleString(undefined, {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
      }).toUpperCase();
    } catch {
      return 'UNKNOWN DATE';
    }
  };

  return (
    <div className="h-full flex flex-col space-y-6 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col gap-4 border-b-2 border-bl-gray-dark pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-5xl text-bl-yellow text-cel tracking-widest leading-none mb-1">
              ECHO ARCHIVES
            </h1>
            <div className="text-bl-gray-light font-mono text-xs tracking-[0.2em] uppercase">
              // TRANSMISSION_LOG_V8.4 //
            </div>
          </div>
          <div className="text-right hidden sm:block">
            <div className="text-3xl font-display text-white">
              {logs.length} <span className="text-bl-yellow text-xl">ENTRIES</span>
            </div>
          </div>
        </div>

        {/* Controls Toolbar */}
        <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between mt-2">
          {/* Custom Filter Tabs */}
          <div className="flex bg-bl-black-light p-1 border border-bl-gray-dark skew-x-[-10deg]">
            {(['all', 'success', 'failed'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`
                  px-6 py-2 font-display text-lg uppercase tracking-wider skew-x-[10deg] transition-all
                  ${filter === f 
                    ? 'bg-bl-yellow text-black shadow-glow-yellow' 
                    : 'text-bl-gray-light hover:text-white hover:bg-white/5'}
                `}
              >
                {f === 'all' ? 'Global' : f === 'success' ? 'Verified' : 'Corrupted'}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative group">
            <input
              type="text"
              placeholder="SEARCH DATA..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-black/50 border-b-2 border-bl-gray text-bl-yellow font-mono text-sm px-4 py-2 w-full sm:w-64 focus:outline-none focus:border-bl-yellow transition-colors placeholder-bl-gray-dark uppercase"
            />
            <div className="absolute right-0 bottom-2 w-2 h-2 bg-bl-yellow opacity-0 group-focus-within:opacity-100 transition-opacity" />
          </div>
        </div>
      </div>

      {/* Content Area */}
      {isLoading ? (
        <div className="flex-1 flex flex-col items-center justify-center p-12 border-2 border-dashed border-bl-gray-dark">
          <div className="text-bl-yellow font-display text-2xl animate-pulse">
            ACCESSING MAINFRAME...
          </div>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-12 border-2 border-dashed border-bl-gray-dark opacity-50">
          <div className="text-4xl mb-4">🚫</div>
          <div className="font-display text-xl text-bl-gray uppercase tracking-widest">
            {logs.length === 0 ? 'No Transmissions Found' : 'No Matching Data'}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 overflow-y-auto pr-2 pb-4 scrollbar-bl">
          {filteredLogs.map((log, index) => (
            <div 
              key={`${log.code}-${index}`}
              className="group relative bg-bl-black-card border-l-4 border-l-bl-gray border-t border-r border-b border-bl-gray-dark p-4 hover:border-l-bl-yellow transition-all duration-300 hover:translate-x-1"
            >
              <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center relative z-10">
                
                {/* Left: Code & Metadata */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <code className="text-xl text-white font-mono tracking-wider group-hover:text-bl-yellow transition-colors">
                      {log.code}
                    </code>
                    {log.success && (
                      <span className="bg-bl-yellow/10 text-bl-yellow text-[10px] font-bold px-2 py-0.5 border border-bl-yellow/30 uppercase tracking-widest">
                        Verified
                      </span>
                    )}
                    {!log.success && (
                      <span className="bg-red-900/20 text-red-500 text-[10px] font-bold px-2 py-0.5 border border-red-500/30 uppercase tracking-widest">
                        Corrupted
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4 text-xs font-mono text-bl-gray-light uppercase tracking-wide">
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-bl-gray group-hover:bg-bl-yellow transition-colors" />
                      {log.game || 'UNKNOWN_GAME'}
                    </span>
                    <span className="text-bl-gray-dark">///</span>
                    <span>{log.platform || 'UNIVERSAL'}</span>
                  </div>
                </div>

                {/* Right: Timestamp & Status Visual */}
                <div className="flex items-center gap-4 text-right">
                  <div className="font-mono text-xs text-bl-gray-dark group-hover:text-bl-gray transition-colors">
                    {formatTime(log.redeemedAt)}
                  </div>
                  <div className={`
                    w-8 h-8 flex items-center justify-center border-2 skew-x-[-10deg]
                    ${log.success 
                      ? 'border-bl-yellow text-bl-yellow shadow-[0_0_10px_rgba(255,189,0,0.2)]' 
                      : 'border-red-500 text-red-500 shadow-[0_0_10px_rgba(239,68,68,0.2)]'}
                  `}>
                    <span className="skew-x-[10deg] font-display text-lg">
                      {log.success ? '✓' : '!'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Decorative Background Element */}
              <div className="absolute top-0 right-0 p-1 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
                <div className="w-16 h-16 border-t-2 border-r-2 border-white rounded-tr-xl" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer Status Bar */}
      <div className="mt-auto pt-4 border-t border-bl-gray-dark flex justify-between items-center text-[10px] font-mono uppercase tracking-[0.1em] text-bl-gray-dark">
        <div>
          STATUS: <span className="text-bl-yellow">ONLINE</span>
        </div>
        <div className="flex gap-4">
          <span>SUCCESS_RATE: {logs.length > 0 ? Math.round((logs.filter(l => l.success).length / logs.length) * 100) : 0}%</span>
          <span>SYNC_ID: {Math.floor(Math.random() * 9999).toString().padStart(4, '0')}</span>
        </div>
      </div>
    </div>
  );
}
