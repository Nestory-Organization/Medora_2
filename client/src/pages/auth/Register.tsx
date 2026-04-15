import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeClosed, EnvelopeSimple, LockKey, User, Stethoscope, UserList } from '@phosphor-icons/react';
import { Link } from 'react-router-dom';

export default function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [role, setRole] = useState<'patient' | 'doctor'>('patient');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
    }, 1500);
  };

  return (
    <>
      <div className="mb-6 text-center text-white">
        <h2 className="text-3xl font-bold mb-2">Join Medora</h2>
        <p className="text-slate-400">Begin your journey to smarter healthcare.</p>
      </div>

      {/* Role Selection */}
      <div className="flex p-1 mb-8 bg-slate-900/50 rounded-xl relative">
        <motion.div
          layoutId="activeRole"
          className="absolute inset-y-1 rounded-lg bg-teal-500/20 w-[calc(50%-4px)]"
          initial={false}
          animate={{ left: role === 'patient' ? 4 : 'calc(50% + 0px)' }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        />
        <button
          className={`w-1/2 py-2 text-sm font-semibold rounded-lg z-10 flex items-center justify-center gap-2 transition-colors ${role === 'patient' ? 'text-teal-400' : 'text-slate-400 hover:text-slate-300'}`}
          onClick={() => setRole('patient')}
        >
          <UserList weight="bold" /> Patient
        </button>
        <button
          className={`w-1/2 py-2 text-sm font-semibold rounded-lg z-10 flex items-center justify-center gap-2 transition-colors ${role === 'doctor' ? 'text-teal-400' : 'text-slate-400 hover:text-slate-300'}`}
          onClick={() => setRole('doctor')}
        >
          <Stethoscope weight="bold" /> Doctor
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 text-white">
        <div className="space-y-1">
          <label className="ml-1 text-sm font-medium text-slate-300">Full Name</label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-teal-400 transition-colors">
              <User size={20} weight="duotone" />
            </div>
            <input
              type="text"
              required
              className="w-full bg-slate-900/50 border border-slate-700 text-white rounded-2xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all placeholder-slate-500"
              placeholder="John Doe"
            />
          </div>
        </div>

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
          <label className="ml-1 text-sm font-medium text-slate-300">Create Password</label>
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
          className="w-full py-3.5 mt-4 rounded-2xl bg-gradient-to-r from-teal-400 to-blue-500 text-white font-bold shadow-lg shadow-teal-500/20 disabled:opacity-70 disabled:cursor-not-allowed flex justify-center mt-8"
        >
          {isLoading ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
              className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full"
            />
          ) : (
            `Sign Up as ${role === 'patient' ? 'Patient' : 'Doctor'}`
          )}
        </motion.button>
      </form>

      <p className="text-center text-slate-400 mt-6 text-sm">
        Already have an account?{' '}
        <Link to="/login" className="text-white font-semibold hover:text-teal-400 transition-colors">
          Sign In
        </Link>
      </p>
    </>
  );
}
