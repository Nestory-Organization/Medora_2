import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  CalendarCheck, 
  Users, 
  Clock, 
  CheckCircle, 
  CaretDown,
  CaretUp,
  CreditCard,
  Plus,
  X,
  CalendarPlus,
  VideoCamera
} from '@phosphor-icons/react';
import { getMyAppointments, cancelAppointment, rescheduleAppointment } from '../../api/patient';
import PageTransition from '../../components/PageTransition';
import EmptyState from '../../components/EmptyState';
import { TableSkeleton } from '../../components/Skeleton';

const RescheduleModal = ({ appointment, onClose, onSubmit, isLoading }: any) => {
  const [newDate, setNewDate] = useState(new Date(appointment.currentDate).toISOString().split('T')[0]);
  const [newStartTime, setNewStartTime] = useState(appointment.currentTime);
  const [newEndTime, setNewEndTime] = useState(appointment.endTime);

  const handleSubmit = (e: any) => {
    e.preventDefault();
    if (newDate && newStartTime && newEndTime) {
      onSubmit(newDate, newStartTime, newEndTime);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-slate-900 border border-white/10 rounded-3xl shadow-2xl max-w-md w-full p-8 space-y-6"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <CalendarPlus size={24} className="text-blue-400" />
            Reschedule Appointment
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4 text-sm">
          <div className="p-3 bg-slate-800/50 rounded-lg border border-white/5">
            <p className="text-slate-400 text-xs uppercase font-bold mb-1">Doctor</p>
            <p className="text-white font-semibold">{appointment.specialty}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-300 mb-2">New Date</label>
            <input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-2.5 bg-slate-800 border border-white/10 rounded-lg text-white focus:outline-none focus:border-teal-500 transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-300 mb-2">Start Time</label>
              <input
                type="time"
                value={newStartTime}
                onChange={(e) => setNewStartTime(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-800 border border-white/10 rounded-lg text-white focus:outline-none focus:border-teal-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-300 mb-2">End Time</label>
              <input
                type="time"
                value={newEndTime}
                onChange={(e) => setNewEndTime(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-800 border border-white/10 rounded-lg text-white focus:outline-none focus:border-teal-500 transition-colors"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-slate-800 text-white rounded-lg font-bold uppercase text-xs hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg font-bold uppercase text-xs hover:shadow-lg disabled:opacity-50 transition-all"
            >
              {isLoading ? 'Rescheduling...' : 'Confirm'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

const AppointmentRow = ({ appointment, onCancel, onReschedule, navigate }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  
  // Map API response to component format
  const mapped = {
    id: appointment._id,
    doctorId: appointment.doctorId,
    doctorName:
      appointment.doctorName ||
      appointment?.doctor?.name ||
      (appointment?.doctor?.firstName && appointment?.doctor?.lastName
        ? `${appointment.doctor.firstName} ${appointment.doctor.lastName}`
        : `Doctor ${appointment.doctorId?.substring(0, 8)}`),
    date: new Date(appointment.appointmentDate).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    }),
    rawDate: appointment.appointmentDate,
    time: appointment.startTime,
    endTime: appointment.endTime,
    duration: `${appointment.startTime} - ${appointment.endTime}`,
    status: appointment.status === 'PENDING_PAYMENT' ? 'pending' : appointment.status?.toLowerCase(),
    specialty: appointment.specialty || 'General',
    paymentStatus: appointment.paymentStatus,
    telemedicineRoomId: appointment.telemedicineRoomId,
    telemedicineJoinPath: appointment.telemedicineJoinPath,
    telemedicineStatus: appointment.telemedicineStatus,
    consultationFee: appointment.consultationFee,
    reason: appointment.reason
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
  const [rescheduleModal, setRescheduleModal] = useState<any>(null);
  const [rescheduling, setRescheduling] = useState(false);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const appointmentsData = await getMyAppointments();
      setAppointments(appointmentsData || []);
    } catch (err) {
      console.error("Failed to load appointments", err);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch on component mount
  useEffect(() => {
    fetchAppointments();
  }, []);

  // Refetch when page becomes visible (user returns from payment)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('Page became visible, refetching appointments...');
        fetchAppointments();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Also refetch every 10 seconds to ensure latest payment status
  useEffect(() => {
    const interval = setInterval(() => {
      fetchAppointments();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const handleCancel = async (id: string) => {
    try {
      await cancelAppointment(id);
      setAppointments(prev => prev.map(a => a._id === id ? { ...a, status: 'CANCELLED' } : a));
    } catch (err) {
      console.error("Cancel failed", err);
    }
  };

  const handleOpenReschedule = (appointmentData: any) => {
    setRescheduleModal(appointmentData);
  };

  const handleRescheduleSubmit = async (newDate: string, newStartTime: string, newEndTime: string) => {
    if (!rescheduleModal) return;

    setRescheduling(true);
    try {
      await rescheduleAppointment(rescheduleModal.id, {
        appointmentDate: newDate,
        startTime: newStartTime,
        endTime: newEndTime,
        reason: rescheduleModal.reason
      });

      // Update the appointments list
      setAppointments(prev => 
        prev.map(a => 
          a._id === rescheduleModal.id 
            ? { 
                ...a, 
                appointmentDate: newDate,
                startTime: newStartTime,
                endTime: newEndTime
              } 
            : a
        )
      );

      setRescheduleModal(null);
    } catch (err) {
      console.error("Reschedule failed", err);
    } finally {
      setRescheduling(false);
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
          <div className="flex gap-4 items-center w-full md:w-auto">
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
            <motion.button
              onClick={() => navigate('/patient/book')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-2.5 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-xl font-bold text-[10px] uppercase shadow-lg shadow-teal-500/30 hover:shadow-teal-500/50 transition-all flex items-center gap-2 whitespace-nowrap border border-teal-400/30"
            >
              <Plus size={16} weight="bold" />
              New Appointment
            </motion.button>
          </div>
        </div>

        <div className="space-y-6">
          {loading ? (
            <TableSkeleton rows={4} />
          ) : filteredAppointments.length > 0 ? (
            filteredAppointments.map((a, idx) => <AppointmentRow key={idx} appointment={a} onCancel={handleCancel} onReschedule={handleOpenReschedule} navigate={navigate} />)
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

        {/* Reschedule Modal */}
        <AnimatePresence>
          {rescheduleModal && (
            <RescheduleModal 
              appointment={rescheduleModal}
              onClose={() => setRescheduleModal(null)}
              onSubmit={handleRescheduleSubmit}
              isLoading={rescheduling}
            />
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
}
