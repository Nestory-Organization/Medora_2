import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Sparkle } from 'phosphor-react';

interface SymptomFormProps {
  onSubmit: (data: any) => void;
  loading: boolean;
}

const COMMON_SYMPTOMS = [
  'Headache', 'Fever', 'Cough', 'Fatigue', 'Nausea', 
  'Dizziness', 'Chest Pain', 'Shortness of Breath', 
  'Abdominal Pain', 'Sore Throat', 'Body Ache', 'Runny Nose'
];

const SymptomForm: React.FC<SymptomFormProps> = ({ onSubmit, loading }) => {
  const [symptomInput, setSymptomInput] = useState('');
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState('1 day');
  const [severity, setSeverity] = useState(5);
  const [age, setAge] = useState<number | ''>('');
  const [medicalHistory, setMedicalHistory] = useState('');

  const toggleSymptom = (symptom: string) => {
    if (symptoms.includes(symptom)) {
      setSymptoms(symptoms.filter((s) => s !== symptom));
    } else {
      setSymptoms([...symptoms, symptom]);
    }
  };

  const addSymptom = () => {
    if (symptomInput.trim() && !symptoms.includes(symptomInput.trim())) {
      setSymptoms([...symptoms, symptomInput.trim()]);
      setSymptomInput('');
    }
  };

  const removeSymptom = (symptom: string) => {
    setSymptoms(symptoms.filter((s) => s !== symptom));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSymptom();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (symptoms.length === 0 && !description.trim()) {
      alert('Please select at least one symptom or describe your symptoms');
      return;
    }
    onSubmit({
      symptoms,
      description,
      duration,
      severity,
      age: Number(age),
      medicalHistory,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="backdrop-blur-3xl bg-white/10 p-10 rounded-[2rem] border border-white/20 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] relative overflow-hidden group"
    >
      {/* Decorative gradient corner */}
      <div className="absolute top-0 left-0 w-32 h-32 bg-cyan-500/10 blur-3xl -ml-16 -mt-16 group-hover:bg-cyan-500/20 transition-all duration-700" />
      
      <h2 className="text-3xl font-black text-white mb-10 flex items-center gap-3">
        <div className="p-2 bg-cyan-500/20 rounded-xl">
          <Plus size={24} weight="bold" className="text-cyan-400" />
        </div>
        Symptom Checker
      </h2>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Common Symptoms Selection */}
        <div className="space-y-4">
          <label className="text-[10px] uppercase tracking-[0.2em] font-black text-cyan-200/50 block">Select Common Symptoms</label>
          <div className="flex flex-wrap gap-2">
            {COMMON_SYMPTOMS.map((symptom) => {
              const isSelected = symptoms.includes(symptom);
              return (
                <button
                  key={symptom}
                  type="button"
                  onClick={() => toggleSymptom(symptom)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                    isSelected 
                      ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-200' 
                      : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10 hover:border-white/20'
                  }`}
                >
                  {symptom}
                </button>
              );
            })}
          </div>
        </div>

        {/* Symptoms Input */}
        <div className="space-y-4">
          <label className="text-[10px] uppercase tracking-[0.2em] font-black text-cyan-200/50 block">Other Symptoms</label>
          <div className="relative group/input">
            <input
              type="text"
              value={symptomInput}
              onChange={(e) => setSymptomInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="E.g. Persistent fatigue, Chest pain..."
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-4 focus:ring-cyan-500/20 focus:border-cyan-500/50 transition-all duration-300 pr-16"
            />
            <button
              type="button"
              onClick={addSymptom}
              className="absolute right-2 top-2 bottom-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white w-12 rounded-xl flex items-center justify-center transition-all shadow-lg active:scale-95"
            >
              <Plus weight="bold" size={20} />
            </button>
          </div>
          <div className="flex flex-wrap gap-2.5 min-h-[40px]">
            <AnimatePresence>
              {symptoms.filter(s => !COMMON_SYMPTOMS.includes(s)).map((symptom) => (
                <motion.span
                  key={symptom}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  className="bg-white/5 text-cyan-200 border border-white/10 px-4 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-white/10 hover:border-cyan-500/30 transition-all cursor-default group"
                >
                  {symptom}
                  <button
                    type="button"
                    onClick={() => removeSymptom(symptom)}
                    className="text-white/30 hover:text-rose-400 transition-colors"
                  >
                    <X size={14} weight="bold" />
                  </button>
                </motion.span>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Optional Description */}
        <div className="space-y-4">
          <label className="text-[10px] uppercase tracking-[0.2em] font-black text-cyan-200/50 block">Describe your symptoms (Optional)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Tell us more about how you feel..."
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-4 focus:ring-cyan-500/20 focus:border-cyan-500/50 min-h-[100px] transition-all text-sm font-medium"
          />
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* Duration */}
          <div className="space-y-4">
            <label className="text-[10px] uppercase tracking-[0.2em] font-black text-cyan-200/50 block">Duration of Onset</label>

            <div className="relative">
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:ring-4 focus:ring-cyan-500/20 focus:border-cyan-500/50 transition-all appearance-none font-bold text-sm"
              >
                <option className="bg-slate-900" value="1 day">1 Day</option>
                <option className="bg-slate-900" value="2 days">2 Days</option>
                <option className="bg-slate-900" value="1 week">1 Week</option>
                <option className="bg-slate-900" value="More than a month">Over 1 Month</option>
              </select>
            </div>
          </div>

          {/* Age */}
          <div className="space-y-4">
            <label className="text-[10px] uppercase tracking-[0.2em] font-black text-cyan-200/50 block">Patient Age</label>
            <input
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value === '' ? '' : parseInt(e.target.value))}
              placeholder="YY"
              required
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:ring-4 focus:ring-cyan-500/20 focus:border-cyan-500/50 transition-all font-bold text-sm"
            />
          </div>
        </div>

        {/* Severity */}
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <label className="text-[10px] uppercase tracking-[0.2em] font-black text-cyan-200/50">Discomfort Level</label>
            <span className={`px-3 py-1 rounded-lg text-[10px] font-black tracking-widest uppercase ${severity > 7 ? 'bg-rose-500/20 text-rose-400' : 'bg-cyan-500/20 text-cyan-400'}`}>
              Level {severity}
            </span>
          </div>
          <div className="px-1">
            <input
              type="range"
              min="1"
              max="10"
              value={severity}
              onChange={(e) => setSeverity(parseInt(e.target.value))}
              className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-cyan-500 hover:accent-cyan-400 transition-all shadow-[0_0_10px_rgba(6,182,212,0.1)]"
            />
            <div className="flex justify-between mt-3 px-1">
              <span className="text-[8px] font-black text-white/20 uppercase tracking-tighter">Mild</span>
              <span className="text-[8px] font-black text-white/20 uppercase tracking-tighter">Severe</span>
            </div>
          </div>
        </div>

        {/* Medical History */}
        <div className="space-y-4">
          <label className="text-[10px] uppercase tracking-[0.2em] font-black text-cyan-200/50 block">Clinical Context</label>
          <textarea
            value={medicalHistory}
            onChange={(e) => setMedicalHistory(e.target.value)}
            placeholder="Existing hyper-tensions, medications, allergies..."
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:ring-4 focus:ring-cyan-500/20 focus:border-cyan-500/50 min-h-[120px] transition-all text-sm font-medium"
          />
        </div>

        {/* Submit Button */}
        <motion.button
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={loading}
          className={`w-full py-5 rounded-2xl font-black text-white uppercase tracking-[0.25em] text-xs transition-all flex items-center justify-center gap-3 overflow-hidden relative group ${
            loading 
              ? 'bg-slate-800 cursor-not-allowed' 
              : 'bg-gradient-to-r from-cyan-600 via-cyan-500 to-blue-600 shadow-[0_20px_40px_-10px_rgba(6,182,212,0.4)] hover:shadow-[0_25px_50px_-10px_rgba(6,182,212,0.6)]'
          }`}
        >
          {loading && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
          )}
          {loading ? (
            'Processing Engine...'
          ) : (
            <>
              Execute Analysis
              <Sparkle size={18} weight="fill" className="animate-pulse" />
            </>
          )}
        </motion.button>
      </form>
    </motion.div>
  );
};

export default SymptomForm;
