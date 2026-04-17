import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkle, WarningCircle, CheckCircle } from 'phosphor-react';
import SymptomForm from '../../components/ai/SymptomForm';
import ResultsPanel from '../../components/ai/ResultsPanel';
import SpecialistModal from '../../components/ai/SpecialistModal';
import HealthInsights from '../../components/ai/HealthInsights';
import { analyzeSymptoms, recommendSpecialist, getHealthInsights } from '../../api/ai';

const SymptomChecker: React.FC = () => {
  const [step, setStep] = useState<'input' | 'analysis' | 'recommendations'>('input');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [specialists, setSpecialists] = useState<any[]>([]);
  const [suggestedDoctors, setSuggestedDoctors] = useState<any[]>([]);
  const [insights, setInsights] = useState<any[]>([]);
  const [showSpecialistModal, setShowSpecialistModal] = useState(false);
  const [showInsights, setShowInsights] = useState(false);
  const [loadingExtras, setLoadingExtras] = useState(false);
  const [doctorCoverage, setDoctorCoverage] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [analysisHistoryId, setAnalysisHistoryId] = useState<string | null>(null);

  const handleSymptomSubmit = async (formData: any) => {
    setLoading(true);
    setError(null);
    setResults(null);
    setSpecialists([]);
    setSuggestedDoctors([]);
    setDoctorCoverage(null);
    setShowInsights(false);
    setAnalysisHistoryId(null);
    
    try {
      const response = await analyzeSymptoms(formData);
      setResults(response.data);
      setAnalysisHistoryId(response.analysisHistoryId || null);
      setStep('analysis');
    } catch (err: any) {
      // Better error messages for different scenarios
      let errorMessage = "An unexpected error occurred. Please try again.";
      
      if (err.response?.status === 503) {
        errorMessage = "AI service is temporarily unavailable due to high demand. Please try again in a few moments.";
      } else if (err.response?.status === 504) {
        errorMessage = "Request timeout. Please try again with simpler symptoms.";
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleFindSpecialist = async () => {
    setShowSpecialistModal(true);
    setLoadingExtras(true);
    try {
      const response = await recommendSpecialist({
        symptoms: Array.isArray(results?.symptoms) ? results.symptoms : [],
        conditions: Array.isArray(results?.conditions)
          ? results.conditions.map((item: any) => item?.name).filter(Boolean)
          : undefined,
        analysisHistoryId: analysisHistoryId || undefined,
      });
      setSpecialists(response.data.specialists);
      setSuggestedDoctors(response.data.suggestedDoctors || []);
      setDoctorCoverage(response.data.doctorCoverage || null);
      setStep('recommendations');
    } catch (err: any) {
      let errorMessage = "Failed to fetch specialist recommendations. Please try again.";
      
      if (err.response?.status === 503) {
        errorMessage = "AI service is temporarily unavailable. Please try again in a few moments.";
      } else if (err.response?.status === 504) {
        errorMessage = "Request timeout. Please try again.";
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoadingExtras(false);
    }
  };

  const handleGetHealthTips = async () => {
    setShowInsights(true);
    setLoadingExtras(true);
    try {
      const response = await getHealthInsights({
        symptoms: Array.isArray(results?.symptoms) ? results.symptoms : [],
        medicalHistory: results?.medicalHistory || '',
        age: Number(results?.age || 0),
        analysisHistoryId: analysisHistoryId || undefined,
      });
      setInsights(response.data.insights);
    } catch (err: any) {
      let errorMessage = "Failed to fetch health insights. Please try again.";

      if (err.response?.status === 503) {
        errorMessage = "AI service is temporarily unavailable. Please try again in a few moments.";
      } else if (err.response?.status === 504) {
        errorMessage = "Request timeout. Please try again.";
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
    } finally {
      setLoadingExtras(false);
    }
  };

  const stepItems = [
    { id: 'input', label: 'Symptoms', num: 1 },
    { id: 'analysis', label: 'AI Analysis', num: 2 },
    { id: 'recommendations', label: 'Health Plan', num: 3 }
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-transparent p-6 md:p-12 relative overflow-hidden"
    >
      {/* Premium Floating Background Shapes */}
      <motion.div 
        animate={{ 
          y: [0, 50, 0],
          x: [0, 30, 0],
          rotate: [0, 90, 0]
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] bg-blue-500/10 blur-[120px] rounded-full pointer-events-none" 
      />
      <motion.div 
        animate={{ 
          y: [0, -60, 0],
          x: [0, -40, 0],
          rotate: [0, -90, 0]
        }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        className="absolute bottom-[-10%] right-[-5%] w-[600px] h-[600px] bg-purple-600/10 blur-[130px] rounded-full pointer-events-none" 
      />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-cyan-600/5 blur-[180px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        <header className="mb-16 text-center">
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="inline-flex items-center gap-2 px-6 py-2 bg-white/5 border border-white/10 rounded-full mb-6 backdrop-blur-md shadow-inner"
          >
            <Sparkle size={18} weight="fill" className="text-cyan-400 animate-pulse" />
            <span className="text-sm font-bold tracking-[0.2em] uppercase text-cyan-200/80">Next-Gen Health Diagnostics</span>
          </motion.div>
          <h1 className="text-5xl md:text-7xl font-black text-white mb-6 tracking-tighter leading-tight italic flex items-center justify-center">
            Medora <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 underline decoration-cyan-500/30 ml-4">AI</span>
          </h1>
          <p className="text-cyan-100/60 mx-auto text-xl font-light leading-relaxed">
            Harnessing the power of advanced neural networks to provide rapid, accurate, and personalized health assessments.
          </p>

          <div className="flex items-center justify-center mt-12 gap-4">
            {stepItems.map((item, idx) => (
              <React.Fragment key={item.id}>
                <div className="flex flex-col items-center gap-2">
                  <motion.div
                    animate={{
                      backgroundColor: (step === item.id || (item.id === 'input' && results)) ? 'rgba(6, 182, 212, 0.4)' : 'rgba(255, 255, 255, 0.05)',
                      borderColor: (step === item.id || (item.id === 'input' && results)) ? 'rgba(6, 182, 212, 1)' : 'rgba(255, 255, 255, 0.1)',
                      scale: step === item.id ? 1.1 : 1
                    }}
                    className={`w-10 h-10 rounded-full border-2 flex items-center justify-center font-bold text-sm ${step === item.id ? 'text-white' : 'text-white/30'}`}
                  >
                    {(item.id === 'input' && results) ? <CheckCircle size={20} weight="fill" className="text-cyan-400" /> : item.num}
                  </motion.div>
                  <span className={`text-[10px] uppercase tracking-widest font-bold ${step === item.id ? 'text-cyan-400' : 'text-white/20'}`}>
                    {item.label}
                  </span>
                </div>
                {idx < stepItems.length - 1 && (
                  <div className="w-16 h-[2px] mb-6 bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      animate={{ 
                        width: (idx === 0 && results) || (idx === 1 && step === 'recommendations') ? '100%' : '0%' 
                      }}
                      className="h-full bg-cyan-500"
                    />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </header>

        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ height: 0, opacity: 0, y: -20 }}
              animate={{ height: 'auto', opacity: 1, y: 0 }}
              exit={{ height: 0, opacity: 0, y: -20 }}
              className="mb-8 overflow-hidden"
            >
              <div className="bg-rose-500/10 border border-rose-500/20 p-5 rounded-2xl flex items-center gap-4 text-rose-300 backdrop-blur-xl shadow-2xl">
                <div className="w-10 h-10 bg-rose-500/20 rounded-full flex items-center justify-center shrink-0">
                  <WarningCircle size={24} weight="bold" />
                </div>
                <div>
                  <h4 className="font-bold text-rose-200">Processing Error</h4>
                  <p className="text-sm opacity-80">{error}</p>
                </div>
                <button onClick={() => setError(null)} className="ml-auto p-2 hover:bg-white/10 rounded-xl transition-colors">✕</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          <motion.div 
            animate={{ 
              opacity: step !== 'input' ? 0.4 : 1,
              filter: step !== 'input' ? 'grayscale(0.5) blur(1px)' : 'none'
            }}
            className="lg:col-span-5"
          >
            <SymptomForm onSubmit={handleSymptomSubmit} loading={loading} />
          </motion.div>

          <div className="lg:col-span-7">
            {step === 'recommendations' && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 text-emerald-100"
              >
                <p className="text-sm font-semibold">
                  AI matched {doctorCoverage?.totalSuggestedDoctors ?? suggestedDoctors.length} registered doctors across {doctorCoverage?.specialtiesWithDoctors ?? 0} specialties.
                </p>
                <p className="text-xs text-emerald-100/70 mt-1">
                  Open the doctor match panel to continue directly to booking with the most relevant specialization.
                </p>
              </motion.div>
            )}

            <AnimatePresence mode="wait">
              {(loading || results) ? (
                <motion.div
                  key="results"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <ResultsPanel 
                    results={results} 
                    loading={loading}
                    onFindSpecialist={handleFindSpecialist}
                    onGetHealthTips={handleGetHealthTips}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="h-full min-h-[500px] flex flex-col items-center justify-center p-12 text-center backdrop-blur-xl bg-white/5 rounded-3xl border border-white/10 relative group overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                  
                  <motion.div 
                    animate={{ 
                      y: [0, -10, 0],
                      scale: [1, 1.05, 1]
                    }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="w-24 h-24 bg-gradient-to-inner from-white/10 to-transparent rounded-full flex items-center justify-center mb-10 shadow-2xl border border-white/5 relative z-10"
                  >
                    <Sparkle size={48} className="text-cyan-400 group-hover:text-cyan-300 transition-colors" />
                  </motion.div>
                  <h3 className="text-3xl font-black text-white mb-4 relative z-10 tracking-tight">Medora AI Intelligence</h3>
                  <p className="text-cyan-100/40 text-lg max-w-sm leading-relaxed relative z-10 font-light">
                    Initiate diagnostic sequence by describing your symptoms. Our AI will analyze patterns and provide clinical insights.
                  </p>
                  
                  <div className="mt-12 flex gap-3 relative z-10 opacity-40">
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse delay-75" />
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse delay-150" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <AnimatePresence>
          {showInsights && (
            <HealthInsights insights={insights} loading={loadingExtras} />
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showSpecialistModal && (
          <SpecialistModal 
            specialists={specialists} 
            suggestedDoctors={suggestedDoctors}
            loading={loadingExtras} 
            onClose={() => setShowSpecialistModal(false)} 
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default SymptomChecker;
