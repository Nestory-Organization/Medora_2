import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, CaretRight, Trash, Brain, Layout, Calendar, Flask } from '@phosphor-icons/react';
import { getAiHistory, deleteAiHistoryItem, type AiHistoryItem } from '../../api/ai';
import PageTransition from '../../components/PageTransition';

const asStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item)).filter(Boolean);
};

const getHistorySummary = (item: AiHistoryItem): string => {
  const data = item.resultData || {};

  if (item.type === 'analysis') {
    const advice = typeof data.advice === 'string' ? data.advice : '';
    const possibleConditions = Array.isArray(data.possibleConditions) ? data.possibleConditions.length : 0;
    const recommendedDoctors = Array.isArray(data.recommendedDoctors) ? data.recommendedDoctors.length : 0;
    const hasWellnessProtocol = Boolean(data.wellnessProtocol);
    if (advice) return advice;
    if (recommendedDoctors > 0 || hasWellnessProtocol) {
      return `Analysis linked with ${recommendedDoctors} recommended doctors and wellness protocol.`;
    }
    if (possibleConditions > 0) return `Potential conditions identified: ${possibleConditions}.`;
    return 'AI symptom analysis completed.';
  }

  if (item.type === 'recommendation') {
    const specialties = Array.isArray(data.specialtyRecommendations) ? data.specialtyRecommendations.length : 0;
    const doctors = Array.isArray(data.suggestedDoctors) ? data.suggestedDoctors.length : 0;
    if (specialties > 0 || doctors > 0) {
      return `Recommended ${specialties} specialties with ${doctors} matched doctors.`;
    }
    return 'Specialist recommendations generated.';
  }

  const insights = Array.isArray(data.insights) ? data.insights.length : 0;
  if (insights > 0) return `Generated ${insights} personalized health insights.`;
  return 'Health insights generated.';
};

const HistoryCard = ({
  item,
  onDelete,
  deleting,
}: {
  item: AiHistoryItem;
  onDelete: (id: string) => void;
  deleting: boolean;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const date = new Date(item.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const getTypeIcon = () => {
    switch (item.type) {
      case 'analysis': return <Flask className="text-cyan-400" size={20} />;
      case 'recommendation': return <Brain className="text-purple-400" size={20} />;
      case 'insight': return <Layout className="text-emerald-400" size={20} />;
      default: return <Clock className="text-slate-400" size={20} />;
    }
  };

  const getTitle = () => {
    if (item.type === 'analysis') return 'Symptom Analysis';
    if (item.type === 'recommendation') return 'Specialist Recommendation';
    return 'Health Insights';
  };

  const symptoms = asStringArray((item.inputData || {}).symptoms);
  const description = typeof item.inputData?.description === 'string' ? item.inputData.description : null;
  const conditions = asStringArray((item.inputData || {}).conditions);
  const duration = typeof item.inputData?.duration === 'string' ? item.inputData.duration : null;
  const severity = item.inputData?.severity;
  const age = item.inputData?.age;

  const resultConditions = Array.isArray(item.resultData?.possibleConditions) 
    ? item.resultData.possibleConditions 
    : [];
  const redFlags = Array.isArray(item.resultData?.redFlags) ? item.resultData.redFlags : [];
  const recommendations = Array.isArray(item.resultData?.recommendations) ? item.resultData.recommendations : [];

  const linkedDoctors = Array.isArray(item.resultData?.recommendedDoctors)
    ? item.resultData.recommendedDoctors
    : [];
  const wellnessProtocol = item.resultData?.wellnessProtocol;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-900/40 border border-white/5 rounded-2xl overflow-hidden group hover:border-white/10 transition-all"
    >
      <div className="p-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
            {getTypeIcon()}
          </div>
          <div>
            <h4 className="font-bold text-white group-hover:text-cyan-400 transition-colors uppercase text-xs tracking-widest">{getTitle()}</h4>
            <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium">
              <Calendar size={12} weight="bold" />
              {date}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            aria-label={isExpanded ? 'Collapse history details' : 'Expand history details'}
            title={isExpanded ? 'Collapse history details' : 'Expand history details'}
            className={`p-2 rounded-lg transition-all ${isExpanded ? 'bg-cyan-500/20 text-cyan-400' : 'bg-white/5 text-slate-400 hover:text-white'}`}
          >
            <CaretRight size={18} weight="bold" className={`transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`} />
          </button>
          <button 
            onClick={() => onDelete(item._id)}
            aria-label="Delete history entry"
            title="Delete history entry"
            disabled={deleting}
            className="p-2 rounded-lg bg-white/5 text-slate-400 hover:bg-rose-500/20 hover:text-rose-400 transition-all"
          >
            <Trash size={18} weight="bold" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-5 pb-5 border-t border-white/5"
          >
            <div className="pt-4 space-y-6">
              {description && (
                <div>
                  <p className="text-[10px] uppercase font-black text-slate-500 mb-2 tracking-widest">Case Description</p>
                  <p className="text-xs text-slate-300 italic p-3 bg-white/5 rounded-xl border border-white/5">"{description}"</p>
                </div>
              )}

              {symptoms.length > 0 && (
                <div>
                  <p className="text-[10px] uppercase font-black text-slate-500 mb-2 tracking-widest">Reported Symptoms</p>
                  <div className="flex flex-wrap gap-2">
                    {symptoms.map((s) => (
                      <span key={s} className="px-2 py-1 bg-white/5 border border-white/10 rounded-md text-[10px] text-slate-300 uppercase font-bold">{s}</span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {duration && <span className="px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-cyan-500/10 text-cyan-200 border border-cyan-500/20">Duration: {duration}</span>}
                {severity !== undefined && severity !== null && <span className="px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-200 border border-amber-500/20">Severity: {String(severity)}/10</span>}
                {age !== undefined && age !== null && <span className="px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-200 border border-emerald-500/20">Age: {String(age)}</span>}
              </div>

              {/* Detailed Results Section */}
              {item.type === 'analysis' && resultConditions.length > 0 && (
                <div className="space-y-4 pt-2">
                  <p className="text-[10px] uppercase font-black text-cyan-400 mb-2 tracking-widest">Diagnostic Findings</p>
                  <div className="space-y-3">
                    {resultConditions.map((c: any, i: number) => (
                      <div key={i} className="bg-white/5 p-3 rounded-xl border border-white/5">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs font-bold text-white">{c.condition || c.name}</span>
                          <span className="text-[10px] font-black text-cyan-400">{c.confidence || c.probability}%</span>
                        </div>
                        {c.description && <p className="text-[10px] text-slate-400 leading-relaxed">{c.description}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {redFlags.length > 0 && (
                <div>
                  <p className="text-[10px] uppercase font-black text-rose-400 mb-2 tracking-widest">Warning Signs</p>
                  <ul className="space-y-1">
                    {redFlags.map((f, i) => (
                      <li key={i} className="text-[10px] text-rose-200/60 flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-rose-500" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {recommendations.length > 0 && (
                <div>
                  <p className="text-[10px] uppercase font-black text-emerald-400 mb-2 tracking-widest">Medical Guidance</p>
                  <ul className="space-y-1">
                    {recommendations.map((r, i) => (
                      <li key={i} className="text-[10px] text-emerald-200/60 flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-emerald-400" />
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              <div>
                <p className="text-[10px] uppercase font-black text-slate-500 mb-2 tracking-widest">Summary result</p>
                <p className="text-xs text-slate-300 leading-relaxed italic">
                  {getHistorySummary(item)}
                </p>
              </div>

              {item.type === 'analysis' && linkedDoctors.length > 0 && (
                <div>
                  <p className="text-[10px] uppercase font-black text-slate-500 mb-2 tracking-widest">Recommended Doctors Saved</p>
                  <div className="flex flex-wrap gap-2">
                    {linkedDoctors.slice(0, 5).map((doctor: any, idx: number) => (
                      <span key={`${doctor?.doctorId || doctor?.name || idx}`} className="px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-md text-[10px] text-emerald-200 uppercase font-bold">
                        {String(doctor?.name || doctor?.specialization || 'Doctor')}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {item.type === 'analysis' && wellnessProtocol && (
                <div>
                  <p className="text-[10px] uppercase font-black text-slate-500 mb-2 tracking-widest">Wellness Protocol Saved</p>
                  <p className="text-xs text-slate-300 leading-relaxed italic">
                    Wellness guidance has been attached to this analysis entry.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default function AiHistoryPage() {
  const [history, setHistory] = useState<AiHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isFetchingRef = useRef(false);

  useEffect(() => {
    void fetchHistory();
  }, []);

  const fetchHistory = async () => {
    if (isFetchingRef.current) {
      return;
    }

    isFetchingRef.current = true;
    try {
      setError(null);
      const response = await getAiHistory();
      setHistory(response.data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load AI history.');
    } finally {
      isFetchingRef.current = false;
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setDeletingId(id);
      setError(null);
      await deleteAiHistoryItem(id);
      setHistory(history.filter(item => item._id !== id));
    } catch (err: any) {
      setError(err?.message || 'Failed to delete history entry.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen p-6 md:p-12">
        <header className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-cyan-500/20 rounded-xl">
              <Clock size={24} weight="fill" className="text-cyan-400" />
            </div>
            <h1 className="text-3xl font-black text-white italic">AI Analysis <span className="text-cyan-400">History</span></h1>
          </div>
          <p className="text-slate-400 text-sm max-w-2xl font-medium tracking-tight">Review your previous symptom assessments and AI-powered medical insights.</p>
          <button
            type="button"
            onClick={() => void fetchHistory()}
            className="mt-4 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold uppercase tracking-wider text-slate-200 hover:bg-white/10 transition-colors"
          >
            Refresh History
          </button>
        </header>

        {error && (
          <div className="mb-6 p-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 text-rose-200 text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-slate-900/40 border border-white/5 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : history.length > 0 ? (
          <div className="grid gap-4 max-w-4xl">
            {history.map(item => (
              <HistoryCard
                key={item._id}
                item={item}
                onDelete={handleDelete}
                deleting={deletingId === item._id}
              />
            ))}
          </div>
        ) : (
          <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-12 text-center">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
              <Clock size={32} weight="bold" className="text-slate-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No history found</h3>
            <p className="text-slate-500 text-sm">Start an AI analysis to see your history here.</p>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
