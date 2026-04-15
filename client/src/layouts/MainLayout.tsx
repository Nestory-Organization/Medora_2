import { Outlet, Link } from 'react-router-dom';
import { Pill } from '@phosphor-icons/react';

export default function MainLayout() {
  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans selection:bg-teal-500/30">
      <nav className="fixed w-full top-0 z-50 bg-slate-900/60 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="p-2 bg-gradient-to-br from-teal-400 to-blue-500 rounded-xl group-hover:scale-105 transition-transform">
              <Pill weight="fill" className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
              Medora
            </span>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">How it works</a>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
              Login
            </Link>
            <Link to="/register" className="px-5 py-2.5 rounded-full text-sm font-bold bg-white text-slate-900 hover:bg-slate-100 hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)]">
              Get Started
            </Link>
          </div>
        </div>
      </nav>
      <main className="pt-20">
        <Outlet />
      </main>
      <footer className="border-t border-white/10 py-12 text-center text-slate-500">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Pill weight="fill" className="w-5 h-5 text-teal-500" />
          <span className="text-lg font-semibold text-slate-300">Medora</span>
        </div>
        <p className="text-sm">© {new Date().getFullYear()} Medora Healthcare. All rights reserved.</p>
      </footer>
    </div>
  );
}
