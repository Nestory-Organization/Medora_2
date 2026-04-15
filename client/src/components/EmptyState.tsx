import React from 'react';
import { Ghost, FileX, CalendarX, Database } from '@phosphor-icons/react';
import { motion } from 'framer-motion';

interface EmptyStateProps {
  type?: 'appointments' | 'reports' | 'history' | 'default';
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const icons = {
  appointments: CalendarX,
  reports: FileX,
  history: Database,
  default: Ghost
};

const EmptyState: React.FC<EmptyStateProps> = ({ type = 'default', title, description, action }) => {
  const Icon = icons[type];

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center p-12 bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-3xl text-center space-y-4 shadow-2xl shadow-black/20"
    >
      <div className="p-6 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-400 mb-2 ring-1 ring-white/10 ring-offset-4 ring-offset-slate-950">
        <Icon size={48} weight="duotone" />
      </div>
      <div className="space-y-1">
        <h3 className="text-xl font-bold text-white tracking-tight">{title}</h3>
        <p className="text-slate-400 text-sm max-w-[280px] leading-relaxed mx-auto font-medium">
          {description}
        </p>
      </div>
      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 px-6 py-2.5 bg-teal-500 hover:bg-teal-400 text-white text-sm font-bold rounded-xl transition-all hover:scale-105 active:scale-95 shadow-lg shadow-teal-500/20"
        >
          {action.label}
        </button>
      )}
    </motion.div>
  );
};

export default EmptyState;
