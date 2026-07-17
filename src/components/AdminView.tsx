import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, Activity as ActivityIcon, ShieldAlert, Plus, DoorOpen, 
  Sparkles, RefreshCw, AlertCircle, CheckCircle, Flame, Server, 
  MapPin, Loader2, ArrowUpRight, ArrowDownRight, Clock
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell 
} from 'recharts';
import { Gate, DashboardMetrics, Recommendation } from '../types';

interface AdminViewProps {
  metrics: DashboardMetrics;
  recommendation: Recommendation | null;
  onRefresh: () => Promise<void>;
  onTriggerAI: () => Promise<void>;
  isAILoading: boolean;
}

export default function AdminView({ 
  metrics, 
  recommendation, 
  onRefresh, 
  onTriggerAI, 
  isAILoading 
}: AdminViewProps) {
  const [isAddGateOpen, setIsAddGateOpen] = useState(false);
  const [gateName, setGateName] = useState('');
  const [capacity, setCapacity] = useState('400');
  const [currentCount, setCurrentCount] = useState('0');
  const [status, setStatus] = useState<'active' | 'closed' | 'restricted'>('active');
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto refresh Admin dashboard every 6 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      onRefresh();
    }, 6000);
    return () => clearInterval(timer);
  }, [onRefresh]);

  const handleAddGate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gateName || !capacity) {
      setSubmitError('Please fill in Gate Name and Max Capacity');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const res = await fetch('/api/gate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gate_name: gateName,
          capacity: Number(capacity),
          current_count: Number(currentCount),
          status
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to add gate');
      }

      setGateName('');
      setCurrentCount('0');
      setIsAddGateOpen(false);
      await onRefresh();
    } catch (err: any) {
      setSubmitError(err.message || 'Error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Convert Gates list to Recharts compatible list
  const gateChartData = metrics.gates.map(g => ({
    name: g.gate_name.split(' - ')[0], // short name
    occupancy: g.current_count,
    capacity: g.capacity,
    ratio: Math.round((g.current_count / g.capacity) * 100)
  }));

  // Activity split data (Arrival vs Exit ratios)
  const actionSplitData = [
    { name: 'Arrivals', value: metrics.recentActivities.filter(a => a.action === 'arrival').length || 3 },
    { name: 'Exits', value: metrics.recentActivities.filter(a => a.action === 'exit').length || 2 }
  ];
  
  const COLORS = ['#6366f1', '#ec4899'];

  const getEmergencyBadge = (status: string) => {
    switch (status) {
      case 'critical':
        return { text: 'CRITICAL PRESSURE', bg: 'bg-rose-50 text-rose-700 border-rose-200', icon: <Flame className="w-4 h-4 text-rose-600" /> };
      case 'warning':
        return { text: 'HIGH CONGESTION', bg: 'bg-amber-50 text-amber-700 border-amber-200', icon: <AlertCircle className="w-4 h-4 text-amber-600" /> };
      default:
        return { text: 'NOMINAL PASSAGE', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: <CheckCircle className="w-4 h-4 text-emerald-600" /> };
    }
  };

  return (
    <div className="space-y-8 pb-12 font-sans text-slate-900">
      {/* Upper Status Banner / AI Alert panel */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 font-sans">Command Overview</h2>
          <p className="text-sm text-slate-500">Real-time gate processing rates, telemetry tracking, and Gemini AI dispatching.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={onRefresh}
            className="p-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 rounded-lg transition-all active:scale-95 shadow-sm"
            title="Refresh Database"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => setIsAddGateOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-lg shadow-md shadow-indigo-600/10 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Provision Gate
          </button>
        </div>
      </div>

      {/* Grid of 4 Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <motion.div 
          whileHover={{ y: -3 }}
          className="bg-white border border-slate-200 p-5 rounded-xl flex items-center justify-between shadow-sm"
        >
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total processed today</span>
            <div className="text-3xl font-bold text-slate-900 font-mono">{metrics.totalVisitors}</div>
            <div className="text-xs text-emerald-600 flex items-center gap-1 font-semibold">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>+18% since peak</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center border border-indigo-100 text-indigo-600">
            <Users className="w-6 h-6" />
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ y: -3 }}
          className="bg-white border border-slate-200 p-5 rounded-xl flex items-center justify-between shadow-sm"
        >
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Venue Crowd</span>
            <div className="text-3xl font-bold text-slate-900 font-mono">{metrics.currentCrowd}</div>
            <div className="text-xs text-slate-500">
              of <span className="font-mono text-slate-700 font-semibold">{metrics.totalCapacity}</span> max venue limit
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center border border-purple-100 text-purple-600">
            <ActivityIcon className="w-6 h-6" />
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ y: -3 }}
          className="bg-white border border-slate-200 p-5 rounded-xl flex items-center justify-between shadow-sm"
        >
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Operational Gates</span>
            <div className="text-3xl font-bold text-slate-900 font-mono">
              {metrics.activeGates}<span className="text-sm text-slate-400 font-normal">/{metrics.totalGates}</span>
            </div>
            <div className="text-xs text-indigo-600 font-semibold">
              {(metrics.activeGates / metrics.totalGates * 100).toFixed(0)}% grid active
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-cyan-50 flex items-center justify-center border border-cyan-100 text-cyan-600">
            <DoorOpen className="w-6 h-6" />
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ y: -3 }}
          className="bg-white border border-slate-200 p-5 rounded-xl flex items-center justify-between shadow-sm"
        >
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Venue Risk Threat</span>
            <div className="mt-1.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-bold uppercase tracking-wide font-mono shadow-sm bg-slate-50">
              {getEmergencyBadge(metrics.emergencyStatus).icon}
              <span className={getEmergencyBadge(metrics.emergencyStatus).bg.split(' ')[1]}>
                {getEmergencyBadge(metrics.emergencyStatus).text}
              </span>
            </div>
            <div className="text-[10px] text-slate-400 block pt-1">Threshold monitoring active</div>
          </div>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${
            metrics.emergencyStatus === 'critical' ? 'bg-rose-50 border-rose-200 text-rose-600' :
            metrics.emergencyStatus === 'warning' ? 'bg-amber-50 border-amber-200 text-amber-600' :
            'bg-emerald-50 border-emerald-200 text-emerald-600'
          }`}>
            <ShieldAlert className="w-6 h-6" />
          </div>
        </motion.div>
      </div>

      {/* Main Content split: Left is Tables and Charts, Right is AI recommendation panel and activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left column (2/3 width on large screens) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Real-time Gate Monitoring Table */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Grid Gate Sentinel</h3>
                <p className="text-xs text-slate-500">Interactive live sensor monitors showing current headcounts against target capacities.</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 text-xs uppercase tracking-wider font-mono">
                    <th className="pb-3 pl-2">Gate Identifier</th>
                    <th className="pb-3 text-center">Current Occupants</th>
                    <th className="pb-3">Gate Load density</th>
                    <th className="pb-3 text-right">Status State</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {metrics.gates.map((g) => {
                    const ratio = g.current_count / g.capacity;
                    let barColor = 'bg-indigo-500';
                    let textColor = 'text-indigo-600';
                    if (ratio >= 0.9) {
                      barColor = 'bg-rose-500';
                      textColor = 'text-rose-600';
                    } else if (ratio >= 0.7) {
                      barColor = 'bg-amber-500';
                      textColor = 'text-amber-600';
                    } else if (g.status === 'closed') {
                      barColor = 'bg-slate-300';
                      textColor = 'text-slate-400';
                    } else {
                      barColor = 'bg-emerald-500';
                      textColor = 'text-emerald-600';
                    }

                    return (
                      <tr key={g.gate_id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 pl-2 font-medium text-slate-900 max-w-[200px] truncate">
                          <div className="font-semibold text-slate-900">{g.gate_name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">ID: {g.gate_id}</div>
                        </td>
                        <td className="py-4 text-center font-mono">
                          <span className="text-slate-900 font-bold">{g.current_count}</span>
                          <span className="text-slate-400 text-xs"> / {g.capacity}</span>
                        </td>
                        <td className="py-4 w-[250px]">
                          <div className="flex items-center gap-2">
                            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                                style={{ width: `${Math.min(100, ratio * 100)}%` }}
                              />
                            </div>
                            <span className={`text-xs font-mono font-bold ${textColor} w-10 text-right`}>
                              {Math.round(ratio * 100)}%
                            </span>
                          </div>
                        </td>
                        <td className="py-4 text-right">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${
                            g.status === 'active' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' :
                            g.status === 'restricted' ? 'bg-amber-50 border-amber-100 text-amber-700' :
                            'bg-slate-50 border-slate-200 text-slate-600'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              g.status === 'active' ? 'bg-emerald-500' :
                              g.status === 'restricted' ? 'bg-amber-500' :
                              'bg-slate-400'
                            }`} />
                            {g.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Crowd charts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Chart 1: Crowd distribution bar chart */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <h4 className="text-sm font-bold text-slate-900 mb-4">Occupancy Rates by Gate (%)</h4>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={gateChartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                    <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={11} tickLine={false} domain={[0, 120]} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: 8, color: '#0f172a' }} 
                      labelClassName="text-slate-500 font-semibold"
                    />
                    <Bar dataKey="ratio" radius={[4, 4, 0, 0]}>
                      {gateChartData.map((entry, index) => {
                        let barFill = 'url(#bluePurpleGrad)';
                        if (entry.ratio >= 90) barFill = '#f43f5e';
                        else if (entry.ratio >= 70) barFill = '#fbbf24';
                        return <Cell key={`cell-${index}`} fill={barFill} />;
                      })}
                    </Bar>
                    <defs>
                      <linearGradient id="bluePurpleGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366f1" />
                        <stop offset="100%" stopColor="#d946ef" />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Peak hours traffic area line chart */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <h4 className="text-sm font-bold text-slate-900 mb-4">Traffic Progression Curve (Total Counts)</h4>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={metrics.peakHours} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="time" stroke="#64748b" fontSize={11} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: 8 }}
                      labelClassName="text-slate-500 font-semibold"
                    />
                    <Area type="monotone" dataKey="count" stroke="#a855f7" strokeWidth={2.5} fillOpacity={1} fill="url(#purpleGlow)" />
                    <defs>
                      <linearGradient id="purpleGlow" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#a855f7" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Right column (1/3 width on large screens) */}
        <div className="space-y-6">
          
          {/* AI Recommendation Dispatch Panel */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex justify-between items-center mb-5">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900 text-base">Gemini Router Engine</h3>
              </div>
              
              <button
                onClick={onTriggerAI}
                disabled={isAILoading}
                className="p-1.5 bg-slate-50 text-indigo-600 hover:bg-indigo-50 rounded-lg border border-slate-200 hover:border-indigo-300 transition-all flex items-center justify-center disabled:opacity-40 shadow-sm"
                title="Force AI recalculation"
              >
                {isAILoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
              </button>
            </div>

            <AnimatePresence mode="wait">
              {isAILoading ? (
                <motion.div 
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="py-12 flex flex-col items-center justify-center text-center space-y-4"
                >
                  <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-slate-900">Analyzing Venue Ratios</p>
                    <p className="text-xs text-slate-500">Querying Gemini 3.5 Flash server-side node...</p>
                  </div>
                </motion.div>
              ) : recommendation ? (
                <motion.div
                  key="content"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <div className="p-3.5 bg-indigo-50/50 border border-indigo-100/80 rounded-xl space-y-1">
                    <div className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest font-mono">Recommended Port</div>
                    <div className="text-lg font-bold text-slate-900 flex items-center justify-between">
                      <span className="truncate">
                        {metrics.gates.find(g => g.gate_id === recommendation.recommended_gate_id)?.gate_name || 'Calculating...'}
                      </span>
                      <span className="text-[10px] bg-indigo-100 text-indigo-800 px-2.5 py-0.5 rounded-full border border-indigo-200 flex-shrink-0 ml-1 font-semibold">
                        {recommendation.isAI ? 'GEMINI 3.5' : 'LOCAL AI'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                      <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono font-bold block">Wait Estimate</span>
                      <span className="text-lg font-bold text-slate-900 font-mono">{recommendation.estimated_wait_time_minutes} min</span>
                    </div>
                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                      <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono font-bold block">Risk Status</span>
                      <span className={`text-xs font-bold uppercase tracking-wider block mt-1 ${
                        recommendation.safety_status === 'critical' ? 'text-rose-600' :
                        recommendation.safety_status === 'warning' ? 'text-amber-600' :
                        'text-emerald-600'
                      }`}>
                        ● {recommendation.safety_status}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono font-bold block">AI Reasoning Insights</span>
                    <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-150">
                      {recommendation.reasoning}
                    </p>
                  </div>

                  <div className="p-2.5 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
                    <span className="text-[10px] text-indigo-700 font-mono font-bold uppercase">Advisory: {recommendation.safety_advisory}</span>
                  </div>
                </motion.div>
              ) : (
                <div className="py-8 text-center text-xs text-slate-500">
                  No analysis active. Click dispatch engine to compile.
                </div>
              )}
            </AnimatePresence>
          </div>

          {/* Action Split Chart */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <h4 className="text-sm font-bold text-slate-900 mb-4">Traffic Action Split Ratio (Last Logs)</h4>
            <div className="h-44 flex items-center justify-between">
              <div className="w-[55%] h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={actionSplitData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={60}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {actionSplitData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: 8 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-[45%] space-y-3 pl-3">
                {actionSplitData.map((item, index) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index] }} />
                    <div className="text-xs">
                      <div className="text-slate-500 font-medium">{item.name}</div>
                      <div className="text-slate-900 font-mono font-bold">{item.value} logs</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Operations Log */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <h4 className="text-sm font-bold text-slate-900 mb-4">Operational Telemetry logs</h4>
            <div className="space-y-3.5 max-h-[240px] overflow-y-auto pr-1">
              {metrics.recentActivities.map((act) => (
                <div key={act.id} className="flex items-start justify-between text-xs pb-3 border-b border-slate-100 last:border-0 last:pb-0">
                  <div className="space-y-1">
                    <span className="font-semibold text-slate-800 truncate max-w-[150px] block">{act.gate_name}</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                  
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider ${
                    act.action === 'arrival' 
                      ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' 
                      : 'bg-pink-50 text-pink-700 border border-pink-100'
                  }`}>
                    {act.action === 'arrival' ? '+ ARRIVAL' : '- EXIT'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Slide-over/Modal for Add Gate (Provision Gate) */}
      <AnimatePresence>
        {isAddGateOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddGateOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            
            {/* Dialog Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-white border border-slate-200 p-6 rounded-2xl shadow-xl z-10"
            >
              <h3 className="text-lg font-bold text-slate-900 mb-1 flex items-center gap-2">
                <Server className="w-5 h-5 text-indigo-600" />
                Provision New Access Gate
              </h3>
              <p className="text-xs text-slate-500 mb-4">Register a physical portal to start aggregating counter values.</p>

              {submitError && (
                <div className="mb-4 p-2 bg-rose-50 border border-rose-100 text-rose-700 text-xs rounded-lg flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
                  <span>{submitError}</span>
                </div>
              )}

              <form onSubmit={handleAddGate} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-500">Gate Name / Location</label>
                  <input
                    type="text"
                    value={gateName}
                    onChange={(e) => setGateName(e.target.value)}
                    placeholder="e.g. Gate F - North Plaza Terminal"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 rounded-lg text-xs outline-none focus:border-indigo-500 transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-500">Target Max Capacity</label>
                    <input
                      type="number"
                      value={capacity}
                      onChange={(e) => setCapacity(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-slate-900 rounded-lg text-xs outline-none focus:border-indigo-500 transition-all font-mono"
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-500">Seed Occupancy</label>
                    <input
                      type="number"
                      value={currentCount}
                      onChange={(e) => setCurrentCount(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-slate-900 rounded-lg text-xs outline-none focus:border-indigo-500 transition-all font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-500">Deployment Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-slate-900 rounded-lg text-xs outline-none focus:border-indigo-500 transition-all"
                  >
                    <option value="active">Active (Operational)</option>
                    <option value="restricted">Restricted (VIP/Staff)</option>
                    <option value="closed">Closed (Locked)</option>
                  </select>
                </div>

                <div className="flex gap-3 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddGateOpen(false)}
                    className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg text-xs font-medium transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium shadow-md shadow-indigo-600/10 transition-all flex items-center justify-center disabled:opacity-50"
                  >
                    {isSubmitting ? 'Registering...' : 'Deploy Port'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
