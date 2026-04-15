import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CalendarCheck, 
  Users, 
  Clock, 
  CheckCircle, 
  CaretDown,
  CaretUp
} from '@phosphor-icons/react';
import { getMyAppointments, cancelAppointment } from '../../api/patient';
import PageTransition from '../../components/PageTransition';
import EmptyState from '../../components/EmptyState';
import { TableSkeleton } from '../../components/Skeleton';

const AppointmentRow = ({ appointment, onCancel }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const statusColors = {
    pending: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    confirmed: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
    completed: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    cancelled: 'bg-rose-500/10 text-rose-500 border-rose-500/20'
  };

  return (
    <motion.div 
      layout
      className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-4xl shadow-2xl overflow-hidden group hover:border-teal-500/20 transition-all duration-300 mb-6"
    >
      <div className="p-8 cursor-pointer relative z-10" onClick={() => setIsOpen(!isOpen)}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between items-start gap-6">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-3xl bg-slate-800 flex items-center justify-center text-teal-400 border border-slate-700 group-hover:bg-teal-500 group-hover:text-white transition-all duration-500 transform group-hover:rotate-6">
              <Users size={32} weight="duotone" />
            </div>
            <div>
              <p className="font-bold text-white text-xl tracking-tight leading-tight mb-1">Dr. {appointment.doctorName}</p>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-2">
                <CalendarCheck size={14} weight="duotone" /> {appointment.date}
                <span className="w-1 h-1 rounded-full bg-slate-700" />
                <Clock size={14} weight="duotone" /> {appointment.time}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-8 w-full lg:w-auto overflow-hidden">
            <div className="flex flex-col items-end">
              <span className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border ${statusColors[appointment.status as keyof typeof statusColors]}`}>
                {appointment.status}
              </span>
              {appointment.type && <p className="text-[10px] font-bold text-slate-600 mt-1 uppercase tracking-tight">{appointment.type}</p>}
            </div>
            <div className="flex items-center gap-4">
               {appointment.status !== 'cancelled' && (
                  <button 
                  onClick={(e) => { e.stopPropagation(); onCancel(appointment.id); }}
                  className="px-6 py-2.5 bg-rose-500/10 text-rose-500 rounded-xl font-bold uppercase text-[10px] hover:bg-rose-500 hover:text-white transition-all shadow-lg active:scale-95 border border-rose-500/10"
                >
                  Cancel
                </button>
               )}
               <div className="p-2 text-slate-500 hover:text-teal-400 transition-colors">
                  {isOpen ? <CaretUp size={24} weight="bold" /> : <CaretDown size={24} weight="bold" />}
               </div>
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
            className="overflow-hidden border-t border-white/5 bg-slate-950/20 backdrop-blur-2xl px-8 py-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 text-sm">
                <div className="p-4 bg-slate-900/40 rounded-2xl border border-white/5 space-y-2">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                        <CheckCircle size={14} weight="duotone" className="text-teal-400" /> Appointment ID
                    </p>
                    <p className="text-slate-300 font-mono tracking-wider">{appointment.id}</p>
                </div>
                <div className="p-4 bg-slate-900/40 rounded-2xl border border-white/5 space-y-2">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                        <Users size={14} weight="duotone" className="text-teal-400" /> Specialty
                    </p>
                    <p className="text-slate-300 font-semibold">{appointment.specialty || 'General Practitioner'}</p>
                </div>
                <div className="p-4 bg-slate-900/40 rounded-2xl border border-white/5 space-y-2">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                        <Clock size={14} weight="duotone" className="text-teal-400" /> Duration
                    </p>
                    <p className="text-slate-300 font-semibold">30 Minutes</p>
                </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default function MyAppointments() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAppointments = async () => {
      setLoading(true);
      try {
        const res = await getMyAppointments();
        setAppointments(res.data);
      } catch (err) {
        console.error("Failed to load appointments", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAppointments();
  }, []);

  const handleCancel = async (id: string) => {
    try {
      await cancelAppointment(id);
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: 'cancelled' } : a));
    } catch (err) {
      console.error("Cancel failed", err);
    }
  };

  return (
    <PageTransition>
      <div className="space-y-8 max-w-7xl mx-auto pb-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between items-start gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-extrabold tracking-tight text-white mb-1 leading-tight">My Appointments</h1>
            <p className="text-base font-medium text-slate-500 max-w-lg leading-relaxed">View all your upcoming and past consultations in one place.</p>
          </div>
          <div className="flex bg-slate-900/50 backdrop-blur-xl border border-white/5 p-1.5 rounded-2xl shadow-xl">
             <button className="px-6 py-2.5 rounded-xl bg-teal-500 text-white font-bold text-[10px] uppercase shadow-lg shadow-teal-500/20 active:scale-95 transition-all">All</button>
             <button className="px-6 py-2.5 rounded-xl text-slate-400 font-bold text-[10px] uppercase hover:text-white transition-colors">Upcoming</button>
             <button className="px-6 py-2.5 rounded-xl text-slate-400 font-bold text-[10px] uppercase hover:text-white transition-colors">History</button>
          </div>
        </div>

        <div className="space-y-6">
          {loading ? (
            <TableSkeleton rows={4} />
          ) : appointments.length > 0 ? (
            appointments.map((a, idx) => <AppointmentRow key={idx} appointment={a} onCancel={handleCancel} />)
          ) : (
            <EmptyState 
              type="appointments"
              title="No Appointments Found"
              description="You haven't scheduled any consultations yet. Ready to start your health journey?"
              action={{
                label: "Book Your First Appointment",
                onClick: () => console.log("Navigate to booking")
              }}
            />
          )}
        </div>
      </div>
    </PageTransition>
  );
}
