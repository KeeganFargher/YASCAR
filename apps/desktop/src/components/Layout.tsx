import { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';

interface LayoutProps {
  children: ReactNode;
  onLogout: () => void;
}

export function Layout({ children, onLogout }: LayoutProps) {
  return (
    <div className="min-h-screen bg-bl-black flex flex-col">
      {/* Title bar */}
      <header 
        data-tauri-drag-region
        className="h-10 bg-bl-black-card border-b-3 border-bl-gray-dark flex items-center justify-between px-4"
      >
        <div className="flex items-center gap-2">
          <span className="text-2xl">🔑</span>
          <span className="font-display text-bl-yellow text-lg">YASCAR</span>
        </div>
        <nav className="flex items-center gap-4">
          <NavLink 
            to="/" 
            className={({ isActive }) => 
              `text-sm font-semibold uppercase transition-colors ${
                isActive ? 'text-bl-yellow' : 'text-bl-gray-light hover:text-white'
              }`
            }
          >
            Dashboard
          </NavLink>
          <NavLink 
            to="/settings" 
            className={({ isActive }) => 
              `text-sm font-semibold uppercase transition-colors ${
                isActive ? 'text-bl-yellow' : 'text-bl-gray-light hover:text-white'
              }`
            }
          >
            Settings
          </NavLink>
          <NavLink 
            to="/log" 
            className={({ isActive }) => 
              `text-sm font-semibold uppercase transition-colors ${
                isActive ? 'text-bl-yellow' : 'text-bl-gray-light hover:text-white'
              }`
            }
          >
            Log
          </NavLink>
          <button 
            onClick={onLogout}
            className="text-sm font-semibold uppercase text-bl-gray-light hover:text-bl-red transition-colors"
          >
            Logout
          </button>
        </nav>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-auto scrollbar-bl p-6">
        {children}
      </main>
    </div>
  );
}
