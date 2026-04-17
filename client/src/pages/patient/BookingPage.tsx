import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MagnifyingGlass, Clock, UserCircle, Star, Sparkle, WarningCircle } from 'phosphor-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useSearchParams } from 'react-router-dom';
import PageTransition from '../../components/PageTransition';
import { getStoredUser } from '../../api/patient';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';

interface Doctor {
  doctorId: string;
  name: string;
  specialization: string;
  consultationFee: number;
  yearsOfExperience: number;
  qualification: string;
  bio: string;
  clinicAddress: string;
  availableSlots?: { startTime: string; endTime: string; isBooked: boolean }[];
}

const BookingPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [slotLoading, setSlotLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchAllDoctors = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const headers = { ...(token && { Authorization: `Bearer ${token}` }) };

      const allDoctors: Doctor[] = [];
      let page = 1;
      let totalPages = 1;

      while (page <= totalPages) {
        const response = await axios.get(`${API_BASE_URL}/doctors/verified`, {
          params: { page, limit: 100 },
          headers
        });

        const payload = response.data?.data || [];
        const pagination = response.data?.pagination || {};

        allDoctors.push(...payload);
        totalPages = Number(pagination.totalPages) || 1;
        page += 1;
      }

      setDoctors(allDoctors);
    } catch (err) {
      console.error('Fetch all doctors error:', err);
      const errorMessage = axios.isAxiosError(err)
        ? err.response?.data?.message
        : 'Failed to load doctors list.';
      setMessage({ type: 'error', text: errorMessage || 'Failed to load doctors list.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllDoctors();
  }, []);

  useEffect(() => {
    const specialtyParam = searchParams.get('specialty');
    if (specialtyParam && specialtyParam.trim()) {
      setSearchTerm(specialtyParam.trim());
    }
  }, [searchParams]);

  useEffect(() => {
    if (!searchTerm.trim()) {
      return;
    }

    const specialtyParam = searchParams.get('specialty');
    if (!specialtyParam || specialtyParam.trim().toLowerCase() !== searchTerm.trim().toLowerCase()) {
      return;
    }

    handleSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, selectedDate, searchParams]);
  // Fetch availability slots when date changes
  const fetchSlotsForDate = async (doctor: Doctor, date: string) => {
    try {
      setSlotLoading(true);
      const token = localStorage.getItem('authToken');
      const response = await axios.get(`${API_BASE_URL}/appointments/doctors/search`, {
        params: { specialty: doctor.specialization, date },
        headers: { ...(token && { Authorization: `Bearer ${token}` }) }
      });
      
      const updatedDoctor = response.data.data?.find((d: Doctor) => d.doctorId === doctor.doctorId);
      if (updatedDoctor) {
        setSelectedDoctor(updatedDoctor);
        setSelectedSlot(null); // Reset selected slot when date changes
      }
    } catch (err: any) {
      console.error('Fetch slots error:', err);
      setMessage({ type: 'error', text: 'Failed to load available slots for this date' });
    } finally {
      setSlotLoading(false);
    }
  };

  // Handle date change in modal
  const handleDateChange = (newDate: string) => {
    setSelectedDate(newDate);
    if (selectedDoctor) {
      fetchSlotsForDate(selectedDoctor, newDate);
    }
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!searchTerm.trim()) {
      fetchAllDoctors();
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      // Search doctors through appointment service (uses real MongoDB data)
      const response = await axios.get(`${API_BASE_URL}/appointments/doctors/search`, {
        params: { specialty: searchTerm, date: selectedDate },
        headers: { ...(token && { Authorization: `Bearer ${token}` }) }
      });
      setDoctors(response.data.data || []);
      if (!response.data.success) {
        setMessage({ type: 'error', text: 'Failed to fetch doctors' });
      }
    } catch (err) {
      console.error('Search error:', err);
      const errorMessage = axios.isAxiosError(err) 
        ? err.response?.data?.message 
        : 'Failed to search doctors. Make sure API Gateway is running on port 4000.';
      setMessage({ 
        type: 'error', 
        text: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBook = async () => {
    if (!selectedDoctor || !selectedSlot) return;
    setMessage(null);

    try {
      const user = getStoredUser();
      
      if (!user || !user._id) {
        setMessage({ type: 'error', text: 'You must be logged in to book an appointment' });
        return;
      }

      const slot = selectedDoctor.availableSlots?.find(s => s.startTime === selectedSlot);
      if (!slot) {
        setMessage({ type: 'error', text: 'Invalid time slot selected' });
        return;
      }

      const appointmentData = {
        patientId: user._id,
        patientName: [user.firstName, user.lastName].filter(Boolean).join(' ').trim() || user.name || 'Patient',
        patientEmail: user.email || null,
        patientPhone: user.phone || null,
        doctorId: selectedDoctor.doctorId,
        specialty: selectedDoctor.specialization,
        appointmentDate: selectedDate,
        startTime: selectedSlot,
        endTime: slot.endTime,
        consultationFee: selectedDoctor.consultationFee,
        reason: "General Consultation"
      };

      console.log('Booking appointment:', appointmentData);

      const response = await axios.post(`${API_BASE_URL}/appointments`, appointmentData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
      });

      if (response.data.success) {
        setMessage({ type: 'success', text: 'Appointment booked successfully! Redirecting to payment...' });
        setTimeout(() => {
          // Redirect to payment page with appointment details
          const appointmentId = response.data.data?.appointmentId;
          if (appointmentId) {
            navigate(`/patient/payment?appointmentId=${appointmentId}`);
          } else {
            navigate('/patient/appointments');
          }
        }, 1500);
      } else {
        setMessage({ type: 'error', text: response.data.message || 'Failed to book appointment' });
      }
    } catch (err) {
      console.error('Booking error:', err);
      const errorMessage = axios.isAxiosError(err)
        ? err.response?.data?.message
        : 'Failed to book appointment. Make sure API Gateway is running on port 4000.';
      setMessage({ 
        type: 'error', 
        text: errorMessage
      });
    } finally {
      setBookingLoading(false);
    }
  };

  return (
    <PageTransition>
      <div className="max-w-7xl mx-auto px-6 py-12">
        <header className="mb-12">
          <h1 className="text-4xl font-black text-white tracking-tight leading-none mb-4">
            Find Your <span className="text-teal-400">Specialist</span>
          </h1>
          <p className="text-slate-400 font-medium">Search across our network of verified medical professionals.</p>
        </header>

        <form onSubmit={handleSearch} className="relative mb-12 group">
          <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
            <MagnifyingGlass size={24} className="text-slate-500 group-focus-within:text-teal-400 transition-colors" />
          </div>
          <input 
            type="text" 
            placeholder="Search by specialty (e.g. Cardiology, Pediatrics) or leave blank to see all doctors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-3xl py-6 pl-16 pr-6 text-white placeholder-slate-500 focus:outline-none focus:border-teal-500/50 focus:ring-4 focus:ring-teal-500/10 transition-all text-lg shadow-2xl"
          />
          <button 
            type="submit"
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-teal-500 hover:bg-teal-400 text-white font-bold py-3 px-8 rounded-2xl transition-all shadow-lg shadow-teal-500/20 active:scale-95"
          >
            Search
          </button>
        </form>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-12 h-12 border-4 border-teal-500/20 border-t-teal-500 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {doctors.map((doctor) => (
              <motion.div 
                key={doctor.doctorId}
                layoutId={doctor.doctorId}
                onClick={() => {
                  setSelectedDoctor(doctor);
                  fetchSlotsForDate(doctor, selectedDate);
                }}
                className="bg-slate-900/40 backdrop-blur-xl border border-white/5 p-8 rounded-[2.5rem] hover:border-teal-500/30 transition-all group cursor-pointer relative overflow-hidden"
              >
                <div className="flex items-start gap-6 relative z-10">
                  <div className="w-24 h-24 bg-gradient-to-br from-teal-500/20 to-blue-500/20 rounded-[2rem] flex items-center justify-center border border-white/5 ring-4 ring-black/20 group-hover:ring-teal-500/20 transition-all">
                    <UserCircle size={48} weight="duotone" className="text-teal-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-black text-white group-hover:text-teal-400 transition-colors">{doctor.name}</h3>
                    <p className="text-teal-400/60 uppercase font-black text-[10px] tracking-[0.2em] mb-4">{doctor.specialization}</p>
                    <div className="flex items-center gap-4 text-sm text-slate-400 font-medium">
                      <span className="flex items-center gap-2"><Star size={16} weight="fill" className="text-yellow-500" /> 4.9</span>
                      <span className="flex items-center gap-2"><Clock size={16} /> {doctor.yearsOfExperience}y Exp</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black text-white">${doctor.consultationFee}</p>
                    <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest mt-1">Consultation</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {!loading && doctors.length === 0 && (
          <div className="text-center py-16 bg-slate-900/30 border border-white/5 rounded-3xl">
            <p className="text-slate-400 font-medium">No doctors found. Try another specialty or clear search.</p>
          </div>
        )}

        <AnimatePresence>
          {selectedDoctor && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedDoctor(null)}
                className="absolute inset-0 bg-black/80 backdrop-blur-md"
              />
              <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 40 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 40 }}
                className="relative w-full max-w-2xl bg-slate-900 border border-white/10 rounded-[3rem] overflow-hidden shadow-2xl"
              >
                <div className="p-10">
                  <header className="flex items-start justify-between mb-8">
                    <div className="flex gap-6">
                      <div className="w-20 h-20 bg-teal-500/20 rounded-3xl flex items-center justify-center">
                         <UserCircle size={40} className="text-teal-400" />
                      </div>
                      <div>
                        <h2 className="text-3xl font-black text-white">{selectedDoctor.name}</h2>
                        <p className="text-teal-400 font-bold uppercase tracking-widest text-xs mt-1">{selectedDoctor.specialization}</p>
                      </div>
                    </div>
                    <div className="bg-slate-800/50 p-4 rounded-2xl text-center min-w-[100px]">
                      <p className="text-xl font-black text-white">${selectedDoctor.consultationFee}</p>
                      <p className="text-[10px] font-bold text-slate-500 uppercase">Fee</p>
                    </div>
                  </header>

                  <div className="grid grid-cols-2 gap-8 mb-8">
                    <div>
                      <h4 className="text-[10px] uppercase font-black text-slate-500 tracking-[0.2em] mb-4">Availability</h4>
                      <div className="flex gap-4">
                        <input 
                          type="date" 
                          value={selectedDate}
                          onChange={(e) => handleDateChange(e.target.value)}
                          aria-label="Select appointment date"
                          className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <h4 className="text-[10px] uppercase font-black text-slate-500 tracking-[0.2em] mb-4">Qualification</h4>
                      <p className="text-sm text-slate-300 font-medium">{selectedDoctor.qualification}</p>
                    </div>
                  </div>

                  <div className="mb-10">
                    <h4 className="text-[10px] uppercase font-black text-slate-500 tracking-[0.2em] mb-4">Select Slot</h4>
                    {slotLoading ? (
                      <div className="flex justify-center py-6">
                        <div className="w-6 h-6 border-2 border-teal-500/20 border-t-teal-500 rounded-full animate-spin" />
                      </div>
                    ) : selectedDoctor.availableSlots && selectedDoctor.availableSlots.length > 0 ? (
                      <div className="flex flex-wrap gap-3">
                        {selectedDoctor.availableSlots.filter(s => !s.isBooked).map((slot) => (
                          <button
                            key={slot.startTime}
                            onClick={() => setSelectedSlot(slot.startTime)}
                            className={`px-6 py-3 rounded-2xl text-sm font-bold transition-all ${
                              selectedSlot === slot.startTime 
                                ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/30' 
                                : 'bg-white/5 text-slate-400 hover:bg-white/10 border border-white/5'
                            }`}
                          >
                            {slot.startTime}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-400">No available slots for this date</p>
                    )}
                  </div>

                  {message && (
                    <div className={`mb-6 p-4 rounded-2xl text-sm font-bold flex items-center gap-3 ${
                      message.type === 'success' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                    }`}>
                      {message.type === 'success' ? <Sparkle size={20} /> : <WarningCircle size={20} />}
                      {message.text}
                    </div>
                  )}

                  <div className="flex gap-4">
                    <button 
                      onClick={() => setSelectedDoctor(null)}
                      className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold py-5 rounded-2xl transition-all"
                    >
                      Cancel
                    </button>
                    <button 
                      disabled={!selectedSlot || bookingLoading}
                      onClick={handleBook}
                      className="flex-[2] bg-teal-500 hover:bg-teal-400 disabled:opacity-30 disabled:hover:bg-teal-500 text-white font-black py-5 rounded-2xl transition-all shadow-xl shadow-teal-500/20 relative overflow-hidden"
                    >
                      {bookingLoading ? (
                        <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto" />
                      ) : (
                        'Confirm Appointment'
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
};

export default BookingPage;
