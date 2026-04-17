import React from 'react';
import { motion } from 'framer-motion';
import { Warning, Sparkle, ChatText } from 'phosphor-react';

interface Condition {
  condition?: string; // Support both naming conventions
  name?: string;
  probability?: number;
  confidence?: number;
  description?: string;
}

interface ResultsPanelProps {
  results: {
    conditions: Condition[];
    possibleConditions?: Condition[]; // Support both
    severityLevel: 'Low' | 'Medium' | 'High';
    advice: string;
    redFlags?: string[];
    recommendations?: string[];
  } | null;
  loading: boolean;
  onFindSpecialist: () => void;
  onGetHealthTips: () => void;
}

const ResultsPanel: React.FC<ResultsPanelProps> = ({ results, loading, onFindSpecialist, onGetHealthTips }) => {
  const [showDetailed, setShowDetailed] = React.useState(false);

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

  const conditions = results.conditions || results.possibleConditions || [];

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
      {/* Header and Minimal Summary */}
      <div className="flex justify-between items-center px-2">
        <div>
          <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
            Analysis Complete
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </h3>
          <p className="text-xs text-white/40 uppercase tracking-widest font-bold">Diagnostic Sequence Finished</p>
        </div>
        <button 
          onClick={() => setShowDetailed(!showDetailed)}
          className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-cyan-400 border border-white/10 transition-all"
        >
          {showDetailed ? 'View Minimal' : 'View Full Details'}
        </button>
      </div>

      {/* Primary Result - Minimal */}
      {!showDetailed ? (
        <motion.div 
          layoutId="result-card"
          className="backdrop-blur-3xl bg-white/10 p-8 rounded-[2rem] border border-white/20 shadow-2xl relative overflow-hidden"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-[0.2em] font-black text-cyan-200/50">Most Likely Condition</label>
              <h4 className="text-3xl font-black text-white tracking-tighter">
                {conditions[0]?.name || conditions[0]?.condition || 'Analysis Pending'}
              </h4>
              <div className="flex items-center gap-3 mt-4">
                <span className={`px-4 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-wider ${getSeverityBadgeColor(results.severityLevel)}`}>
                  {results.severityLevel} Severity
                </span>
                <span className="text-[10px] font-black text-cyan-400/80 uppercase tracking-wider">
                  {conditions[0]?.probability || conditions[0]?.confidence || 0}% Confidence
                </span>
              </div>
            </div>
            
            <div className="md:border-l border-white/10 md:pl-8 space-y-2 max-w-xs">
              <label className="text-[10px] uppercase tracking-[0.2em] font-black text-cyan-200/50">Primary Guidance</label>
              <p className="text-sm text-white/70 italic leading-relaxed line-clamp-3">
                "{results.advice}"
              </p>
            </div>
          </div>
        </motion.div>
      ) : (
        <motion.div 
          layoutId="result-card"
          className="space-y-6"
        >
          {/* Detailed Conditions List */}
          <div className="backdrop-blur-3xl bg-white/10 p-10 rounded-[2rem] border border-white/20 shadow-2xl">
            <h4 className="text-[10px] uppercase tracking-[0.2em] font-black text-cyan-200/50 mb-8">Clinical Indicators</h4>
            <div className="space-y-8">
              {conditions.map((item, index) => (
                <div key={index} className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <span className="text-lg font-bold text-white tracking-tight">{item.name || item.condition}</span>
                      {item.description && <p className="text-xs text-white/40 leading-relaxed max-w-md">{item.description}</p>}
                    </div>
                    <span className="text-lg font-black text-cyan-400 tabular-nums">{item.probability || item.confidence}%</span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${item.probability || item.confidence}%` }}
                      transition={{ duration: 1, ease: "circOut", delay: index * 0.1 }}
                      className="h-full bg-gradient-to-r from-cyan-600 to-blue-500 rounded-full"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Red Flags & Recommendations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {results.redFlags && results.redFlags.length > 0 && (
              <div className="backdrop-blur-3xl bg-rose-500/10 p-8 rounded-[2rem] border border-rose-500/20 shadow-xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-1.5 bg-rose-500/20 rounded-lg">
                    <Warning size={18} className="text-rose-400" />
                  </div>
                  <h4 className="text-[10px] uppercase tracking-[0.2em] font-black text-rose-400">Critical Red Flags</h4>
                </div>
                <ul className="space-y-3">
                  {results.redFlags.map((flag, i) => (
                    <li key={i} className="text-xs text-rose-200/70 flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full bg-rose-500" />
                      {flag}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {results.recommendations && results.recommendations.length > 0 && (
              <div className="backdrop-blur-3xl bg-cyan-500/10 p-8 rounded-[2rem] border border-cyan-500/20 shadow-xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-1.5 bg-cyan-500/20 rounded-lg">
                    <Sparkle size={18} className="text-cyan-400" />
                  </div>
                  <h4 className="text-[10px] uppercase tracking-[0.2em] font-black text-cyan-400">Clinical Advice</h4>
                </div>
                <ul className="space-y-3">
                  {results.recommendations.map((rec, i) => (
                    <li key={i} className="text-xs text-cyan-200/70 flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full bg-cyan-400" />
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </motion.div>
      )}

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
