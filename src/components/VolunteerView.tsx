import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, CheckCircle, ShieldAlert, Wifi, ArrowUp, ArrowDown, 
  MapPin, RefreshCw, Layers, AlertTriangle, AlertCircle
} from 'lucide-react';
import { Gate } from '../types';

interface VolunteerViewProps {
  gates: Gate[];
  onRefresh: () => Promise<void>;
  username: string;
}

export default function VolunteerView({ gates, onRefresh, username }: VolunteerViewProps) {
  const [selectedGateId, setSelectedGateId] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [pulseAction, setPulseAction] = useState<'arrival' | 'exit' | null>(null);
  const [autoSync, setAutoSync] = useState(true);

  const selectedGate = gates.find(g => g.gate_id === selectedGateId);

  // Auto refresh every 3 seconds when enabled
  useEffect(() => {
    if (!autoSync) return;
    const interval = setInterval(() => {
      onRefresh();
    }, 3000);
    return () => clearInterval(interval);
  }, [onRefresh, autoSync]);

  const handleAction = async (action: 'arrival' | 'exit') => {
    if (!selectedGateId) return;
    setIsUpdating(true);
    setPulseAction(action);

    try {
      const res = await fetch(`/api/gate/${action}/${selectedGateId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!res.ok) throw new Error('Action failed');
      await onRefresh();
    } catch (e) {
      console.error(e);
    } finally {
      setIsUpdating(false);
      setTimeout(() => setPulseAction(null), 400); // clear visual pulse
    }
  };

  const getPercentage = () => {
    if (!selectedGate) return 0;
    return Math.round((selectedGate.current_count / selectedGate.capacity) * 100);
  };

  const getCapacityStateColor = (pct: number) => {
    if (pct >= 95) return 'text-rose-700 border-rose-200 bg-rose-50';
    if (pct >= 80) return 'text-amber-700 border-amber-200 bg-amber-50';
    return 'text-emerald-700 border-emerald-200 bg-emerald-50';
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-emerald-500';
      case 'restricted': return 'bg-amber-500';
      default: return 'bg-rose-500';
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-12 font-sans text-slate-900">
      
      {/* Upper info card */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <User className="w-5 h-5 text-indigo-600" />
            Volunteer Console
          </h2>
          <p className="text-xs text-slate-500">Assigned operator: <span className="text-slate-700 font-mono font-bold">@{username}</span></p>
        </div>

        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-sm">
          <Wifi className={`w-3.5 h-3.5 ${autoSync ? 'text-emerald-500 animate-pulse' : 'text-slate-400'}`} />
          <span className="text-[10px] font-mono text-slate-500">AUTO-SYNC (3S)</span>
          <button 
            onClick={() => setAutoSync(!autoSync)}
            className={`w-7 h-4 rounded-full p-0.5 transition-colors duration-200 outline-none ${
              autoSync ? 'bg-indigo-600' : 'bg-slate-200'
            }`}
          >
            <div className={`w-3 h-3 rounded-full bg-white transition-transform duration-200 ${
              autoSync ? 'translate-x-3' : 'translate-x-0'
            }`} />
          </button>
        </div>
      </div>

      {/* Selector screen or Active Counter screen */}
      {!selectedGateId ? (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4"
        >
          <div className="space-y-1">
            <h3 className="font-bold text-slate-900 text-base">Select Your Assigned Gate</h3>
            <p className="text-xs text-slate-500">Choose the terminal gate you are stationed at to manage crowd flow operations.</p>
          </div>

          <div className="grid grid-cols-1 gap-3.5 pt-2">
            {gates.map((g) => {
              const pct = Math.round((g.current_count / g.capacity) * 100);
              return (
                <button
                  key={g.gate_id}
                  onClick={() => setSelectedGateId(g.gate_id)}
                  className="w-full p-4 bg-white hover:bg-slate-50/55 border border-slate-200 hover:border-slate-300 rounded-xl transition-all flex items-center justify-between text-left group shadow-sm"
                >
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 transition-colors flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${getStatusBgColor(g.status)}`} />
                      {g.gate_name}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">ID: {g.gate_id}</span>
                  </div>

                  <div className="text-right flex items-center gap-4">
                    <div className="space-y-1">
                      <span className="text-xs font-mono font-bold text-slate-800">{g.current_count}</span>
                      <span className="text-[10px] text-slate-400"> / {g.capacity} max</span>
                    </div>
                    <div className={`text-[10px] font-mono font-extrabold px-2.5 py-0.5 rounded-full border ${getCapacityStateColor(pct)}`}>
                      {pct}%
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </motion.div>
      ) : (
        <div className="space-y-6">
          {/* Active Controller Console card */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm relative overflow-hidden"
          >
            {/* Visual pulse indicator on count modifications */}
            <AnimatePresence>
              {pulseAction && (
                <motion.div 
                  initial={{ opacity: 0.4 }}
                  animate={{ opacity: 0 }}
                  exit={{ opacity: 0 }}
                  className={`absolute inset-0 pointer-events-none transition-colors duration-300 ${
                    pulseAction === 'arrival' ? 'bg-indigo-500/5' : 'bg-pink-500/5'
                  }`}
                />
              )}
            </AnimatePresence>

            <div className="flex justify-between items-start mb-6">
              <div className="space-y-1">
                <span className="text-[10px] font-mono font-bold text-indigo-600 uppercase tracking-widest flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-indigo-600" />
                  Operator Assigned Portal
                </span>
                <h3 className="text-lg font-bold text-slate-900">{selectedGate?.gate_name}</h3>
                <span className="text-[10px] text-slate-400 font-mono">Terminal Node: {selectedGate?.gate_id}</span>
              </div>
              
              <button
                onClick={() => setSelectedGateId('')}
                className="px-3 py-1 bg-slate-50 text-slate-600 hover:bg-slate-100 text-xs font-medium rounded-lg border border-slate-200 shadow-sm transition-all"
              >
                Change Gate
              </button>
            </div>

            {/* Large Counter Box */}
            {selectedGate && (
              <div className="space-y-6 py-4 flex flex-col items-center justify-center text-center">
                
                {/* Gauge Area */}
                <div className="relative w-48 h-48 flex items-center justify-center">
                  
                  {/* Gauge Ring background */}
                  <div className="absolute inset-0 rounded-full border-[8px] border-slate-100" />
                  
                  {/* Active SVG Ring overlay for clean percentage representation */}
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="96"
                      cy="96"
                      r="88"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="transparent"
                      className={`${
                        getPercentage() >= 95 ? 'text-rose-500' :
                        getPercentage() >= 80 ? 'text-amber-500' :
                        'text-indigo-600'
                      } transition-all duration-500`}
                      strokeDasharray={2 * Math.PI * 88}
                      strokeDashoffset={2 * Math.PI * 88 * (1 - Math.min(1, getPercentage() / 100))}
                    />
                  </svg>

                  {/* Absolute Center Counter numbers */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center space-y-1">
                    <span className="text-4xl font-extrabold text-slate-900 font-mono tracking-tight">
                      {selectedGate.current_count}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono font-semibold uppercase tracking-widest">
                      / {selectedGate.capacity} max
                    </span>
                    <span className={`text-xs font-mono font-extrabold px-2.5 py-0.5 rounded-full border ${getCapacityStateColor(getPercentage())}`}>
                      {getPercentage()}% Occupied
                    </span>
                  </div>
                </div>

                {/* Warnings / Alerts block */}
                {getPercentage() >= 100 ? (
                  <div className="w-full max-w-sm p-3.5 bg-rose-50 border border-rose-150 text-rose-700 text-xs rounded-xl flex items-center justify-center gap-2 shadow-sm">
                    <ShieldAlert className="w-4 h-4 text-rose-600 flex-shrink-0 animate-bounce" />
                    <span className="font-semibold text-center">CAPACITY BREACH! Restrict portal immediately.</span>
                  </div>
                ) : getPercentage() >= 85 ? (
                  <div className="w-full max-w-sm p-3.5 bg-amber-50 border border-amber-150 text-amber-700 text-xs rounded-xl flex items-center justify-center gap-2 shadow-sm">
                    <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                    <span className="font-semibold text-center">High Volume warning. Processing delay occurring.</span>
                  </div>
                ) : null}
              </div>
            )}

            {/* Clickable Action buttons */}
            <div className="grid grid-cols-2 gap-4 mt-4">
              
              {/* EXIT (-) button */}
              <button
                onClick={() => handleAction('exit')}
                disabled={isUpdating || (selectedGate?.current_count || 0) <= 0}
                className="py-5 bg-slate-50 hover:bg-rose-50/40 hover:border-rose-300 border border-slate-200 disabled:opacity-30 rounded-xl flex flex-col items-center justify-center gap-2 transition-all active:scale-95 text-slate-600 hover:text-rose-600 font-bold group"
              >
                <div className="p-3 bg-white border border-slate-200 rounded-full group-hover:border-rose-200 transition-all text-slate-400 group-hover:text-rose-600 shadow-sm">
                  <ArrowDown className="w-5 h-5" />
                </div>
                <div className="text-xs uppercase tracking-wider font-mono font-bold">- Passenger Exit</div>
              </button>

              {/* ARRIVAL (+) button */}
              <button
                onClick={() => handleAction('arrival')}
                disabled={isUpdating}
                className="py-5 bg-indigo-50/30 hover:bg-indigo-50 hover:border-indigo-300 border border-slate-200 rounded-xl flex flex-col items-center justify-center gap-2 transition-all active:scale-95 text-slate-600 hover:text-indigo-600 font-bold group animate-none"
              >
                <div className="p-3 bg-white border border-slate-200 rounded-full group-hover:border-indigo-200 transition-all text-slate-400 group-hover:text-indigo-600 shadow-sm">
                  <ArrowUp className="w-5 h-5" />
                </div>
                <div className="text-xs uppercase tracking-wider font-mono font-bold">+ Passenger Arrival</div>
              </button>

            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
}
