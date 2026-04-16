import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  UserCircle, 
  EnvelopeSimple, 
  ShieldCheck, 
  MagnifyingGlass,
  Funnel,
  ArrowClockwise,
  DotsThreeVertical,
  CheckCircle,
  XCircle,
  Stethoscope
} from '@phosphor-icons/react';
import { toast } from 'react-toastify';

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

const ManageUsers: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    const token = localStorage.getItem('authToken');
    try {
      const response = await fetch('http://localhost:4000/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setUsers(data.data || []);
      } else {
        toast.error(data.message || 'Failed to fetch users');
      }
    } catch (err) {
      toast.error('Network error: Could not reach server');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = (user.firstName + ' ' + user.lastName).toLowerCase().includes(searchTerm.toLowerCase()) || 
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <ShieldCheck size={16} weight="duotone" className="text-purple-400" />;
      case 'doctor': return <Stethoscope size={16} weight="duotone" className="text-blue-400" />;
      default: return <UserCircle size={16} weight="duotone" className="text-teal-400" />;
    }
  };

  const getRoleStyle = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'doctor': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      default: return 'bg-teal-500/10 text-teal-400 border-teal-500/20';
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-1"
        >
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 bg-teal-500/10 rounded-lg">
              <Users size={24} weight="duotone" className="text-teal-400" />
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight uppercase">Manage Users</h1>
          </div>
          <p className="text-slate-400 text-sm font-medium">Command center for all platform accounts and permissions</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3"
        >
          <div className="bg-slate-900/80 border border-white/5 px-4 py-2 rounded-2xl flex items-center gap-2">
            <div className="flex flex-col items-end">
              <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Total Users</span>
              <span className="text-xl font-black text-white leading-tight">{users.length}</span>
            </div>
          </div>
        </motion.div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 lg:grid-cols-4 gap-4"
      >
        <div className="lg:col-span-2 relative group">
          <MagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-teal-400 transition-colors" size={18} />
          <input 
            type="text"
            placeholder="Search by name, email or ID..."
            className="w-full bg-slate-900/50 border border-white/5 rounded-2xl py-3 pl-12 pr-4 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500/50 transition-all backdrop-blur-md"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="relative group">
          <Funnel className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-teal-400 transition-colors" size={18} />
          <select 
            className="w-full bg-slate-900/50 border border-white/5 rounded-2xl py-3 pl-12 pr-4 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500/50 transition-all backdrop-blur-md appearance-none"
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
          >
            <option value="all">All Roles</option>
            <option value="patient">Patients</option>
            <option value="doctor">Doctors</option>
            <option value="admin">Admins</option>
          </select>
        </div>

        <button 
          onClick={fetchUsers}
          disabled={loading}
          className="bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white font-bold rounded-2xl py-3 px-6 text-sm flex items-center justify-center gap-2 border border-white/5 transition-all active:scale-95"
        >
          <ArrowClockwise className={loading ? 'animate-spin' : ''} size={18} weight="bold" />
          {loading ? 'SYNCING...' : 'REFRESH DATA'}
        </button>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-slate-900/40 border border-white/5 rounded-[32px] overflow-hidden backdrop-blur-2xl shadow-2xl relative"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 via-transparent to-blue-500/5 pointer-events-none" />
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02]">
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Profile & Identity</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">System Role</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Account Status</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Registration</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              <AnimatePresence mode="popLayout">
                {filteredUsers.length === 0 ? (
                  <motion.tr 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-transparent"
                  >
                    <td colSpan={5} className="px-8 py-20 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="p-4 bg-slate-800/50 rounded-full">
                          <Users size={32} className="text-slate-600" />
                        </div>
                        <p className="text-slate-500 text-sm font-medium italic">No users matching your search criteria...</p>
                      </div>
                    </td>
                  </motion.tr>
                ) : (
                  filteredUsers.map((user, idx) => (
                    <motion.tr 
                      key={user._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      className="group hover:bg-white/[0.03] transition-all duration-300 cursor-default"
                    >
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 flex items-center justify-center text-teal-400 font-black text-lg shadow-inner overflow-hidden group-hover:scale-105 transition-transform">
                              {user.firstName[0]}{user.lastName[0]}
                            </div>
                            <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-slate-900 ${user.isActive ? 'bg-emerald-500' : 'bg-slate-600'}`} />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-white font-bold text-sm tracking-tight">{user.firstName} {user.lastName}</span>
                            <span className="text-slate-500 text-xs font-medium flex items-center gap-1.5">
                              <EnvelopeSimple size={12} weight="bold" />
                              {user.email}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex justify-center">
                          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border ${getRoleStyle(user.role)} text-[10px] font-black uppercase tracking-widest`}>
                            {getRoleIcon(user.role)}
                            {user.role}
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex justify-center">
                          {user.isActive ? (
                            <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-[11px]">
                              <CheckCircle size={16} weight="fill" />
                              ACTIVE
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 text-slate-500 font-bold text-[11px]">
                              <XCircle size={16} weight="fill" />
                              DISABLED
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex flex-col items-center">
                          <span className="text-slate-300 font-bold text-[11px]">
                            {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                          <span className="text-slate-600 text-[9px] font-black uppercase">
                            {new Date(user.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <button className="p-2 hover:bg-white/5 rounded-xl text-slate-500 hover:text-white transition-all active:scale-90">
                          <DotsThreeVertical size={24} weight="bold" />
                        </button>
                      </td>
                    </motion.tr>
                  ))
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
};

export default ManageUsers;
