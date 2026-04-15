import { Outlet, Navigate, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { motion, AnimatePresence } from 'framer-motion';

export default function DashboardLayout() {
  const location = useLocation();
  const token = localStorage.getItem('authToken');
  const userStr = localStorage.getItem('user');
  
  // Safe parsing to prevent "undefined" or null errors
  let user = null;
  try {
    user = userStr && userStr !== "undefined" ? JSON.parse(userStr) : null;
  } catch (e) {
    console.error("Failed to parse user data", e);
    user = null;
  }

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  // Ensure routing matches role (basic check)
  const isDoctorRoute = location.pathname.startsWith('/doctor');
  const isPatientRoute = location.pathname.startsWith('/patient');

  if (isDoctorRoute && user.role !== 'doctor') return <Navigate to="/patient/dashboard" replace />;
  if (isPatientRoute && user.role !== 'patient') return <Navigate to="/doctor/dashboard" replace />;

  return (
    <div className="flex bg-slate-950 min-h-screen font-sans selection:bg-teal-500/20 text-[14px]">
      <Sidebar role={user.role as 'patient' | 'doctor'} />
      <main className="flex-1 ml-64 p-8 overflow-y-auto text-white relative">
        {/* Background blobs for aesthetic */}
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-teal-500/5 rounded-full blur-[100px] pointer-events-none -mr-32 -mt-16" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none -ml-20 -mb-20" />
        
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, scale: 0.99, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.99, y: 10 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 mx-auto max-w-7xl"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
