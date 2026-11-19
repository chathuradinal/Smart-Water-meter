import React, { useState } from 'react';
import { User, Lock, X, LogIn, UserPlus, Shield, CheckCircle2 } from 'lucide-react';

export default function AuthModal({ isOpen, onClose, onAuthSuccess, currentUsername }) {
  const [tab, setTab] = useState('login'); // 'login' | 'register'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
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
        onAuthSuccess(data.username);
        onClose();
      } else {
        setError(data.message || 'Authentication failed.');
      }
    } catch (err) {
      setError('Network error connecting to auth server.');
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
        onClose();
      }
    } catch (err) {
      setError('Failed demo login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="card-modern w-full max-w-md p-6 bg-slate-900 border border-slate-700 shadow-2xl relative rounded-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 bg-blue-500/10 border border-blue-500/30 rounded-xl text-blue-400">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Smart Meter Access</h3>
            <p className="text-xs text-slate-400">Maintains isolated chat history per user account</p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 gap-1 p-1 bg-slate-800/80 rounded-xl mb-4 border border-slate-700/60">
          <button
            onClick={() => { setTab('login'); setError(''); }}
            className={`py-2 text-xs font-semibold rounded-lg transition flex items-center justify-center gap-1.5 ${
              tab === 'login' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            Sign In
          </button>
          <button
            onClick={() => { setTab('register'); setError(''); }}
            className={`py-2 text-xs font-semibold rounded-lg transition flex items-center justify-center gap-1.5 ${
              tab === 'register' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            Create Account
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="p-2.5 mb-4 text-xs rounded-lg bg-red-950/60 border border-red-800 text-red-200">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Username</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. admin or alice"
                className="w-full bg-slate-800 text-sm text-white rounded-lg pl-9 pr-3 py-2 border border-slate-700 focus:outline-none focus:border-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-800 text-sm text-white rounded-lg pl-9 pr-3 py-2 border border-slate-700 focus:outline-none focus:border-blue-500"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition text-sm flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
          >
            {loading ? (
              <span className="animate-pulse">Authenticating...</span>
            ) : tab === 'login' ? (
              <>
                <LogIn className="w-4 h-4" /> Sign In
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" /> Create Account
              </>
            )}
          </button>
        </form>

        {/* Pre-seeded Demo Accounts */}
        <div className="mt-5 pt-4 border-t border-slate-800">
          <span className="text-[11px] font-semibold text-slate-400 block mb-2">
            Quick 1-Click Demo Accounts:
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => quickDemoLogin('admin', 'admin123')}
              className="flex-1 py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg border border-slate-700 flex items-center justify-center gap-1.5 transition"
            >
              <User className="w-3 h-3 text-cyan-400" />
              Login as <strong>admin</strong>
            </button>
            <button
              type="button"
              onClick={() => quickDemoLogin('user1', 'user123')}
              className="flex-1 py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg border border-slate-700 flex items-center justify-center gap-1.5 transition"
            >
              <User className="w-3 h-3 text-purple-400" />
              Login as <strong>user1</strong>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

