import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  UserCheck,
  Calendar,
  DollarSign,
  TrendingUp,
  Activity,
  Search,
  Bell,
  ChevronRight,
  MoreVertical,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  RefreshCcw,
  Clock,
  Filter
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// --- MOCK DATA FOR UI ---
const GROWTH_DATA = [
  { name: "Jan", users: 400, revenue: 2400 },
  { name: "Feb", users: 300, revenue: 1398 },
  { name: "Mar", users: 600, revenue: 9800 },
  { name: "Apr", users: 800, revenue: 3908 },
  { name: "May", users: 1100, revenue: 4800 },
  { name: "Jun", users: 1500, revenue: 13800 },
  { name: "Jul", users: 2100, revenue: 15300 },
];

const RECENT_ACTIVITY = [
  { id: 1, type: "doctor", message: "Dr. Sarah Smith verified by Admin", time: "2 mins ago", color: "text-blue-400", icon: ShieldCheck },
  { id: 2, type: "user", message: "New patient registration: John Doe", time: "15 mins ago", color: "text-purple-400", icon: Users },
  { id: 3, type: "app", message: "Appointment #BK-882 confirmed", time: "1 hour ago", color: "text-cyan-400", icon: Calendar },
  { id: 4, type: "payment", message: "Revenue milestone reached: $50k", time: "3 hours ago", color: "text-emerald-400", icon: DollarSign },
];

// --- COMPONENTS ---

const GlassCard = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <div className={`relative overflow-hidden rounded-3xl bg-white/[0.03] backdrop-blur-2xl border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] ${className}`}>
    {children}
  </div>
);

const StatCard = ({ title, value, icon: Icon, trend, color, delay = 0 }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.5, ease: "easeOut" }}
    whileHover={{ y: -8, transition: { duration: 0.2 } }}
    className="group"
  >
    <GlassCard className="p-6 h-full transition-all duration-300 group-hover:border-white/20">
      <div className={`absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br ${color} opacity-10 blur-3xl group-hover:opacity-20 transition-opacity`} />
      
      <div className="flex justify-between items-start mb-6">
        <div className={`p-4 rounded-2xl bg-gradient-to-br ${color} shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform duration-300`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold bg-emerald-400/10 px-3 py-1.5 rounded-full border border-emerald-400/20">
          <TrendingUp className="w-3.5 h-3.5" />
          {trend}
        </div>
      </div>
      
      <p className="text-slate-400 text-sm font-semibold mb-1 uppercase tracking-wider">{title}</p>
      <div className="flex items-baseline gap-2">
        <h3 className="text-3xl font-black text-white tracking-tighter">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </h3>
        <span className="text-slate-500 text-xs font-medium">this month</span>
      </div>
    </GlassCard>
  </motion.div>
);

const SkeletonCard = () => (
    <div className="animate-pulse p-6 rounded-3xl bg-white/5 border border-white/10 h-40">
        <div className="flex justify-between mb-6">
            <div className="w-12 h-12 bg-white/10 rounded-2xl"></div>
            <div className="w-16 h-6 bg-white/10 rounded-full"></div>
        </div>
        <div className="w-24 h-4 bg-white/10 rounded mb-2"></div>
        <div className="w-32 h-8 bg-white/10 rounded"></div>
    </div>
);

const FilesIcon = ({className}: {className?: string}) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width="24" 
        height="24" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className={className}
    >
        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
        <polyline points="14 2 14 8 20 8" />
    </svg>
);

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDoctors: 0,
    pendingDoctorVerifications: 0,
    revenue: 0,
  });
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    const token = localStorage.getItem("authToken");
    try {
      const [statsRes, doctorsRes] = await Promise.all([
        axios.get("http://localhost:4000/api/admin/stats", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get("http://localhost:4000/api/admin/doctors", {
          headers: { Authorization: `Bearer ${token}` },
        })
      ]);

      if (statsRes.data.success) setStats(statsRes.data.data);
      if (doctorsRes.data.success) setDoctors(doctorsRes.data.data.slice(0, 5));
      
    } catch (error) {
      toast.error("Failed to sync platform data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
    toast.info("Updating real-time stats...");
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-200 selection:bg-blue-500/30 lg:ml-60">
        <ToastContainer theme="dark" position="top-right" />
        
        <main className="max-w-[1600px] mx-auto p-4 md:p-8 space-y-8">
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 mb-10">
                <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }}>
                    <div className="flex items-center gap-3 mb-1">
                        <div className="w-2 h-8 bg-gradient-to-b from-blue-500 to-purple-600 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
                        <h1 className="text-4xl font-black text-white tracking-tighter">System Console</h1>
                    </div>
                    <p className="text-slate-500 font-medium ml-5 italic">Intelligence & Control</p>
                </motion.div>

                <div className="flex items-center gap-4 flex-wrap">
                    <div className="relative group min-w-[300px]">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input type="text" placeholder="Find patients..." className="w-full pl-12 pr-4 py-3 bg-white/[0.02] border border-white/10 rounded-2xl outline-none" />
                    </div>
                    <button onClick={handleRefresh} className={`p-3 bg-white/[0.02] border border-white/10 rounded-2xl ${refreshing ? 'animate-spin' : ''}`}><RefreshCcw className="w-5 h-5" /></button>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {loading ? [1,2,3,4].map(i => <SkeletonCard key={i} />) : (
                    <>
                        <StatCard title="Patients" value={stats.totalUsers} icon={Users} trend="+42%" color="from-blue-500 to-cyan-400" delay={0.1} />
                        <StatCard title="Medical Staff" value={stats.totalDoctors} icon={UserCheck} trend="+18%" color="from-purple-500 to-pink-500" delay={0.2} />
                        <StatCard title="Approvals" value={stats.pendingDoctorVerifications} icon={ShieldCheck} trend="Critical" color="from-orange-500 to-amber-500" delay={0.3} />
                        <StatCard title="Revenue" value={`$${stats.revenue}`} icon={DollarSign} trend="+14%" color="from-emerald-500 to-teal-500" delay={0.4} />
                    </>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-7 gap-8">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-5">
                    <GlassCard className="p-8 h-full">
                        <h3 className="text-xl font-black mb-10 flex items-center gap-2"><TrendingUp /> Growth</h3>
                        <div className="h-[400px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={GROWTH_DATA}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#fff1" vertical={false} />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip />
                                    <Area type="monotone" dataKey="revenue" stroke="#3b82f6" fill="#3b82f633" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </GlassCard>
                </motion.div>
                <div className="lg:col-span-2 space-y-4">
                  <GlassCard className="p-6">
                      <h3 className="text-lg font-black mb-6">Live Feed</h3>
                      <div className="space-y-6">
                          {RECENT_ACTIVITY.map(a => <div key={a.id} className="text-sm"><b>{a.message}</b><br/><span className="text-xs text-slate-500">{a.time}</span></div>)}
                      </div>
                  </GlassCard>
                </div>
            </div>
        </main>
    </div>
  );
};

export default AdminDashboard;
