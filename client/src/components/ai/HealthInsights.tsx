import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Lightbulb, Info, Sparkle } from 'phosphor-react';

interface Insight {
  tip: string;
  category: string;
}

interface HealthInsightsProps {
  insights: Insight[];
  loading: boolean;
}

const HealthInsights: React.FC<HealthInsightsProps> = ({ insights, loading }) => {
  if (loading) {
    return (
      <div className="mt-8 backdrop-blur-xl bg-white/10 p-8 rounded-2xl border border-white/20 animate-pulse">
        <div className="h-6 w-1/3 bg-white/20 rounded-md mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-white/5 rounded-xl border border-white/10" />
          ))}
        </div>
      </div>
    );
  }

  if (insights.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="mt-16 backdrop-blur-3xl bg-cyan-900/10 p-12 rounded-[3.5rem] border border-cyan-500/20 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.6)] relative overflow-hidden group"
    >
      {/* Decorative pulse element */}
      <div className="absolute top-0 right-0 p-10 opacity-10 blur-xl pointer-events-none group-hover:opacity-20 transition-opacity duration-1000">
        <Lightbulb size={240} weight="duotone" className="text-cyan-400 rotate-12" />
      </div>

      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6 relative z-10">
        <div>
          <h3 className="text-4xl font-black text-white flex items-center gap-4 mb-2">
            <div className="p-3 bg-amber-500/20 rounded-2xl">
              <Lightbulb size={36} weight="duotone" className="text-amber-400" />
            </div>
            Wellness Protocol
          </h3>
          <p className="text-cyan-200/40 text-sm font-bold uppercase tracking-[0.3em] ml-2">Personalized Health Optimization</p>
        </div>
        
        <div className="hidden md:flex px-4 py-2 bg-white/5 border border-white/10 rounded-2xl items-center gap-3">
          <Sparkle size={18} weight="fill" className="text-cyan-400" />
          <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">AI Generated Insights</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
        {insights.map((insight, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.1, ease: "backOut" }}
            className="flex gap-6 p-8 bg-white/[0.02] border border-white/5 rounded-[2.5rem] hover:bg-white/[0.06] hover:border-cyan-500/30 transition-all duration-700 group/item relative overflow-hidden"
          >
            <div className="shrink-0 flex items-center justify-center w-14 h-14 rounded-2xl bg-cyan-500/10 group-hover/item:bg-cyan-500/20 group-hover/item:scale-110 transition-all shadow-inner">
              <CheckCircle size={32} weight="duotone" className="text-cyan-400/80" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-[9px] uppercase font-black tracking-[0.25em] text-cyan-400 border border-cyan-400/30 px-3 py-1 rounded-full bg-cyan-400/5">
                  {insight.category}
                </span>
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400/20" />
              </div>
              <p className="text-base text-cyan-50/90 leading-relaxed font-bold tracking-tight">
                {insight.tip}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-12 flex items-center gap-4 text-xs text-cyan-200/30 italic bg-white/[0.02] p-6 rounded-[2rem] border border-white/5 relative z-10"
      >
        <div className="p-2 bg-white/5 rounded-xl">
          <Info size={16} className="shrink-0" />
        </div>
        <p className="leading-relaxed font-medium">
          Strategic wellness insights delivered via Medora's neural analysis engine. These indicators facilitate health awareness but do not replace localized clinical diagnostics.
        </p>
      </motion.div>
    </motion.div>
  );
};

export default HealthInsights;
