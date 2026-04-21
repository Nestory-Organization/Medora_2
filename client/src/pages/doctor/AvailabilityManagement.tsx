import { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Plus, 
  Trash, 
  CheckCircle, 
  XCircle, 
  ArrowLeft, 
  CalendarCheck,
  List
} from '@phosphor-icons/react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useRefreshOnNavigate } from '../../hooks/useRefreshOnNavigate';

interface TimeSlot {
  startTime: string;
  endTime: string;
}

interface DailyAvailability {
  _id: string;
  date: string;
  slots: {
    startTime: string;
    endTime: string;
    isBooked: boolean;
  }[];
}

export default function AvailabilityManagement() {
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [slots, setSlots] = useState<TimeSlot[]>([
    { startTime: '09:00', endTime: '10:00' }
  ]);
  const [availabilityList, setAvailabilityList] = useState<DailyAvailability[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const fetchAvailability = async () => {
    setFetching(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get(
        'http://localhost:4000/api/doctors/availability',
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      if (response.data.success) {
        setAvailabilityList(response.data.data);
      }
    } catch (error: any) {
      console.error('Fetch availability error:', error);
    } finally {
      setFetching(false);
    }
  };

  // Refresh availability data when navigating to this page
  useRefreshOnNavigate(fetchAvailability);

  useEffect(() => {
    fetchAvailability();
  }, []);

  const handleAddSlot = () => {
    setSlots([...slots, { startTime: '', endTime: '' }]);
  };

  const handleRemoveSlot = (index: number) => {
    setSlots(slots.filter((_, i) => i !== index));
  };

  const handleSlotChange = (index: number, field: keyof TimeSlot, value: string) => {
    const newSlots = [...slots];
    newSlots[index][field] = value;
    setSlots(newSlots);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setMessage({ type: 'error', text: 'No authentication token found. Please login again.' });
        setLoading(false);
        return;
      }

      const response = await axios.post(
        'http://localhost:4000/api/doctors/availability',
        { date, slots },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        setMessage({ type: 'success', text: 'Availability updated successfully!' });
        fetchAvailability();
      }
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to update availability' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-6 h-1 bg-blue-500 rounded-full" />
            <span className="text-[9px] font-black text-blue-500 tracking-[0.2em] uppercase italic">Schedule Management</span>
          </div>
          <h1 className="text-2xl font-black tracking-tighter text-white mb-0.5 leading-none uppercase italic">
            Doctor <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-500">Availability</span>
          </h1>
        </div>
        <Link to="/doctor/dashboard" className="px-4 py-2 bg-slate-800/50 hover:bg-slate-800 text-slate-300 rounded-xl font-bold text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all border border-white/5">
          <ArrowLeft weight="bold" />
          Back to Dashboard
        </Link>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Configuration Form */}
        <div className="lg:col-span-12">
          <form onSubmit={handleSubmit} className="bg-slate-900/40 backdrop-blur-md border border-white/5 p-8 rounded-3xl shadow-2xl space-y-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-[80px] -mr-20 -mt-20" />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
              <div className="space-y-4">
                <label className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                  <CalendarIcon size={14} weight="duotone" className="text-blue-500" />
                  Select Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-slate-800/50 border border-white/10 rounded-2xl px-5 py-4 text-white font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all uppercase tracking-tighter"
                  required
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                    <Clock size={14} weight="duotone" className="text-indigo-500" />
                    Time Slots
                  </label>
                  <button 
                    type="button"
                    onClick={handleAddSlot}
                    className="p-2 bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-500 hover:text-white transition-all scale-90"
                  >
                    <Plus weight="bold" size={14} />
                  </button>
                </div>

                <div className="space-y-3">
                  {slots.map((slot, index) => (
                    <div key={index} className="flex gap-3 group">
                      <div className="flex-1 grid grid-cols-2 gap-2">
                        <input
                          type="time"
                          value={slot.startTime}
                          onChange={(e) => handleSlotChange(index, 'startTime', e.target.value)}
                          className="bg-slate-800/30 border border-white/5 rounded-xl px-4 py-3 text-sm text-white font-bold focus:ring-1 focus:ring-blue-500/30 outline-none transition-all"
                          required
                        />
                        <input
                          type="time"
                          value={slot.endTime}
                          onChange={(e) => handleSlotChange(index, 'endTime', e.target.value)}
                          className="bg-slate-800/30 border border-white/5 rounded-xl px-4 py-3 text-sm text-white font-bold focus:ring-1 focus:ring-blue-500/30 outline-none transition-all"
                          required
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveSlot(index)}
                        className="p-3 bg-red-500/10 text-red-400 rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white"
                      >
                        <Trash size={14} weight="bold" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {message && (
                  <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest ${
                    message.type === 'success' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                  }`}>
                    {message.type === 'success' ? <CheckCircle size={14} /> : <XCircle size={14} />}
                    {message.text}
                  </div>
                )}
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className="w-full md:w-auto px-10 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl font-black text-white shadow-2xl shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 uppercase tracking-[0.2em] text-xs disabled:opacity-50"
              >
                {loading ? 'Saving...' : (
                  <>
                    <CalendarCheck weight="bold" size={18} />
                    Save Availability
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Availability List */}
        <div className="lg:col-span-12 space-y-4">
          <h3 className="text-lg font-black tracking-tighter text-white italic uppercase flex items-center gap-3 px-1">
            <List size={20} weight="bold" className="text-blue-500" />
            Current Schedule List
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {fetching ? (
              <div className="col-span-full py-12 text-center text-slate-500 font-bold uppercase tracking-widest animate-pulse">
                Fetching availability records...
              </div>
            ) : availabilityList.length === 0 ? (
              <div className="col-span-full py-12 bg-slate-900/20 border border-dashed border-white/10 rounded-3xl text-center">
                <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">No availability records found.</p>
              </div>
            ) : (
              availabilityList.map((item) => (
                <div key={item._id} className="bg-slate-900/60 border border-white/5 p-5 rounded-2xl group hover:border-blue-500/20 transition-all duration-300 shadow-xl">
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg">
                        <CalendarIcon size={16} weight="duotone" />
                      </div>
                      <span className="font-bold text-white text-[13px] tracking-tight">
                        {new Date(item.date).toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-2">
                    {item.slots.map((slot, sIdx) => (
                      <div key={sIdx} className="flex items-center justify-between px-3 py-2 bg-slate-800/40 border border-white/5 rounded-xl uppercase">
                        <span className="text-[10px] font-black text-slate-400 tracking-tighter">
                          {slot.startTime} - {slot.endTime}
                        </span>
                        <span className={`text-[8px] font-black px-2 py-0.5 rounded-full tracking-widest ${
                          slot.isBooked 
                            ? 'bg-red-500/10 text-red-400' 
                            : 'bg-green-500/10 text-green-400'
                        }`}>
                          {slot.isBooked ? 'BOOKED' : 'AVAILABLE'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}