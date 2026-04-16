import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  UserCheck,
  DollarSign,
  TrendingUp,
  Activity,
  Search,
  ShieldCheck,
  RefreshCcw,
  Clock,
  ArrowRight,
  Zap,
  Cpu,
  Globe,
  MoreVertical,
  Bell,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell
} from "recharts";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// --- ENHANCED MOCK DATA ---
const GROWTH_DATA = [
  { name: "00:00", users: 400, revenue: 2400 },
  { name: "04:00", users: 300, revenue: 1398 },
  { name: "08:00", users: 600, revenue: 9800 },
  { name: "12:00", users: 800, revenue: 3908 },
  { name: "16:00", users: 1100, revenue: 4800 },
  { name: "20:00", users: 1500, revenue: 13800 },
  { name: "23:59", users: 2100, revenue: 15300 },
];

const DISTRIBUTION_DATA = [
  { category: "Cardiology", value: 45, color: "#3b82f6" },
  { category: "Neurology", value: 32, color: "#8b5cf6" },
  { category: "Pediatrics", value: 28, color: "#ec4899" },
  { category: "General", value: 55, color: "#10b981" },
];

const RECENT_ACTIVITY = [
  { id: 1, type: "success", message: "Kernel: Dr. Sarah Smith verified", time: "2m ago", icon: CheckCircle2 },
  { id: 2, type: "info", message: "Inbound: New patient registration", time: "15m ago", icon: Zap },
  { id: 3, type: "warning", message: "System: High latency on Auth node", time: "1h ago", icon: AlertCircle },
  { id: 4, type: "success", message: "Revenue: Milestone $50k reached", time: "3h ago", icon: DollarSign },
];

// --- COMPONENTS ---

const DashboardCard = ({ children, className = "", title = "", subtitle = "", action = null }: { 
  children: React.ReactNode, 
  className?: string, 
  title?: string, 
  subtitle?: string,
  action?: React.ReactNode 
}) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className={`group relative overflow-hidden rounded-[2.5rem] bg-[#0a0f18] border border-white/5 hover:border-blue-500/30 transition-all duration-500 ${className}`}
  >
    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
    <div className="relative p-8 h-full flex flex-col">
      {(title || subtitle || action) && (
        <div className="flex justify-between items-start mb-8">
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">{title}</h3>
            <p className="text-slate-500 text-[10px] uppercase font-black tracking-widest mt-1">{subtitle}</p>
          </div>
          {action}
        </div>
      )}
      {children}
    </div>
  </motion.div>
);

interface StatDisplayProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
  trend: string;
  isPositive: boolean;
  color: string;
}

const StatDisplay = ({ label, value, icon: Icon, trend, isPositive, color }: StatDisplayProps) => (
  <div className="relative flex-1 group">
    <div className={`absolute -inset-1 rounded-3xl blur-xl opacity-0 group-hover:opacity-20 transition-opacity duration-500 bg-gradient-to-r ${color}`} />
    <div className="relative p-6 rounded-[2rem] bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-2xl bg-gradient-to-br ${color} shadow-lg shadow-black/20`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div className={`flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-lg ${isPositive ? 'text-emerald-400 bg-emerald-400/10' : 'text-rose-400 bg-rose-400/10'}`}>
          {isPositive ? '+' : '-'}{trend}
        </div>
      </div>
      <div>
        <p className="text-slate-500 text-[10px] uppercase font-bold tracking-[0.2em] mb-1">{label}</p>
        <h4 className="text-2xl font-black text-white tracking-tighter">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </h4>
      </div>
    </div>
  </div>
);

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDoctors: 0,
    pendingDoctorVerifications: 0,
    revenue: 0,
  });
  const [activeTab, setActiveTab] = useState("revenue");

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    const token = localStorage.getItem("authToken");
    try {
      const statsRes = await axios.get("http://localhost:4000/api/admin/stats", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (statsRes.data.success) setStats(statsRes.data.data);
    } catch {
      toast.error("Telemetry link failed - Retrying protocol");
    }
  };

  return (
    <div className="">
      <ToastContainer theme="dark" position="bottom-right" />
      
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-600/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-purple-600/5 blur-[120px] rounded-full translate-y-1/3 -translate-x-1/3" />
      </div>

      <main className="relative w-full px-6 py-8 md:px-12 md:py-12 space-y-12">
        {/* Navigation / Top Bar */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8 bg-white/[0.02] border border-white/5 p-6 rounded-[2.5rem] backdrop-blur-xl">
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500 blur-md opacity-20 animate-pulse" />
              <div className="relative p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl">
                <Cpu className="w-8 h-8 text-blue-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <h1 className="text-2xl font-black text-white uppercase tracking-tighter">Command Center</h1>
              </div>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.2em]">Deployment: Production-Alpha-09</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="relative group overflow-hidden bg-white/[0.03] border border-white/5 rounded-2xl flex items-center px-4 py-3 focus-within:border-blue-500/40 transition-all w-full md:w-80">
              <Search className="w-4 h-4 text-slate-500 group-focus-within:text-blue-400" />
              <input 
                type="text" 
                placeholder="Query system files..." 
                className="bg-transparent border-none outline-none text-sm ml-3 w-full text-slate-200 placeholder:text-slate-600 font-medium"
              />
            </div>
            <button className="relative p-3.5 bg-white/[0.03] border border-white/5 rounded-2xl hover:bg-white/[0.06] transition-all text-slate-400 hover:text-white">
              <Bell className="w-5 h-5" />
              <span className="absolute top-3.5 right-3.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-[#05070a]" />
            </button>
            <button className="flex items-center gap-2 px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold uppercase tracking-widest text-[10px] transition-all shadow-lg shadow-blue-600/20">
              <RefreshCcw className="w-3.5 h-3.5" /> Initialize Sync
            </button>
          </div>
        </div>

        {/* Core Metrics Visualizer */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatDisplay label="Patient Node" value={stats.totalUsers} icon={Users} trend="12%" isPositive={true} color="from-blue-600 to-indigo-600" />
          <StatDisplay label="Medical Link" value={stats.totalDoctors} icon={UserCheck} trend="8%" isPositive={true} color="from-purple-600 to-violet-600" />
          <StatDisplay label="Audit Queue" value={stats.pendingDoctorVerifications} icon={ShieldCheck} trend="High" isPositive={false} color="from-orange-600 to-amber-600" />
          <StatDisplay label="Gross Revenue" value={`$${stats.revenue}`} icon={DollarSign} trend="22%" isPositive={true} color="from-emerald-600 to-teal-600" />
        </div>

        {/* Primary Data Grids */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Visualizer */}
          <DashboardCard 
            className="lg:col-span-8" 
            title="Telemetry Stream" 
            subtitle="Real-time Network Velocity"
            action={
              <div className="flex bg-white/5 p-1 rounded-xl">
                {["revenue", "users"].map((tab) => (
                  <button 
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            }
          >
            <div className="h-[400px] w-full mt-auto">
              <ResponsiveContainer width="99%" height="100%">
                <AreaChart data={GROWTH_DATA} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorWave" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#fff1" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 10, fontWeight: 800}} dy={15} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 10, fontWeight: 800}} />
                  <Tooltip 
                    cursor={{ stroke: '#3b82f6', strokeWidth: 2 }}
                    contentStyle={{ backgroundColor: '#0a0f18', border: '1px solid rgba(59,130,246,0.3)', borderRadius: '20px', padding: '16px' }}
                    itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: '900' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey={activeTab === 'revenue' ? "revenue" : "users"} 
                    stroke="#3b82f6" 
                    strokeWidth={4} 
                    fillOpacity={1} 
                    fill="url(#colorWave)" 
                    animationDuration={2000}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </DashboardCard>

          {/* Side Module: System Intel */}
          <div className="lg:col-span-4 space-y-8 flex flex-col">
            <DashboardCard title="Sector Load" subtitle="Consultation Distribution" className="flex-1">
              <div className="h-[200px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={DISTRIBUTION_DATA} layout="vertical" margin={{ left: -20 }}>
                    <XAxis type="number" hide />
                    <YAxis dataKey="category" type="category" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 700}} width={80} />
                    <Bar dataKey="value" radius={[0, 10, 10, 0]} barSize={20}>
                      {DISTRIBUTION_DATA.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-8 space-y-4">
                {DISTRIBUTION_DATA.map((item) => (
                  <div key={item.category} className="flex justify-between items-center bg-white/[0.02] p-3 rounded-xl border border-white/5">
                    <span className="text-xs font-bold text-slate-400">{item.category}</span>
                    <span className="text-sm font-black text-white">{item.value}%</span>
                  </div>
                ))}
              </div>
            </DashboardCard>
          </div>
        </div>

        {/* Secondary Modules */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Signal Feed */}
          <DashboardCard title="Uplink Activity" subtitle="Real-time Event Log" className="xl:col-span-2">
            <div className="space-y-4">
              {RECENT_ACTIVITY.map((activity, idx) => (
                <div key={activity.id} className="flex items-center justify-between p-4 bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 rounded-2xl transition-all group cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${activity.type === 'success' ? 'bg-emerald-500/10 text-emerald-400' : activity.type === 'warning' ? 'bg-orange-500/10 text-orange-400' : 'bg-blue-500/10 text-blue-400'}`}>
                      <activity.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-200">{activity.message}</p>
                      <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-0.5">{activity.time}</p>
                    </div>
                  </div>
                  <button className="opacity-0 group-hover:opacity-100 p-2 hover:bg-white/10 rounded-lg transition-all">
                    <MoreVertical className="w-4 h-4 text-slate-500" />
                  </button>
                </div>
              ))}
            </div>
          </DashboardCard>

          {/* Quick Actions / Status */}
          <DashboardCard title="Hardware Status" subtitle="Global Node Integrity" className="bg-gradient-to-br from-[#1e3a8a]/10 to-transparent">
            <div className="space-y-6">
              {[
                { label: "Auth Gateway", status: "Active", ping: "24ms", color: "#10b981" },
                { label: "Patient Database", status: "Nominal", ping: "8ms", color: "#10b981" },
                { label: "Payment API", status: "Maintenance", ping: "--", color: "#f59e0b" },
              ].map((node) => (
                <div key={node.label} className="flex items-center gap-4">
                  <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: node.color }} />
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-bold text-slate-300">{node.label}</span>
                      <span className="text-[10px] font-black tracking-widest text-slate-500 uppercase">{node.ping}</span>
                    </div>
                    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: node.status === 'Active' ? '100%' : '60%' }} className="h-full" style={{ backgroundColor: node.color, opacity: 0.3 }} />
                    </div>
                  </div>
                </div>
              ))}
              
              <div className="pt-6">
                <button 
                  onClick={() => window.location.href = '/admin/verify-doctors'}
                  className="w-full flex items-center justify-between p-5 bg-blue-600/10 border border-blue-500/20 hover:bg-blue-500/20 rounded-3xl transition-all group"
                >
                  <div className="flex items-center gap-4 text-left">
                    <div className="p-3 bg-blue-400/10 rounded-xl">
                      <ShieldCheck className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                      <span className="block text-sm font-black text-white uppercase tracking-tight">Audit Portal</span>
                      <span className="text-[10px] font-bold text-blue-400/60 uppercase">Manual Override Required</span>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-blue-400 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </DashboardCard>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;

