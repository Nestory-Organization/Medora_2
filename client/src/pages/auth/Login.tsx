import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeClosed, EnvelopeSimple, LockKey, CircleNotch } from '@phosphor-icons/react';
import { Link, useNavigate } from 'react-router-dom';
import { login } from '../../api/auth';

export default function Login() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await login(formData);
      if (response.success) {
        // Access token and user from response.data based on backend controller
        const { token, user } = response.data;
        
        localStorage.setItem('authToken', token);
        localStorage.setItem('user', JSON.stringify(user));
        
        // Redirect based on role
        if (user.role === 'doctor') {
          navigate('/doctor/dashboard');
        } else {
          navigate('/patient/dashboard');
        }
      } else {
        setError(response.message || 'Login failed');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid credentials or server error.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="mb-8 text-center text-white">
        <h2 className="text-3xl font-bold mb-2 tracking-tight">Welcome Back</h2>
        <p className="text-slate-400 font-medium">Log in to safely manage your health insights.</p>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium flex items-center gap-3"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} className="space-y-5 text-white">
        <div className="space-y-1.5">
          <label className="ml-1 text-sm font-semibold text-slate-300">Email Address</label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-teal-400 transition-colors">
              <EnvelopeSimple size={20} weight="duotone" />
            </div>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full bg-slate-900/30 backdrop-blur-sm border border-slate-700/50 text-white rounded-2xl py-3.5 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 transition-all placeholder-slate-600 shadow-inner"
              placeholder="name@example.com"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between items-center ml-1">
            <label className="text-sm font-semibold text-slate-300">Password</label>
            <a href="#" className="text-xs font-bold text-teal-400 hover:text-teal-300 transition-colors">Forgot Password?</a>
          </div>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-teal-400 transition-colors">
              <LockKey size={20} weight="duotone" />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full bg-slate-900/30 backdrop-blur-sm border border-slate-700/50 text-white rounded-2xl py-3.5 pl-12 pr-12 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 transition-all placeholder-slate-600 shadow-inner"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-white transition-colors"
            >
              {showPassword ? <EyeClosed size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        <motion.button
          whileHover={!isLoading ? { scale: 1.01, translateY: -1 } : {}}
          whileTap={!isLoading ? { scale: 0.99 } : {}}
          disabled={isLoading}
          type="submit"
          className="relative w-full py-4 mt-6 rounded-2xl bg-gradient-to-r from-teal-400 to-blue-500 text-white font-bold shadow-xl shadow-teal-500/20 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center overflow-hidden group"
        >
          <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
          {isLoading ? (
            <CircleNotch size={24} weight="bold" className="animate-spin" />
          ) : (
            <span className="relative">Sign In to Dashboard</span>
          )}
        </motion.button>
      </form>

      <p className="text-center text-slate-400 mt-10 text-sm font-medium">
        Don't have an account?{' '}
        <Link to="/register" className="text-white font-bold hover:text-teal-400 transition-all border-b border-white/20 hover:border-teal-400/50 pb-0.5 ml-1">
          Create account
        </Link>
      </p>
    </>
  );
}
