import { 
  Users, 
  Clock, 
  VideoCamera,
  ArrowRight,
  ClipboardText,
  Pulse,
  Plus,
  UserCircle,
  Calendar
} from '@phosphor-icons/react';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getAppointments } from '../../api/doctor';
import { useRefreshOnNavigate } from '../../hooks/useRefreshOnNavigate';
import type { Appointment } from '../../api/doctor';

const StatCard = ({ icon: Icon, label, value, trend, color, trendColor }: any) => (
  <div className="bg-slate-900/40 backdrop-blur-md border border-white/5 p-4 rounded-2xl flex flex-col justify-between group hover:border-blue-500/20 transition-all duration-300 shadow-2xl">
    <div className="flex items-center justify-between mb-3">
      <div className={`p-2 rounded-lg ${color} bg-opacity-20 flex items-center justify-center text-white/90 shadow-lg ring-1 ring-white/10 group-hover:scale-110 transition-all duration-500`}>
        <Icon size={18} weight="duotone" />
      </div>
      <div className={`px-2 py-0.5 rounded-full text-[9px] font-bold tracking-tight ${trendColor} bg-opacity-10 border border-white/5`}>
        {trend}
      </div>
    </div>
    <div>
      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-loose">{label}</p>
      <p className="text-xl font-extrabold tracking-tight text-white mt-0.5 group-hover:text-blue-400 transition-colors uppercase italic">{value}</p>
    </div>
  </div>
);

const PatientProgressRow = ({ name, status, time, condition }: any) => (
  <div className="px-4 py-3 bg-slate-800/20 hover:bg-slate-800/40 border border-white/5 rounded-xl group transition-all duration-300 flex items-center justify-between shadow-lg">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-slate-700/50 border-2 border-slate-700 flex items-center justify-center text-xs font-bold text-slate-400 group-hover:border-blue-500/50 group-hover:bg-blue-500/10 group-hover:text-blue-400 transition-all duration-300 uppercase">
        {name[0]}
      </div>
      <div>
        <h4 className="font-bold text-sm text-white group-hover:text-blue-400/90 transition-colors">{name}</h4>
        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">{condition}</p>
      </div>
    </div>
    
    <div className="flex items-center gap-4">
      <div className="text-right">
        <p className="text-[11px] font-bold text-white flex items-center gap-1.5 justify-end">
          <Clock size={12} /> {time}
        </p>
        <p className="text-[9px] font-bold text-slate-500 mt-0.5 uppercase tracking-tight">{status}</p>
      </div>
      <button className="p-2 bg-slate-900 border border-white/5 rounded-lg text-slate-500 hover:bg-blue-500 hover:text-white transition-all hover:scale-110 active:scale-95 shadow-xl group/btn overflow-hidden relative">
        <div className="absolute inset-0 bg-white/10 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300" />
        <ArrowRight size={14} weight="bold" className="relative group-hover/btn:translate-x-1 transition-transform" />
      </button>
    </div>
  </div>
);

export default function DoctorDashboard() {
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const navigate = useNavigate();
  
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getAppointments();
      
      if (response.success) {
        // Filter and sort appointments - get today's and upcoming
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        const filteredAppointments = response.data
          .filter((apt: Appointment) => {
            const aptDate = new Date(apt.appointmentDate);
            return aptDate >= todayStart && apt.status !== 'cancelled' && apt.status !== 'rejected';
          })
          .sort((a: Appointment, b: Appointment) => {
            const dateA = new Date(a.appointmentDate);
            const dateB = new Date(b.appointmentDate);
            return dateA.getTime() - dateB.getTime();
          })
          .slice(0, 10); // Get first 10 upcoming appointments
        
        setAppointments(filteredAppointments);
      } else {
        setError(response.message || 'Failed to fetch appointments');
        setAppointments([]);
      }
    } catch (err: any) {
      console.error('Error fetching appointments:', err);
      setError(err.response?.data?.message || 'Failed to fetch appointments');
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  // Refresh appointments when navigating to this page
  useRefreshOnNavigate(fetchAppointments);

  useEffect(() => {
    if (user) {
      fetchAppointments();
    }
  }, [user]);

  // Calculate statistics from appointments
  const getTodayAppointments = () => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
    
    return appointments.filter(apt => {
      const aptDate = new Date(apt.appointmentDate);
      return aptDate >= todayStart && aptDate < todayEnd;
    });
  };

  const todayAppointments = getTodayAppointments();
  const totalAppointments = appointments.length;
  const completedAppointments = appointments.filter(apt => apt.status === 'completed').length;
  const activeAppointments = appointments.filter(apt => apt.status === 'accepted' || apt.status === 'pending').length;

  // Format time from HH:MM format
  const formatTime = (timeStr: string) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'PENDING';
      case 'accepted':
        return 'ACTIVE';
      case 'completed':
        return 'COMPLETED';
      case 'rejected':
        return 'REJECTED';
      case 'cancelled':
        return 'CANCELLED';
      default:
        return status.toUpperCase();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between items-start gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-6 h-1 bg-blue-500 rounded-full" />
            <span className="text-[9px] font-black text-blue-500 tracking-[0.2em] uppercase italic">Medical Intelligence</span>
          </div>
          <h1 className="text-2xl font-black tracking-tighter text-white mb-0.5 leading-none uppercase italic">
            Good Morning, <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-500">Dr. {user?.lastName}</span>
          </h1>
          <p className="text-sm font-bold text-slate-500 max-w-lg leading-relaxed tracking-tight">
            You have <span className="text-slate-200">{todayAppointments.length} appointments</span> scheduled for today.
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => navigate('/doctor/profile')}
            className="px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl font-black text-white shadow-2xl shadow-indigo-500/20 hover:scale-105 transition-all active:scale-95 flex items-center gap-2 uppercase tracking-widest text-[10px]"
          >
            <UserCircle weight="bold" size={14} />
            My Profile
          </button>
          <button 
            onClick={() => navigate('/doctor/appointments')}
            className="px-4 py-2.5 bg-gradient-to-r from-teal-500 to-cyan-600 rounded-xl font-black text-white shadow-2xl shadow-teal-500/20 hover:scale-105 transition-all active:scale-95 flex items-center gap-2 uppercase tracking-widest text-[10px]"
          >
            <Calendar weight="bold" size={14} />
            Appointments
          </button>
          <button 
            onClick={() => navigate('/doctor/availability')}
            className="px-4 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl font-black text-white shadow-2xl shadow-blue-500/20 hover:scale-105 transition-all active:scale-95 flex items-center gap-2 uppercase tracking-widest text-[10px]"
          >
            <Plus weight="bold" size={14} />
            Set Availability
          </button>
        </div>
      </header>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Appointments" value={totalAppointments.toString()} trend={`+${totalAppointments}%`} color="bg-blue-500" trendColor="text-green-400" />
        <StatCard icon={Pulse} label="Active Appointments" value={activeAppointments.toString()} trend={`${activeAppointments > 0 ? '+' : ''}${Math.round((activeAppointments/totalAppointments || 0)*100)}%`} color="bg-indigo-500" trendColor={activeAppointments > 0 ? "text-green-400" : "text-red-400"} />
        <StatCard icon={VideoCamera} label="Today's Queue" value={todayAppointments.length.toString()} trend={`${todayAppointments.length} due`} color="bg-teal-500" trendColor="text-blue-400" />
        <StatCard icon={ClipboardText} label="Completed" value={completedAppointments.toString()} trend={`${completedAppointments > 0 ? '+' : ''}${Math.round((completedAppointments/totalAppointments || 0)*100)}%`} color="bg-purple-500" trendColor="text-green-400" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Main Schedule */}
        <div className="xl:col-span-8 space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-lg font-black tracking-tighter text-white italic uppercase flex items-center gap-3">
              Live Queue
              <span className="text-[8px] bg-blue-500 text-white font-black px-2 py-0.5 rounded-full not-italic tracking-widest shadow-lg shadow-blue-500/20 uppercase">
                {todayAppointments.length} Active
              </span>
            </h3>
            <button onClick={() => navigate('/doctor/appointments')} className="text-blue-400 font-extrabold text-[10px] hover:underline tracking-widest uppercase italic">
              Full Calendar
            </button>
          </div>
          
          <div className="space-y-3">
            {loading ? (
              <div className="text-center py-8">
                <p className="text-slate-400 font-bold">Loading appointments...</p>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <p className="text-red-400 font-bold">{error}</p>
              </div>
            ) : todayAppointments.length > 0 ? (
              todayAppointments.map((apt) => (
                <PatientProgressRow
                  key={apt._id}
                  name={apt.patientName || 'Unknown Patient'}
                  status={getStatusColor(apt.status)}
                  time={formatTime(apt.startTime)}
                  condition={apt.reason || apt.specialty || 'GENERAL CHECKUP'}
                />
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-slate-400 font-bold">No appointments scheduled for today</p>
              </div>
            )}
          </div>
        </div>

        {/* Shortcuts/Action Center */}
        <div className="xl:col-span-4 space-y-4">
          <h3 className="text-lg font-black tracking-tighter text-white italic uppercase px-1">Action Center</h3>
          <div className="bg-slate-900/60 border border-white/5 p-6 rounded-3xl space-y-6 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-[60px] -mr-10 -mt-10 group-hover:bg-blue-500/20 transition-all duration-700" />
            
            <div className="space-y-2">
              <h4 className="text-base font-black text-slate-200 uppercase tracking-tighter italic">Quick Diagnosis</h4>
              <p className="text-xs text-slate-500 font-bold leading-relaxed tracking-tight">Upload reports for AI analysis.</p>
            </div>

            <div className="grid gap-2">
              <button 
                onClick={() => navigate('/doctor/profile')}
                className="flex items-center justify-between p-3.5 bg-slate-800/40 border border-white/5 rounded-2xl hover:bg-slate-800 transition-all group/btn border-l-4 border-l-indigo-500 hover:scale-[1.02] active:scale-[0.98]"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg group-hover/btn:scale-110 transition-transform">
                    <UserCircle size={18} weight="duotone" />
                  </div>
                  <span className="font-black text-slate-200 uppercase tracking-widest text-[9px] italic">My Profile</span>
                </div>
                <ArrowRight size={12} weight="bold" className="text-slate-500 group-hover/btn:translate-x-1 transition-transform" />
              </button>

              <button 
                onClick={() => navigate('/doctor/appointments')}
                className="flex items-center justify-between p-3.5 bg-slate-800/40 border border-white/5 rounded-2xl hover:bg-slate-800 transition-all group/btn border-l-4 border-l-teal-500 hover:scale-[1.02] active:scale-[0.98]"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-teal-500/10 text-teal-400 rounded-lg group-hover/btn:scale-110 transition-transform">
                    <Calendar size={18} weight="duotone" />
                  </div>
                  <span className="font-black text-slate-200 uppercase tracking-widest text-[9px] italic">Patient Bookings</span>
                </div>
                <ArrowRight size={12} weight="bold" className="text-slate-500 group-hover/btn:translate-x-1 transition-transform" />
              </button>
              
              <button className="flex items-center justify-between p-3.5 bg-slate-800/40 border border-white/5 rounded-2xl hover:bg-slate-800 transition-all group/btn border-l-4 border-l-blue-500 hover:scale-[1.02] active:scale-[0.98]">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg group-hover/btn:scale-110 transition-transform">
                    <ClipboardText size={18} weight="duotone" />
                  </div>
                  <span className="font-black text-slate-200 uppercase tracking-widest text-[9px] italic">Upload Labs</span>
                </div>
                <ArrowRight size={12} weight="bold" className="text-slate-500 group-hover/btn:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
