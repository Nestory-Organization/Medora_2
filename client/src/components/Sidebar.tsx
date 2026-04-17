import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { 
  CalendarCheck, 
  User, 
  ChatTeardropDots, 
  Files, 
  SignOut, 
  Pill,
  Bell,
  Gear,
  CirclesFour,
  Clock,
  CaretDown,
  FileText,
  VideoCamera,
  Stethoscope,
  ChartLine,
  type IconProps
} from '@phosphor-icons/react';

interface SidebarItemProps {
  to: string;
  icon: React.ForwardRefExoticComponent<IconProps & React.RefAttributes<SVGSVGElement>>;
  label: string;
  badge?: number;
  submenu?: SidebarItemProps[];
}

const SidebarItem = ({ to, icon: Icon, label, badge, submenu }: SidebarItemProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const isActive = location.pathname.startsWith(to);

  if (submenu && submenu.length > 0) {
    return (
      <div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`
            group w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all duration-300
            ${isActive 
              ? 'bg-gradient-to-r from-teal-500/20 to-blue-500/10 text-teal-400 shadow-sm border border-teal-500/20' 
              : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}
          `}
        >
          <div className="flex items-center gap-2">
            <Icon size={18} weight="duotone" className="group-hover:scale-110 transition-transform" />
            <span className="font-semibold text-[13px]">{label}</span>
          </div>
          <div className="flex items-center gap-2">
            {badge && (
              <span className="bg-teal-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                {badge}
              </span>
            )}
            <CaretDown 
              size={14} 
              weight="bold" 
              className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
            />
          </div>
        </button>
        {isOpen && (
          <div className="ml-3 mt-1 pl-3 border-l border-slate-700/50 space-y-1">
            {submenu.map((item) => (
              <SidebarItem key={item.to} {...item} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <NavLink
      to={to}
      className={({ isActive }) => `
        group flex items-center justify-between px-3 py-2 rounded-xl transition-all duration-300
        ${isActive 
          ? 'bg-gradient-to-r from-teal-500/20 to-blue-500/10 text-teal-400 shadow-sm border border-teal-500/20' 
          : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}
      `}
    >
      <div className="flex items-center gap-2">
        <Icon size={18} weight="duotone" className="group-hover:scale-110 transition-transform" />
        <span className="font-semibold text-[13px]">{label}</span>
      </div>
      {badge && (
        <span className="bg-teal-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
          {badge}
        </span>
      )}
    </NavLink>
  );
};

export default function Sidebar({ role }: { role: 'patient' | 'doctor' | 'admin' }) {
  const navigate = useNavigate();
  const userStr = localStorage.getItem('user');

  let user = null;
  try {
    user = userStr && userStr !== "undefined" ? JSON.parse(userStr) : null;
  } catch {
    user = null;
  }

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const navItems = role === 'patient' 
    ? [
        { to: '/patient/dashboard', icon: CirclesFour, label: 'Dashboard' },
      { to: '/patient/book', icon: Stethoscope, label: 'Find Your Specialist' },
        { to: '/patient/appointments', icon: CalendarCheck, label: 'My Appointments' },
        { to: '/patient/history', icon: Files, label: 'Medical History' },
        { to: '/patient/prescriptions', icon: Pill, label: 'Prescriptions' },
        { to: '/patient/upload-reports', icon: Files, label: 'Upload Reports' },
        { to: '/ai/symptom-checker', icon: ChatTeardropDots, label: 'AI Symptom Checker' },
        { to: '/ai/history', icon: Clock, label: 'Analysis History' },
        { to: '/patient/profile', icon: User, label: 'Profile' },
      ]
    : role === 'doctor' 
    ? [
        { to: '/doctor/dashboard', icon: CirclesFour, label: 'Dashboard' },
        { 
          to: '/doctor/appointments', 
          icon: CalendarCheck, 
          label: 'Patient Bookings',
          badge: 8
        },
        { 
          to: '/doctor/earnings', 
          icon: ChartLine, 
          label: 'My Earnings'
        },
        { 
          to: '/doctor/profile', 
          icon: User, 
          label: 'My Profile',
          submenu: [
            { to: '/doctor/profile', icon: User, label: 'Edit Profile' },
            { to: '/doctor/availability', icon: Clock, label: 'Set Availability' },
          ]
        },
        { 
          to: '#consultation', 
          icon: Stethoscope, 
          label: 'Consultation Tools',
          submenu: [
            { to: '/doctor/appointments', icon: CalendarCheck, label: 'All Appointments' },
            { to: '/doctor/appointments?tab=notes', icon: FileText, label: 'Add Notes' },
            { to: '/doctor/appointments?tab=prescription', icon: Pill, label: 'Add Prescription' },
            { to: '/doctor/appointments?tab=telemedicine', icon: VideoCamera, label: 'Start Telemedicine' },
          ]
        },
      ]
    : [
        { to: '/admin/dashboard', icon: CirclesFour, label: 'Dashboard' },
        { to: '/admin/earnings', icon: ChartLine, label: 'Earnings Report' },
        { to: '/admin/doctors', icon: User, label: 'Verify Doctors' },
        { to: '/admin/users', icon: User, label: 'Manage Users' },
      ];

  return (
    <aside className="w-60 h-screen fixed left-0 top-0 z-40 bg-slate-900 border-r border-white/5 flex flex-col p-4 overflow-hidden">
      {/* Logo */}
      <div className="flex items-center gap-2 mb-6 px-1">
        <div className="p-1.5 bg-gradient-to-br from-teal-400 to-blue-500 rounded-lg shadow-lg shadow-teal-500/20">
          <Pill weight="fill" size={18} className="text-white" />
        </div>
        <span className="text-lg font-bold tracking-tight text-white italic">Medora</span>
      </div>

      {/* Navigation */}
      <div className="flex-1 space-y-1 overflow-y-auto pr-1 -mr-1 custom-scrollbar">
        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-2 ml-2">Main Menu</p>
        {navItems.map((item, index) => (
          <SidebarItem key={`${item.to}-${item.label}-${index}`} to={item.to} icon={item.icon} label={item.label} badge={item.badge} submenu={item.submenu} />
        ))}
      </div>

      {/* User Card */}
      <div className="mt-auto pt-4 border-t border-white/5 space-y-2.5">
        <div className="flex items-center gap-2 p-1 group cursor-pointer">
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-teal-400 group-hover:border-teal-500/50 transition-colors">
              <User size={16} weight="duotone" />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-green-500 border-2 border-slate-900 rounded-full" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-bold text-slate-200 truncate">{user?.firstName} {user?.lastName}</p>
            <p className="text-[9px] font-medium text-slate-500 capitalize">{user?.role || role}</p>
          </div>
          <button 
            className="text-slate-500 hover:text-white transition-colors"
            title="View Notifications"
          >
            <Bell size={14} weight="duotone" />
          </button>
        </div>

        <div className="space-y-0.5">
          <button className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 transition-all font-semibold text-[13px]">
            <Gear size={18} weight="duotone" /> Settings
          </button>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-red-400/80 hover:bg-red-500/5 hover:text-red-400 transition-all font-semibold text-[13px]"
          >
            <SignOut size={18} weight="duotone" /> Logout
          </button>
        </div>
      </div>
    </aside>
  );
}
