import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeClosed, EnvelopeSimple, LockKey } from '@phosphor-icons/react';
import { Link } from 'react-router-dom';

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      // Let's pretend there's an error for demonstration
      // setError("Invalid credentials or account does not exist.");
    }, 1500);
  };

  return (
    <>
      <div className="mb-8 text-center text-white">
        <h2 className="text-3xl font-bold mb-2">Welcome Back</h2>
        <p className="text-slate-400">Log in to safely manage your health insights.</p>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} className="space-y-5 text-white">
        <div className="space-y-1">
          <label className="ml-1 text-sm font-medium text-slate-300">Email Address</label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-teal-400 transition-colors">
              <EnvelopeSimple size={20} weight="duotone" />
            </div>
            <input
              type="email"
              required
              className="w-full bg-slate-900/50 border border-slate-700 text-white rounded-2xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all placeholder-slate-500"
              placeholder="name@example.com"
            />
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between items-center ml-1">
            <label className="text-sm font-medium text-slate-300">Password</label>
            <a href="#" className="text-xs font-semibold text-teal-400 hover:text-teal-300">Forgot?</a>
          </div>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-teal-400 transition-colors">
              <LockKey size={20} weight="duotone" />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              required
              className="w-full bg-slate-900/50 border border-slate-700 text-white rounded-2xl py-3 pl-12 pr-12 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all placeholder-slate-500"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-white transition-colors"
            >
              {showPassword ? <EyeClosed size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        <motion.button
          whileHover={!isLoading ? { scale: 1.02 } : {}}
          whileTap={!isLoading ? { scale: 0.98 } : {}}
          disabled={isLoading}
          type="submit"
          className="w-full py-3.5 mt-4 rounded-2xl bg-gradient-to-r from-teal-400 to-blue-500 text-white font-bold shadow-lg shadow-teal-500/20 disabled:opacity-70 disabled:cursor-not-allowed flex justify-center mt-6"
        >
          {isLoading ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
              className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full"
            />
          ) : (
            'Sign In'
          )}
        </motion.button>
      </form>

      <p className="text-center text-slate-400 mt-8 text-sm">
        Don't have an account?{' '}
        <Link to="/register" className="text-white font-semibold hover:text-teal-400 transition-colors">
          Create one now
        </Link>
      </p>
    </>
  );
}
