import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, Users, Monitor, LogOut, Sparkles, 
  RefreshCw, Menu, X, ArrowRight, Layout, AlertCircle, Signal
} from 'lucide-react';
import { DashboardMetrics, Recommendation } from './types';
import LoginView from './components/LoginView';
import AdminView from './components/AdminView';
import VolunteerView from './components/VolunteerView';
import PublicView from './components/PublicView';

export default function App() {
  const [role, setRole] = useState<'admin' | 'volunteer' | 'public' | null>(null);
  const [username, setUsername] = useState<string>('');
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [isAILoading, setIsAILoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState<string>('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Fetch metrics & gates from server
  const fetchDashboardData = async () => {
    try {
      setApiError('');
      const res = await fetch('/api/dashboard');
      if (!res.ok) throw new Error('Failed to retrieve system metrics');
      
      const data = await res.json();
      setMetrics(data);
    } catch (err: any) {
      console.error(err);
      setApiError(err.message || 'Connection lost to command server');
    }
  };

  // Fetch AI or heuristic recommendation from server
  const fetchAIRecommendation = async (forceLoad = false) => {
    if (isAILoading) return;
    setIsAILoading(true);
    try {
      const res = await fetch('/api/recommendation');
      if (!res.ok) throw new Error('Recommendation node offline');
      const data = await res.json();
      setRecommendation(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsAILoading(false);
    }
  };

  // On mount and role updates
  useEffect(() => {
    const initLoad = async () => {
      setIsLoading(true);
      await fetchDashboardData();
      await fetchAIRecommendation();
      setIsLoading(false);
    };
    initLoad();
  }, [role]);

  const handleLogin = (selectedRole: 'admin' | 'volunteer' | 'public', userDisplay?: string) => {
    setRole(selectedRole);
    setUsername(userDisplay || selectedRole);
  };

  const handleLogout = () => {
    setRole(null);
    setUsername('');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-center">
        <div className="relative w-16 h-16 flex items-center justify-center mb-4">
          <div className="absolute inset-0 border-4 border-indigo-500/5 rounded-full" />
          <div className="absolute inset-0 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <Sparkles className="w-6 h-6 text-indigo-600 animate-pulse" />
        </div>
        <div className="space-y-1">
          <h3 className="text-slate-900 font-bold text-lg font-sans">Booting CrowdFlow AI</h3>
          <p className="text-xs text-slate-500 font-mono">Initializing local SQLite database context • PORT 3000</p>
        </div>
      </div>
    );
  }

  // If not logged in, show login card
  if (!role) {
    return <LoginView onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Background soft gradients */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Top Navigation Navbar */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            
            {/* Logo and title */}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center shadow-md shadow-indigo-500/10 text-white font-bold">
                <div className="w-4 h-4 bg-white rounded-full opacity-90 shadow-sm" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-slate-900 tracking-tight leading-none text-base">CrowdFlow <span className="text-indigo-600">AI</span></span>
                <span className="text-[9px] text-slate-500 font-mono tracking-wider font-medium uppercase mt-0.5">Crowd Management Node</span>
              </div>
            </div>

            {/* Quick switcher tabs (Legendary Hackathon helper) */}
            <nav className="hidden lg:flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => handleLogin('admin', username)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                  role === 'admin' 
                    ? 'bg-white text-indigo-600 border border-slate-200 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-800 border border-transparent'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                Admin Dashboard
              </button>

              <button
                onClick={() => handleLogin('volunteer', username)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                  role === 'volunteer' 
                    ? 'bg-white text-purple-600 border border-slate-200 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-800 border border-transparent'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                Volunteer Controller
              </button>

              <button
                onClick={() => handleLogin('public', username)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                  role === 'public' 
                    ? 'bg-white text-cyan-600 border border-slate-200 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-800 border border-transparent'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                Public display TV
              </button>
            </nav>

            {/* User profile actions */}
            <div className="hidden lg:flex items-center gap-4">
              <div className="flex flex-col items-end text-right">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">@{username}</span>
                <span className="text-[10px] text-slate-500 font-mono capitalize">{role} Account</span>
              </div>
              
              <button
                onClick={handleLogout}
                className="p-2 bg-slate-50 hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-200 hover:border-rose-200 rounded-lg transition-all shadow-sm"
                title="Disconnect from platform"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

            {/* Mobile menu button */}
            <div className="flex lg:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-slate-600 hover:text-slate-900 bg-slate-50 border border-slate-200 rounded-lg outline-none"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>

          </div>
        </div>

        {/* Mobile menu modal drawer */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-4 space-y-2"
            >
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest font-mono px-3 py-1">Quick Role Switcher</div>
              
              <button
                onClick={() => { handleLogin('admin', username); setMobileMenuOpen(false); }}
                className={`w-full flex items-center justify-between p-3 rounded-xl text-sm font-semibold transition-all ${
                  role === 'admin' ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : 'text-slate-500'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Shield className="w-4 h-4" />
                  <span>Admin Dashboard</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 opacity-60" />
              </button>

              <button
                onClick={() => { handleLogin('volunteer', username); setMobileMenuOpen(false); }}
                className={`w-full flex items-center justify-between p-3 rounded-xl text-sm font-semibold transition-all ${
                  role === 'volunteer' ? 'bg-purple-50 text-purple-600 border border-purple-100' : 'text-slate-500'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Users className="w-4 h-4" />
                  <span>Volunteer Controller</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 opacity-60" />
              </button>

              <button
                onClick={() => { handleLogin('public', username); setMobileMenuOpen(false); }}
                className={`w-full flex items-center justify-between p-3 rounded-xl text-sm font-semibold transition-all ${
                  role === 'public' ? 'bg-cyan-50 text-cyan-600 border border-cyan-100' : 'text-slate-500'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Monitor className="w-4 h-4" />
                  <span>Public display TV</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 opacity-60" />
              </button>

              <div className="border-t border-slate-100 pt-2 flex items-center justify-between px-3">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-800 uppercase font-mono">@{username}</span>
                  <span className="text-[10px] text-slate-500 font-mono capitalize">{role} portal</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-3 py-1.5 bg-rose-50 border border-rose-200 text-rose-600 rounded-lg text-xs font-semibold transition-all"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Disconnect
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Main Container Wrapper */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        
        {apiError && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-700 text-sm rounded-xl flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
              <span>{apiError}</span>
            </div>
            <button 
              onClick={fetchDashboardData}
              className="flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-lg transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Retry Connection
            </button>
          </div>
        )}

        {/* Dynamic active role layout router with transition */}
        <AnimatePresence mode="wait">
          <motion.div
            key={role}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {role === 'admin' && metrics && (
              <AdminView 
                metrics={metrics}
                recommendation={recommendation}
                onRefresh={fetchDashboardData}
                onTriggerAI={() => fetchAIRecommendation(true)}
                isAILoading={isAILoading}
              />
            )}

            {role === 'volunteer' && metrics && (
              <VolunteerView 
                gates={metrics.gates}
                onRefresh={fetchDashboardData}
                username={username}
              />
            )}

            {role === 'public' && metrics && (
              <PublicView 
                gates={metrics.gates}
                recommendation={recommendation}
                onRefresh={fetchDashboardData}
                isAILoading={isAILoading}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Grid footer watermark */}
      <footer className="border-t border-slate-200 bg-white py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
            <Signal className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
            <span>Node Secure Connection: Active • PORT 3000 Ingress</span>
          </div>
          <div className="text-xs text-slate-500 font-mono text-center md:text-right">
            CrowdFlow AI Platform • Powered by Google Gemini 3.5 Flash & Vite
          </div>
        </div>
      </footer>
    </div>
  );
}
