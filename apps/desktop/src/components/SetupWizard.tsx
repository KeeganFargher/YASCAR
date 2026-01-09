import { useState, useEffect } from "react";
import { GameTitle, Platform } from "@yascar/types";
import { UserConfig, DEFAULT_CONFIG } from "@yascar/user-config";
import { saveConfig, setSetupCompleted } from "../lib/store";
import {
  Monitor,
  Gamepad,
  Calendar,
  Zap,
  Check,
  ChevronRight,
  ChevronLeft,
  Shield,
} from "lucide-react";

interface SetupWizardProps {
  onComplete: () => void;
}

export function SetupWizard({ onComplete }: SetupWizardProps) {
  const [step, setStep] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  // Config state
  const [games, setGames] = useState<GameTitle[]>(Object.values(GameTitle));
  const [platforms, setPlatforms] = useState<Platform[]>(
    DEFAULT_CONFIG.platforms
  );
  const [autoRedeem, setAutoRedeem] = useState(DEFAULT_CONFIG.autoRedeem);
  const [checkInterval, setCheckInterval] = useState(
    DEFAULT_CONFIG.checkIntervalMinutes
  );
  const [notify, setNotify] = useState(DEFAULT_CONFIG.notifyOnAutoRedeem);

  const handleFinish = async () => {
    setIsSaving(true);
    try {
      const newConfig: UserConfig = {
        ...DEFAULT_CONFIG,
        games,
        platforms,
        autoRedeem,
        checkIntervalMinutes: checkInterval,
        notifyOnAutoRedeem: notify,
      };

      await saveConfig(newConfig);
      await setSetupCompleted(true);

      // Artificial delay for "processing" effect
      setTimeout(() => {
        onComplete();
      }, 800);
    } catch (err) {
      console.error("Failed to save setup:", err);
      setIsSaving(false);
    }
  };

  const toggleGame = (game: GameTitle) => {
    setGames((prev) =>
      prev.includes(game) ? prev.filter((g) => g !== game) : [...prev, game]
    );
  };

  const togglePlatform = (platform: Platform) => {
    setPlatforms((prev) =>
      prev.includes(platform)
        ? prev.filter((p) => p !== platform)
        : [...prev, platform]
    );
  };

  const steps = [
    {
      title: "TRACKED GAMES",
      icon: Gamepad,
      description:
        "Select which Borderlands games you want to track codes for.",
    },
    {
      title: "YOUR PLATFORMS",
      icon: Monitor,
      description: "Which platforms do you want to redeem codes on?",
    },
    {
      title: "AUTOMATION",
      icon: Zap,
      description: "Configure how YASCAR works in the background.",
    },
  ];

  return (
    <div className="min-h-screen bg-bl-black flex flex-col relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="scanline" />
        <div className="crt-overlay" />
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-bl-yellow/5 to-transparent" />
      </div>

      <div className="flex-1 flex items-center justify-center p-8 relative z-10 animate-in fade-in duration-500">
        <div className="w-full max-w-4xl">
          {/* Header */}
          <div className="mb-12 text-center">
            <h1 className="font-display text-4xl text-white tracking-widest mb-4">
              INITIAL SETUP
            </h1>
            <div className="flex items-center justify-center gap-2">
              {steps.map((s, i) => (
                <div
                  key={i}
                  className={`flex items-center ${i < steps.length - 1 ? "w-24" : ""}`}
                >
                  <div
                    className={`
                                         w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-bold transition-all duration-300
                                         ${
                                           i === step
                                             ? "border-bl-yellow bg-bl-yellow text-black scale-110 shadow-[0_0_15px_rgba(245,197,24,0.5)]"
                                             : i < step
                                               ? "border-bl-yellow bg-bl-black text-bl-yellow"
                                               : "border-bl-gray-dark bg-bl-black text-bl-gray-dark"
                                         }
                                     `}
                  >
                    {i < step ? <Check className="w-4 h-4" /> : i + 1}
                  </div>
                  {i < steps.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 mx-2 transition-colors duration-300 ${i < step ? "bg-bl-yellow" : "bg-bl-gray-dark"}`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Step Content */}
          <div className="card-bl shadow-2xl backdrop-blur-md flex flex-col">
            <div className="p-6 border-b border-bl-gray-dark/50 flex items-center gap-4">
              <div className="p-3 bg-bl-yellow/10 rounded-lg text-bl-yellow">
                {(() => {
                  const Icon = steps[step].icon;
                  return <Icon className="w-6 h-6" />;
                })()}
              </div>
              <div>
                <h2 className="text-xl font-display text-white tracking-wider">
                  {steps[step].title}
                </h2>
                <p className="text-sm text-gray-400">
                  {steps[step].description}
                </p>
              </div>
            </div>

            <div className="flex-1 p-6">
              {/* Step 1: Games */}
              {step === 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {Object.values(GameTitle).map((game) => (
                    <button
                      key={game}
                      onClick={() => toggleGame(game)}
                      className={`
                                                relative p-3 border-2 text-left transition-all duration-200 group
                                                ${
                                                  games.includes(game)
                                                    ? "border-bl-yellow bg-bl-yellow/10"
                                                    : "border-bl-gray-dark hover:border-bl-gray-light bg-black/20"
                                                }
                                            `}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`font-bold text-sm tracking-wide ${games.includes(game) ? "text-white" : "text-gray-400"}`}
                        >
                          {game}
                        </span>
                        <div
                          className={`
                                                    w-4 h-4 border flex items-center justify-center transition-colors
                                                    ${games.includes(game) ? "border-bl-yellow bg-bl-yellow text-black" : "border-bl-gray-dark"}
                                                `}
                        >
                          {games.includes(game) && (
                            <Check className="w-3 h-3" />
                          )}
                        </div>
                      </div>
                      {/* Corner Accents */}
                      <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-current opacity-50" />
                      <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-current opacity-50" />
                    </button>
                  ))}
                </div>
              )}

              {/* Step 2: Platforms */}
              {step === 1 && (
                <div className="space-y-4">
                  <div className="p-3 bg-blue-900/20 border border-blue-500/30 text-blue-100 rounded mb-4 flex gap-3">
                    <Shield className="w-5 h-5 flex-shrink-0" />
                    <p className="text-xs">
                      Tip: Usually "Universal" is all you need. Only select
                      specific platforms if you have specific redeem
                      requirements.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {Object.values(Platform).map((platform) => (
                      <button
                        key={platform}
                        onClick={() => togglePlatform(platform)}
                        className={`
                                                    relative p-3 border-2 text-left transition-all duration-200
                                                    ${
                                                      platforms.includes(
                                                        platform
                                                      )
                                                        ? "border-bl-yellow bg-bl-yellow/10"
                                                        : "border-bl-gray-dark hover:border-bl-gray-light bg-black/20"
                                                    }
                                                `}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={`font-bold text-sm tracking-wide ${platforms.includes(platform) ? "text-white" : "text-gray-400"}`}
                          >
                            {platform}
                          </span>
                          <div
                            className={`
                                                        w-4 h-4 border flex items-center justify-center transition-colors
                                                        ${platforms.includes(platform) ? "border-bl-yellow bg-bl-yellow text-black" : "border-bl-gray-dark"}
                                                    `}
                          >
                            {platforms.includes(platform) && (
                              <Check className="w-3 h-3" />
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 3: Automation */}
              {step === 2 && (
                <div className="space-y-6 max-w-xl mx-auto">
                  {/* Auto Redeem Toggle */}
                  <div className="flex items-start justify-between p-4 bg-black/40 border border-bl-gray-dark">
                    <div>
                      <h3 className="text-base font-bold text-white mb-1">
                        Auto-Redeem Codes
                      </h3>
                      <p className="text-xs text-gray-400">
                        Automatically check for and redeem new codes in the
                        background.
                      </p>
                    </div>
                    <button
                      onClick={() => setAutoRedeem(!autoRedeem)}
                      className={`
                                               w-12 h-6 rounded-full border-2 relative transition-colors duration-300
                                               ${autoRedeem ? "border-bl-yellow bg-bl-yellow/20" : "border-bl-gray-dark bg-black"}
                                           `}
                    >
                      <div
                        className={`
                                                absolute top-0.5 left-0.5 w-4 h-4 rounded-full transition-transform duration-300
                                                ${autoRedeem ? "translate-x-6 bg-bl-yellow" : "bg-bl-gray-dark"}
                                            `}
                      />
                    </button>
                  </div>

                  {autoRedeem && (
                    <div className="space-y-4 animate-in slide-in-from-top-4 fade-in">
                      {/* Interval */}
                      <div className="space-y-2">
                        <label className="block text-xs font-bold uppercase text-gray-400 tracking-wider">
                          Check Frequency
                        </label>
                        <select
                          value={checkInterval}
                          onChange={(e) =>
                            setCheckInterval(Number(e.target.value))
                          }
                          className="w-full bg-black/50 border-2 border-bl-gray-dark p-2 text-sm text-white focus:border-bl-yellow outline-none transition-colors"
                        >
                          <option value={15}>Every 15 Minutes</option>
                          <option value={30}>Every 30 Minutes</option>
                          <option value={60}>Every 1 Hour (Recommended)</option>
                          <option value={120}>Every 2 Hours</option>
                          <option value={360}>Every 6 Hours</option>
                          <option value={1440}>Once Daily</option>
                        </select>
                      </div>

                      {/* Notifications */}
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setNotify(!notify)}
                          className={`
                                                       w-5 h-5 border-2 flex items-center justify-center transition-colors
                                                       ${notify ? "border-bl-yellow bg-bl-yellow text-black" : "border-bl-gray-dark bg-black"}
                                                   `}
                        >
                          {notify && <Check className="w-3 h-3" />}
                        </button>
                        <label
                          onClick={() => setNotify(!notify)}
                          className="cursor-pointer text-sm text-white select-none"
                        >
                          Send system notifications when codes are found
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer / Navigation */}
            <div className="p-6 border-t border-bl-gray-dark/50 flex justify-between bg-black/20">
              <button
                onClick={() => setStep((s) => Math.max(0, s - 1))}
                disabled={step === 0 || isSaving}
                className={`
                                    flex items-center gap-2 text-xs font-bold tracking-wider uppercase transition-colors
                                    ${step === 0 ? "opacity-0 pointer-events-none" : "text-gray-400 hover:text-white"}
                                `}
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>

              {step < steps.length - 1 ? (
                <button
                  onClick={() => setStep((s) => s + 1)}
                  className="btn-bl-primary px-6 py-2 flex items-center gap-2 group text-sm"
                >
                  Next Step{" "}
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              ) : (
                <button
                  onClick={handleFinish}
                  disabled={isSaving}
                  className="btn-bl-primary px-8 py-2 flex items-center gap-2 group relative overflow-hidden text-sm"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    {isSaving ? "SAVING..." : "FINISH SETUP"}
                    {!isSaving && <Check className="w-4 h-4" />}
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
