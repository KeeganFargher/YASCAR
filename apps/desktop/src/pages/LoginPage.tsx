import { useState, FormEvent } from 'react';
import { loginToShift, ShiftSession } from '../lib/shift';

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
        setError(result.error || 'Login failed. Please try again.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bl-black flex flex-col">
      {/* Draggable title bar */}
      <div data-tauri-drag-region className="h-8 bg-bl-black-card border-b border-bl-gray-dark" />
      
      {/* Centered login form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="text-7xl mb-4">🔑</div>
            <h1 className="font-display text-5xl text-bl-yellow text-cel">
              YASCAR
            </h1>
            <p className="text-bl-gray-light mt-2 text-sm uppercase tracking-widest">
              Yet Another Shift Code Auto Redeemer
            </p>
          </div>

          {/* Login card */}
          <div className="card-bl">
            <h2 className="font-display text-2xl text-bl-orange mb-6 text-center">
              Sign In to SHiFT
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-semibold uppercase text-bl-gray-light mb-2">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-bl"
                  placeholder="vault-hunter@example.com"
                  required
                  disabled={isLoading}
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-semibold uppercase text-bl-gray-light mb-2">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-bl"
                  placeholder="••••••••"
                  required
                  disabled={isLoading}
                />
              </div>

              {error && (
                <div className="bg-bl-red/20 border-2 border-bl-red text-bl-red px-4 py-3 text-sm">
                  ❌ {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="btn-bl-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin">⚡</span>
                    Signing In...
                  </span>
                ) : (
                  '🔓 Sign In'
                )}
              </button>
            </form>

            <p className="text-xs text-bl-gray-light text-center mt-6">
              Your credentials are sent directly to Gearbox SHiFT.
              <br />
              We never store your password.
            </p>
          </div>

          {/* Links */}
          <div className="mt-6 text-center">
            <a 
              href="https://shift.gearboxsoftware.com/home" 
              target="_blank"
              rel="noopener noreferrer"
              className="text-bl-gray-light hover:text-bl-yellow text-sm underline"
            >
              Don't have an account? Create one at SHiFT →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
