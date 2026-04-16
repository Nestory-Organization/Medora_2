import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, CaretRight, Trash, Brain, Layout, Calendar, Flask } from '@phosphor-icons/react';
import { getAiHistory, deleteAiHistoryItem } from '../../api/ai';
import PageTransition from '../../components/PageTransition';

interface HistoryItem {
  _id: string;
  type: 'analysis' | 'recommendation' | 'insight';
  inputData: any;
  resultData: any;
  createdAt: string;
}

const HistoryCard = ({ item, onDelete }: { item: HistoryItem; onDelete: (id: string) => void }) => {
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
            className={`p-2 rounded-lg transition-all ${isExpanded ? 'bg-cyan-500/20 text-cyan-400' : 'bg-white/5 text-slate-400 hover:text-white'}`}
          >
            <CaretRight size={18} weight="bold" className={`transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`} />
          </button>
          <button 
            onClick={() => onDelete(item._id)}
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
            <div className="pt-4 space-y-4">
              <div>
                <p className="text-[10px] uppercase font-black text-slate-500 mb-2 tracking-widest">Input Symptoms</p>
                <div className="flex flex-wrap gap-2">
                  {item.inputData.symptoms?.map((s: string) => (
                    <span key={s} className="px-2 py-1 bg-white/5 border border-white/10 rounded-md text-[10px] text-slate-300 uppercase font-bold">{s}</span>
                  ))}
                </div>
              </div>
              
              <div>
                <p className="text-[10px] uppercase font-black text-slate-500 mb-2 tracking-widest">Summary result</p>
                <p className="text-xs text-slate-300 leading-relaxed italic">
                  {item.type === 'analysis' ? item.resultData.advice : 
                   item.type === 'recommendation' ? `Found ${item.resultData.specialtyRecommendations?.length || 0} specialties` : 
                   'Personalized health tips generated.'}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default function AiHistoryPage() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await getAiHistory();
      setHistory(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteAiHistoryItem(id);
      setHistory(history.filter(item => item._id !== id));
    } catch (err) {
      console.error(err);
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
        </header>

        {loading ? (
          <div className="grid gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-slate-900/40 border border-white/5 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : history.length > 0 ? (
          <div className="grid gap-4 max-w-4xl">
            {history.map(item => (
              <HistoryCard key={item._id} item={item} onDelete={handleDelete} />
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
