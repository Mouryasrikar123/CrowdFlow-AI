import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Shield, Users, LogIn, Monitor, AlertCircle, Sparkles } from 'lucide-react';

interface LoginViewProps {
  onLogin: (role: 'admin' | 'volunteer' | 'public', username?: string) => void;
}

export default function LoginView({ onLogin }: LoginViewProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Invalid username or password');
      }

      const data = await res.json();
      onLogin(data.role, data.username);
    } catch (err: any) {
      setError(err.message || 'Server connection failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoAccess = (role: 'admin' | 'volunteer' | 'public') => {
    if (role === 'admin') {
      onLogin('admin', 'demo-admin');
    } else if (role === 'volunteer') {
      onLogin('volunteer', 'volunteer1');
    } else {
      onLogin('public', 'public-visitor');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center relative overflow-hidden px-4 text-slate-900 font-sans">
      {/* Background radial glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-[350px] h-[350px] bg-purple-500/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Header Info */}
      <div className="text-center mb-8 relative z-10 max-w-md">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 text-xs font-medium mb-4 shadow-sm"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          CrowdFlow AI Platform
        </motion.div>
        
        <motion.h1 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl"
        >
          Crowd<span className="text-indigo-600">Flow AI</span>
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-2 text-sm text-slate-500"
        >
          Real-time crowd monitoring and smart gate recommendations powered by Gemini 3.5 Flash.
        </motion.p>
      </div>

      {/* Main Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="w-full max-w-md bg-white border border-slate-200 shadow-lg p-8 rounded-2xl relative z-10"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <h2 className="text-xl font-bold text-slate-900 mb-2">Sign in to Console</h2>

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-rose-50 border border-rose-100 text-rose-700 text-xs rounded-lg flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
              <span>{error}</span>
            </motion.div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-500">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-900 rounded-lg transition-all outline-none text-sm"
              placeholder="e.g. admin or volunteer1"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="text-xs font-medium text-slate-500">Password</label>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-900 rounded-lg transition-all outline-none text-sm"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-lg flex items-center justify-center gap-2 shadow-md shadow-indigo-600/10 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {isLoading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                Authenticate
              </>
            )}
          </button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-slate-150"></div>
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="px-3 bg-white text-slate-400 font-medium">Demo Profiles Quick Access</span>
          </div>
        </div>

        {/* Demo profiles quick entry */}
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => handleDemoAccess('admin')}
            className="p-2.5 rounded-xl bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 transition-all flex flex-col items-center justify-center gap-1.5"
          >
            <Shield className="w-4 h-4 text-indigo-600" />
            <span className="text-[11px] font-bold text-slate-700">Admin</span>
            <span className="text-[9px] text-slate-400 font-mono">admin123</span>
          </button>

          <button
            onClick={() => handleDemoAccess('volunteer')}
            className="p-2.5 rounded-xl bg-slate-50 hover:bg-purple-50 border border-slate-200 hover:border-purple-200 transition-all flex flex-col items-center justify-center gap-1.5"
          >
            <Users className="w-4 h-4 text-purple-600" />
            <span className="text-[11px] font-bold text-slate-700">Volunteer</span>
            <span className="text-[9px] text-slate-400 font-mono">volunteer123</span>
          </button>

          <button
            onClick={() => handleDemoAccess('public')}
            className="p-2.5 rounded-xl bg-slate-50 hover:bg-cyan-50 border border-slate-200 hover:border-cyan-200 transition-all flex flex-col items-center justify-center gap-1.5"
          >
            <Monitor className="w-4 h-4 text-cyan-600" />
            <span className="text-[11px] font-bold text-slate-700">Public TV</span>
            <span className="text-[9px] text-slate-400 font-mono">No Auth</span>
          </button>
        </div>
      </motion.div>

      {/* Footer copyright */}
      <div className="mt-12 text-xs text-slate-400 font-mono">
        CrowdFlow AI © 2026 • Port 3000 Security Node Active
      </div>
    </div>
  );
}
