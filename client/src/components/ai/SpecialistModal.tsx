import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { X, UserCircle, CaretRight, Sparkle, CheckCircle, FirstAid, CalendarBlank, Clock, MapPin, Globe } from 'phosphor-react';

interface Specialist {
  name: string;
  reason: string;
  priority?: string;
  matchedDoctors?: SuggestedDoctor[];
  externalSearchUrl?: string;
  matchedDoctorCount?: number;
}

interface SuggestedDoctor {
  doctorId: string;
  name: string;
  specialization: string;
  yearsOfExperience?: number;
  consultationFee?: number;
  qualification?: string;
  clinicAddress?: string;
  reason?: string;
  priority?: string;
  matchedSpecialties?: string[];
}

interface SpecialistModalProps {
  specialists: Specialist[];
  suggestedDoctors?: SuggestedDoctor[];
  onClose: () => void;
  loading: boolean;
}

const SpecialistModal: React.FC<SpecialistModalProps> = ({ specialists, suggestedDoctors = [], onClose, loading }) => {
  const navigate = useNavigate();

  const uniqueDoctors = suggestedDoctors.length > 0
    ? suggestedDoctors
    : specialists.flatMap((item) => item.matchedDoctors || []);

  const navigateToBooking = (specialty?: string) => {
    const params = new URLSearchParams();
    if (specialty) {
      params.set('specialty', specialty);
    }
    navigate(`/patient/book${params.toString() ? `?${params.toString()}` : ''}`);
    onClose();
  };

  const getPriorityClass = (priority?: string) => {
    if (priority === 'High') return 'border-rose-400/50 text-rose-200 bg-rose-400/10';
    if (priority === 'Medium') return 'border-amber-300/50 text-amber-100 bg-amber-300/10';
    return 'border-cyan-300/50 text-cyan-100 bg-cyan-300/10';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm shadow-2xl"
      />

      {/* Modal Content */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 30 }}
        className="relative w-full max-w-4xl bg-slate-900/40 backdrop-blur-3xl border border-white/20 rounded-[2.5rem] overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.7)]"
      >
        <div className="p-8 border-b border-white/10 flex justify-between items-center bg-gradient-to-r from-cyan-900/40 via-blue-900/40 to-transparent">
          <div>
            <h3 className="text-2xl font-black text-white flex items-center gap-3">
              <div className="p-2 bg-cyan-500/20 rounded-xl">
                <UserCircle size={28} weight="fill" className="text-cyan-400" />
              </div>
              Doctor Match Results
            </h3>
            <p className="text-[10px] uppercase tracking-widest font-bold text-cyan-200/40 mt-1 ml-11">Based on registered and verified doctors</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close doctor match panel"
            title="Close"
            className="p-2 hover:bg-white/10 rounded-2xl text-white/40 hover:text-white transition-all"
          >
            <X size={24} weight="bold" />
          </button>
        </div>

        <div className="p-8 max-h-[65vh] overflow-y-auto space-y-8 custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-6">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
                <Sparkle size={24} weight="fill" className="text-cyan-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
              </div>
              <p className="text-cyan-200/40 font-black uppercase tracking-[0.3em] text-[10px] animate-pulse">Scanning Global Database</p>
            </div>
          ) : specialists.length > 0 || uniqueDoctors.length > 0 ? (
            <>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-white text-lg font-black flex items-center gap-2">
                    <FirstAid size={20} className="text-cyan-300" /> Suggested Specialties
                  </h4>
                  <span className="text-xs text-white/40">{specialists.length} specialties</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {specialists.map((specialist, idx) => (
                    <motion.div
                      key={`${specialist.name}-${idx}`}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: idx * 0.08, ease: 'circOut' }}
                      className="group p-5 bg-white/[0.03] border border-white/5 rounded-3xl hover:bg-white/[0.07] hover:border-cyan-500/30 transition-all duration-500 relative overflow-hidden"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h5 className="text-base font-black text-white group-hover:text-cyan-300 transition-colors tracking-tight">
                            {specialist.name}
                          </h5>
                          <p className="text-xs text-cyan-100/40 mt-2 leading-relaxed font-medium italic">
                            {specialist.reason}
                          </p>
                        </div>
                        <span className={`text-[10px] px-2.5 py-1 rounded-full border font-bold uppercase tracking-wider ${getPriorityClass(specialist.priority)}`}>
                          {specialist.priority || 'Medium'}
                        </span>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => navigateToBooking(specialist.name)}
                          className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-cyan-200 hover:text-white transition-colors"
                        >
                          Continue to booking
                          <CaretRight size={14} />
                        </button>

                        {specialist.externalSearchUrl && (
                          <a
                            href={specialist.externalSearchUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-emerald-300 hover:text-emerald-200 transition-colors ml-auto"
                          >
                            <Globe size={14} />
                            Search Web
                          </a>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-white text-lg font-black flex items-center gap-2">
                    <CheckCircle size={20} className="text-emerald-300" /> Matched Registered Doctors
                  </h4>
                  <span className="text-xs text-white/40">{uniqueDoctors.length} doctors</span>
                </div>

                {uniqueDoctors.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {uniqueDoctors.map((doctor, idx) => (
                      <motion.div
                        key={`${doctor.doctorId || doctor.name}-${idx}`}
                        initial={{ y: 12, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.1 + idx * 0.05 }}
                        className="p-5 rounded-3xl border border-emerald-400/20 bg-emerald-500/[0.03]"
                      >
                        <div className="flex justify-between gap-3">
                          <div>
                            <h5 className="text-white font-black tracking-tight">{doctor.name}</h5>
                            <p className="text-xs text-emerald-100/70 mt-1">{doctor.specialization}</p>
                          </div>
                          <span className="text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full border border-emerald-300/30 text-emerald-200 bg-emerald-300/10 h-fit">
                            Verified
                          </span>
                        </div>

                        <div className="mt-4 space-y-2 text-xs text-white/70">
                          <p className="flex items-center gap-2"><Clock size={14} className="text-cyan-300" /> {doctor.yearsOfExperience ?? 0}+ years experience</p>
                          <p className="flex items-center gap-2"><CalendarBlank size={14} className="text-cyan-300" /> LKR {doctor.consultationFee ?? 0} consultation fee</p>
                          {doctor.clinicAddress && (
                            <p className="flex items-center gap-2"><MapPin size={14} className="text-cyan-300" /> {doctor.clinicAddress}</p>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => navigateToBooking(doctor.specialization)}
                          className="mt-4 w-full py-2.5 rounded-xl text-xs font-bold uppercase tracking-[0.15em] bg-cyan-600 hover:bg-cyan-500 text-white transition-colors"
                        >
                          Book with this specialty
                        </button>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 border border-dashed border-white/15 rounded-2xl bg-white/[0.02]">
                    <p className="text-white/40 text-sm">No registered doctors matched yet. You can still continue to manual booking search.</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-white/30 font-bold tracking-widest uppercase text-xs">No matching credentials found</p>
            </div>
          )}
        </div>

        <div className="p-8 border-t border-white/10 bg-slate-900/60 backdrop-blur-3xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <button
              onClick={() => navigateToBooking()}
              className="w-full py-4 bg-cyan-600 hover:bg-cyan-500 text-white rounded-2xl transition-all font-black uppercase tracking-[0.2em] text-[10px] border border-cyan-400/40"
            >
              Open Booking Page
            </button>
            <button
              onClick={onClose}
              className="w-full py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl transition-all font-black uppercase tracking-[0.2em] text-[10px] border border-white/10 hover:border-cyan-500/40 shadow-2xl"
            >
              Close
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default SpecialistModal;
