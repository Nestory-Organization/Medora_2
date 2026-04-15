import React from 'react';
import { motion } from 'framer-motion';
import { X, UserCircle, CaretRight, Sparkle, CheckCircle } from 'phosphor-react';

interface Specialist {
  name: string;
  reason: string;
}

interface SpecialistModalProps {
  specialists: Specialist[];
  onClose: () => void;
  loading: boolean;
}

const SpecialistModal: React.FC<SpecialistModalProps> = ({ specialists, onClose, loading }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm shadow-2xl"
      />

      {/* Modal Content */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 30 }}
        className="relative w-full max-w-xl bg-slate-900/40 backdrop-blur-3xl border border-white/20 rounded-[2.5rem] overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.7)]"
      >
        <div className="p-8 border-b border-white/10 flex justify-between items-center bg-gradient-to-r from-cyan-900/40 via-blue-900/40 to-transparent">
          <div>
            <h3 className="text-2xl font-black text-white flex items-center gap-3">
              <div className="p-2 bg-cyan-500/20 rounded-xl">
                <UserCircle size={28} weight="fill" className="text-cyan-400" />
              </div>
              Expert Network
            </h3>
            <p className="text-[10px] uppercase tracking-widest font-bold text-cyan-200/40 mt-1 ml-11">Specialist Recommendations</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-2xl text-white/40 hover:text-white transition-all">
            <X size={24} weight="bold" />
          </button>
        </div>

        <div className="p-8 max-h-[60vh] overflow-y-auto space-y-6 custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-6">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
                <Sparkle size={24} weight="fill" className="text-cyan-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
              </div>
              <p className="text-cyan-200/40 font-black uppercase tracking-[0.3em] text-[10px] animate-pulse">Scanning Global Database</p>
            </div>
          ) : specialists.length > 0 ? (
            specialists.map((specialist, idx) => (
              <motion.div
                key={idx}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: idx * 0.1, ease: "circOut" }}
                className="group p-6 bg-white/[0.03] border border-white/5 rounded-3xl hover:bg-white/[0.07] hover:border-cyan-500/30 transition-all duration-500 cursor-default relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 blur-2xl group-hover:bg-cyan-500/10 transition-colors" />
                
                <div className="flex items-center gap-6 relative z-10">
                  <div className="w-16 h-16 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-2xl flex items-center justify-center shrink-0 border border-white/5 group-hover:border-cyan-500/40 transition-all">
                    <UserCircle size={32} weight="duotone" className="text-cyan-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-lg font-black text-white group-hover:text-cyan-300 transition-colors tracking-tight">
                          {specialist.name}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <CheckCircle size={14} weight="fill" className="text-emerald-400/70" />
                          <span className="text-[10px] uppercase font-bold text-emerald-400/60 tracking-widest">Verified Specialist</span>
                        </div>
                      </div>
                      <CaretRight size={20} className="text-white/10 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
                    </div>
                    <p className="text-xs text-cyan-100/40 mt-4 leading-relaxed font-medium italic">
                      "{specialist.reason}"
                    </p>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-12">
              <p className="text-white/30 font-bold tracking-widest uppercase text-xs">No matching credentials found</p>
            </div>
          )}
        </div>

        <div className="p-8 border-t border-white/10 bg-slate-900/60 backdrop-blur-3xl">
          <button
            onClick={onClose}
            className="w-full py-5 bg-white/5 hover:bg-white/10 text-white rounded-2xl transition-all font-black uppercase tracking-[0.2em] text-[10px] border border-white/10 hover:border-cyan-500/40 shadow-2xl"
          >
            Acknowledge
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default SpecialistModal;
