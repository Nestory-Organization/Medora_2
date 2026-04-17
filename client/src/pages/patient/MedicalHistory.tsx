import { motion } from 'framer-motion';
import { 
  Pill, 
  Calendar, 
  User, 
  Stethoscope
} from '@phosphor-icons/react';
import { usePatient } from '../../api/PatientContext';
import { useRefreshOnNavigate } from '../../hooks/useRefreshOnNavigate';
import PageTransition from '../../components/PageTransition';
import EmptyState from '../../components/EmptyState';
// Removed unused TableSkeleton import

const HistoryCard = ({ entry }: any) => (
  <motion.div 
    layout
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="bg-slate-900/50 backdrop-blur-xl border border-white/5 p-6 rounded-4xl shadow-2xl relative overflow-hidden group hover:border-teal-500/20 transition-all duration-300"
  >
    <div className="absolute top-0 right-0 p-6 pointer-events-none text-teal-400 group-hover:scale-110 transition-transform duration-500 opacity-20 group-hover:opacity-40">
      <Stethoscope size={64} weight="duotone" />
    </div>
    
    <div className="flex items-center gap-4 mb-6">
      <div className="p-3 bg-teal-500/10 text-teal-400 rounded-xl">
        <Calendar size={20} weight="duotone" />
      </div>
      <div>
        <p className="font-bold text-white text-lg tracking-tight">{entry.condition || entry.diagnosis}</p>
        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">{new Date(entry.appointmentDate || entry.date).toLocaleDateString()}</p>
      </div>
    </div>
    
    <div className="space-y-4 relative z-10">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 border border-slate-700">
          <User size={16} weight="duotone" />
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Diagnosed By</p>
          <p className="text-sm font-semibold text-slate-300">Dr. {entry.doctorName}</p>
        </div>
      </div>
      
      <div className="bg-slate-950/40 rounded-2xl p-4 border border-white/5">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
          <Pill size={12} weight="duotone" /> Treatment / Notes
        </p>
        <p className="text-sm text-slate-400 leading-relaxed font-medium">
          {entry.notes || "No additional notes provided."}
        </p>
      </div>
    </div>
  </motion.div>
);

export default function MedicalHistory() {
  const { history, loading, refreshHistory } = usePatient();
  
  // Refresh medical history when navigating to this page
  useRefreshOnNavigate(refreshHistory);

  return (
    <PageTransition>
      <div className="space-y-8 max-w-7xl mx-auto pb-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between items-start gap-6">
          <div className="space-y-1">
            <h1 className="text-4xl font-extrabold tracking-tight text-white mb-1 leading-tight">Medical History</h1>
            <p className="text-slate-500 font-medium">Keep track of your past diagnoses and treatments in one secure place.</p>
          </div>
          <span className="px-3 py-1 text-[10px] uppercase tracking-widest font-bold rounded-full border border-white/10 text-slate-400 bg-slate-900/40">
            View Only
          </span>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-48 bg-slate-800/20 rounded-4xl animate-pulse" />
            <div className="h-48 bg-slate-800/20 rounded-4xl animate-pulse" />
            <div className="h-48 bg-slate-800/20 rounded-4xl animate-pulse" />
            <div className="h-48 bg-slate-800/20 rounded-4xl animate-pulse" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {history.length > 0 ? (
              history.map((entry, idx) => <HistoryCard key={entry._id || idx} entry={entry} />)
            ) : (
              <div className="lg:col-span-2">
                <EmptyState 
                  type="history"
                  title="No Medical History Records"
                  description="Keep your clinical profile updated. Your history is empty. Start adding your past diagnoses or allergic conditions."
                />
              </div>
            )}
          </div>
        )}
      </div>
    </PageTransition>
  );
}
