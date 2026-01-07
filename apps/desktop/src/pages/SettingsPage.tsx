import { useState, useEffect } from 'react';
import { GameTitle, Platform } from '@yascar/types';
import { loadConfig, saveConfig } from '../lib/store';
import { UserConfig } from '@yascar/user-config';

const GAMES = [
  { id: GameTitle.BL_GOTY, label: 'Borderlands GOTY' },
  { id: GameTitle.BL2, label: 'Borderlands 2' },
  { id: GameTitle.BL_TPS, label: 'Borderlands: The Pre-Sequel' },
  { id: GameTitle.BL3, label: 'Borderlands 3' },
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
    return <div className="text-bl-yellow">Loading...</div>;
  }

  const toggleGame = (id: string) => {
    const games = config.games.includes(id as GameTitle)
      ? config.games.filter(g => g !== id)
      : [...config.games, id as GameTitle];
    setConfig({ ...config, games });
  };

  const togglePlatform = (id: string) => {
    const platforms = config.platforms.includes(id as Platform)
      ? config.platforms.filter(p => p !== id)
      : [...config.platforms, id as Platform];
    setConfig({ ...config, platforms });
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus('idle');
    try {
      await saveConfig(config);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Failed to save config:', error);
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="font-display text-4xl text-bl-yellow text-cel">Settings</h1>

      {/* Games */}
      <div className="card-bl">
        <h2 className="font-display text-2xl text-bl-orange mb-4">Games</h2>
        <p className="text-bl-gray-light text-sm mb-4">Select which games to redeem codes for:</p>
        <div className="space-y-2">
          {GAMES.map(game => (
            <label 
              key={game.id}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <input
                type="checkbox"
                checked={config.games.includes(game.id)}
                onChange={() => toggleGame(game.id)}
                className="w-5 h-5 accent-bl-yellow bg-bl-black border-2 border-bl-gray"
              />
              <span className="group-hover:text-bl-yellow transition-colors">
                {game.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Platforms */}
      <div className="card-bl">
        <h2 className="font-display text-2xl text-bl-orange mb-4">Platforms</h2>
        <p className="text-bl-gray-light text-sm mb-4">Select your gaming platforms:</p>
        <div className="space-y-2">
          {PLATFORMS.map(platform => (
            <label 
              key={platform.id}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <input
                type="checkbox"
                checked={config.platforms.includes(platform.id)}
                onChange={() => togglePlatform(platform.id)}
                className="w-5 h-5 accent-bl-yellow bg-bl-black border-2 border-bl-gray"
              />
              <span className="group-hover:text-bl-yellow transition-colors">
                {platform.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Auto-redeem */}
      <div className="card-bl">
        <h2 className="font-display text-2xl text-bl-orange mb-4">Auto-Redeem</h2>
        
        <label className="flex items-center gap-3 cursor-pointer group mb-4">
          <input
            type="checkbox"
            checked={config.autoRedeem}
            onChange={(e) => setConfig({ ...config, autoRedeem: e.target.checked })}
            className="w-5 h-5 accent-bl-yellow bg-bl-black border-2 border-bl-gray"
          />
          <span className="group-hover:text-bl-yellow transition-colors">
            Enable automatic code redemption
          </span>
        </label>

        {config.autoRedeem && (
          <div>
            <label className="block text-bl-gray-light text-sm mb-2">
              Check interval:
            </label>
            <select
              value={config.checkIntervalMinutes}
              onChange={(e) => setConfig({ ...config, checkIntervalMinutes: Number(e.target.value) })}
              className="input-bl"
            >
              {INTERVALS.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={isSaving}
        className={`btn-bl-primary w-full disabled:opacity-50 ${
          saveStatus === 'saved' ? 'bg-bl-green' : ''
        }`}
      >
        {isSaving ? 'Saving...' : saveStatus === 'saved' ? '✓ Saved!' : '💾 Save Settings'}
      </button>
    </div>
  );
}
