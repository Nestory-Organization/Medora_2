import { 
  Users, 
  Clock, 
  VideoCamera,
  ArrowRight,
  ClipboardText,
  Pulse,
  Plus
} from '@phosphor-icons/react';

const StatCard = ({ icon: Icon, label, value, trend, color, trendColor }: any) => (
  <div className="bg-slate-900/40 backdrop-blur-md border border-white/5 p-6 rounded-[1.5rem] flex flex-col justify-between group hover:border-blue-500/20 transition-all duration-300 shadow-2xl">
    <div className="flex items-center justify-between mb-4">
      <div className={`p-2.5 rounded-xl ${color} bg-opacity-20 flex items-center justify-center text-white/90 shadow-lg ring-1 ring-white/10 group-hover:scale-110 transition-all duration-500`}>
        <Icon size={22} weight="duotone" />
      </div>
      <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-tight ${trendColor} bg-opacity-10 border border-${trendColor.split('-')[1]}-500/10`}>
        {trend}
      </div>
    </div>
    <div>
      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest leading-loose">{label}</p>
      <p className="text-2xl font-extrabold tracking-tight text-white mt-0.5 group-hover:text-blue-400 transition-colors uppercase italic">{value}</p>
    </div>
  </div>
);

const PatientProgressRow = ({ name, status, time, condition }: any) => (
  <div className="px-5 py-4 bg-slate-800/20 hover:bg-slate-800/40 border border-white/5 rounded-[1.25rem] group transition-all duration-300 flex items-center justify-between shadow-lg">
    <div className="flex items-center gap-4">
      <div className="w-11 h-11 rounded-full bg-slate-700/50 border-2 border-slate-700 flex items-center justify-center text-sm font-bold text-slate-400 group-hover:border-blue-500/50 group-hover:bg-blue-500/10 group-hover:text-blue-400 transition-all duration-300 uppercase">
        {name[0]}
      </div>
      <div>
        <h4 className="font-bold text-base text-white group-hover:text-blue-400/90 transition-colors">{name}</h4>
        <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest">{condition}</p>
      </div>
    </div>
    
    <div className="flex items-center gap-6">
      <div className="text-right">
        <p className="text-xs font-bold text-white flex items-center gap-1.5 justify-end">
          <Clock size={14} /> {time}
        </p>
        <p className="text-[10px] font-bold text-slate-500 mt-0.5 uppercase tracking-tight">{status}</p>
      </div>
      <button className="p-2.5 bg-slate-900 border border-white/5 rounded-xl text-slate-500 hover:bg-blue-500 hover:text-white transition-all hover:scale-110 active:scale-95 shadow-xl group/btn overflow-hidden relative">
        <div className="absolute inset-0 bg-white/10 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300" />
        <ArrowRight size={16} weight="bold" className="relative group-hover/btn:translate-x-1 transition-transform" />
      </button>
    </div>
  </div>
);

export default function DoctorDashboard() {
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;

  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between items-start gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-3 mb-2">
            <span className="w-8 h-1.5 bg-blue-500 rounded-full" />
            <span className="text-[10px] font-black text-blue-500 tracking-[0.2em] uppercase italic">Medical Intelligence</span>
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-white mb-1 leading-none uppercase italic">
            Good Morning, <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-500">Dr. {user?.lastName}</span>
          </h1>
          <p className="text-base font-bold text-slate-500 max-w-lg leading-relaxed tracking-tight">
            You have <span className="text-slate-200">8 appointments</span> scheduled for today.
          </p>
        </div>
        <div className="flex gap-3">
          <button className="px-6 py-3.5 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl font-black text-white shadow-2xl shadow-blue-500/20 hover:scale-105 transition-all active:scale-95 flex items-center gap-2.5 uppercase tracking-widest text-[11px]">
            <Plus weight="bold" size={16} />
            Set Availability
          </button>
        </div>
      </header>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={Users} label="Daily Patients" value="12" trend="+15%" color="bg-blue-500" trendColor="text-green-400" />
        <StatCard icon={Pulse} label="Consultations" value="8" trend="+12%" color="bg-indigo-500" trendColor="text-green-400" />
        <StatCard icon={VideoCamera} label="Telemedicine" value="5" trend="-2%" color="bg-teal-500" trendColor="text-red-400" />
        <StatCard icon={ClipboardText} label="Reports Done" value="28" trend="+8%" color="bg-purple-500" trendColor="text-green-400" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
        {/* Main Schedule */}
        <div className="xl:col-span-8 space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-2xl font-black tracking-tighter text-white italic uppercase flex items-center gap-4">
              Live Queue
              <span className="text-[9px] bg-blue-500 text-white font-black px-3 py-1 rounded-full not-italic tracking-widest shadow-lg shadow-blue-500/20 uppercase">Active Now</span>
            </h3>
            <button className="text-blue-400 font-extrabold text-[11px] hover:underline tracking-widest uppercase italic">Full Calendar</button>
          </div>
          
          <div className="space-y-4">
            <PatientProgressRow name="Arthur Morgan" status="Pending" time="09:15 AM" condition="POST-OP RECOVERY" />
            <PatientProgressRow name="Sadie Adler" status="Active" time="10:30 AM" condition="ROUTINE CHECKUP" />
            <PatientProgressRow name="John Marston" status="Waiting" time="11:45 AM" condition="BLOOD PRESSURE" />
          </div>
        </div>

        {/* Shortcuts/Action Center */}
        <div className="xl:col-span-4 space-y-6">
          <h3 className="text-2xl font-black tracking-tighter text-white italic uppercase px-2">Action Center</h3>
          <div className="bg-slate-900/60 border border-white/5 p-8 rounded-[2rem] space-y-8 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-[80px] -mr-12 -mt-12 group-hover:bg-blue-500/20 transition-all duration-700" />
            
            <div className="space-y-3">
              <h4 className="text-lg font-black text-slate-200 uppercase tracking-tighter italic">Quick Diagnosis</h4>
              <p className="text-sm text-slate-500 font-bold leading-relaxed tracking-tight">Upload reports to initiate AI-assisted analysis.</p>
            </div>

            <div className="grid gap-3">
              <button className="flex items-center justify-between p-4 bg-slate-800/40 border border-white/5 rounded-[1.25rem] hover:bg-slate-800 transition-all group/btn border-l-4 border-l-blue-500 hover:scale-[1.02] active:scale-[0.98]">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-lg group-hover/btn:scale-110 transition-transform">
                    <ClipboardText size={20} weight="duotone" />
                  </div>
                  <span className="font-black text-slate-200 uppercase tracking-widest text-[10px] italic">Upload Labs</span>
                </div>
                <ArrowRight size={14} weight="bold" className="text-slate-500 group-hover/btn:translate-x-1 transition-transform" />
              </button>
              
              <button className="flex items-center justify-between p-4 bg-slate-800/40 border border-white/5 rounded-[1.25rem] hover:bg-slate-800 transition-all group/btn border-l-4 border-l-indigo-500 hover:scale-[1.02] active:scale-[0.98]">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-lg group-hover/btn:scale-110 transition-transform">
                    <Users size={20} weight="duotone" />
                  </div>
                  <span className="font-black text-slate-200 uppercase tracking-widest text-[10px] italic">Patient Records</span>
                </div>
                <ArrowRight size={14} weight="bold" className="text-slate-500 group-hover/btn:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
