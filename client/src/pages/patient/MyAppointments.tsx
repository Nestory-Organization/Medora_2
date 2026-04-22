import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useRefreshOnNavigate } from '../../hooks/useRefreshOnNavigate';
import { 
  CalendarCheck, 
  Users, 
  Clock, 
  CheckCircle, 
  CaretDown,
  CaretUp,
  CreditCard,
  VideoCamera,
  CalendarPlus,
  X,
  Warning
} from '@phosphor-icons/react';
import { getMyAppointments, cancelAppointment, joinMeeting, requestReschedule, getDoctorAvailabilitySlots } from '../../api/patient';
import PageTransition from '../../components/PageTransition';
import EmptyState from '../../components/EmptyState';
import { TableSkeleton } from '../../components/Skeleton';

const AppointmentRow = ({ appointment, onCancel, navigate, onReschedule, onJoinMeeting }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Map API response to component format
  const mapped = {
    id: appointment._id,
    doctorName: appointment.doctorName || `Doctor ${appointment.doctorId?.substring(0, 8)}`,
    date: new Date(appointment.appointmentDate).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    }),
    time: appointment.startTime,
    duration: `${appointment.startTime} - ${appointment.endTime}`,
    status: appointment.status === 'PENDING_DOCTOR_APPROVAL' ? 'pending_approval' : appointment.status === 'PENDING_PAYMENT' ? 'pending' : appointment.status?.toLowerCase(),
    specialty: appointment.specialty || 'General',
    paymentStatus: appointment.paymentStatus,
    consultationFee: appointment.consultationFee,
    appointmentDate: appointment.appointmentDate,
    startTime: appointment.startTime,
    endTime: appointment.endTime
  };
  
  // Check if appointment is in the future
  const appointmentDateTime = new Date(mapped.appointmentDate);
  const now = new Date();
  const isFuture = appointmentDateTime > now;
  
  // Check if appointment is soon (within 24 hours) for join meeting button
  const timeDiffMinutes = (appointmentDateTime.getTime() - now.getTime()) / (1000 * 60);
  const canJoinMeeting = timeDiffMinutes <= 60 && timeDiffMinutes >= -15 && mapped.status === 'confirmed';
  
  const statusColors = {
    pending_approval: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    pending: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    confirmed: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
    completed: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    cancelled: 'bg-rose-500/10 text-rose-500 border-rose-500/20'
  };

  const statusLabels: Record<string, string> = {
    pending_approval: 'Awaiting Approval',
    pending: 'Pending Payment',
    confirmed: 'Confirmed',
    completed: 'Completed',
    cancelled: 'Cancelled'
  };

  const isConfirmed = mapped.status === 'confirmed';
  const canJoin = isConfirmed && mapped.paymentStatus === 'PAID';

  const handlePayment = (e: any) => {
    e.stopPropagation();
    navigate(`/patient/payment?appointmentId=${mapped.id}`);
  };

  const handleJoinMeeting = async (e: any) => {
    e.stopPropagation();
    setIsLoading(true);
    try {
      await onJoinMeeting(mapped.id);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReschedule = (e: any) => {
    e.stopPropagation();
    onReschedule(appointment);
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
              <p className="font-bold text-white text-xl tracking-tight leading-tight mb-1">
                {mapped.doctorName.startsWith('Dr. ') ? mapped.doctorName : `Dr. ${mapped.doctorName}`}
              </p>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-2">
                <CalendarCheck size={14} weight="duotone" /> {mapped.date}
                <span className="w-1 h-1 rounded-full bg-slate-700" />
                <Clock size={14} weight="duotone" /> {mapped.time}
              </p>
              {appointment.rescheduleRequest?.status === 'PENDING' && (
                <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest mt-2 flex items-center gap-1.5">
                  <Warning size={12} weight="duotone" /> 
                  Reschedule request pending
                </p>
              )}
              {appointment.rescheduleRequest?.status === 'APPROVED' && (
                <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest mt-2 flex items-center gap-1.5">
                  <CheckCircle size={12} weight="duotone" /> 
                  Rescheduled to {new Date(appointment.rescheduleRequest.requestedDate).toLocaleDateString()} at {appointment.rescheduleRequest.requestedStartTime}
                </p>
              )}
              {appointment.rescheduleRequest?.status === 'REJECTED' && (
                <p className="text-[10px] text-rose-400 font-bold uppercase tracking-widest mt-2 flex items-center gap-1.5">
                  <Warning size={12} weight="duotone" /> 
                  Reschedule request declined
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-4 w-full lg:w-auto overflow-hidden">
            <div className="flex flex-col items-end gap-2">
              <span className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border ${statusColors[mapped.status as keyof typeof statusColors]}`}>
                {statusLabels[mapped.status] || mapped.status}
              </span>
              {mapped.paymentStatus && mapped.status !== 'pending_approval' && <p className="text-[10px] font-bold text-slate-600 uppercase tracking-tight">{mapped.paymentStatus}</p>}
            </div>
            <div className="flex items-center gap-2 flex-wrap justify-end">
              {mapped.status === 'pending_approval' && (
                <div className="px-3 py-2 bg-blue-500/10 text-blue-400 rounded-xl font-bold uppercase text-[10px] border border-blue-500/20 flex items-center gap-1.5 whitespace-nowrap">
                  <Clock size={13} />
                  Wait for Doctor
                </div>
              )}
              {mapped.status === 'pending' && (
                <button 
                  onClick={handlePayment}
                  className="px-3 py-2 bg-teal-500/10 text-teal-400 rounded-xl font-bold uppercase text-[10px] hover:bg-teal-500 hover:text-white transition-all shadow-lg active:scale-95 border border-teal-500/20 flex items-center gap-1.5 whitespace-nowrap"
                >
                  <CreditCard size={13} />
                  Pay
                </button>
              )}
              {canJoin && !canJoinMeeting && (
                <button 
                  onClick={handleJoinMeeting}
                  disabled={isLoading}
                  className="px-3 py-2 bg-emerald-500/10 text-emerald-400 rounded-xl font-bold uppercase text-[10px] hover:bg-emerald-500 hover:text-white transition-all shadow-lg active:scale-95 border border-emerald-500/20 flex items-center gap-1.5 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <VideoCamera size={13} weight="fill" />
                  {isLoading ? 'Loading...' : 'Join Meeting'}
                </button>
              )}
              {canJoinMeeting && (
                <button 
                  onClick={handleJoinMeeting}
                  disabled={isLoading}
                  className="px-3 py-2 bg-emerald-500/10 text-emerald-400 rounded-xl font-bold uppercase text-[10px] hover:bg-emerald-500 hover:text-white transition-all shadow-lg active:scale-95 border border-emerald-500/20 flex items-center gap-1.5 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <VideoCamera size={13} weight="fill" />
                  {isLoading ? 'Joining...' : 'Join'}
                </button>
              )}
              {isFuture && mapped.status !== 'cancelled' && mapped.status !== 'completed' && appointment.rescheduleRequest?.status !== 'PENDING' && (
                <button 
                  onClick={handleReschedule}
                  className="px-3 py-2 bg-blue-500/10 text-blue-400 rounded-xl font-bold uppercase text-[10px] hover:bg-blue-500 hover:text-white transition-all shadow-lg active:scale-95 border border-blue-500/20 flex items-center gap-1.5 whitespace-nowrap"
                >
                  <CalendarPlus size={13} />
                  Reschedule
                </button>
              )}
              {mapped.status !== 'cancelled' && mapped.status !== 'completed' && (
                <button 
                  onClick={(e) => { e.stopPropagation(); onCancel(mapped.id); }}
                  className="px-3 py-2 bg-rose-500/10 text-rose-500 rounded-xl font-bold uppercase text-[10px] hover:bg-rose-500 hover:text-white transition-all shadow-lg active:scale-95 border border-rose-500/10 whitespace-nowrap"
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
  const [rescheduleModal, setRescheduleModal] = useState<{ isOpen: boolean; appointmentId: string | null; doctorId: string | null }>({
    isOpen: false,
    appointmentId: null,
    doctorId: null
  });
  const [rescheduleForm, setRescheduleForm] = useState({
    newDate: '',
    startTime: '',
    endTime: '',
    reason: ''
  });
  const [availableSlots, setAvailableSlots] = useState<Array<{ startTime: string; endTime: string }>>([]);
  const [slotLoading, setSlotLoading] = useState(false);
  const [isSubmittingReschedule, setIsSubmittingReschedule] = useState(false);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const res = await getMyAppointments();
      // res is the full API response object (success: true, data: [...])
      setAppointments(res?.data || []);
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

  // Refresh when page becomes visible (e.g., returning from payment)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchAppointments();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Auto-confirm PENDING_PAYMENT appointments on page load (fallback when Stripe webhook didn't fire)
  // Only runs once using a ref to avoid re-running on filter changes
  const hasConfirmedRef = useRef(false);
  useEffect(() => {
    if (hasConfirmedRef.current || appointments.length === 0) return;
    hasConfirmedRef.current = true;

    const confirmPendingPayment = async () => {
      const pending = appointments.filter(
        (a) => a.status === 'PENDING_PAYMENT' && a.paymentStatus === 'UNPAID'
      );

      for (const apt of pending) {
        try {
          const token = localStorage.getItem('authToken');
          const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';
          const res = await axios.post(
            `${API_BASE_URL}/appointments/${apt._id}/confirm-from-payment`,
            {},
            { headers: { Authorization: `Bearer ${token}` } }
          );
          if (res.data?.success) {
            setAppointments((prev) =>
              prev.map((a) =>
                a._id === apt._id
                  ? { ...a, status: 'CONFIRMED', paymentStatus: 'PAID' }
                  : a
              )
            );
          }
        } catch (_) {
          // Silent - just skip if it fails
        }
      }
    };

    confirmPendingPayment();
  }, []);

  const handleCancel = async (id: string) => {
    try {
      await cancelAppointment(id);
      setAppointments(prev => prev.map(a => a._id === id ? { ...a, status: 'CANCELLED' } : a));
    } catch (err) {
      console.error("Cancel failed", err);
    }
  };

  const loadAvailableSlots = async (doctorId: string, date: string) => {
    setSlotLoading(true);
    try {
      const slots = await getDoctorAvailabilitySlots(doctorId, date);
      setAvailableSlots(slots);
    } catch (error) {
      console.error('Failed to load doctor slots', error);
      setAvailableSlots([]);
    } finally {
      setSlotLoading(false);
    }
  };

  const handleReschedule = (appointment: any) => {
    const dateValue = new Date().toISOString().split('T')[0];
    setRescheduleModal({ isOpen: true, appointmentId: appointment._id, doctorId: appointment.doctorId });
    setRescheduleForm({ newDate: '', startTime: '', endTime: '', reason: '' });

    if (appointment?.doctorId) {
      setRescheduleForm((prev) => ({ ...prev, newDate: dateValue }));
      loadAvailableSlots(appointment.doctorId, dateValue);
    }
  };

  const handleRescheduleDateChange = async (newDate: string) => {
    setRescheduleForm((prev) => ({ ...prev, newDate, startTime: '', endTime: '' }));

    if (!rescheduleModal.doctorId || !newDate) {
      setAvailableSlots([]);
      return;
    }

    await loadAvailableSlots(rescheduleModal.doctorId, newDate);
  };

  const handleSlotSelect = (startTime: string, endTime: string) => {
    setRescheduleForm((prev) => ({ ...prev, startTime, endTime }));
  };

  const handleRescheduleSubmit = async () => {
    if (!rescheduleForm.newDate || !rescheduleForm.startTime || !rescheduleForm.endTime) {
      alert('Please fill in all required fields');
      return;
    }

    if (!rescheduleModal.appointmentId) return;

    setIsSubmittingReschedule(true);
    try {
      const response = await requestReschedule(
        rescheduleModal.appointmentId,
        rescheduleForm.newDate,
        rescheduleForm.startTime,
        rescheduleForm.endTime,
        rescheduleForm.reason
      );

      if (response.success) {
        alert('Reschedule request sent! Waiting for doctor approval.');
        setAppointments(prev =>
          prev.map(a => a._id === rescheduleModal.appointmentId
            ? { ...a, rescheduleRequest: response.data.rescheduleRequest }
            : a
          )
        );
        setRescheduleModal({ isOpen: false, appointmentId: null, doctorId: null });
        setAvailableSlots([]);
      }
    } catch (err) {
      console.error("Reschedule request failed", err);
      alert('Failed to submit reschedule request');
    } finally {
      setIsSubmittingReschedule(false);
    }
  };

  const handleJoinMeeting = async (appointmentId: string) => {
    try {
      const response = await joinMeeting(appointmentId);
      const sessionId = response?.data?.sessionId;
      if (sessionId) {
        // Navigate to telemedicine room page
        navigate(`/patient-telemedicine/${sessionId}`);
      } else {
        console.error("No session ID received");
      }
    } catch (err) {
      console.error("Failed to join meeting", err);
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
          <div className="flex flex-col md:flex-row gap-3">
            <button 
              onClick={() => navigate('/patient/book')}
              className="px-6 py-3 bg-teal-600 hover:bg-teal-500 text-white rounded-2xl font-bold text-sm uppercase shadow-lg active:scale-95 transition-all flex items-center gap-2"
            >
              <CalendarPlus size={18} weight="bold" />
              New Appointment
            </button>
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
        </div>

        <div className="space-y-6">
          {loading ? (
            <TableSkeleton rows={4} />
          ) : filteredAppointments.length > 0 ? (
            filteredAppointments.map((a, idx) => <AppointmentRow key={idx} appointment={a} onCancel={handleCancel} navigate={navigate} onReschedule={handleReschedule} onJoinMeeting={handleJoinMeeting} />)
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

      {/* Reschedule Request Modal */}
      <AnimatePresence>
        {rescheduleModal.isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-md z-50 flex items-center justify-center p-4"
            onClick={() => {
              setRescheduleModal({ isOpen: false, appointmentId: null, doctorId: null });
              setAvailableSlots([]);
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-white/10 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-linear-to-r from-blue-600/20 to-teal-600/20 border-b border-white/10 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                    <CalendarPlus size={20} className="text-blue-400" weight="duotone" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Request Reschedule</h3>
                    <p className="text-xs text-slate-400">Doctor approval required</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setRescheduleModal({ isOpen: false, appointmentId: null, doctorId: null });
                    setAvailableSlots([]);
                  }}
                  className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X size={20} weight="bold" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">
                    New Date *
                  </label>
                  <input
                    type="date"
                    value={rescheduleForm.newDate}
                    onChange={(e) => handleRescheduleDateChange(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">
                    Available Slots *
                  </label>
                  {slotLoading ? (
                    <div className="text-sm text-slate-400">Loading available slots...</div>
                  ) : availableSlots.length === 0 ? (
                    <div className="text-sm text-slate-400 bg-slate-800/40 border border-slate-700 rounded-xl px-3 py-2">
                      No available slots for this date.
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {availableSlots.map((slot) => {
                        const isSelected = rescheduleForm.startTime === slot.startTime && rescheduleForm.endTime === slot.endTime;
                        return (
                          <button
                            key={`${slot.startTime}-${slot.endTime}`}
                            type="button"
                            onClick={() => handleSlotSelect(slot.startTime, slot.endTime)}
                            className={`px-3 py-2 rounded-lg border text-xs font-bold transition-colors ${isSelected ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:border-blue-500/50'}`}
                          >
                            {slot.startTime} - {slot.endTime}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">
                    Reason (Optional)
                  </label>
                  <textarea
                    value={rescheduleForm.reason}
                    onChange={(e) => setRescheduleForm({ ...rescheduleForm, reason: e.target.value })}
                    placeholder="Why do you need to reschedule?"
                    className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors resize-none h-20"
                  />
                </div>

                <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3 flex gap-2">
                  <Warning size={16} className="text-blue-400 shrink-0 mt-0.5" weight="duotone" />
                  <p className="text-xs text-blue-200">Doctor will review your request. No additional payment needed.</p>
                </div>
              </div>

              {/* Footer */}
              <div className="bg-slate-950/50 border-t border-white/10 px-6 py-4 flex gap-3">
                <button
                  onClick={() => {
                    setRescheduleModal({ isOpen: false, appointmentId: null, doctorId: null });
                    setAvailableSlots([]);
                  }}
                  className="flex-1 px-4 py-2.5 bg-slate-800/50 text-slate-300 rounded-xl font-semibold hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRescheduleSubmit}
                  disabled={isSubmittingReschedule}
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {isSubmittingReschedule ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <CalendarPlus size={16} weight="bold" />
                      Request Change
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageTransition>
  );
}
