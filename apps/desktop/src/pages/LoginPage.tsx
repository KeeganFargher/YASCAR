import { useState, FormEvent } from 'react';
import { loginToShift, ShiftSession } from '../lib/shift';
import logo from '../assets/logo2.jpg';
import { Mail, Key, AlertTriangle, Loader2, Shield, ChevronRight } from 'lucide-react';

interface LoginPageProps {
  onLogin: (session: ShiftSession) => void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const result = await loginToShift(email, password);

      if (result.success && result.session) {
        onLogin(result.session);
      } else {
        setError(result.error || 'Authentication Failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection Error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bl-black flex flex-col relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="scanline" />
        <div className="crt-overlay" />
        {/* Large Decorative Vault Symbol approximation */}
        <div className="absolute -left-20 top-1/2 -translate-y-1/2 w-96 h-96 rounded-full border-[20px] border-bl-gray-dark opacity-10 blur-sm" />
        <div className="absolute -left-10 top-1/2 -translate-y-1/2 w-[400px] h-[10px] bg-bl-gray-dark opacity-10 rotate-45" />
        <div className="absolute -left-10 top-1/2 -translate-y-1/2 w-[400px] h-[10px] bg-bl-gray-dark opacity-10 -rotate-45" />
      </div>

      {/* Draggable Title Bar */}
      <div data-tauri-drag-region className="h-8 bg-black/50 border-b border-bl-gray-dark z-50 flex items-center px-4 justify-between">
        <div className="flex gap-2">
          <div className="w-2 h-2 rounded-full bg-bl-red animate-pulse" />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-5 relative z-10 animate-in fade-in duration-700">
        <div className="w-full max-w-md">

          {/* Header Brand */}
          <div className="text-center mb-8 relative">
            <div className="inline-block relative group">
              <img
                src={logo}
                alt="YASCAR"
                className="h-40 w-auto object-contain transform -rotate-2 hover:rotate-0 transition-transform duration-300 drop-shadow-[0_0_15px_rgba(247,201,72,0.3)]"
              />
              <span className="absolute -bottom-2 -right-4 text-bl-yellow text-sm font-bold bg-bl-black px-2 border border-bl-yellow transform skew-x-12 shadow-lg">
                VER 2.0
              </span>
            </div>
            <p className="text-bl-gray-light mt-4 text-sm font-mono tracking-[0.15em] uppercase">
              Yet Another Shift Code Auto Redeemer
            </p>
          </div>

          {/* Login Terminal */}
          <div className="card-bl shadow-[0_0_50px_rgba(245,197,24,0.1)] backdrop-blur-sm">
            <div className="border-b border-bl-gray-dark pb-4 mb-6 text-center">
              <h2 className="font-display text-3xl text-white tracking-widest">
                SHiFT LOGIN
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1 group">
                <label htmlFor="email" className="flex justify-between text-xs font-bold uppercase text-bl-gray-light tracking-widest group-focus-within:text-bl-yellow transition-colors">
                  <span>Email Address</span>
                  <span className="opacity-0 group-focus-within:opacity-100 transition-opacity">REQUIRED</span>
                </label>
                <div className="relative">
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-bl pl-10 bg-black/50"
                    placeholder="ENTER EMAIL..."
                    required
                    disabled={isLoading}
                    autoComplete="email"
                  />
                  <span className="absolute left-3 top-3 text-bl-gray-light group-focus-within:text-bl-yellow transition-colors">
                    <Mail className="w-4 h-4" />
                  </span>
                </div>
              </div>

              <div className="space-y-1 group">
                <label htmlFor="password" className="flex justify-between text-xs font-bold uppercase text-bl-gray-light tracking-widest group-focus-within:text-bl-yellow transition-colors">
                  <span>Password</span>
                  <span className="opacity-0 group-focus-within:opacity-100 transition-opacity">SECURE</span>
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-bl pl-10 bg-black/50"
                    placeholder="ENTER PASSWORD..."
                    required
                    disabled={isLoading}
                  />
                  <span className="absolute left-3 top-3 text-bl-gray-light group-focus-within:text-bl-yellow transition-colors">
                    <Key className="w-4 h-4" />
                  </span>
                </div>
              </div>

              {/* Status Display area - only renders when needed */}
              {(error || isLoading) && (
                <div className={`
                  p-3 flex items-center justify-center text-sm font-bold border-2 border-dashed transition-all duration-300 animate-in fade-in slide-in-from-top-2
                  ${error
                    ? 'bg-bl-red/10 border-bl-red text-bl-red animate-glitch'
                    : 'bg-bl-yellow/10 border-bl-yellow text-bl-yellow'
                  }
                `}>
                  {error && (
                    <span className="flex items-center gap-2 uppercase tracking-wide">
                      <AlertTriangle className="w-4 h-4" /> {error}
                    </span>
                  )}
                  {isLoading && (
                    <span className="flex items-center gap-2 uppercase tracking-wide animate-pulse">
                      <Loader2 className="w-4 h-4 animate-spin" /> CONNECTING TO GEARBOX...
                    </span>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="btn-bl-primary w-full group relative overflow-hidden"
              >
                <span className="relative z-10 flex items-center justify-center gap-2 group-hover:tracking-widest transition-all duration-300">
                  {isLoading ? 'AUTHENTICATING...' : 'LOG IN TO SHIFT'}
                  {!isLoading && <ChevronRight className="w-5 h-5" />}
                </span>
                {/* Hover scan effect */}
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 skew-y-12" />
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-bl-gray-dark text-center space-y-4">
              {/* Privacy Notice */}
              <div className="bg-bl-black/80 border border-bl-gray-light/30 p-4 text-left shadow-lg">
                <div className="flex items-center gap-2 mb-2 text-bl-yellow text-sm font-bold uppercase tracking-wider">
                  <Shield className="w-4 h-4" /> Security Notice
                </div>
                <p className="text-xs text-white/90 leading-relaxed font-regular">
                  Your credentials are sent directly to Gearbox Software's SHiFT servers.
                  We do not store your password, and no data is sent to any third-party
                  servers. Your session token is stored securely on your device.
                </p>
                <a href="https://github.com/KeeganFargher/YASCAR" target="_blank"
                  rel="noopener noreferrer" className="text-xs text-white/90 leading-relaxed font-regular">View Source Code Here</a>
              </div>

              <a
                href="https://shift.gearboxsoftware.com/home"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-xs font-bold text-bl-gray hover:text-bl-yellow transition-colors uppercase tracking-wide border-b border-transparent hover:border-bl-yellow"
              >
                Create New SHiFT Account
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
