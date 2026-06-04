import { useEffect, useState } from 'react';
import { CheckCircle, Clock, XCircle, CalendarBlank, User, Phone, ArrowClockwise, Stethoscope, CurrencyDollar } from '@phosphor-icons/react';
import { useNavigate } from 'react-router-dom';
import PageTransition from '../../components/PageTransition';
import axios from 'axios';

interface Appointment {
  _id: string;
  patientId: string;
  patientName?: string;
  patientPhone?: string;
  patientEmail?: string;
  specialty: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  consultationFee: number;
  reason: string;
  status: 'PENDING_DOCTOR_APPROVAL' | 'PENDING_PAYMENT' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  paymentStatus: 'UNPAID' | 'PAID' | 'FAILED' | 'REFUNDED';
}

export default function PendingApprovals() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadAppointments = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get(
        'http://localhost:4000/api/doctors/appointments?status=PENDING_DOCTOR_APPROVAL',
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        setAppointments(response.data.data || []);
      }
    } catch (err: any) {
      console.error('Failed to load pending appointments', err);
      setError(err.response?.data?.message || 'Failed to load pending appointments');
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, []);

  useEffect(() => {
    const interval = setInterval(loadAppointments, 30000);
    return () => clearInterval(interval);
  }, []);

  const onApprove = async (appointmentId: string) => {
    setActionLoadingId(appointmentId);
    try {
      const token = localStorage.getItem('authToken');
      await axios.patch(
        `http://localhost:4000/api/doctors/appointment/${appointmentId}/status`,
        { status: 'CONFIRMED' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess('Appointment approved successfully');
      loadAppointments();
    } catch (err: any) {
      console.error('Failed to approve appointment', err);
      setError(err.response?.data?.message || 'Failed to approve appointment');
    } finally {
      setActionLoadingId(null);
    }
  };

  const onReject = async (appointmentId: string) => {
    const declineReason = window.prompt('Rejection reason (optional):', 'Appointment does not meet requirements.') || undefined;
    
    setActionLoadingId(appointmentId);
    try {
      const token = localStorage.getItem('authToken');
      await axios.patch(
        `http://localhost:4000/api/doctors/appointment/${appointmentId}/status`,
        { status: 'CANCELLED', declineReason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess('Appointment declined');
      loadAppointments();
    } catch (err: any) {
      console.error('Failed to decline appointment', err);
      setError(err.response?.data?.message || 'Failed to decline appointment');
    } finally {
      setActionLoadingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <PageTransition>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-6 h-1 bg-amber-500 rounded-full" />
              <span className="text-[9px] font-black text-amber-500 tracking-[0.2em] uppercase">Action Required</span>
            </div>
            <h1 className="text-2xl font-black text-white uppercase italic">Pending Approvals</h1>
            <p className="text-slate-400 text-sm mt-1">Review and approve new patient appointment requests.</p>
          </div>
          <button
            onClick={loadAppointments}
            className="px-4 py-2 rounded-xl border border-slate-700 text-slate-200 bg-slate-900/50 hover:bg-slate-800 transition-colors flex items-center gap-2"
          >
            <ArrowClockwise size={16} weight="bold" /> Refresh
          </button>
        </div>

        {error && (
          <div className="px-4 py-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="px-4 py-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-sm">
            {success}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-64 bg-slate-900/50 rounded-2xl animate-pulse border border-white/5" />
            ))}
          </div>
        ) : appointments.length === 0 ? (
          <div className="p-12 rounded-2xl border border-white/5 bg-slate-900/40 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} weight="duotone" className="text-emerald-500" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">All Caught Up!</h3>
            <p className="text-slate-400 text-sm">No pending appointments to review right now.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {appointments.map((apt) => (
              <div key={apt._id} className="bg-slate-900/50 border-2 border-amber-500/20 rounded-2xl p-5 space-y-4 hover:border-amber-500/40 transition-all">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-bold text-lg">
                      {apt.patientName?.[0] || 'P'}
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-lg">{apt.patientName || 'Patient'}</h3>
                      <p className="text-xs text-slate-400 flex items-center gap-1">
                        <Stethoscope size={12} weight="duotone" /> {apt.specialty}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-1 rounded-full border border-amber-400/30 text-amber-300 bg-amber-500/10 uppercase font-bold tracking-wider flex items-center gap-1">
                    <Clock size={12} weight="duotone" /> Pending
                  </span>
                </div>

                <div className="flex items-center gap-4 text-sm text-slate-400">
                  <div className="flex items-center gap-1">
                    <Phone size={14} weight="duotone" />
                    {apt.patientPhone || apt.patientEmail || 'No contact'}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-white/5 bg-slate-950/30 p-3">
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-1">
                      <CalendarBlank size={12} weight="duotone" /> Date
                    </p>
                    <p className="text-slate-200 font-semibold">{formatDate(apt.appointmentDate)}</p>
                    <p className="text-xs text-slate-400">{apt.startTime} - {apt.endTime}</p>
                  </div>
                  <div className="rounded-xl border border-green-400/20 bg-green-500/10 p-3">
                    <p className="text-[10px] text-green-300 uppercase tracking-widest mb-1 flex items-center gap-1">
                      <CurrencyDollar size={12} weight="duotone" /> Fee
                    </p>
                    <p className="text-green-100 font-bold text-xl">LKR {apt.consultationFee?.toLocaleString()}</p>
                    <p className="text-xs text-green-300/60">{apt.paymentStatus}</p>
                  </div>
                </div>

                <div className="text-sm text-slate-300 rounded-xl bg-slate-950/30 border border-white/5 p-3">
                  <span className="text-slate-500 text-xs uppercase tracking-widest block mb-1">Reason for Visit</span>
                  {apt.reason}
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => onApprove(apt._id)}
                    disabled={actionLoadingId === apt._id}
                    className="flex-1 px-3 py-3 rounded-xl text-sm font-bold border border-emerald-400/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <CheckCircle size={18} weight="duotone" /> Approve
                  </button>
                  <button
                    onClick={() => onReject(apt._id)}
                    disabled={actionLoadingId === apt._id}
                    className="flex-1 px-3 py-3 rounded-xl text-sm font-bold border border-rose-400/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <XCircle size={18} weight="duotone" /> Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageTransition>
  );
}