import { 
  CalendarCheck, 
  FirstAid, 
  Drop, 
  Virus,
  ArrowRight,
  DotsThreeVertical,
  Plus
} from '@phosphor-icons/react';
import { motion } from 'framer-motion';

const StatCard = ({ icon: Icon, label, value, color }: any) => (
  <div className="bg-slate-900/40 backdrop-blur-md border border-white/5 p-5 rounded-[1.5rem] flex items-center justify-between group hover:border-teal-500/20 transition-all duration-300 shadow-xl shadow-black/5">
    <div className="flex items-center gap-4">
      <div className={`p-3 rounded-xl ${color} bg-opacity-20 flex items-center justify-center text-white/90 shadow-lg ring-1 ring-white/10 group-hover:scale-110 transition-transform`}>
        <Icon size={22} weight="duotone" />
      </div>
      <div>
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{label}</p>
        <p className="text-2xl font-bold tracking-tight text-white mt-0.5 group-hover:text-teal-400 transition-colors">{value}</p>
      </div>
    </div>
    <button className="text-slate-600 hover:text-white transition-colors">
      <DotsThreeVertical size={20} weight="bold" />
    </button>
  </div>
);

const AppointmentCard = ({ doctor, date, time, status, type }: any) => {
  const isVideo = type === 'Video Call';
  return (
    <div className="px-5 py-4 bg-slate-800/20 hover:bg-slate-800/40 border border-white/5 rounded-[1.5rem] group transition-all duration-300 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-slate-700/50 flex items-center justify-center group-hover:bg-teal-500/10 transition-colors text-slate-400 group-hover:text-teal-500">
          <CalendarCheck size={24} weight="duotone" />
        </div>
        <div>
          <h4 className="font-bold text-base text-white group-hover:text-teal-400/90 transition-colors">Dr. {doctor}</h4>
          <p className="text-xs font-semibold text-slate-500 flex items-center gap-2">
            <span className="flex items-center gap-1.5"><CalendarCheck size={14} /> {date}</span>
            <span className="w-1 h-1 rounded-full bg-slate-700" />
            <span className="font-medium">{time}</span>
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-6">
        <div className="text-right flex flex-col items-end">
          <span className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase border ${
            status === 'Upcoming' ? 'bg-teal-500/10 text-teal-400 border-teal-500/20' : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
          }`}>
            {status}
          </span>
          <p className="text-[10px] font-bold text-slate-600 mt-1 uppercase tracking-tight">{type}</p>
        </div>
        <button className="p-3 bg-slate-800/80 rounded-xl text-slate-400 hover:bg-teal-500 hover:text-white transition-all hover:scale-105 active:scale-95 shadow-xl group/btn">
          <ArrowRight size={16} weight="bold" className="group-hover/btn:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
};

export default function PatientDashboard() {
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;

  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between items-start gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-1.5 h-6 bg-gradient-to-b from-teal-400 to-blue-500 rounded-full" />
            <span className="text-[10px] font-bold text-teal-400 tracking-widest uppercase">Health Pulse</span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white mb-1 leading-tight">
            Hi, {user?.firstName}! 👋
          </h1>
          <p className="text-base font-medium text-slate-500 max-w-lg leading-relaxed">
            Your personalized health overview is ready.
          </p>
        </div>
        <div className="flex gap-3">
          <button className="px-6 py-3.5 bg-slate-800/50 border border-white/5 rounded-xl text-sm font-bold flex items-center gap-2.5 hover:bg-slate-800 transition-colors">
            Today
            <ArrowRight weight="bold" size={16} className="text-slate-500" />
          </button>
          <button className="px-6 py-3.5 bg-gradient-to-r from-teal-400 to-blue-500 rounded-xl text-sm font-bold flex items-center gap-2.5 shadow-xl shadow-teal-500/10 hover:scale-105 transition-all text-white active:scale-95">
            <Plus weight="bold" size={16} />
            New Appointment
          </button>
        </div>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={FirstAid} label="BMI Index" value="22.5" color="bg-teal-500" />
        <StatCard icon={Drop} label="Glucose" value="4.5" color="bg-blue-500" />
        <StatCard icon={Virus} label="Cholesterol" value="120" color="bg-purple-500" />
        <StatCard icon={CalendarCheck} label="Checkup" value="2 Days" color="bg-orange-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Appointments Section */}
        <section className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xl font-extrabold flex items-center gap-3">
              Upcoming Consultations
              <span className="text-[10px] bg-slate-800 text-slate-500 font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">3 Total</span>
            </h3>
            <button className="text-teal-400 font-bold text-xs hover:underline tracking-tight uppercase">View All</button>
          </div>
          
          <div className="grid gap-3">
            <AppointmentCard 
              doctor="Emily Carter" 
              date="Feb 24, 2026" 
              time="09:00 AM" 
              status="Upcoming" 
              type="Video Call" 
            />
            <AppointmentCard 
              doctor="Marcus Wright" 
              date="Feb 28, 2026" 
              time="02:30 PM" 
              status="Upcoming" 
              type="In-Person" 
            />
          </div>
        </section>

        {/* Health Insights / Tips sidebar */}
        <section className="space-y-6">
          <h3 className="text-xl font-extrabold px-2">Daily Health Tips</h3>
          <div className="bg-gradient-to-br from-teal-500/10 to-blue-500/10 border border-teal-500/20 p-6 rounded-[2rem] relative overflow-hidden group shadow-2xl">
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
  );
}
