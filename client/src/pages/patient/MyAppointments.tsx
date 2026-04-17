import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useRefreshOnNavigate } from '../../hooks/useRefreshOnNavigate';
import { 
  CalendarCheck, 
  Users, 
  Clock, 
  CheckCircle, 
  CaretDown,
  CaretUp,
  CreditCard
} from '@phosphor-icons/react';
import { getMyAppointments, cancelAppointment } from '../../api/patient';
import PageTransition from '../../components/PageTransition';
import EmptyState from '../../components/EmptyState';
import { TableSkeleton } from '../../components/Skeleton';
import { CalendarPlus, VideoCamera } from 'phosphor-react';

const AppointmentRow = ({ appointment, onCancel, onReschedule, navigate }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  
  // Map API response to component format
  const mapped = {
    id: appointment._id,
    doctorName: appointment.doctorName || `Doctor ${appointment.doctorId?.substring(0, 8)}`,
    doctorId: appointment.doctorId,
    date: new Date(appointment.appointmentDate).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    }),
    time: appointment.startTime,
    duration: `${appointment.startTime} - ${appointment.endTime}`,
    status: appointment.status === 'PENDING_PAYMENT' ? 'pending' : appointment.status?.toLowerCase(),
    specialty: appointment.specialty || 'General',
    paymentStatus: appointment.paymentStatus,
    telemedicineRoomId: appointment.telemedicineRoomId,
    telemedicineJoinPath: appointment.telemedicineJoinPath,
    telemedicineStatus: appointment.telemedicineStatus,
    consultationFee: appointment.consultationFee,
    reason: appointment.reason,
    rawDate: appointment.appointmentDate,
    endTime: appointment.endTime
  };
  
  const statusColors = {
    pending: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    confirmed: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
    completed: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    cancelled: 'bg-rose-500/10 text-rose-500 border-rose-500/20'
  };

  const handlePayment = (e: any) => {
    e.stopPropagation();
    navigate(`/patient/payment?appointmentId=${mapped.id}`);
  };

  const handleReschedule = (e: any) => {
    e.stopPropagation();
    onReschedule({
      id: mapped.id,
      doctorId: mapped.doctorId,
      specialty: mapped.specialty,
      currentDate: mapped.rawDate,
      currentTime: mapped.time,
      endTime: mapped.endTime,
      consultationFee: mapped.consultationFee,
      reason: mapped.reason
    });
  };

  const handleJoinTelemedicine = (e: any) => {
    e.stopPropagation();

    if (mapped.telemedicineRoomId) {
      navigate(`/patient-telemedicine/${mapped.telemedicineRoomId}`);
    }
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
              <p className="font-bold text-white text-xl tracking-tight leading-tight mb-1">Dr. {mapped.doctorName}</p>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-2">
                <CalendarCheck size={14} weight="duotone" /> {mapped.date}
                <span className="w-1 h-1 rounded-full bg-slate-700" />
                <Clock size={14} weight="duotone" /> {mapped.time}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 w-full lg:w-auto overflow-hidden">
            <div className="flex flex-col items-end gap-2">
              <span className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border ${statusColors[mapped.status as keyof typeof statusColors]}`}>
                {mapped.status}
              </span>
              {mapped.paymentStatus && <p className="text-[10px] font-bold text-slate-600 uppercase tracking-tight">{mapped.paymentStatus}</p>}
            </div>
            <div className="flex items-center gap-3">
              {mapped.status === 'pending' && (
                <button 
                  onClick={handlePayment}
                  className="px-4 py-2.5 bg-teal-500/10 text-teal-400 rounded-xl font-bold uppercase text-[10px] hover:bg-teal-500 hover:text-white transition-all shadow-lg active:scale-95 border border-teal-500/20 flex items-center gap-2 whitespace-nowrap"
                >
                  <CreditCard size={14} />
                  Pay Now
                </button>
              )}
              {mapped.status === 'confirmed' && (
                <button 
                  onClick={handleReschedule}
                  className="px-4 py-2.5 bg-blue-500/10 text-blue-400 rounded-xl font-bold uppercase text-[10px] hover:bg-blue-500 hover:text-white transition-all shadow-lg active:scale-95 border border-blue-500/20 flex items-center gap-2 whitespace-nowrap"
                >
                  <CalendarPlus size={14} />
                  Reschedule
                </button>
              )}
              {mapped.paymentStatus === 'PAID' && mapped.telemedicineRoomId && (
                <button
                  onClick={handleJoinTelemedicine}
                  className="px-4 py-2.5 bg-purple-500/10 text-purple-300 rounded-xl font-bold uppercase text-[10px] hover:bg-purple-500 hover:text-white transition-all shadow-lg active:scale-95 border border-purple-500/30 flex items-center gap-2 whitespace-nowrap"
                >
                  <VideoCamera size={14} />
                  Join Call
                </button>
              )}
              {mapped.status !== 'cancelled' && mapped.status !== 'completed' && (
                <button 
                  onClick={(e) => { e.stopPropagation(); onCancel(mapped.id); }}
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 text-sm">
                <div className="p-4 bg-slate-900/40 rounded-2xl border border-white/5 space-y-2">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                        <CheckCircle size={14} weight="duotone" className="text-teal-400" /> Appointment ID
                    </p>
                    <p className="text-slate-300 font-mono text-xs tracking-wider">{mapped.id}</p>
                </div>
                <div className="p-4 bg-slate-900/40 rounded-2xl border border-white/5 space-y-2">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                        <Users size={14} weight="duotone" className="text-teal-400" /> Specialty
                    </p>
                    <p className="text-slate-300 font-semibold">{mapped.specialty}</p>
                </div>
                <div className="p-4 bg-slate-900/40 rounded-2xl border border-white/5 space-y-2">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                        <Clock size={14} weight="duotone" className="text-teal-400" /> Duration
                    </p>
                    <p className="text-slate-300 font-semibold">{mapped.duration}</p>
                </div>
                <div className="p-4 bg-slate-900/40 rounded-2xl border border-white/5 space-y-2">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                        <CreditCard size={14} weight="duotone" className="text-teal-400" /> Fee
                    </p>
                    <p className="text-slate-300 font-semibold">${mapped.consultationFee}</p>
                </div>
                <div className="p-4 bg-slate-900/40 rounded-2xl border border-white/5 space-y-2 md:col-span-2 lg:col-span-4">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                        <VideoCamera size={14} weight="duotone" className="text-purple-300" /> Telemedicine Link
                    </p>
                    {mapped.telemedicineRoomId ? (
                      <button
                        onClick={handleJoinTelemedicine}
                        className="px-4 py-2 bg-purple-500/10 text-purple-300 rounded-lg font-bold uppercase text-[10px] hover:bg-purple-500 hover:text-white transition-all border border-purple-500/30"
                      >
                        Open Video Call Link
                      </button>
                    ) : (
                      <p className="text-slate-500 text-xs">
                        Link will appear automatically after payment is processed.
                      </p>
                    )}
                </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default function MyAppointments() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'history'>('all');

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const res = await getMyAppointments();
      setAppointments(res.data || []);
    } catch (err) {
      console.error("Failed to load appointments", err);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  // Refresh appointments when navigating to this page
  useRefreshOnNavigate(fetchAppointments);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleCancel = async (id: string) => {
    try {
      await cancelAppointment(id);
      setAppointments(prev => prev.map(a => a._id === id ? { ...a, status: 'CANCELLED' } : a));
    } catch (err) {
      console.error("Cancel failed", err);
    }
  };

  const filteredAppointments = appointments.filter(apt => {
    const aptDate = new Date(apt.appointmentDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (filter === 'upcoming') {
      return aptDate >= today && apt.status !== 'CANCELLED';
    } else if (filter === 'history') {
      return aptDate < today || apt.status === 'CANCELLED';
    }
    return true;
  });

  return (
    <PageTransition>
      <div className="space-y-8 max-w-7xl mx-auto pb-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between items-start gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-extrabold tracking-tight text-white mb-1 leading-tight">My Appointments</h1>
            <p className="text-base font-medium text-slate-500 max-w-lg leading-relaxed">View all your upcoming and past consultations in one place.</p>
          </div>
          <div className="flex bg-slate-900/50 backdrop-blur-xl border border-white/5 p-1.5 rounded-2xl shadow-xl">
            <button 
              onClick={() => setFilter('all')}
              className={`px-6 py-2.5 rounded-xl font-bold text-[10px] uppercase shadow-lg active:scale-95 transition-all ${filter === 'all' ? 'bg-teal-500 text-white shadow-teal-500/20' : 'text-slate-400 hover:text-white'}`}>
              All
            </button>
            <button 
              onClick={() => setFilter('upcoming')}
              className={`px-6 py-2.5 rounded-xl font-bold text-[10px] uppercase transition-colors ${filter === 'upcoming' ? 'bg-teal-500 text-white' : 'text-slate-400 hover:text-white'}`}>
              Upcoming
            </button>
            <button 
              onClick={() => setFilter('history')}
              className={`px-6 py-2.5 rounded-xl font-bold text-[10px] uppercase transition-colors ${filter === 'history' ? 'bg-teal-500 text-white' : 'text-slate-400 hover:text-white'}`}>
              History
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {loading ? (
            <TableSkeleton rows={4} />
          ) : filteredAppointments.length > 0 ? (
            filteredAppointments.map((a, idx) => <AppointmentRow key={idx} appointment={a} onCancel={handleCancel} navigate={navigate} />)
          ) : (
            <EmptyState 
              type="appointments"
              title="No Appointments Found"
              description={filter === 'all' ? "You haven't scheduled any consultations yet. Ready to start your health journey?" : `No ${filter} appointments found.`}
              action={{
                label: "Book Your First Appointment",
                onClick: () => navigate("/patient/book")
              }}
            />
          )}
        </div>
      </div>
    </PageTransition>
  );
}
