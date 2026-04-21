import { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Phone, 
  MapPin, 
  Calendar, 
  Clock,
  CheckCircle,
  XCircle,
  Hourglass,
  MagnifyingGlass,
  FunnelSimple,
  Check
} from '@phosphor-icons/react';
import { useNavigate } from 'react-router-dom';
import { useRefreshOnNavigate } from '../../hooks/useRefreshOnNavigate';
import axios from 'axios';
import PageTransition from '../../components/PageTransition';

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
  status: 'PENDING_PAYMENT' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  paymentStatus: 'UNPAID' | 'PAID' | 'FAILED' | 'REFUNDED';
}

const statusConfig = {
  'PENDING_PAYMENT': { icon: Hourglass, color: 'bg-yellow-500/20 text-yellow-300', label: 'Pending Payment', border: 'border-yellow-500/30' },
  'CONFIRMED': { icon: CheckCircle, color: 'bg-green-500/20 text-green-300', label: 'Confirmed', border: 'border-green-500/30' },
  'CANCELLED': { icon: XCircle, color: 'bg-red-500/20 text-red-300', label: 'Cancelled', border: 'border-red-500/30' },
  'COMPLETED': { icon: CheckCircle, color: 'bg-blue-500/20 text-blue-300', label: 'Completed', border: 'border-blue-500/30' }
};

const AppointmentCard = ({ appointment, onStatusUpdate, onViewDetail, onComplete }: { appointment: Appointment; onStatusUpdate?: (id: string, status: string) => void; onViewDetail?: (patientId: string) => void; onComplete?: (id: string) => void }) => {
  const statusInfo = statusConfig[appointment.status];
  const StatusIcon = statusInfo.icon;
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const isPending = appointment.status === 'PENDING_PAYMENT';

  return (
    <div className={`bg-slate-800/30 border-2 ${statusInfo.border} rounded-xl p-5 space-y-4 hover:bg-slate-800/50 transition-all duration-300 shadow-lg`}>
      {/* Header with Patient Info */}
      <div className="flex items-start justify-between">
        <div className="flex-1 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => onViewDetail?.(appointment.patientId)}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
              {appointment.patientName ? appointment.patientName[0] : 'P'}
            </div>
            <div>
              <h3 className="font-bold text-white text-lg hover:text-blue-400 transition-colors">{appointment.patientName || 'Patient'}</h3>
              <p className="text-xs text-slate-400">{appointment.specialty}</p>
            </div>
          </div>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${statusInfo.color} border ${statusInfo.border}`}>
          <StatusIcon size={16} weight="bold" />
          <span className="text-xs font-bold uppercase tracking-wide">{statusInfo.label}</span>
        </div>
      </div>

      {/* Appointment Details Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Date and Time */}
        <div className="bg-slate-900/50 rounded-lg p-3 border border-white/5">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold mb-1 uppercase">
            <Calendar size={14} weight="bold" />
            Date
          </div>
          <p className="text-white font-bold text-sm">{formatDate(appointment.appointmentDate)}</p>
        </div>

        <div className="bg-slate-900/50 rounded-lg p-3 border border-white/5">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold mb-1 uppercase">
            <Clock size={14} weight="bold" />
            Time
          </div>
          <p className="text-white font-bold text-sm">{appointment.startTime} - {appointment.endTime}</p>
        </div>
      </div>

      {/* Patient Contact Info */}
      <div className="grid grid-cols-2 gap-3">
        {appointment.patientPhone && (
          <div className="bg-slate-900/50 rounded-lg p-3 border border-white/5 flex items-center gap-2">
            <Phone size={14} className="text-blue-400" weight="bold" />
            <span className="text-sm text-slate-300">{appointment.patientPhone}</span>
          </div>
        )}
        {appointment.patientEmail && (
          <div className="bg-slate-900/50 rounded-lg p-3 border border-white/5 flex items-center gap-2">
            <MapPin size={14} className="text-indigo-400" weight="bold" />
            <span className="text-sm text-slate-300 truncate">{appointment.patientEmail}</span>
          </div>
        )}
      </div>

      {/* Reason for Visit */}
      <div className="bg-slate-900/50 rounded-lg p-3 border border-white/5">
        <p className="text-xs text-slate-400 font-semibold uppercase mb-1">Reason for Visit</p>
        <p className="text-sm text-slate-200">{appointment.reason}</p>
      </div>

      {/* Fee and Payment Status */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs text-slate-400 font-semibold uppercase mb-1">Consultation Fee</p>
          <p className="text-lg font-bold text-green-400">${appointment.consultationFee.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-400 font-semibold uppercase mb-1">Payment Status</p>
          <p className={`text-sm font-bold ${appointment.paymentStatus === 'PAID' ? 'text-green-400' : 'text-yellow-400'}`}>
            {appointment.paymentStatus}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-2 pt-2">
        {isPending && onStatusUpdate && (
          <div className="flex gap-2">
            <button
              onClick={() => onStatusUpdate(appointment._id, 'CONFIRMED')}
              className="flex-1 px-3 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-300 rounded-lg font-semibold text-sm transition-all border border-green-500/30"
            >
              Accept
            </button>
            <button
              onClick={() => onStatusUpdate(appointment._id, 'CANCELLED')}
              className="flex-1 px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg font-semibold text-sm transition-all border border-red-500/30"
            >
              Decline
            </button>
          </div>
        )}
        
        {appointment.status !== 'CANCELLED' && (
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => window.location.href = `/doctor/appointment/${appointment._id}/prescription`}
              className="px-3 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-300 rounded-lg font-semibold text-xs transition-all border border-green-500/30 uppercase"
            >
              Rx
            </button>
            <button
              onClick={() => window.location.href = `/doctor/appointment/${appointment._id}/notes`}
              className="px-3 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded-lg font-semibold text-xs transition-all border border-purple-500/30 uppercase"
            >
              Notes
            </button>
            <button
              onClick={() => window.location.href = `/doctor/appointment/${appointment._id}/telemedicine`}
              className="px-3 py-2 bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 rounded-lg font-semibold text-xs transition-all border border-pink-500/30 uppercase"
            >
              Call
            </button>
          </div>
        )}

        {appointment.status === 'CONFIRMED' && onComplete && (
          <button
            onClick={() => onComplete(appointment._id)}
            className="w-full px-3 py-2.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg font-semibold text-sm transition-all border border-blue-500/30 flex items-center justify-center gap-2 uppercase"
          >
            <Check size={16} weight="bold" />
            Complete Appointment
          </button>
        )}
      </div>
    </div>
  );
};

export default function PatientAppointments() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      const doctorId = user?._id || user?.id;

      if (!doctorId) {
        setMessage({ type: 'error', text: 'Doctor ID not found. Please log in again.' });
        setLoading(false);
        return;
      }

      const response = await axios.get(
        `http://localhost:4000/api/appointments/doctor/${doctorId}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setAppointments(response.data.data || []);
      }
    } catch (error: any) {
      console.error('Fetch appointments error:', error);
      setMessage({ type: 'error', text: 'Failed to load appointments' });
    } finally {
      setLoading(false);
    }
  };

  // Refresh appointments when navigating to this page
  useRefreshOnNavigate(fetchAppointments);

  useEffect(() => {
    fetchAppointments();
  }, []);

  useEffect(() => {
    filterAppointments();
  }, [appointments, searchTerm, statusFilter]);

  const filterAppointments = () => {
    let filtered = [...appointments];

    // Status filter
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(app => app.status === statusFilter);
    }

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(app => 
        (app.patientName?.toLowerCase().includes(search)) ||
        (app.reason?.toLowerCase().includes(search)) ||
        (app.specialty?.toLowerCase().includes(search))
      );
    }

    setFilteredAppointments(filtered);
  };

  const handleStatusUpdate = async (appointmentId: string, newStatus: string) => {
    try {
      const token = localStorage.getItem('authToken');
      const declineReason =
        newStatus === 'CANCELLED'
          ? window.prompt('Optional: add a reason for declining this appointment')?.trim() || ''
          : '';

      const response = await axios.put(
        `http://localhost:4000/api/appointments/${appointmentId}/doctor-status`,
        {
          status: newStatus,
          declineReason: declineReason || undefined
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setMessage({ type: 'success', text: `Appointment ${newStatus.toLowerCase()}` });
        fetchAppointments();
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: 'Failed to update appointment status' });
      console.error('Update status error:', error);
    }
  };

  const handleCompleteAppointment = async (appointmentId: string) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.patch(
        `http://localhost:4000/api/doctors/appointment/${appointmentId}/complete`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setMessage({ type: 'success', text: 'Appointment completed successfully' });
        fetchAppointments();
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Failed to complete appointment';
      setMessage({ type: 'error', text: errorMsg });
      console.error('Complete appointment error:', error);
    }
  };

  const stats = {
    total: appointments.length,
    confirmed: appointments.filter(a => a.status === 'CONFIRMED').length,
    pending: appointments.filter(a => a.status === 'PENDING_PAYMENT').length,
    completed: appointments.filter(a => a.status === 'COMPLETED').length
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/doctor/dashboard')}
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} className="text-slate-400" />
            </button>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-6 h-1 bg-blue-500 rounded-full" />
                <span className="text-[9px] font-black text-blue-500 tracking-[0.2em] uppercase italic">
                  Patient Management
                </span>
              </div>
              <h1 className="text-2xl font-black tracking-tighter text-white uppercase italic">
                Booked Appointments
              </h1>
            </div>
          </div>
        </header>

        {/* Messages */}
        {message && (
          <div className={`p-4 rounded-lg border flex items-center gap-3 ${
            message.type === 'success' 
              ? 'bg-green-500/10 border-green-500/30 text-green-300'
              : 'bg-red-500/10 border-red-500/30 text-red-300'
          }`}>
            <span className="text-sm font-semibold">{message.text}</span>
          </div>
        )}

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-slate-900/40 border border-white/5 rounded-xl p-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Total</p>
            <p className="text-2xl font-black text-white">{stats.total}</p>
          </div>
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
            <p className="text-xs font-bold text-green-400 uppercase tracking-wide mb-1">Confirmed</p>
            <p className="text-2xl font-black text-green-300">{stats.confirmed}</p>
          </div>
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
            <p className="text-xs font-bold text-yellow-400 uppercase tracking-wide mb-1">Pending</p>
            <p className="text-2xl font-black text-yellow-300">{stats.pending}</p>
          </div>
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
            <p className="text-xs font-bold text-blue-400 uppercase tracking-wide mb-1">Completed</p>
            <p className="text-2xl font-black text-blue-300">{stats.completed}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-xl p-4 space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <MagnifyingGlass size={18} className="text-slate-400" />
            <input
              type="text"
              placeholder="Search by patient name, specialty, or reason..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-2 bg-slate-800/50 border border-white/10 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 transition-all"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <FunnelSimple size={18} className="text-slate-400" />
            {['ALL', 'PENDING_PAYMENT', 'CONFIRMED', 'CANCELLED', 'COMPLETED'].map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all uppercase tracking-wide ${
                  statusFilter === status
                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                    : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {status === 'ALL' ? 'All Status' : status.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Appointments List */}
        <div className="space-y-4">
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-48 bg-slate-800/50 rounded-xl animate-pulse border border-white/5" />
              ))}
            </div>
          ) : filteredAppointments.length === 0 ? (
            <div className="text-center py-12 bg-slate-900/40 border border-white/5 rounded-xl">
              <Calendar size={48} className="text-slate-600 mx-auto mb-4" weight="light" />
              <h3 className="text-lg font-bold text-slate-300 mb-2">No Appointments Found</h3>
              <p className="text-slate-500">
                {appointments.length === 0 
                  ? 'You have no booked appointments yet.'
                  : 'No appointments match your search criteria.'}
              </p>
            </div>
          ) : (
            filteredAppointments.map(appointment => (
              <AppointmentCard
                key={appointment._id}
                appointment={appointment}
                onStatusUpdate={handleStatusUpdate}
                onViewDetail={(patientId) => navigate(`/doctor/patient/${patientId}`)}
                onComplete={handleCompleteAppointment}
              />
            ))
          )}
        </div>
      </div>
    </PageTransition>
  );
}
