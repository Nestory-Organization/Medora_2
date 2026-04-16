import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeClosed, EnvelopeSimple, LockKey, Stethoscope, UserList, CircleNotch } from '@phosphor-icons/react';
import { Link, useNavigate } from 'react-router-dom';
import { register } from '../../api/auth';
import { getUserId, registerPatientProfile } from '../../api/patient';

export default function Register() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState<'patient' | 'doctor'>('patient');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
    specialization: '', // Doctor only
    licenseNumber: '', // Doctor only
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      const payload = {
        ...formData,
        role,
      };
      
      const response = await register(payload);
      if (response.success) {
        // Access token and user from response.data based on backend controller
        const { token, user } = response.data;
        
        localStorage.setItem('authToken', token);
        localStorage.setItem('user', JSON.stringify(user));
        
        if (role === 'doctor') {
          navigate('/doctor/dashboard');
        } else {
          try {
            const userId = getUserId(user);
            if (userId) {
              await registerPatientProfile({
                userId,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                phone: user.phone,
              });
            }
          } catch (bootstrapErr) {
            // Profile bootstrap is best-effort; PatientContext also auto-recovers on first load.
          }
          navigate('/patient/dashboard');
        }
      } else {
        setError(response.message || 'Registration failed');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="mb-6 text-center text-white">
        <h2 className="text-3xl font-bold mb-2 tracking-tight">Join Medora</h2>
        <p className="text-slate-400 font-medium tracking-wide leading-relaxed">Begin your journey to smarter healthcare.</p>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="mb-8 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium flex items-center gap-3 backdrop-blur-sm shadow-xl"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Role Selection */}
      <div className="flex p-1.5 mb-10 bg-slate-900/40 backdrop-blur-md rounded-2xl relative border border-slate-700/30 shadow-inner overflow-hidden">
        <motion.div
          layoutId="activeRole"
          className="absolute inset-y-1.5 rounded-xl bg-gradient-to-r from-teal-500/20 to-blue-500/20 w-[calc(50%-6px)]"
          initial={false}
          animate={{ left: role === 'patient' ? 6 : 'calc(50% + 0px)' }}
          transition={{ type: 'spring', stiffness: 350, damping: 25 }}
        />
        <button
          className={`w-1/2 py-2.5 text-[15px] font-bold rounded-xl z-10 flex items-center justify-center gap-2.5 transition-all duration-300 ${role === 'patient' ? 'text-teal-400' : 'text-slate-400 hover:text-slate-200'}`}
          onClick={() => setRole('patient')}
        >
          <UserList weight="bold" size={20} /> Patient
        </button>
        <button
          className={`w-1/2 py-2.5 text-[15px] font-bold rounded-xl z-10 flex items-center justify-center gap-2.5 transition-all duration-300 ${role === 'doctor' ? 'text-teal-400' : 'text-slate-400 hover:text-slate-200'}`}
          onClick={() => setRole('doctor')}
        >
          <Stethoscope weight="bold" size={20} /> Doctor
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 text-white">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="ml-1 text-sm font-semibold text-slate-400">First Name</label>
            <div className="relative group">
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
                className="w-full bg-slate-900/30 border border-slate-700/50 text-white rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 transition-all placeholder-slate-600 shadow-inner"
                placeholder="John"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="ml-1 text-sm font-semibold text-slate-400">Last Name</label>
            <div className="relative group">
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
                className="w-full bg-slate-900/30 border border-slate-700/50 text-white rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 transition-all placeholder-slate-600 shadow-inner"
                placeholder="Doe"
              />
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="ml-1 text-sm font-semibold text-slate-400">Email Address</label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-teal-400 transition-colors">
              <EnvelopeSimple size={20} weight="duotone" />
            </div>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full bg-slate-900/30 border border-slate-700/50 text-white rounded-2xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 transition-all placeholder-slate-600 shadow-inner"
              placeholder="name@example.com"
            />
          </div>
        </div>

        {role === 'doctor' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-2 gap-4"
          >
            <div className="space-y-1.5">
              <label className="ml-1 text-sm font-semibold text-slate-400">Specialization</label>
              <input
                type="text"
                name="specialization"
                value={formData.specialization}
                onChange={handleChange}
                required
                className="w-full bg-slate-900/30 border border-slate-700/50 text-white rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 transition-all placeholder-slate-600 shadow-inner"
                placeholder="Cardiology"
              />
            </div>
            <div className="space-y-1.5">
              <label className="ml-1 text-sm font-semibold text-slate-400">License Number</label>
              <input
                type="text"
                name="licenseNumber"
                value={formData.licenseNumber}
                onChange={handleChange}
                required
                className="w-full bg-slate-900/30 border border-slate-700/50 text-white rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 transition-all placeholder-slate-600 shadow-inner"
                placeholder="MD-12345"
              />
            </div>
          </motion.div>
        )}

        <div className="space-y-1.5">
          <label className="ml-1 text-sm font-semibold text-slate-400">Password</label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-teal-400 transition-colors">
              <LockKey size={20} weight="duotone" />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full bg-slate-900/30 border border-slate-700/50 text-white rounded-2xl py-3 pl-12 pr-12 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 transition-all placeholder-slate-600 shadow-inner"
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
          className="relative w-full py-4 mt-8 rounded-2xl bg-gradient-to-r from-teal-400 to-blue-500 text-white font-bold shadow-xl shadow-teal-500/25 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center group overflow-hidden"
        >
          <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
          {isLoading ? (
            <CircleNotch size={24} weight="bold" className="animate-spin" />
          ) : (
            <span className="relative">Create {role === 'patient' ? 'Patient' : 'Doctor'} Profile</span>
          )}
        </motion.button>
      </form>

      <p className="text-center text-slate-400 mt-10 text-sm font-medium">
        Already have an account?{' '}
        <Link to="/login" className="text-white font-bold hover:text-teal-400 transition-all border-b border-white/20 hover:border-teal-400/50 pb-0.5 ml-1">
          Sign In
        </Link>
      </p>
    </>
  );
}
