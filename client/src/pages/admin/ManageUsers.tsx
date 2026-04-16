import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  MagnifyingGlass,
  ArrowClockwise,
  Trash,
  Prohibit,
  Check,
  CaretLeft,
  CaretRight
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

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  actionLabel: string;
  actionColor: string;
  onAction: () => void;
  loading?: boolean;
}

const Modal = ({ isOpen, onClose, title, children, actionLabel, actionColor, onAction, loading }: ModalProps) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-md bg-slate-900 border border-white/10 rounded-[32px] p-8 shadow-2xl overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-teal-500/50 to-transparent" />
        <h3 className="text-xl font-black text-white mb-2 uppercase tracking-tight">{title}</h3>
        <div className="text-slate-400 text-sm mb-8 leading-relaxed">
          {children}
        </div>
        <div className="flex gap-3 mt-4">
          <button 
            onClick={onClose}
            className="flex-1 px-6 py-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-2xl transition-all uppercase text-[11px] tracking-widest"
          >
            Cancel
          </button>
          <button 
            onClick={onAction}
            disabled={loading}
            className={`flex-2 px-8 py-4 ${actionColor} text-white font-black rounded-2xl transition-all uppercase text-[11px] tracking-widest shadow-lg flex items-center justify-center gap-2`}
          >
            {loading ? (
              <ArrowClockwise className="animate-spin" weight="bold" />
            ) : actionLabel}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const ManageUsers: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const [modalType, setModalType] = useState<'status' | 'delete' | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

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
    } catch {
      toast.error('Network error: Could not reach server');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!selectedUser) return;
    setActionLoading(true);
    const token = localStorage.getItem('authToken');
    try {
      const response = await fetch(`http://localhost:4000/api/admin/toggle-user/${selectedUser._id}`, {
        method: 'PATCH',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json' 
        }
      });
      const data = await response.json();
      if (data.success) {
        toast.success('Account status updated');
        fetchUsers();
        setModalType(null);
      }
    } catch {
      toast.error('Failed to update account status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    setActionLoading(true);
    const token = localStorage.getItem('authToken');
    try {
      const response = await fetch(`http://localhost:4000/api/admin/users/${selectedUser._id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        toast.success('User deleted');
        fetchUsers();
        setModalType(null);
      }
    } catch {
      toast.error('Failed to delete user');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const nameMatch = (user.firstName + ' ' + user.lastName).toLowerCase().includes(searchTerm.toLowerCase());
      const emailMatch = user.email.toLowerCase().includes(searchTerm.toLowerCase());
      const roleMatch = filterRole === 'all' || user.role === filterRole;
      return (nameMatch || emailMatch) && roleMatch;
    });
  }, [users, searchTerm, filterRole]);

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getRoleStyle = (role: string) => {
    if (role === 'admin') return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
    if (role === 'doctor') return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    return 'bg-teal-500/10 text-teal-400 border-teal-500/20';
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2.5 bg-teal-500/10 rounded-2xl border border-teal-500/20">
              <Users size={28} weight="duotone" className="text-teal-400" />
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight uppercase">User Directory</h1>
          </div>
          <p className="text-slate-500 text-sm font-medium">Manage matrix account authorizations</p>
        </motion.div>

        <div className="bg-slate-900/80 border border-white/5 px-6 py-3 rounded-3xl backdrop-blur-xl flex items-center gap-4 text-white">
          <div className="flex flex-col items-center">
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Total</span>
            <span className="text-2xl font-black">{users.length}</span>
          </div>
          <div className="w-[1px] h-8 bg-white/5" />
          <div className="flex flex-col items-center">
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Active</span>
            <span className="text-2xl font-black text-teal-400">{users.filter(u => u.isActive).length}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-6 relative group">
          <MagnifyingGlass className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
          <input 
            type="text"
            placeholder="Search by identity or email..."
            className="w-full bg-slate-900/40 border border-white/5 rounded-[24px] py-4 pl-14 pr-6 text-sm text-slate-200 focus:outline-none focus:border-teal-500/40"
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          />
        </div>

        <div className="lg:col-span-3 relative group">
          <select 
            className="w-full bg-slate-900/40 border border-white/5 rounded-[24px] py-4 px-6 text-sm text-slate-200 focus:outline-none appearance-none"
            value={filterRole}
            title="Filter users by role"
            onChange={(e) => { setFilterRole(e.target.value); setCurrentPage(1); }}
          >
            <option value="all">Every Role</option>
            <option value="patient">Patient Node</option>
            <option value="doctor">Medical Node</option>
            <option value="admin">Root Node</option>
          </select>
        </div>

        <button 
          onClick={fetchUsers}
          className="lg:col-span-3 bg-slate-800 hover:bg-slate-700 text-white font-black rounded-[24px] py-4 px-8 text-[11px] tracking-widest uppercase flex items-center justify-center gap-3 border border-white/5"
        >
          <ArrowClockwise className={loading ? 'animate-spin' : ''} size={18} weight="bold" />
          SYNC DATA
        </button>
      </div>

      <div className="bg-slate-900/40 border border-white/5 rounded-[40px] overflow-hidden backdrop-blur-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.01]">
                <th className="px-10 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Profile</th>
                <th className="px-10 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Role</th>
                <th className="px-10 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Status</th>
                <th className="px-10 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Joined</th>
                <th className="px-10 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-white">
              {loading ? (
                <tr><td colSpan={5} className="px-10 py-20 text-center text-slate-500">Syncing with matrix...</td></tr>
              ) : paginatedUsers.length === 0 ? (
                <tr><td colSpan={5} className="px-10 py-20 text-center text-slate-500">No nodes found</td></tr>
              ) : (
                paginatedUsers.map((user) => (
                  <tr key={user._id} className="group hover:bg-white/[0.03]">
                    <td className="px-10 py-6">
                      <div className="flex items-center gap-5">
                        <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-teal-400 font-black text-lg">
                          {user.firstName[0]}{user.lastName[0]}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-black">{user.firstName} {user.lastName}</span>
                          <span className="text-slate-500 text-xs">{user.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-6 text-center">
                      <span className={`inline-block px-3 py-1 rounded-xl text-[10px] font-black uppercase border ${getRoleStyle(user.role)}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-10 py-6 text-center font-black text-[10px]">
                      {user.isActive ? <span className="text-emerald-400">ONLINE</span> : <span className="text-rose-500">OFFLINE</span>}
                    </td>
                    <td className="px-10 py-6 text-center text-xs text-slate-400">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-10 py-6 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => { setSelectedUser(user); setModalType('status'); }}
                          className="p-2 rounded-xl border border-white/5 hover:bg-white/5 transition-all text-slate-400"
                          title={user.isActive ? "Deactivate user" : "Activate user"}
                        >
                          {user.isActive ? <Prohibit size={18} /> : <Check size={18} />}
                        </button>
                        <button 
                          onClick={() => { setSelectedUser(user); setModalType('delete'); }}
                          className="p-2 rounded-xl border border-white/5 hover:bg-rose-500/10 hover:text-rose-400 text-slate-400 transition-all"
                          title="Delete user"
                        >
                          <Trash size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-10 py-6 border-t border-white/5 flex justify-between items-center bg-white/[0.01]">
          <span className="text-[10px] font-black text-slate-600">Page {currentPage} of {totalPages || 1}</span>
          <div className="flex gap-2">
            <button 
              disabled={currentPage === 1} 
              onClick={() => setCurrentPage(c => c - 1)} 
              className="p-2 rounded-xl bg-slate-800 disabled:opacity-20"
              title="Previous page"
            >
              <CaretLeft size={16} className="text-white" />
            </button>
            <button 
              disabled={currentPage >= totalPages} 
              onClick={() => setCurrentPage(c => c + 1)} 
              className="p-2 rounded-xl bg-slate-800 disabled:opacity-20"
              title="Next page"
            >
              <CaretRight size={16} className="text-white" />
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {modalType === 'status' && (
          <Modal 
            isOpen={true} 
            onClose={() => setModalType(null)}
            title="Modify Status"
            actionLabel={selectedUser?.isActive ? "OFFLINE" : "ONLINE"}
            actionColor={selectedUser?.isActive ? "bg-amber-500" : "bg-emerald-500"}
            onAction={handleToggleStatus}
            loading={actionLoading}
          >
            Update node {selectedUser?.firstName}'s authorization?
          </Modal>
        )}
        {modalType === 'delete' && (
          <Modal 
            isOpen={true} 
            onClose={() => setModalType(null)}
            title="Purge Node"
            actionLabel="PURGE"
            actionColor="bg-rose-500"
            onAction={handleDeleteUser}
            loading={actionLoading}
          >
            Permanently delete binary profile for {selectedUser?.firstName}?
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ManageUsers;
