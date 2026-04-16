import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, 
  Stethoscope, 
  Files, 
  IdentificationCard,
  MapPin,
  Clock,
  CheckCircle,
  ArrowRight,
  UserCircle,
  Warning,
  Eye,
  Check,
  X
} from '@phosphor-icons/react';
import { toast } from 'react-toastify';

interface Doctor {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  specialization: string;
  experience: number;
  isVerified: boolean;
  licenseNumber: string;
  clinicAddress: string;
  workingHours: string;
  registrationDate?: string;
}

const VerifyDoctors: React.FC = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    setLoading(true);
    const token = localStorage.getItem('authToken');
    try {
      const response = await fetch('http://localhost:4000/api/admin/doctors', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setDoctors(data.data || []);
      }
    } catch (err) {
      toast.error('Failed to sync doctor records');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (id: string) => {
    const token = localStorage.getItem('authToken');
    try {
      const response = await fetch(`http://localhost:4000/api/admin/verify-doctor/${id}`, {
        method: 'PATCH',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isVerified: true })
      });
      const data = await response.json();
      if (data.success) {
        toast.success('Doctor credentials verified successfully');
        fetchDoctors();
        setSelectedDoctor(null);
      }
    } catch (err) {
      toast.error('Verification update failed');
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
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <ShieldCheck size={24} weight="duotone" className="text-blue-400" />
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight uppercase">Credentials Audit</h1>
          </div>
          <p className="text-slate-400 text-sm font-medium">Verify medical licenses and board certifications for new practitioners</p>
        </motion.div>

        <div className="flex gap-4">
          <div className="bg-slate-900/50 border border-white/5 px-6 py-2 rounded-2xl">
            <span className="text-[10px] font-black text-slate-500 block tracking-widest uppercase">Pending Approval</span>
            <span className="text-2xl font-black text-blue-400">{doctors.filter(d => !d.isVerified).length}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-4">
          <AnimatePresence mode="popLayout">
            {loading ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-slate-900/40 animate-pulse rounded-[24px] border border-white/5" />
              ))
            ) : doctors.length === 0 ? (
              <div className="bg-slate-900/20 border border-white/5 rounded-[32px] p-20 text-center">
                <Warning size={48} className="text-slate-700 mx-auto mb-4" weight="duotone" />
                <p className="text-slate-500 font-medium italic">No new verification requests found...</p>
              </div>
            ) : (
              doctors.map((doctor, idx) => (
                <motion.div
                  key={doctor._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => setSelectedDoctor(doctor)}
                  className={`group relative p-6 rounded-[28px] border transition-all duration-300 cursor-pointer ${
                    selectedDoctor?._id === doctor._id 
                    ? 'bg-blue-500/10 border-blue-500/50 shadow-[0_0_30px_rgba(59,130,246,0.1)]' 
                    : 'bg-slate-900/40 border-white/5 hover:border-white/10'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-white/5 flex items-center justify-center text-blue-400 shadow-inner">
                        <UserCircle size={32} weight="duotone" />
                      </div>
                      <div>
                        <h3 className="text-white font-black tracking-tight text-lg flex items-center gap-2">
                          Dr. {doctor.firstName} {doctor.lastName}
                          {doctor.isVerified && <CheckCircle size={18} weight="fill" className="text-emerald-500" />}
                        </h3>
                        <p className="text-blue-400 text-xs font-black uppercase tracking-widest flex items-center gap-1.5 mt-0.5">
                          <Stethoscope size={14} weight="bold" />
                          {doctor.specialization}
                        </p>
                      </div>
                    </div>
                    <button className="p-2 bg-white/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity">
                      <ArrowRight size={20} className="text-white" />
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>

        <div className="xl:col-span-1">
          <div className="sticky top-8">
            <AnimatePresence mode="wait">
              {selectedDoctor ? (
                <motion.div
                  key={selectedDoctor._id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-slate-900/60 border border-white/10 rounded-[32px] p-8 backdrop-blur-3xl overflow-hidden relative"
                >
                  <div className="relative space-y-6">
                    <div className="text-center">
                      <div className="w-20 h-20 bg-slate-800 rounded-3xl mx-auto mb-4 border border-white/5 flex items-center justify-center text-blue-400 shadow-2xl">
                        <IdentificationCard size={40} weight="duotone" />
                      </div>
                      <h2 className="text-xl font-black text-white uppercase tracking-tight">Credentials Review</h2>
                    </div>

                    <div className="space-y-4 bg-white/5 p-5 rounded-3xl border border-white/5">
                      <div className="space-y-1">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Clinic Location</span>
                        <div className="text-slate-200 text-xs font-medium flex items-center gap-2">
                          <MapPin size={16} className="text-blue-400" />
                          {selectedDoctor.clinicAddress}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Operating Hours</span>
                        <div className="text-slate-200 text-xs font-medium flex items-center gap-2">
                          <Clock size={16} className="text-blue-400" />
                          {selectedDoctor.workingHours}
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 space-y-3">
                      {!selectedDoctor.isVerified ? (
                        <>
                          <button 
                            onClick={() => handleVerify(selectedDoctor._id)}
                            className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-4 rounded-2xl transition-all shadow-lg shadow-emerald-500/20 active:scale-[0.98] flex items-center justify-center gap-2"
                          >
                            <Check size={20} weight="bold" />
                            APPROVE CREDENTIALS
                          </button>
                        </>
                      ) : (
                        <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl text-emerald-400 text-center font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2">
                          <CheckCircle size={18} weight="fill" />
                          FULLY VERIFIED
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div className="h-96 border-2 border-dashed border-white/5 rounded-[32px] flex flex-col items-center justify-center text-slate-700 p-8 text-center italic text-sm">
                  Select a practitioner profile to begin clinical audit and credential verification.
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyDoctors;
