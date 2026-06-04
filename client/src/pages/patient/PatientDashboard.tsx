import { 
  CalendarCheck, 
  FirstAid, 
  Drop, 
  Virus,
  ArrowRight,
  DotsThreeVertical,
  Plus
} from '@phosphor-icons/react';
import { usePatient } from '../../api/PatientContext';
import { useRefreshOnNavigate } from '../../hooks/useRefreshOnNavigate';
import { motion, AnimatePresence } from 'framer-motion';
import PageTransition from '../../components/PageTransition';
import { StatCardSkeleton, TableSkeleton } from '../../components/Skeleton';
import EmptyState from '../../components/EmptyState';

const StatCard = ({ icon: Icon, label, value, color }: any) => (
  <div className="bg-slate-900/40 backdrop-blur-md border border-white/5 p-4 rounded-2xl flex items-center justify-between group hover:border-teal-500/20 transition-all duration-300 shadow-xl shadow-black/5">
    <div className="flex items-center gap-3">
      <div className={`p-2 rounded-lg ${color} bg-opacity-20 flex items-center justify-center text-white/90 shadow-lg ring-1 ring-white/10 group-hover:scale-110 transition-transform`}>
        <Icon size={18} weight="duotone" />
      </div>
      <div>
        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{label}</p>
        <p className="text-xl font-bold tracking-tight text-white mt-0.5 group-hover:text-teal-400 transition-colors">{value}</p>
      </div>
    </div>
    <button title="More options" className="text-slate-600 hover:text-white transition-colors">
      <DotsThreeVertical size={18} weight="bold" />
    </button>
  </div>
);

const AppointmentCard = ({ doctor, date, time, status, type }: any) => {
  return (
    <div className="px-4 py-3 bg-slate-800/20 hover:bg-slate-800/40 border border-white/5 rounded-2xl group transition-all duration-300 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-slate-700/50 flex items-center justify-center group-hover:bg-teal-500/10 transition-colors text-slate-400 group-hover:text-teal-500">
          <CalendarCheck size={20} weight="duotone" />
        </div>
        <div>
          <h4 className="font-bold text-sm text-white group-hover:text-teal-400/90 transition-colors">Dr. {doctor}</h4>
          <p className="text-[11px] font-semibold text-slate-500 flex items-center gap-2">
            <span className="flex items-center gap-1.5"><CalendarCheck size={12} /> {date}</span>
            <span className="w-1 h-1 rounded-full bg-slate-700" />
            <span className="font-medium">{time}</span>
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="text-right flex flex-col items-end">
          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase border ${
            status === 'Upcoming' ? 'bg-teal-500/10 text-teal-400 border-teal-500/20' : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
          }`}>
            {status}
          </span>
          <p className="text-[9px] font-bold text-slate-600 mt-1 uppercase tracking-tight">{type}</p>
        </div>
        <button title="View details" className="p-2 bg-slate-800/80 rounded-lg text-slate-400 hover:bg-teal-500 hover:text-white transition-all hover:scale-105 active:scale-95 shadow-xl group/btn">
          <ArrowRight size={14} weight="bold" className="group-hover/btn:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
};

export default function PatientDashboard() {
  const { profile, appointments, loading, error, clearError, refreshProfile, refreshAppointments } = usePatient();
  
  // Refresh patient data when navigating to this page
  useRefreshOnNavigate(async () => {
    await Promise.all([refreshProfile(), refreshAppointments()]);
  });

  if (loading && !profile) {
    return (
      <PageTransition>
        <div className="space-y-8 animate-in fade-in duration-700">
          <header className="flex flex-col md:flex-row md:items-end justify-between items-start gap-6">
            <div className="space-y-3">
              <div className="h-4 w-32 bg-slate-800/50 rounded-full animate-pulse" />
              <div className="h-10 w-64 bg-slate-800/50 rounded-xl animate-pulse" />
            </div>
            <div className="h-10 w-40 bg-slate-800/50 rounded-xl animate-pulse" />
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="h-40 bg-slate-800/20 rounded-3xl animate-pulse" />
              <TableSkeleton rows={3} />
            </div>
            <div className="space-y-6">
              <div className="h-80 bg-slate-800/20 rounded-3xl animate-pulse" />
            </div>
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="space-y-8 pb-10">
      {/* Error Toast Mockup */}
      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-8 right-8 z-[100] bg-rose-500/10 border border-rose-500/20 backdrop-blur-xl p-4 rounded-2xl flex items-center gap-4 text-rose-400 shadow-2xl"
          >
            <div className="w-2 h-2 rounded-full bg-rose-500" />
            <p className="text-sm font-bold">{error}</p>
            <button onClick={clearError} className="ml-4 p-1 hover:bg-white/5 rounded-lg transition-colors">
              <DotsThreeVertical weight="bold" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between items-start gap-4">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1 h-4 bg-linear-to-b from-teal-400 to-blue-500 rounded-full" />
            <span className="text-[9px] font-bold text-teal-400 tracking-widest uppercase">Health Pulse</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white mb-0.5 leading-tight">
            Hi, {profile?.firstName || 'Patient'}! 👋
          </h1>
          <p className="text-sm font-medium text-slate-500 max-w-lg leading-relaxed">
            Your personalized health overview is ready.
          </p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-slate-800/50 border border-white/5 rounded-xl text-[13px] font-bold flex items-center gap-2 hover:bg-slate-800 transition-colors">
            Today
            <ArrowRight weight="bold" size={14} className="text-slate-500" />
          </button>
          <button className="px-4 py-2 bg-linear-to-r from-teal-400 to-blue-500 rounded-xl text-[13px] font-bold flex items-center gap-2 shadow-xl shadow-teal-500/10 hover:scale-105 transition-all text-white active:scale-95">
            <Plus weight="bold" size={14} />
            New Appointment
          </button>
        </div>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={FirstAid} label="BMI Index" value="22.5" color="bg-teal-500" />
        <StatCard icon={Drop} label="Glucose" value="4.5" color="bg-blue-500" />
        <StatCard icon={Virus} label="Cholesterol" value="120" color="bg-purple-500" />
        <StatCard icon={CalendarCheck} label="Checkup" value="2 Days" color="bg-orange-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Appointments Section */}
        <section className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-lg font-extrabold flex items-center gap-2">
              Upcoming Consultations
              <span className="text-[9px] bg-slate-800 text-slate-500 font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider">3 Total</span>
            </h3>
            <button className="text-teal-400 font-bold text-[10px] hover:underline tracking-tight uppercase">View All</button>
          </div>
          
          <div className="grid gap-3">
            {appointments && appointments.length > 0 ? (
              appointments.slice(0, 3).map((apt: any) => (
                <AppointmentCard 
                  key={apt.id || apt._id}
                  doctor={apt.doctorName || 'Unknown Doctor'}
                  date={apt.date}
                  time={apt.time}
                  status={apt.status === 'confirmed' ? 'Upcoming' : 'Pending'}
                  type={apt.type || 'General'}
                />
              ))
            ) : (
              <EmptyState 
                type="appointments"
                title="No Upcoming Consultations"
                description="Your health journey starts with your first consultation. Schedule one today to stay on top of your health."
                action={{
                  label: "Book Appointment",
                  onClick: () => console.log("Navigate to booking")
                }}
              />
            )}
          </div>
        </section>

        {/* Health Insights / Tips sidebar */}
        <section className="space-y-6">
          <h3 className="text-xl font-extrabold px-2">Daily Health Tips</h3>
          <div className="bg-linear-to-br from-teal-500/10 to-blue-500/10 border border-teal-500/20 p-6 rounded-4xl relative overflow-hidden group shadow-2xl">
            <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/10 rounded-full blur-2xl -mr-8 -mt-8 group-hover:bg-teal-500/20 transition-all duration-500" />
            <div className="relative z-10">
              <div className="p-2.5 bg-teal-500/20 rounded-xl w-fit mb-5 text-teal-400 group-hover:scale-110 transition-transform">
                <FirstAid size={24} weight="duotone" />
              </div>
              <h4 className="text-lg font-bold mb-2 text-white">Hydration Reminder</h4>
              <p className="text-xs text-slate-400 font-medium leading-relaxed mb-6">
                Drinking 8 glasses of water today can improve your metabolism and focus by up to 20%. Stay hydrated!
              </p>
              <button className="w-full py-3.5 bg-teal-500 rounded-xl font-extrabold text-white text-[10px] shadow-lg shadow-teal-500/20 hover:bg-teal-400 active:scale-[0.98] transition-all tracking-widest uppercase">
                Got It
              </button>
            </div>
          </div>
        </section>
      </div>
      </div>
    </PageTransition>
  );
}


