import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

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
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const token = localStorage.getItem('authToken');
    const userStr = localStorage.getItem('user');

    if (!token || !userStr) {
      navigate('/login');
      return;
    }

    try {
      const response = await fetch('http://localhost:4000/api/admin/users', {
        headers: { 
          'Authorization': `Bearer ${token}` 
        }
      });
      const data = await response.json();
      if (data.success) {
        setUsers(data.data || []);
      } else {
        setError(data.message || 'Failed to fetch users');
      }
    } catch (err) {
      setError('Network error: Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-white tracking-tight uppercase">Manage Users</h1>
        <p className="text-slate-400 text-sm">Monitor and manage all system accounts and permissions</p>
      </div>

      <div className="bg-slate-900/50 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-xl shadow-2xl">
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
          <div>
            <h2 className="text-lg font-bold text-white uppercase">Platform Users</h2>
            <p className="text-xs text-slate-500 mt-0.5">A complete list of patients, doctors, and administrators</p>
          </div>
          <button 
            onClick={fetchUsers} 
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-all border border-white/5 flex items-center gap-2"
          >
            Refresh Data
          </button>
        </div>

        <div className="p-0">
          {loading ? (
            <div className="p-20 text-center text-slate-500 text-sm italic">Loading users...</div>
          ) : error ? (
            <div className="m-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              {error}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 bg-white/[0.01]">
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Full Name</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Email Address</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-center">Role</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-center">Status</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-right">Joined On</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-slate-500 text-sm italic">No users found in the system.</td>
                    </tr>
                  ) : (
                    users.map(user => (
                      <tr key={user._id} className="group hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs border uppercase
                              ${user.role === 'admin' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 
                                user.role === 'doctor' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 
                                'bg-teal-500/10 text-teal-400 border-teal-500/20'}
                            `}>
                              {user.firstName[0]}{user.lastName[0]}
                            </div>
                            <span className="text-sm font-semibold text-slate-200 uppercase tracking-wide">{user.firstName} {user.lastName}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs font-medium text-slate-400 lowercase tracking-wide font-mono">{user.email}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`
                            px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider
                            ${user.role === 'admin' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 
                              user.role === 'doctor' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 
                              'bg-green-500/10 text-green-400 border border-green-500/20'}
                          `}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`text-[11px] font-bold uppercase tracking-widest ${user.isActive ? 'text-teal-400' : 'text-red-400'}`}>
                            {user.isActive ? 'Active' : 'Locked'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-xs text-slate-500 font-medium">
                            {new Date(user.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageUsers;