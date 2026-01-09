import { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import appIcon from "../assets/icon.png";
import { LogOut } from "lucide-react";

interface LayoutProps {
  children: ReactNode;
  onLogout: () => void;
}

export function Layout({ children, onLogout }: LayoutProps) {
  return (
    <div className="min-h-screen bg-bl-black flex flex-col relative overflow-hidden">
      {/* Global CRT Effects */}
      <div className="crt-overlay pointer-events-none" />
      <div className="scanline pointer-events-none" />

      {/* Decorative background elements for the main shell */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-bl-yellow/5 rounded-bl-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-32 bg-gradient-to-t from-bl-gray-dark/20 to-transparent pointer-events-none" />

      {/* Title bar / HUD Header */}
      <header
        data-tauri-drag-region
        className="h-16 bg-gradient-to-r from-bl-black to-bl-black-card border-b-2 border-bl-gray-dark flex items-center justify-between px-6 z-50 relative shadow-lg"
      >
        <div className="flex items-center gap-3">
          <img
            src={appIcon}
            alt="YASCAR"
            className="w-10 h-10 object-cover rounded-md border border-bl-gray-dark shadow-lg"
          />
          <div className="flex flex-col">
            <span className="font-display text-bl-yellow text-2xl tracking-tighter leading-none text-cel">
              YASCAR
            </span>
            <span className="text-[10px] text-gray-400 uppercase tracking-[0.15em] leading-none">
              Yet Another Shift Code Auto Redeemer
            </span>
          </div>
        </div>

        <nav className="flex items-center gap-2">
          {[
            { to: "/", label: "Dashboard" },
            { to: "/log", label: "Echo Logs" },
            { to: "/settings", label: "Settings" },
          ].map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `px-6 py-1 font-display text-lg uppercase tracking-wider skew-x-[-15deg] transition-all duration-200 border border-transparent
                ${
                  isActive
                    ? "bg-bl-yellow text-black border-bl-yellow shadow-glow-yellow translate-y-0.5"
                    : "text-gray-400 hover:text-white hover:bg-white/5 hover:border-bl-gray"
                }`
              }
            >
              <div className="skew-x-[15deg]">{link.label}</div>
            </NavLink>
          ))}

          <div className="w-px h-8 bg-bl-gray-dark mx-2 skew-x-[-15deg]" />

          <button
            onClick={onLogout}
            className="group px-4 py-1 font-display text-sm uppercase tracking-widest text-bl-red/80 hover:text-bl-red transition-colors flex items-center gap-2"
          >
            <span className="group-hover:animate-pulse">Log Out</span>
            <LogOut className="w-4 h-4" />
          </button>
        </nav>
      </header>

      {/* Main content container */}
      <main className="flex-1 overflow-hidden relative z-0">
        <div className="absolute inset-0 overflow-auto scrollbar-bl p-6 pb-12">
          {children}
        </div>
      </main>
    </div>
  );
}
