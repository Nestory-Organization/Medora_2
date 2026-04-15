import { Outlet, Link } from 'react-router-dom';
import { CaretLeft } from '@phosphor-icons/react';
import { motion } from 'framer-motion';

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-[#0B1120] flex items-center justify-center p-6 relative overflow-hidden text-white font-sans">
      {/* Animated background blobs */}
      <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-teal-500/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[600px] h-[600px] rounded-full bg-blue-600/20 blur-[150px] pointer-events-none" />

      <Link to="/" className="absolute top-8 left-8 flex items-center gap-2 text-slate-400 hover:text-white transition-colors z-10">
        <CaretLeft weight="bold" />
        <span className="text-sm font-medium">Back to Home</span>
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-md bg-white/[0.03] backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl z-10"
      >
        <Outlet />
      </motion.div>
    </div>
  );
}
