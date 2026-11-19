import React from 'react';
import { 
  Droplets, LayoutDashboard, History, Eye, Brain, 
  MessageSquare, User, LogIn, LogOut, ChevronLeft, 
  ChevronRight, Activity, AlertTriangle, ShieldCheck,
  Waves, Sparkles
} from 'lucide-react';

export default function Sidebar({ 
  activeTab, 
  setActiveTab, 
  currentUser, 
  isLeakActive, 
  snapshotCount = 0,
  collapsed,
  setCollapsed 
}) {
  const navItems = [
    {
      id: 'overview',
      label: 'Live Dashboard',
      subtitle: 'Drums, Flow & Tariff',
      icon: LayoutDashboard,
      badge: isLeakActive ? 'LEAK' : 'LIVE',
      badgeColor: isLeakActive ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
    },
    {
      id: 'snapshots',
      label: 'Snapshot History',
      subtitle: 'Captured Frames & OCR',
      icon: History,
      badge: snapshotCount > 0 ? `${snapshotCount}` : null,
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
    },
    {
      id: 'camera',
      label: 'Dial Vision & ROIs',
      subtitle: 'OV2640 Sensor Align',
      icon: Eye,
      badge: '320×240',
      badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30'
    },
    {
      id: 'ai_insights',
      label: 'AI Diagnostics',
      subtitle: 'XAI & 4h Forecaster',
      icon: Brain,
      badge: 'Edge AI',
      badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
    },
    {
      id: 'chat',
      label: 'RAG Assistant',
      subtitle: 'Telemetry Chatbot',
      icon: MessageSquare,
      badge: 'Grounded',
      badgeColor: 'bg-teal-500/20 text-teal-300 border-teal-500/30'
    },
    {
      id: 'auth',
      label: 'User Account',
      subtitle: currentUser || 'Sign In',
      icon: User,
      badge: currentUser ? 'Active' : 'Guest',
      badgeColor: 'bg-slate-700 text-slate-300 border-slate-600'
    }
  ];

  return (
    <aside 
      className={`fixed top-0 left-0 h-screen z-40 transition-all duration-300 flex flex-col justify-between border-r border-cyan-900/30 bg-gradient-to-b from-[#071326] via-[#091a33] to-[#050d1a] backdrop-blur-xl ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Top Branding Section */}
      <div>
        <div className="p-4 border-b border-cyan-900/30 flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            {/* Water Ripple Droplet Logo */}
            <div className="relative flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 p-0.5 shadow-[0_0_15px_rgba(6,182,212,0.4)] flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center relative overflow-hidden">
                <Waves className="w-5 h-5 text-cyan-400 animate-pulse" />
                <span className="absolute bottom-0 w-full h-1 bg-cyan-400 opacity-60" />
              </div>
            </div>

            {!collapsed && (
              <div className="flex flex-col">
                <span className="font-extrabold text-sm text-white tracking-tight flex items-center gap-1.5">
                  AquaMeter <span className="text-cyan-400 font-bold">AI</span>
                </span>
                <span className="text-[10px] text-cyan-200/70 font-medium truncate">
                  3/4" Smart Water OS
                </span>
              </div>
            )}
          </div>

          {/* Collapse Toggle Button */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-cyan-950/40 transition"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Live Status Pill in Sidebar */}
        {!collapsed && (
          <div className="px-4 py-2.5 mx-3 mt-3 rounded-xl bg-cyan-950/40 border border-cyan-800/40 flex items-center justify-between text-[11px]">
            <span className="flex items-center gap-1.5 text-cyan-300 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              ESP32-CAM Ingestion
            </span>
            <span className="font-mono text-[10px] text-slate-400">Port 5001</span>
          </div>
        )}

        {/* Navigation Items */}
        <nav className="p-3 space-y-1.5 mt-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-all duration-200 group relative ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-600/30 to-blue-600/20 text-white border border-cyan-500/40 shadow-[0_0_20px_rgba(6,182,212,0.15)] font-semibold'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/40 border border-transparent'
                }`}
                title={collapsed ? item.label : undefined}
              >
                {/* Active Indicator Bar */}
                {isActive && (
                  <span className="absolute left-0 top-2 bottom-2 w-1 bg-cyan-400 rounded-r-full shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
                )}

                <Icon 
                  className={`w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-110 ${
                    isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-cyan-300'
                  }`} 
                />

                {!collapsed && (
                  <div className="flex-1 flex items-center justify-between overflow-hidden">
                    <div className="flex flex-col truncate">
                      <span className="text-xs font-semibold leading-tight truncate">
                        {item.label}
                      </span>
                      <span className="text-[10px] text-slate-500 truncate">
                        {item.subtitle}
                      </span>
                    </div>

                    {item.badge && (
                      <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ml-1 ${item.badgeColor}`}>
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Profile & Hardware Section */}
      <div className="p-3 border-t border-cyan-900/30 bg-slate-950/50 space-y-2">
        {/* Hardware Status Strip */}
        {!collapsed && (
          <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              Pipe: <strong className="text-slate-200">3/4" Domestic</strong>
            </span>
            <span className="text-amber-400 font-mono">Qmax: 25 L/m</span>
          </div>
        )}

        {/* User Card */}
        <div 
          onClick={() => setActiveTab('auth')}
          className={`flex items-center gap-2.5 p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/40 transition cursor-pointer ${
            collapsed ? 'justify-center' : 'justify-between'
          }`}
          title="Manage Account / Switch User"
        >
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-cyan-600 to-blue-500 text-white flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-sm">
              {currentUser ? currentUser.charAt(0).toUpperCase() : 'U'}
            </div>
            {!collapsed && (
              <div className="flex flex-col truncate">
                <span className="text-xs font-bold text-white truncate">
                  {currentUser || 'admin'}
                </span>
                <span className="text-[10px] text-slate-400">Domestic Account</span>
              </div>
            )}
          </div>

          {!collapsed && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setActiveTab('auth');
              }}
              className="text-slate-400 hover:text-cyan-300 p-1 rounded transition"
              title="Switch user or log out"
            >
              <LogIn className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}

