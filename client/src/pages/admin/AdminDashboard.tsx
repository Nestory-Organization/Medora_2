import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface DoctorProfile {
  doctorId: string;
  firstName: string;
  lastName: string;
  specialization: string;
  isVerified: boolean;
}

const AdminDashboard: React.FC = () => {
  const [doctors, setDoctors] = useState<DoctorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    const token = localStorage.getItem('authToken');
    const userStr = localStorage.getItem('user');

    if (!token || !userStr) {
      navigate('/login');
      return;
    }

    try {
      const response = await fetch('http://localhost:4000/api/admin/doctors', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setDoctors(data.data || []);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to fetch doctors');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (doctorId: string, status: boolean) => {
    const token = localStorage.getItem('authToken');
    try {
      const response = await fetch(`http://localhost:4000/api/admin/doctor/${doctorId}/verify`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      const data = await response.json();
      if (data.success) {
        fetchDoctors(); // Refresh list
      }
    } catch (err) {
      alert('Error updating status');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-white tracking-tight uppercase">Verify Doctors</h1>
        <p className="text-slate-400 text-sm">Review doctor applications and system verification status</p>
      </div>

      <div className="bg-slate-900/50 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-xl shadow-2xl">
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
          <div>
            <h2 className="text-lg font-bold text-white uppercase">Verification Requests</h2>
            <p className="text-xs text-slate-500 mt-0.5">Approve licenses to grant access to the platform</p>
          </div>
          <button 
            onClick={fetchDoctors} 
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-all border border-white/5 flex items-center gap-2"
          >
            Refresh Data
          </button>
        </div>

        <div className="p-0">
          {loading ? (
            <div className="p-20 text-center text-slate-500 text-sm italic">Loading verify requests...</div>
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
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Doctor Name</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Specialization</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-center">Status</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-right">Verification Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {doctors.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-slate-500 text-sm italic">No pending doctor profiles found.</td>
                    </tr>
                  ) : (
                    doctors.map(doc => (
                      <tr key={doc.doctorId} className="group hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-400 font-bold text-xs border border-teal-500/20 uppercase">
                              {doc.firstName[0]}{doc.lastName[0]}
                            </div>
                            <span className="text-sm font-semibold text-slate-200 uppercase tracking-wide">{doc.firstName} {doc.lastName}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">{doc.specialization}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`
                            inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider
                            ${doc.isVerified 
                              ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}
                          `}>
                            <span className={`w-1 h-1 rounded-full ${doc.isVerified ? 'bg-green-500' : 'bg-amber-500'}`} />
                            {doc.isVerified ? 'Verified' : 'Pending'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {!doc.isVerified ? (
                            <button 
                              onClick={() => handleVerify(doc.doctorId, true)}
                              className="px-4 py-1.5 bg-teal-500 hover:bg-teal-400 text-slate-950 text-[11px] font-bold rounded-lg transition-all shadow-lg shadow-teal-500/20 uppercase"
                            >
                              Approve
                            </button>
                          ) : (
                            <button 
                              onClick={() => handleVerify(doc.doctorId, false)}
                              className="px-4 py-1.5 bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 text-[11px] font-bold rounded-lg transition-all border border-white/5 hover:border-red-500/30 uppercase"
                            >
                              Revoke
                            </button>
                          )}
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

export default AdminDashboard;
