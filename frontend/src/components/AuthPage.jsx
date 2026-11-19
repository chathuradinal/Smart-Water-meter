import React, { useState } from 'react';
import { 
  Droplets, Waves, Shield, Lock, User, LogIn, 
  UserPlus, ArrowLeft, CheckCircle2, AlertTriangle, 
  Sparkles, Eye, KeyRound, Cpu, Gauge
} from 'lucide-react';

export default function AuthPage({ 
  onAuthSuccess, 
  onBackToDashboard, 
  currentUsername 
}) {
  const [tab, setTab] = useState('login'); // 'login' | 'register'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!username.trim() || !password.trim()) {
      setError('Please provide both username and password.');
      return;
    }

    setLoading(true);
    const endpoint = tab === 'login' ? '/api/auth/login' : '/api/auth/register';

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password: password.trim() })
      });
      const data = await res.json();

      if (res.ok && data.status === 'success') {
        if (tab === 'register') {
          setSuccessMsg(`Account created for ${data.username}! Signing in...`);
          setTimeout(() => {
            onAuthSuccess(data.username);
          }, 800);
        } else {
          onAuthSuccess(data.username);
        }
      } else {
        setError(data.message || 'Authentication failed. Please check credentials.');
      }
    } catch (err) {
      setError('Network error connecting to backend auth API.');
    } finally {
      setLoading(false);
    }
  };

  const quickDemoLogin = async (demoUser, demoPass) => {
    setUsername(demoUser);
    setPassword(demoPass);
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: demoUser, password: demoPass })
      });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        onAuthSuccess(demoUser);
      } else {
        setError(data.message || 'Demo login failed.');
      }
    } catch {
      setError('Failed demo login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050c18] text-white flex flex-col justify-between relative overflow-hidden p-4 sm:p-8">
      {/* Dynamic Water Wave & Glow Ambient Effects */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 -right-40 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 left-1/3 w-[500px] h-[300px] bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Bar */}
      <div className="max-w-6xl w-full mx-auto flex items-center justify-between z-10 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 p-0.5 shadow-[0_0_20px_rgba(6,182,212,0.4)] flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Waves className="w-5 h-5 text-cyan-400" />
            </div>
          </div>
          <div>
            <span className="font-extrabold text-lg tracking-tight">
              AquaMeter <span className="text-cyan-400">AI</span>
            </span>
            <span className="text-xs text-slate-400 block -mt-1">
              IoT Water Utilities Platform
            </span>
          </div>
        </div>

        {onBackToDashboard && (
          <button
            onClick={onBackToDashboard}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 hover:border-cyan-500/40 text-xs text-slate-300 hover:text-white transition shadow-sm active:scale-95"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-cyan-400" />
            Back to Dashboard
          </button>
        )}
      </div>

      {/* Main Authentication Grid */}
      <div className="max-w-5xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center z-10 my-auto">
        {/* Left Column: Water Highlights & Value Propositions */}
        <div className="lg:col-span-6 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold">
            <Droplets className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            Edge AI Retrofitting Solution
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
            Intelligent Water <br />
            <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-blue-400 bg-clip-text text-transparent">
              Monitoring & Leak AI
            </span>
          </h2>

          <p className="text-sm text-slate-300 leading-relaxed">
            Retrofitting mechanical domestic water meters with ESP32-CAM TinyML dial digit recognition, continuous night-flow leak surveillance, and official Sri Lanka NWSDB domestic tiered billing estimation.
          </p>

          {/* Feature List */}
          <div className="space-y-3 pt-2">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/50 border border-cyan-900/30 backdrop-blur-sm">
              <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 mt-0.5">
                <Cpu className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">TinyML Digit OCR (99.91% Accuracy)</h4>
                <p className="text-[11px] text-slate-400">5 mechanical drums classified at edge (4 white + 1 red #8).</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/50 border border-cyan-900/30 backdrop-blur-sm">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 mt-0.5">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Two-Tier Leak Detection</h4>
                <p className="text-[11px] text-slate-400">Night resting flow surveillance (01:00-05:00) + Isolation Forest.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/50 border border-cyan-900/30 backdrop-blur-sm">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 mt-0.5">
                <Gauge className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Isolated Per-User Telemetry Context</h4>
                <p className="text-[11px] text-slate-400">Each account maintains separate chat threads and custom alerts.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Glassmorphism Authentication Box */}
        <div className="lg:col-span-6">
          <div className="card-modern bg-slate-900/85 backdrop-blur-2xl border border-cyan-500/30 rounded-3xl p-6 sm:p-8 shadow-[0_0_60px_rgba(6,182,212,0.15)] relative">
            {/* Water Wave Glow Accent on Card Top */}
            <div className="absolute top-0 left-1/4 right-1/4 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_12px_rgba(6,182,212,0.9)]" />

            {/* Current user badge if logged in */}
            {currentUsername && (
              <div className="mb-4 p-2 rounded-xl bg-cyan-950/40 border border-cyan-800/40 flex items-center justify-between text-xs">
                <span className="text-slate-400">
                  Currently active: <strong className="text-cyan-300 font-mono">{currentUsername}</strong>
                </span>
                <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-semibold">
                  <CheckCircle2 className="w-3 h-3" /> Connected
                </span>
              </div>
            )}

            {/* Tab Switcher: Sign In vs Create Account */}
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-950/80 rounded-xl mb-6 border border-slate-800">
              <button
                type="button"
                onClick={() => { setTab('login'); setError(''); setSuccessMsg(''); }}
                className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  tab === 'login'
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-900/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setTab('register'); setError(''); setSuccessMsg(''); }}
                className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  tab === 'register'
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-900/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                Create Account
              </button>
            </div>

            {/* Alert / Error / Success Messages */}
            {error && (
              <div className="p-3 mb-4 text-xs rounded-xl bg-rose-950/60 border border-rose-800 text-rose-200 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
            {successMsg && (
              <div className="p-3 mb-4 text-xs rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-200 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Account Username
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. admin or alice"
                    className="w-full bg-slate-950/80 text-white text-sm rounded-xl pl-10 pr-4 py-2.5 border border-slate-700/80 focus:border-cyan-400 focus:shadow-[0_0_15px_rgba(6,182,212,0.3)] transition"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Security Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950/80 text-white text-sm rounded-xl pl-10 pr-4 py-2.5 border border-slate-700/80 focus:border-cyan-400 focus:shadow-[0_0_15px_rgba(6,182,212,0.3)] transition"
                    required
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600 via-cyan-500 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-sm shadow-lg shadow-cyan-900/40 transition-all active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <span className="animate-pulse">Authenticating...</span>
                ) : tab === 'login' ? (
                  <>
                    <LogIn className="w-4 h-4" />
                    Sign In to Dashboard
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    Register New Account
                  </>
                )}
              </button>
            </form>

            {/* Quick 1-Click Demo Accounts */}
            <div className="mt-6 pt-5 border-t border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 block mb-2.5 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                1-Click Quick Demo Accounts:
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => quickDemoLogin('admin', 'admin123')}
                  disabled={loading}
                  className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-left border border-slate-700 transition group"
                >
                  <div className="flex items-center justify-between text-xs font-bold text-white mb-0.5">
                    <span>Admin</span>
                    <span className="text-[10px] text-cyan-400 group-hover:underline">Login</span>
                  </div>
                  <span className="text-[10px] text-slate-400 block">User: admin / admin123</span>
                </button>

                <button
                  type="button"
                  onClick={() => quickDemoLogin('user1', 'user123')}
                  disabled={loading}
                  className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-left border border-slate-700 transition group"
                >
                  <div className="flex items-center justify-between text-xs font-bold text-white mb-0.5">
                    <span>User 1</span>
                    <span className="text-[10px] text-cyan-400 group-hover:underline">Login</span>
                  </div>
                  <span className="text-[10px] text-slate-400 block">User: user1 / user123</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-6xl w-full mx-auto text-center text-xs text-slate-500 py-4 z-10 border-t border-slate-900 mt-6">
        IoT Smart Water Meter Retrofitting System · National Water Supply and Drainage Board (NWSDB) Domestic Calibrated
      </div>
    </div>
  );
}

