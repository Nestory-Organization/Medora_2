import React from 'react';
import { motion } from 'framer-motion';
import { Warning, Info, Sparkle, ChatText } from 'phosphor-react';

interface Condition {
  name: string;
  probability: number;
}

interface ResultsPanelProps {
  results: {
    conditions: Condition[];
    severityLevel: 'Low' | 'Medium' | 'High';
    advice: string;
  } | null;
  loading: boolean;
  onFindSpecialist: () => void;
  onGetHealthTips: () => void;
}

const ResultsPanel: React.FC<ResultsPanelProps> = ({ results, loading, onFindSpecialist, onGetHealthTips }) => {
  if (loading) {
    return (
      <div className="space-y-6">
        {/* Conditions Skeleton */}
        <div className="backdrop-blur-xl bg-white/5 p-8 rounded-3xl border border-white/10 shadow-2xl overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent animate-shimmer" />
          <div className="h-8 w-1/3 bg-white/10 rounded-lg mb-8 animate-pulse" />
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-3">
                <div className="flex justify-between">
                  <div className="h-4 w-1/4 bg-white/10 rounded-md animate-pulse" />
                  <div className="h-4 w-10 bg-white/10 rounded-md animate-pulse" />
                </div>
                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full w-1/2 bg-white/10 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Small Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map(i => (
            <div key={i} className="backdrop-blur-xl bg-white/5 p-6 rounded-3xl border border-white/10 animate-pulse">
              <div className="h-4 w-1/3 bg-white/10 rounded-md mb-4" />
              <div className="h-10 w-1/2 bg-white/10 rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!results) return null;

  const getSeverityBadgeColor = (severity: string) => {
    switch (severity) {
      case 'Low': return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'Medium': return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'High': return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
      default: return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-6"
    >
      {/* Conditions Card */}
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="backdrop-blur-3xl bg-white/10 p-10 rounded-[2rem] border border-white/20 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] relative overflow-hidden group"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 blur-3xl -mr-16 -mt-16 group-hover:bg-cyan-500/20 transition-all duration-700" />
        
        <h3 className="text-2xl font-black text-white mb-8 flex items-center gap-3">
          <div className="p-2 bg-cyan-500/20 rounded-xl">
            <Sparkle size={24} weight="fill" className="text-cyan-400" />
          </div>
          Diagnostic Insight
        </h3>
        
        <div className="space-y-8">
          {results.conditions.map((item, index) => (
            <div key={index} className="space-y-3">
              <div className="flex justify-between items-end">
                <span className="text-lg font-bold text-white tracking-tight">{item.name}</span>
                <span className="text-sm font-black text-cyan-400 tabular-nums">{item.probability}%</span>
              </div>
              <div className="h-2.5 bg-white/5 rounded-full overflow-hidden p-[1px] border border-white/5">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${item.probability}%` }}
                  transition={{ duration: 1.5, ease: "circOut", delay: 0.3 + index * 0.1 }}
                  className="h-full bg-gradient-to-r from-cyan-600 via-cyan-400 to-blue-500 rounded-full shadow-[0_0_15px_rgba(6,182,212,0.5)]"
                />
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="backdrop-blur-3xl bg-white/10 p-8 rounded-[2rem] border border-white/20 shadow-xl group"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-1.5 bg-white/5 rounded-lg">
              <Info size={18} className="text-cyan-400" />
            </div>
            <h4 className="text-xs uppercase tracking-[0.2em] font-black text-cyan-200/50">Severity Level</h4>
          </div>
          <span className={`px-6 py-2 rounded-2xl border-2 text-xl font-black tracking-tight inline-block ${getSeverityBadgeColor(results.severityLevel)}`}>
            {results.severityLevel}
          </span>
        </motion.div>

        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="backdrop-blur-3xl bg-white/10 p-8 rounded-[2rem] border border-white/20 shadow-xl"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-1.5 bg-white/5 rounded-lg">
              <ChatText size={18} className="text-cyan-400" />
            </div>
            <h4 className="text-xs uppercase tracking-[0.2em] font-black text-cyan-200/50">AI Summary</h4>
          </div>
          <p className="text-teal-50/80 text-sm leading-relaxed font-medium italic">
            "{results.advice}"
          </p>
        </motion.div>
      </div>

      {/* Premium Actions */}
      <div className="grid grid-cols-2 gap-6 mt-4">
        <motion.button
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={onFindSpecialist}
          className="group relative flex items-center justify-center gap-3 py-5 bg-cyan-600 text-white rounded-2xl overflow-hidden font-black uppercase tracking-widest text-[10px] transition-all"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          <ChatText size={20} weight="bold" />
          Find Specialist
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={onGetHealthTips}
          className="relative flex items-center justify-center gap-3 py-5 bg-white/5 hover:bg-white/10 text-white rounded-2xl border border-white/10 hover:border-cyan-500/30 transition-all font-black uppercase tracking-widest text-[10px]"
        >
          <Sparkle size={20} weight="bold" className="text-cyan-400" />
          Wellness Protocol
        </motion.button>
      </div>

      {/* Refined Disclaimer */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="flex items-start gap-3 text-[10px] text-white/30 p-5 border border-white/5 rounded-2xl bg-white/[0.02]"
      >
        <Warning size={16} className="shrink-0 opacity-50" />
        <p className="leading-relaxed">
          The medical intelligence provided is for informational awareness only. It does not constitute digital health advice, clinical diagnosis, or treatment protocols. Consult a certified medical professional for official guidance.
        </p>
      </motion.div>
    </motion.div>
  );
};

export default ResultsPanel;
