import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Pill, 
  Calendar, 
  User, 
  Plus, 
  Stethoscope, 
} from '@phosphor-icons/react';
import { getMedicalHistory, addMedicalHistory } from '../../api/patient';

const HistoryCard = ({ entry }: any) => (
  <motion.div 
    layout
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="bg-slate-900/50 backdrop-blur-xl border border-white/5 p-6 rounded-4xl shadow-2xl relative overflow-hidden group hover:border-teal-500/20 transition-all duration-300"
  >
    <div className="absolute top-0 right-0 p-6 pointer-events-none text-teal-400 group-hover:scale-110 transition-transform duration-500 opacity-20 group-hover:opacity-40">
      <Stethoscope size={64} weight="duotone" />
    </div>
    
    <div className="flex items-center gap-4 mb-6">
      <div className="p-3 bg-teal-500/10 text-teal-400 rounded-xl">
        <Calendar size={20} weight="duotone" />
      </div>
      <div>
        <p className="font-bold text-white text-lg tracking-tight">{entry.condition}</p>
        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">{entry.date}</p>
      </div>
    </div>
    
    <div className="space-y-4 relative z-10">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 border border-slate-700">
          <User size={16} weight="duotone" />
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Diagnosed By</p>
          <p className="text-sm font-semibold text-slate-300">Dr. {entry.doctorName}</p>
        </div>
      </div>
      
      <div className="bg-slate-950/40 rounded-2xl p-4 border border-white/5">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
          <Pill size={12} weight="duotone" /> Treatment / Notes
        </p>
        <p className="text-sm text-slate-400 leading-relaxed font-medium">
          {entry.notes || "No additional notes provided."}
        </p>
      </div>
    </div>
  </motion.div>
);

export default function MedicalHistory() {
  const [history, setHistory] = useState<any[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEntry, setNewEntry] = useState({ condition: '', date: '', doctorName: '', notes: '' });

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await getMedicalHistory();
        setHistory(res.data);
      } catch (err) {
        console.error("Failed to load history", err);
      }
    };
    fetchHistory();
  }, []);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addMedicalHistory(newEntry);
      setHistory([newEntry, ...history]);
      setShowAddForm(false);
      setNewEntry({ condition: '', date: '', doctorName: '', notes: '' });
    } catch (err) {
      console.error("Failed to add history", err);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between items-start gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold bg-linear-to-r from-teal-400 to-blue-500 bg-clip-text text-transparent">Medical History</h1>
          <p className="text-slate-500 font-medium">Keep track of your past diagnoses and treatments.</p>
        </div>
        <button 
          onClick={() => setShowAddForm(true)}
          className="px-8 py-3.5 bg-linear-to-r from-teal-400 to-blue-500 rounded-2xl text-sm font-extrabold text-white shadow-xl shadow-teal-500/20 active:scale-95 transition-all flex items-center gap-2.5"
        >
          <Plus weight="bold" /> Add History
        </button>
      </div>

      <AnimatePresence>
        {showAddForm && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-8"
          >
            <div className="bg-slate-900/50 backdrop-blur-xl border border-white/5 border-dashed rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden group hover:border-teal-500/40 transition-all duration-300">
              <form onSubmit={handleAddSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Condition</label>
                  <input 
                    required placeholder="e.g. Seasonal Allergy" 
                    title="Medical Condition"
                    className="w-full bg-slate-950/50 border border-white/5 rounded-2xl py-3.5 px-5 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-teal-500/50 transition-all"
                    value={newEntry.condition} onChange={e => setNewEntry({...newEntry, condition: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Date</label>
                  <input 
                    required type="date"
                    title="Diagnosis Date"
                    className="w-full bg-slate-950/50 border border-white/5 rounded-2xl py-3.5 px-5 text-slate-100 focus:outline-none focus:border-teal-500/50 transition-all"
                    value={newEntry.date} onChange={e => setNewEntry({...newEntry, date: e.target.value})}
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Doctor Name</label>
                  <input 
                    required placeholder="e.g. Smith" 
                    title="Doctor's Name"
                    className="w-full bg-slate-950/50 border border-white/5 rounded-2xl py-3.5 px-5 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-teal-500/50 transition-all"
                    value={newEntry.doctorName} onChange={e => setNewEntry({...newEntry, doctorName: e.target.value})}
                  />
                </div>
                <div className="md:col-span-2 space-y-2 text-right">
                  <button type="button" onClick={() => setShowAddForm(false)} className="px-6 py-3 font-bold text-slate-400 hover:text-white transition-colors">Discard</button>
                  <button type="submit" className="px-8 py-3 bg-teal-500 hover:bg-teal-400 rounded-xl font-bold text-white shadow-lg shadow-teal-500/10 transition-all">Save Entry</button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {history.length > 0 ? (
          history.map((entry, idx) => <HistoryCard key={idx} entry={entry} />)
        ) : (
          <div className="col-span-2 py-24 text-center border border-white/5 border-dashed rounded-[3rem] bg-slate-900/20">
            <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">Your medical history is clear.</p>
          </div>
        )}
      </div>
    </div>
  );
}
