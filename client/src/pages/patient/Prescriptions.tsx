import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Pill, 
  Calendar, 
  Note, 
  CaretDown, 
  CaretUp,
  DownloadSimple,
  Syringe,
  FirstAid,
  Clock
} from '@phosphor-icons/react';
import { usePatient } from '../../api/PatientContext';

const PrescriptionCard = ({ prescription }: any) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-4xl shadow-2xl relative overflow-hidden group hover:border-teal-500/20 transition-all duration-300"
    >
      <div className="absolute top-0 right-0 p-8 pointer-events-none text-teal-400 opacity-20 group-hover:opacity-40 transition-opacity">
        <FirstAid size={80} weight="duotone" />
      </div>
      
      <div className="p-8 cursor-pointer relative z-10" onClick={() => setIsOpen(!isOpen)}>
        <div className="flex flex-col md:flex-row md:items-center justify-between items-start gap-4">
          <div className="flex items-center gap-5">
            <div className="p-4 bg-teal-500/10 text-teal-400 rounded-2xl border border-teal-500/10 group-hover:scale-110 transition-transform duration-500">
              <Syringe size={28} weight="duotone" />
            </div>
            <div>
              <p className="font-bold text-white text-xl tracking-tight leading-tight mb-1">Dr. {prescription.doctorName}</p>
              <div className="flex items-center gap-3">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-1.5">
                  <Calendar size={12} weight="duotone" /> {new Date(prescription.date).toLocaleDateString()}
                </p>
                <div className="w-1 h-1 rounded-full bg-slate-700" />
                <p className="text-[10px] text-teal-500 font-bold uppercase tracking-widest flex items-center gap-1.5">
                  <Pill size={12} weight="duotone" /> {prescription.medicines?.length || 0} Meds
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button title="Download Prescription" className="p-3 bg-slate-800/80 rounded-xl text-slate-400 hover:bg-teal-500 hover:text-white transition-all hover:scale-105 active:scale-95 shadow-xl group/btn">
              <DownloadSimple size={18} weight="bold" />
            </button>
            <div className="p-2 text-slate-500 shadow-xl group-hover:text-teal-400 transition-colors">
              {isOpen ? <CaretUp size={24} weight="bold" /> : <CaretDown size={24} weight="bold" />}
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden border-t border-white/5 relative z-10"
          >
            <div className="p-8 bg-slate-950/20 backdrop-blur-2xl space-y-6">
              <div className="space-y-4">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 border-b border-white/5 pb-2">Prescribed Medicines</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {(prescription.medicines?.length > 0 ? prescription.medicines : prescription.medications || []).map((med: any, idx: number) => (
                      <div key={idx} className="p-4 bg-slate-900/40 rounded-2xl border border-white/5 hover:border-teal-500/20 transition-colors group/item">
                        <div className="flex items-center gap-3 mb-2">
                            <FirstAid size={20} weight="fill" className="text-teal-400 group-hover/item:rotate-12 transition-transform" />
                            <p className="text-sm font-bold text-slate-200">{med.name}</p>
                        </div>
                        <p className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-2">
                            <Clock size={12} weight="duotone" /> {med.dosage} • {med.frequency}
                        </p>
                        {med.instructions && (
                          <p className="text-xs text-slate-400 mt-2 font-medium">Instructions: {med.instructions}</p>
                        )}
                      </div>
                    ))}
                </div>
              </div>

              <div className="bg-slate-900/40 rounded-3xl p-5 border border-white/5 border-dashed">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <Note size={14} weight="duotone" /> Doctor's Instructions
                </p>
                <p className="text-sm text-slate-500 leading-relaxed font-medium">
                  {prescription.notes || "No additional instructions provided."}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default function Prescriptions() {
  const { prescriptions, loading, refreshPrescriptions } = usePatient();

  useEffect(() => {
    refreshPrescriptions();
    // Intentionally run once when page mounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const refreshOnFocus = () => {
      refreshPrescriptions();
    };

    const pollId = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        refreshPrescriptions();
      }
    }, 20000);

    window.addEventListener('focus', refreshOnFocus);
    document.addEventListener('visibilitychange', refreshOnFocus);

    return () => {
      window.clearInterval(pollId);
      window.removeEventListener('focus', refreshOnFocus);
      document.removeEventListener('visibilitychange', refreshOnFocus);
    };
  }, [refreshPrescriptions]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="space-y-2">
        <h1 className="text-4xl font-extrabold tracking-tight text-white mb-1 leading-tight">My Prescriptions</h1>
        <p className="text-base font-medium text-slate-500 max-w-lg leading-relaxed">View and download your prescribed medications directly from your doctors.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-24">
          <div className="w-10 h-10 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">
          {prescriptions.length > 0 ? (
            prescriptions.map((p, idx) => <PrescriptionCard key={p._id || idx} prescription={p} />)
          ) : (
            <div className="py-24 text-center border-2 border-dashed border-white/5 rounded-[3rem] bg-slate-900/20">
              <div className="p-4 bg-slate-800/40 inline-block rounded-2xl mb-4 text-slate-500">
                <Pill size={32} weight="duotone" />
              </div>
              <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">No prescriptions found.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
