import React, { useState, useEffect } from 'react';
import { 
  Camera, Droplets, AlertTriangle, Shield, User, 
  Sparkles, RefreshCw, Clock, Waves, LogIn
} from 'lucide-react';

export default function TopHeader({ 
  activeTab, 
  setActiveTab, 
  currentUser, 
  isLeakActive, 
  lastUpdated, 
  onSnapshotTriggered 
}) {
  const [capturing, setCapturing] = useState(false);
  const [time, setTime] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const tabTitles = {
    overview: { title: "Live Telemetry Dashboard", subtitle: "Mechanical Roller Drums, Flow & Slab Tariff" },
    snapshots: { title: "Captured Snapshot History", subtitle: "Archived Camera Frames, OCR Digits & ROI Inspection" },
    camera: { title: "Camera Vision & Optical Alignment", subtitle: "OmniVision OV2640 Lens Calibration & LED Flash" },
    ai_insights: { title: "AI Leak Diagnostics & Forecaster", subtitle: "Isolation Forest XAI & 4-Hour Consumption Projections" },
    chat: { title: "Conversational RAG Assistant", subtitle: "AI Grounded in Live Telemetry & NWSDB Domestic Tariffs" },
    auth: { title: "User Account & Profile", subtitle: "Switch Accounts, Register & Session Management" }
  };

  const currentMeta = tabTitles[activeTab] || tabTitles.overview;

  const handleQuickCapture = async () => {
    if (capturing) return;
    setCapturing(true);
    try {
      const res = await fetch('/api/snapshots/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'normal' })
      });
      if (res.ok && onSnapshotTriggered) {
        onSnapshotTriggered();
      }
    } catch (err) {
      console.error("Quick capture error:", err);
    } finally {
      setCapturing(false);
    }
  };

  return (
    <header className="sticky top-0 z-30 mb-6 bg-[#081326]/85 backdrop-blur-md border border-cyan-900/30 rounded-2xl p-4 shadow-lg flex flex-wrap items-center justify-between gap-4">
      {/* Left: Active Section Info */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-gradient-to-br from-cyan-500/20 to-blue-500/10 border border-cyan-500/30 rounded-xl text-cyan-400 shadow-sm flex items-center justify-center">
          <Droplets className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-extrabold text-white tracking-tight">
              {currentMeta.title}
            </h1>
            {isLeakActive && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
                <AlertTriangle className="w-3 h-3 text-rose-400" />
                LEAK ACTIVE
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400">{currentMeta.subtitle}</p>
        </div>
      </div>

      {/* Right: Controls & User Pill */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Instant Snapshot Quick Button */}
        <button
          onClick={handleQuickCapture}
          disabled={capturing}
          className="btn-sim bg-gradient-to-r from-cyan-600/30 to-blue-600/30 hover:from-cyan-600/50 hover:to-blue-600/50 text-cyan-300 border border-cyan-500/40 flex items-center gap-1.5 text-xs shadow-sm active:scale-95"
          title="Fires OV2640 flash and captures frame"
        >
          <Camera className={`w-3.5 h-3.5 ${capturing ? 'animate-pulse' : ''}`} />
          <span className="hidden sm:inline">{capturing ? 'Capturing...' : 'Quick Capture'}</span>
        </button>

        {/* Live Pulse Indicator */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-slate-300 font-medium text-[11px]">Live 5001 API</span>
          <span className="text-slate-500 font-mono text-[10px]">{time}</span>
        </div>

        {/* User Account Badge Button (Redirects to Auth Page) */}
        <button
          onClick={() => setActiveTab('auth')}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 hover:border-cyan-500/40 transition text-xs active:scale-95"
          title="Account profile and login"
        >
          <div className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-[10px]">
            {currentUser ? currentUser.charAt(0).toUpperCase() : 'U'}
          </div>
          <span className="font-semibold text-slate-200">
            {currentUser || 'admin'}
          </span>
          <LogIn className="w-3 h-3 text-cyan-400 ml-0.5" />
        </button>
      </div>
    </header>
  );
}

