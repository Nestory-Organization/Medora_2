import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, 
  Stethoscope, 
  IdentificationCard,
  MapPin,
  Clock,
  CheckCircle,
  ArrowRight,
  UserCircle,
  Warning,
  Files,
  Briefcase,
  Check,
  X,
  FilePdf,
  EnvelopeSimple,
  Calendar
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
  createdAt: string;
}

const DoctorModal = ({ doctor, onClose, onApprove, onReject, loading }: any) => {
  if (!doctor) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/90 backdrop-blur-md"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 30 }}
        className="relative w-full max-w-2xl bg-slate-900 border border-white/10 rounded-[40px] shadow-2xl overflow-hidden"
      >
        {/* Header Decor */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 via-teal-500 to-blue-500" />
        
        <div className="p-8 md:p-12">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            {/* Left: Avatar & Basic Info */}
            <div className="flex flex-col items-center text-center w-full md:w-1/3">
              <div className="w-24 h-24 rounded-[32px] bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 flex items-center justify-center text-blue-400 mb-4 shadow-2xl">
                <UserCircle size={64} weight="duotone" />
              </div>
              <h3 className="text-xl font-black text-white leading-tight">Dr. {doctor.firstName} {doctor.lastName}</h3>
              <p className="text-blue-400 text-xs font-black uppercase tracking-[0.2em] mt-2 italic">{doctor.specialization}</p>
              
              <div className="mt-6 w-full space-y-2">
                <div className="bg-white/5 p-3 rounded-2xl border border-white/5 flex items-center justify-center gap-2">
                  <Briefcase size={16} className="text-slate-400" />
                  <span className="text-slate-300 text-xs font-bold">{doctor.experience} Years Exp.</span>
                </div>
              </div>
            </div>

            {/* Right: Detailed Credentials */}
            <div className="flex-1 space-y-6">
              <div>
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Clinical Credentials</h4>
                <div className="grid grid-cols-1 gap-3">
                  <div className="flex items-center gap-3 text-slate-300 text-sm">
                    <IdentificationCard size={18} className="text-blue-500" />
                    <span className="font-medium">License: <span className="text-white font-bold">#{doctor.licenseNumber}</span></span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-300 text-sm">
                    <EnvelopeSimple size={18} className="text-blue-500" />
                    <span className="font-medium">{doctor.email}</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-300 text-sm">
                    <MapPin size={18} className="text-blue-500" />
                    <span className="font-medium">{doctor.clinicAddress}</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-300 text-sm">
                    <Clock size={18} className="text-blue-500" />
                    <span className="font-medium">{doctor.workingHours}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Verifiable Documents</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-3 bg-slate-800/50 p-3 rounded-2xl border border-white/5 hover:bg-slate-800 transition-colors cursor-pointer group">
                    <FilePdf size={24} weight="duotone" className="text-rose-400" />
                    <div className="flex flex-col">
                      <span className="text-white text-[10px] font-black">Medical_License.pdf</span>
                      <span className="text-slate-500 text-[9px] uppercase">Verify authenticity</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-slate-800/50 p-3 rounded-2xl border border-white/5 hover:bg-slate-800 transition-colors cursor-pointer">
                    <FilePdf size={24} weight="duotone" className="text-blue-400" />
                    <div className="flex flex-col">
                      <span className="text-white text-[10px] font-black">Board_Cert.pdf</span>
                      <span className="text-slate-500 text-[9px] uppercase">View Credentials</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="mt-10 flex gap-4">
            <button 
              onClick={() => onReject(doctor._id)}
              disabled={loading}
              className="flex-1 py-4 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white font-black rounded-2xl transition-all uppercase text-[11px] tracking-widest border border-rose-500/20 flex items-center justify-center gap-2"
            >
              <X size={18} weight="bold" /> Reject Application
            </button>
            <button 
              onClick={() => onApprove(doctor._id)}
              disabled={loading}
              className="flex-2 py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-2xl transition-all uppercase text-[11px] tracking-widest shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 px-8"
            >
              <Check size={18} weight="bold" /> Approve Credentials
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const VerifyDoctors: React.FC = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

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
      toast.error('Clinical data sync failed');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id: string, status: boolean) => {
    setActionLoading(true);
    const token = localStorage.getItem('authToken');
    try {
      const response = await fetch(`http://localhost:4000/api/admin/verify-doctor/${id}`, {
        method: 'PATCH',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isVerified: status })
      });
      const data = await response.json();
      if (data.success) {
        toast.success(status ? 'Board certification approved' : 'Application declined');
        fetchDoctors();
        setSelectedDoctor(null);
      }
    } catch (err) {
      toast.error('Network error during audit');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2.5 bg-blue-500/10 rounded-2xl border border-blue-500/20">
              <ShieldCheck size={28} weight="duotone" className="text-blue-400" />
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight uppercase">Credentials Audit</h1>
          </div>
          <p className="text-slate-500 text-sm font-medium">Verify clinical authorizations and medical licenses</p>
        </motion.div>

        <div className="bg-slate-900/60 border border-white/5 px-6 py-3 rounded-3xl backdrop-blur-xl flex items-center gap-4">
          <div className="flex flex-col items-center">
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Pending Audit</span>
            <span className="text-2xl font-black text-blue-400">{doctors.filter(d => !d.isVerified).length}</span>
          </div>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {loading ? (
            [...Array(6)].map((_, i) => (
              <div key={i} className="h-64 bg-slate-900/40 animate-pulse rounded-[32px] border border-white/5" />
            ))
          ) : doctors.length === 0 ? (
            <div className="col-span-full py-20 text-center">
              <Warning size={48} weight="duotone" className="text-slate-700 mx-auto mb-4" />
              <p className="text-slate-500 font-bold italic">No new practitioner nodes requiring audit...</p>
            </div>
          ) : (
            doctors.map((doctor, idx) => (
              <motion.div
                key={doctor._id}
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="group bg-slate-900/40 border border-white/5 rounded-[32px] p-6 hover:border-blue-500/30 transition-all duration-500 backdrop-blur-xl relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-blue-500/10 transition-colors" />
                
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center text-blue-400 shadow-xl border border-white/5 group-hover:scale-110 transition-transform">
                      <Stethoscope size={28} weight="duotone" />
                    </div>
                    {!doctor.isVerified && (
                      <span className="px-3 py-1 bg-amber-500/10 text-amber-400 text-[9px] font-black uppercase tracking-widest rounded-lg border border-amber-500/20">
                        Pending
                      </span>
                    )}
                  </div>

                  <h3 className="text-white font-black text-lg mb-1">Dr. {doctor.firstName} {doctor.lastName}</h3>
                  <p className="text-blue-400 text-[10px] font-black uppercase tracking-[0.1em] mb-4">{doctor.specialization}</p>
                  
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-2 text-slate-500 text-xs font-bold">
                      <Briefcase size={14} /> {doctor.experience} Years of Clinical Practice
                    </div>
                    <div className="flex items-center gap-2 text-slate-500 text-xs font-bold">
                      <Calendar size={14} /> Registered {new Date(doctor.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  <button 
                    onClick={() => setSelectedDoctor(doctor)}
                    className="w-full py-3 bg-white/5 hover:bg-blue-500 text-slate-300 hover:text-white font-black text-[10px] uppercase tracking-widest rounded-2xl transition-all border border-white/5 hover:border-blue-500 flex items-center justify-center gap-2 group/btn"
                  >
                    Examine Credentials <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Doctor Review Modal */}
      <AnimatePresence>
        {selectedDoctor && (
          <DoctorModal 
            doctor={selectedDoctor} 
            onClose={() => setSelectedDoctor(null)}
            onApprove={(id: string) => handleAction(id, true)}
            onReject={(id: string) => handleAction(id, false)}
            loading={actionLoading}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default VerifyDoctors;
