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

// Mock data for initial UI
const GROWTH_DATA = [
  { name: "Jan", users: 400, revenue: 2400 },
  { name: "Feb", users: 300, revenue: 1398 },
  { name: "Mar", users: 200, revenue: 9800 },
  { name: "Apr", users: 278, revenue: 3908 },
  { name: "May", users: 189, revenue: 4800 },
  { name: "Jun", users: 239, revenue: 3800 },
  { name: "Jul", users: 349, revenue: 4300 },
];

const RECENT_ACTIVITY = [
  { id: 1, type: "doctor", message: "Dr. Sarah Smith verified by Admin", time: "2 mins ago", color: "text-blue-400" },
  { id: 2, type: "user", message: "New patient registration: John Doe", time: "15 mins ago", color: "text-purple-400" },
  { id: 3, type: "app", message: "Appointment #BK-882 confirmed", time: "1 hour ago", color: "text-cyan-400" },
  { id: 4, type: "payment", message: "Revenue milestone reached: $50k", time: "3 hours ago", color: "text-emerald-400" },
];

const StatCard = ({ title, value, icon: Icon, trend, color }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ y: -5 }}
    className="relative overflow-hidden p-6 rounded-2xl bg-white/10 dark:bg-slate-900/50 backdrop-blur-xl border border-white/10 shadow-xl group"
  >
    <div className={`absolute top-0 right-0 p-3 bg-gradient-to-br ${color} opacity-10 rounded-bl-3xl group-hover:opacity-20 transition-opacity`} />
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-xl bg-gradient-to-br ${color} shadow-lg shadow-blue-500/20`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div className="flex items-center gap-1 text-emerald-400 text-xs font-semibold bg-emerald-400/10 px-2 py-1 rounded-full">
        <TrendingUp className="w-3 h-3" />
        {trend}
      </div>
    </div>
    <h3 className="text-slate-400 text-sm font-medium mb-1">{title}</h3>
    <p className="text-2xl font-bold text-white tracking-tight">{value}</p>
  </motion.div>
);

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDoctors: 0,
    pendingVerifications: 0,
    revenue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem("authToken");
        const response = await axios.get("http://localhost:4000/api/admin/stats", {
          headers: { Authorization: `Bearer \${token}` },
        });
        if (response.data.success) {
          setStats(response.data.data);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard stats", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 p-6 lg:ml-60 transition-all duration-300">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-3xl font-bold bg-gradient-to-r from-white to-slate-500 bg-clip-text text-transparent"
          >
            Insights Overview
          </motion.h1>
          <p className="text-slate-500 text-sm">Welcome back, Platform Administrator</p>
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search reports..." 
              className="w-full pl-10 pr-4 py-2 bg-slate-900/50 border border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
            />
          </div>
          <button className="relative p-2 bg-slate-900/50 border border-white/10 rounded-xl hover:bg-slate-800 transition-colors">
            <Bell className="w-5 h-5 text-slate-400" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-[#0f172a]" />
          </button>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard 
          title="Total Platform Users" 
          value={loading ? "..." : stats.totalUsers} 
          icon={Users} 
          trend="+12%" 
          color="from-blue-500 to-cyan-400"
        />
        <StatCard 
          title="Physicians Onboard" 
          value={loading ? "..." : stats.totalDoctors} 
          icon={UserCheck} 
          trend="+5%" 
          color="from-purple-500 to-indigo-400"
        />
        <StatCard 
          title="Pending Verifications" 
          value={loading ? "..." : stats.pendingDoctorVerifications} 
          icon={Activity} 
          trend="Action Required" 
          color="from-orange-500 to-amber-400"
        />
        <StatCard 
          title="Platform Revenue" 
          value={loading ? "..." : \`$\${stats.revenue.toLocaleString()}\`} 
          icon={DollarSign} 
          trend="+22%" 
          color="from-emerald-500 to-teal-400"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="lg:col-span-2 p-6 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 shadow-xl"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-400" />
              Growth Analytics
            </h2>
            <select className="bg-slate-900/50 border border-white/10 text-xs py-1 px-3 rounded-lg outline-none cursor-pointer">
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
            </select>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={GROWTH_DATA}>
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #ffffff10', borderRadius: '12px' }}
                  itemStyle={{ color: '#f1f5f9' }}
                />
                <Area type="monotone" dataKey="users" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorUsers)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Sidebar Activity */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="p-6 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 shadow-xl flex flex-col"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Recent Activity</h2>
            <button className="text-blue-400 text-sm hover:underline">View All</button>
          </div>
          <div className="space-y-6 flex-1">
            {RECENT_ACTIVITY.map((activity) => (
              <div key={activity.id} className="flex gap-4 group cursor-pointer">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-slate-800 border border-white/5 flex items-center justify-center group-hover:bg-slate-700 transition-colors">
                    <Activity className={`w-4 h-4 \${activity.color}`} />
                  </div>
                  {activity.id !== RECENT_ACTIVITY.length && (
                    <div className="absolute top-10 left-1/2 -underline-x-1/2 w-[1px] h-6 bg-slate-800" />
                  )}
                </div>
                <div>
                  <p className="text-sm text-slate-200 leading-tight mb-1">{activity.message}</p>
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 pt-6 border-t border-white/5">
            <div className="p-4 rounded-xl bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-blue-500/20">
              <p className="text-sm font-bold text-blue-300 mb-1">System Status</p>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                All services operational
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Secondary Chart Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 shadow-xl"
        >
          <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-400" />
            Revenue Distribution
          </h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={GROWTH_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <YAxis hide />
                <Tooltip 
                  cursor={{fill: '#ffffff05'}}
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #ffffff10', borderRadius: '12px' }}
                />
                <Bar dataKey="revenue" fill="#10b981" radius={[6, 6, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 shadow-xl"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold">Top Verified Clinicians</h2>
            <ChevronRight className="w-5 h-5 text-slate-500" />
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/5">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-400 to-purple-500 p-[2px]">
                    <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center font-bold text-xs">
                      DR
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-bold">Dr. Alexander Pierce</p>
                    <p className="text-xs text-slate-500">Neurology • 12 years exp.</p>
                  </div>
                </div>
                <div className="text-right text-xs">
                  <p className="text-emerald-400 font-bold">Verified</p>
                  <p className="text-slate-500">2h ago</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminDashboard;