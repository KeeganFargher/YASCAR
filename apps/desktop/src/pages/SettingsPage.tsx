import { useState, useEffect } from 'react';
import { GameTitle, Platform } from '@yascar/types';
import { loadConfig, saveConfig } from '../lib/store';
import { UserConfig } from '@yascar/user-config';
import { Check, Loader2 } from 'lucide-react';
import { enable, disable, isEnabled } from '@tauri-apps/plugin-autostart';

const GAMES = [
  { id: GameTitle.BL_GOTY, label: 'Borderlands GOTY' },
  { id: GameTitle.BL2, label: 'Borderlands 2' },
  { id: GameTitle.BL_TPS, label: 'Borderlands: The Pre-Sequel' },
  { id: GameTitle.BL3, label: 'Borderlands 3' },
  { id: GameTitle.BL4, label: 'Borderlands 4' },
  { id: GameTitle.WONDERLANDS, label: "Tiny Tina's Wonderlands" },
];

const PLATFORMS = [
  { id: Platform.UNIVERSAL, label: 'Universal' },
  { id: Platform.PC, label: 'PC (Steam/Epic)' },
  { id: Platform.PLAYSTATION, label: 'PlayStation' },
  { id: Platform.XBOX, label: 'Xbox' },
];

const INTERVALS = [
  { value: 15, label: '15 minutes' },
  { value: 30, label: '30 minutes' },
  { value: 60, label: '1 hour' },
  { value: 120, label: '2 hours' },
  { value: 240, label: '4 hours' },
];

export function SettingsPage() {
  const [config, setConfig] = useState<UserConfig | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle');

  useEffect(() => {
    loadConfig().then(setConfig);
  }, []);

  if (!config) {
    return (
      <div className="flex h-screen items-center justify-center text-bl-yellow">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  const updateConfig = async (newConfig: UserConfig) => {
    setConfig(newConfig);
    setIsSaving(true);
    setSaveStatus('idle');
    try {
      await saveConfig(newConfig);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Failed to save config:', error);
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleGame = (id: string) => {
    if (!config) return;
    const games = config.games.includes(id as GameTitle)
      ? config.games.filter(g => g !== id)
      : [...config.games, id as GameTitle];
    updateConfig({ ...config, games });
  };

  const togglePlatform = (id: string) => {
    if (!config) return;
    const platforms = config.platforms.includes(id as Platform)
      ? config.platforms.filter(p => p !== id)
      : [...config.platforms, id as Platform];
    updateConfig({ ...config, platforms });
  };

  const toggleStartOnBoot = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!config) return;
    const shouldEnable = e.target.checked;

    try {
      if (shouldEnable) {
        await enable();
        console.log('Autostart enabled');
      } else {
        await disable();
        console.log('Autostart disabled');
      }
      // Update config strictly for UI persistence
      updateConfig({ ...config, startOnBoot: shouldEnable });
    } catch (err) {
      console.error('Failed to toggle autostart:', err);
      // Revert UI if failed
      updateConfig({ ...config, startOnBoot: !shouldEnable });
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* HUD Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-l-4 border-bl-yellow pl-4 py-2 bg-gradient-to-r from-bl-yellow/5 to-transparent">
        <div>
          <h1 className="font-display text-5xl text-bl-yellow text-cel tracking-tighter">
            Settings
          </h1>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-[10px] font-bold uppercase text-bl-gray-light tracking-widest">User Preferences</span>
            <div className={`flex items-center gap-2 transition-opacity duration-300 ${isSaving || saveStatus === 'saved' ? 'opacity-100' : 'opacity-0'}`}>
              {isSaving ? (
                <Loader2 className="h-3 w-3 text-bl-yellow animate-spin" />
              ) : (
                <div className="h-1.5 w-1.5 rounded-full bg-bl-green" />
              )}
              <span className={`text-[10px] font-bold uppercase tracking-widest ${isSaving ? 'text-bl-yellow' : 'text-bl-green'}`}>
                {isSaving ? 'SAVING...' : 'SAVED'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-8">
          {/* Games Section */}
          <div className="card-bl-asymmetric group hover:border-bl-yellow transition-colors duration-300">
            <h2 className="font-display text-2xl text-white mb-1 tracking-tight">Games</h2>
            <div className="text-[10px] font-bold uppercase text-bl-gray-light mb-6 tracking-widest border-b border-bl-gray-dark pb-2">Active Titles</div>

            <div className="space-y-3">
              {GAMES.map(game => (
                <label
                  key={game.id}
                  className="flex items-center gap-4 cursor-pointer group/item"
                >
                  <div className="relative flex items-center justify-center">
                    <input
                      type="checkbox"
                      checked={config.games.includes(game.id)}
                      onChange={() => toggleGame(game.id)}
                      className="peer sr-only"
                    />
                    <div className="w-5 h-5 border-2 border-bl-gray bg-bl-black peer-checked:bg-bl-yellow peer-checked:border-bl-yellow transition-all" />
                    <div className="absolute opacity-0 peer-checked:opacity-100 text-black">
                      <Check className="w-3.5 h-3.5" strokeWidth={4} />
                    </div>
                  </div>
                  <span className="font-display text-lg uppercase tracking-wide group-hover/item:text-bl-yellow transition-colors">
                    {game.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Platforms Section */}
          <div className="card-bl-asymmetric group hover:border-bl-blue transition-colors duration-300">
            <h2 className="font-display text-2xl text-white mb-1 tracking-tight">Platforms</h2>
            <div className="text-[10px] font-bold uppercase text-bl-gray-light mb-6 tracking-widest border-b border-bl-gray-dark pb-2">Target Platforms</div>

            <div className="space-y-3">
              {PLATFORMS.map(platform => (
                <label
                  key={platform.id}
                  className="flex items-center gap-4 cursor-pointer group/item"
                >
                  <div className="relative flex items-center justify-center">
                    <input
                      type="checkbox"
                      checked={config.platforms.includes(platform.id)}
                      onChange={() => togglePlatform(platform.id)}
                      className="peer sr-only"
                    />
                    <div className="w-5 h-5 border-2 border-bl-gray bg-bl-black peer-checked:bg-bl-blue peer-checked:border-bl-blue transition-all" />
                    <div className="absolute opacity-0 peer-checked:opacity-100 text-white">
                      <Check className="w-3.5 h-3.5" strokeWidth={4} />
                    </div>
                  </div>
                  <span className="font-display text-lg uppercase tracking-wide group-hover/item:text-bl-blue transition-colors">
                    {platform.label}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {/* Automation Section */}
          <div className="card-bl-asymmetric border-l-bl-purple group hover:border-bl-purple transition-colors duration-300">
            <h2 className="font-display text-2xl text-white mb-1 tracking-tight">Automation</h2>
            <div className="text-[10px] font-bold uppercase text-bl-purple mb-6 tracking-widest border-b border-bl-gray-dark pb-2">Redemption Rules</div>

            <label className="flex items-center gap-4 cursor-pointer group/item mb-6">
              <div className="relative flex items-center justify-center">
                <input
                  type="checkbox"
                  checked={config.autoRedeem}
                  onChange={(e) => updateConfig({ ...config, autoRedeem: e.target.checked })}
                  className="peer sr-only"
                />
                <div className="w-10 h-5 border-2 border-bl-gray bg-bl-black relative transition-all peer-checked:border-bl-purple">
                  <div className="absolute top-0.5 left-0.5 w-3 h-3 bg-bl-gray transition-all peer-checked:left-5.5 peer-checked:bg-bl-purple"
                    style={{ left: config.autoRedeem ? '22px' : '2px' }} />
                </div>
              </div>
              <span className="font-display text-lg uppercase tracking-wide group-hover/item:text-bl-purple transition-colors">
                Enable Auto-Redeem
              </span>
            </label>

            <label className="flex items-center gap-4 cursor-pointer group/item mb-6">
              <div className="relative flex items-center justify-center">
                <input
                  type="checkbox"
                  checked={!!config.startOnBoot}
                  onChange={toggleStartOnBoot}
                  className="peer sr-only"
                />
                <div className="w-10 h-5 border-2 border-bl-gray bg-bl-black relative transition-all peer-checked:border-bl-purple">
                  <div className="absolute top-0.5 left-0.5 w-3 h-3 bg-bl-gray transition-all peer-checked:left-5.5 peer-checked:bg-bl-purple"
                    style={{ left: config.startOnBoot ? '22px' : '2px' }} />
                </div>
              </div>
              <span className="font-display text-lg uppercase tracking-wide group-hover/item:text-bl-purple transition-colors">
                Start on Boot
              </span>
            </label>

            <label className="flex items-center gap-4 cursor-pointer group/item mb-6">
              <div className="relative flex items-center justify-center">
                <input
                  type="checkbox"
                  checked={!!config.notifyOnAutoRedeem}
                  onChange={(e) => updateConfig({ ...config, notifyOnAutoRedeem: e.target.checked })}
                  className="peer sr-only"
                />
                <div className="w-10 h-5 border-2 border-bl-gray bg-bl-black relative transition-all peer-checked:border-bl-purple">
                  <div className="absolute top-0.5 left-0.5 w-3 h-3 bg-bl-gray transition-all peer-checked:left-5.5 peer-checked:bg-bl-purple"
                    style={{ left: config.notifyOnAutoRedeem ? '22px' : '2px' }} />
                </div>
              </div>
              <span className="font-display text-lg uppercase tracking-wide group-hover/item:text-bl-purple transition-colors">
                Redemption Notifications
              </span>
            </label>

            <div className={`space-y-4 transition-all duration-300 ${config.autoRedeem ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
              <label className="block text-[10px] font-bold uppercase text-bl-gray-light tracking-widest">
                Check Interval
              </label>
              <select
                value={config.checkIntervalMinutes}
                onChange={(e) => updateConfig({ ...config, checkIntervalMinutes: Number(e.target.value) })}
                className="input-bl font-display text-lg uppercase"
              >
                {INTERVALS.map(opt => (
                  <option key={opt.value} value={opt.value} className="bg-bl-black">
                    {opt.label.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
