import { useEffect, useState } from 'react';
import { CheckCircle, Clock, XCircle, CalendarBlank, User, Phone, ArrowClockwise } from '@phosphor-icons/react';
import PageTransition from '../../components/PageTransition';
import { getRescheduleRequests, approveRescheduleRequest, rejectRescheduleRequest, type RescheduleRequestAppointment } from '../../api/doctor';

export default function RescheduleRequests() {
  const [requests, setRequests] = useState<RescheduleRequestAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      const doctorId = user?._id || user?.id;

      if (!doctorId) {
        setError('Doctor ID not found. Please log in again.');
        setRequests([]);
        return;
      }

      const response = await getRescheduleRequests(doctorId);
      setRequests(Array.isArray(response?.data) ? response.data : []);
    } catch (err) {
      console.error('Failed to load reschedule requests', err);
      setError('Failed to load reschedule requests');
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const onApprove = async (appointmentId: string) => {
    setActionLoadingId(appointmentId);
    try {
      await approveRescheduleRequest(appointmentId);
      await loadRequests();
    } catch (err) {
      console.error('Failed to approve reschedule request', err);
      setError('Failed to approve request');
    } finally {
      setActionLoadingId(null);
    }
  };

  const onReject = async (appointmentId: string) => {
    const rejectionReason = window.prompt('Optional rejection reason:', 'Selected slot is not suitable. Please choose another one.') || undefined;

    setActionLoadingId(appointmentId);
    try {
      await rejectRescheduleRequest(appointmentId, rejectionReason);
      await loadRequests();
    } catch (err) {
      console.error('Failed to reject reschedule request', err);
      setError('Failed to reject request');
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <PageTransition>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">Reschedule Requests</h1>
            <p className="text-slate-400 text-sm mt-1">Review and approve patient reschedule requests based on available slots.</p>
          </div>
          <button
            onClick={loadRequests}
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

        {loading ? (
          <div className="text-slate-400">Loading requests...</div>
        ) : requests.length === 0 ? (
          <div className="p-8 rounded-2xl border border-white/5 bg-slate-900/40 text-slate-400 text-center">
            No pending reschedule requests.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {requests.map((request) => (
              <div key={request._id} className="bg-slate-900/50 border border-white/5 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-white font-bold">
                    <User size={16} weight="duotone" />
                    {request.patientName || 'Patient'}
                  </div>
                  <span className="text-[10px] px-2 py-1 rounded-full border border-amber-400/30 text-amber-300 bg-amber-500/10 uppercase font-bold tracking-wider flex items-center gap-1">
                    <Clock size={12} weight="duotone" /> Pending
                  </span>
                </div>

                <div className="text-xs text-slate-400 flex items-center gap-2">
                  <Phone size={14} weight="duotone" /> {request.patientPhone || request.patientEmail || 'No contact'}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl border border-white/5 bg-slate-950/30 p-3">
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Current</p>
                    <p className="text-slate-200">
                      {new Date(request.appointmentDate).toLocaleDateString()} | {request.startTime} - {request.endTime}
                    </p>
                  </div>
                  <div className="rounded-xl border border-blue-400/20 bg-blue-500/10 p-3">
                    <p className="text-[10px] text-blue-300 uppercase tracking-widest mb-1 flex items-center gap-1">
                      <CalendarBlank size={12} weight="duotone" /> Requested
                    </p>
                    <p className="text-blue-100">
                      {request.rescheduleRequest?.requestedDate ? new Date(request.rescheduleRequest.requestedDate).toLocaleDateString() : '-'} | {request.rescheduleRequest?.requestedStartTime} - {request.rescheduleRequest?.requestedEndTime}
                    </p>
                  </div>
                </div>

                {request.rescheduleRequest?.reason && (
                  <div className="text-sm text-slate-300 rounded-xl bg-slate-950/30 border border-white/5 p-3">
                    <span className="text-slate-500 text-xs uppercase tracking-widest block mb-1">Reason</span>
                    {request.rescheduleRequest.reason}
                  </div>
                )}

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => onApprove(request._id)}
                    disabled={actionLoadingId === request._id}
                    className="flex-1 px-3 py-2 rounded-xl text-sm font-bold border border-emerald-400/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <CheckCircle size={15} weight="duotone" /> Approve
                  </button>
                  <button
                    onClick={() => onReject(request._id)}
                    disabled={actionLoadingId === request._id}
                    className="flex-1 px-3 py-2 rounded-xl text-sm font-bold border border-rose-400/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <XCircle size={15} weight="duotone" /> Reject
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
