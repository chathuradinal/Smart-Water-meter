import React from 'react';
import { Droplets, Activity, User, LogIn } from 'lucide-react';

export default function Navbar({ lastUpdated, isLive, currentUser, onOpenAuth }) {
  return (
    <nav className="navbar-glass flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-cyan-400">
          <Droplets className="w-6 h-6" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-white">IoT Smart Water Meter</h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              ESP32-CAM · 3/4" Pipe · TinyML
            </span>
          </div>
          <p className="text-xs text-slate-400">Edge AI Digit Recognition & Real-Time Leak Surveillance</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* User Account Badge */}
        <div className="flex items-center gap-2 bg-slate-800/90 border border-slate-700/80 px-2.5 py-1 rounded-xl shadow-sm">
          <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center">
            <User className="w-3.5 h-3.5" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 leading-none">Account</span>
            <span className="text-xs font-bold text-slate-200 leading-tight truncate max-w-[90px]">
              {currentUser || 'admin'}
            </span>
          </div>
          <button
            onClick={onOpenAuth}
            className="ml-1 text-[11px] px-2 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold transition flex items-center gap-1 shadow-sm active:scale-95"
            title="Switch user or register"
          >
            <LogIn className="w-3 h-3" />
            <span>Switch</span>
          </button>
        </div>

        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          Live Ingestion
        </span>
        <span className="text-xs text-slate-400 hidden sm:inline">
          {lastUpdated ? `Updated: ${lastUpdated}` : 'Connecting...'}
        </span>
      </div>
    </nav>
  );
}

