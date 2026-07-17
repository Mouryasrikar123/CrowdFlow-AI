import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, Clock, Compass, ShieldAlert, Monitor, CheckCircle, 
  AlertCircle, ChevronRight, CornerDownRight, Server, RefreshCw
} from 'lucide-react';
import { Gate, Recommendation } from '../types';

interface PublicViewProps {
  gates: Gate[];
  recommendation: Recommendation | null;
  onRefresh: () => Promise<void>;
  isAILoading: boolean;
}

export default function PublicView({ gates, recommendation, onRefresh, isAILoading }: PublicViewProps) {
  const [secondsToRefresh, setSecondsToRefresh] = useState(8);

  // Countdown timer for automatic public screen updates
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsToRefresh(prev => {
        if (prev <= 1) {
          onRefresh();
          return 8;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [onRefresh]);

  const getStatusDisplay = (ratio: number, status: string) => {
    if (status === 'closed') {
      return { text: 'CLOSED', textClass: 'text-slate-400', dotClass: 'bg-slate-300' };
    }
    if (ratio >= 0.9) {
      return { text: 'CONGESTED (Avoid)', textClass: 'text-rose-600 font-bold', dotClass: 'bg-rose-500 animate-pulse' };
    }
    if (ratio >= 0.7) {
      return { text: 'MODERATE', textClass: 'text-amber-600 font-bold', dotClass: 'bg-amber-500' };
    }
    return { text: 'CLEAR (Fast-Track)', textClass: 'text-emerald-600 font-bold', dotClass: 'bg-emerald-500' };
  };

  const getRiskStatusBadge = (status?: string) => {
    switch (status) {
      case 'critical':
        return { text: 'HIGH VENUE VOLUME', color: 'text-rose-700 border-rose-200 bg-rose-50' };
      case 'warning':
        return { text: 'MODERATE DELAYS', color: 'text-amber-700 border-amber-200 bg-amber-50' };
      default:
        return { text: 'OPTIMAL CLEARANCE', color: 'text-emerald-700 border-emerald-200 bg-emerald-50' };
    }
  };

  const recommendedGate = gates.find(g => g.gate_id === recommendation?.recommended_gate_id);

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-12 font-sans text-slate-900">
      
      {/* Flight monitor style Top Bar */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2.5">
          <Monitor className="w-5 h-5 text-indigo-600 animate-pulse" />
          <div>
            <h2 className="text-sm font-bold tracking-wider text-slate-900 font-mono uppercase">PUBLIC ACCESS TELEMETRY</h2>
            <p className="text-[10px] text-slate-400 font-mono">GATE ROUTING ADVISORY SYSTEM • LIVE NODE FEED</p>
          </div>
        </div>

        <div className="flex items-center gap-3 font-mono">
          <div className="text-[10px] text-slate-500 flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-md border border-slate-150">
            <RefreshCw className="w-3 h-3 text-indigo-600 animate-spin" />
            <span>SYNC IN {secondsToRefresh}S</span>
          </div>
        </div>
      </div>

      {/* Main recommendation banner */}
      <AnimatePresence mode="wait">
        {isAILoading ? (
          <motion.div 
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-8 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col items-center justify-center text-center space-y-4"
          >
            <div className="w-12 h-12 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin" />
            <div className="space-y-1">
              <p className="text-sm font-semibold text-slate-900">Re-routing traffic vectors...</p>
              <p className="text-xs text-slate-500">Retrieving real-time occupancy loads and compiling suggestions</p>
            </div>
          </motion.div>
        ) : recommendation ? (
          <motion.div
            key="rec"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-indigo-50 border border-indigo-100/80 rounded-2xl p-6 sm:p-8 shadow-sm relative overflow-hidden"
          >
            {/* Glowing accents */}
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-6 border-b border-indigo-100/60">
              <div className="space-y-1.5">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-100 border border-indigo-200 text-[10px] font-extrabold text-indigo-800 uppercase tracking-widest font-mono">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  Smart Recommendation AI
                </span>
                <h3 className="text-2xl font-bold tracking-tight text-slate-900 font-sans">
                  Recommended Entry Portal
                </h3>
              </div>

              {/* Big Estimate wait times badge */}
              <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-indigo-100/60 flex-shrink-0 shadow-sm">
                <Clock className="w-5 h-5 text-indigo-600" />
                <div>
                  <div className="text-[9px] text-slate-400 uppercase tracking-widest font-mono font-bold">Est. Wait Time</div>
                  <div className="text-lg font-bold text-slate-900 font-mono">{recommendation.estimated_wait_time_minutes} min</div>
                </div>
              </div>
            </div>

            {/* Recommended Gate Name & Details */}
            <div className="space-y-5">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-white text-indigo-600 rounded-xl border border-indigo-100/80 mt-1 shadow-sm">
                  <Compass className="w-6 h-6 animate-pulse text-indigo-600" />
                </div>
                <div className="space-y-1.5">
                  <h4 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    {recommendedGate?.gate_name || 'Searching optimal route...'}
                  </h4>
                  <div className="flex flex-wrap gap-2.5 items-center text-xs">
                    <span className="text-slate-500 font-medium">Occupancy:</span>
                    <span className="font-mono text-slate-900 font-bold">{recommendedGate?.current_count || 0}</span>
                    <span className="text-slate-300">/</span>
                    <span className="font-mono text-slate-600">{recommendedGate?.capacity || 100} passengers</span>
                    
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono border font-semibold ${getRiskStatusBadge(recommendation.safety_status).color}`}>
                      {getRiskStatusBadge(recommendation.safety_status).text}
                    </span>
                  </div>
                </div>
              </div>

              {/* Explanatory box */}
              <div className="bg-white/60 border border-indigo-100/50 rounded-xl p-4 space-y-2 shadow-sm">
                <div className="text-[9px] text-slate-400 uppercase tracking-widest font-mono font-bold">Processing Analysis</div>
                <p className="text-slate-700 text-xs sm:text-sm leading-relaxed">
                  {recommendation.reasoning}
                </p>
              </div>

              {/* Advisory bar */}
              <div className="flex items-center gap-2 px-3 py-2.5 bg-indigo-100/50 rounded-xl border border-indigo-200/50">
                <ShieldAlert className="w-4 h-4 text-indigo-600" />
                <span className="text-[10px] sm:text-xs text-indigo-800 font-mono font-bold uppercase">ADVISORY: {recommendation.safety_advisory}</span>
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="p-8 text-center text-slate-400 text-xs">
            Awaiting signal compilation...
          </div>
        )}
      </AnimatePresence>

      {/* Gate status boards */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-5">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Grid status board</h3>
          <p className="text-xs text-slate-500">All available entry points and current wait classifications.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {gates.map((g) => {
            const ratio = g.current_count / g.capacity;
            const statusInfo = getStatusDisplay(ratio, g.status);
            const isRec = recommendation?.recommended_gate_id === g.gate_id;

            return (
              <div 
                key={g.gate_id}
                className={`p-4 bg-slate-50/50 rounded-xl border transition-all flex items-center justify-between ${
                  isRec ? 'border-indigo-400 bg-indigo-50/30 shadow-sm' : 'border-slate-200'
                }`}
              >
                <div className="space-y-1.5 max-w-[70%]">
                  <div className="font-bold text-sm text-slate-900 truncate flex items-center gap-1.5">
                    {g.gate_name}
                    {isRec && (
                      <span className="text-[8px] bg-indigo-100 text-indigo-800 border border-indigo-200 px-1.5 py-0.5 rounded-full flex-shrink-0 font-bold">
                        RECOMMENDED
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] font-mono">
                    <span className={statusInfo.textClass}>{statusInfo.text}</span>
                    <span className="text-slate-300">•</span>
                    <span className="text-slate-500">{g.current_count} in queue</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-200 flex-shrink-0 relative">
                    <span className={`absolute -inset-0.5 rounded-full ${statusInfo.dotClass}`} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
