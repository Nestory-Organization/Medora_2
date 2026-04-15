import { motion } from 'framer-motion';
import { ShieldCheck, VideoCamera, Stethoscope, UserGear, ArrowRight, CheckCircle } from '@phosphor-icons/react';
import { Link } from 'react-router-dom';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export default function Home() {
  return (
    <div className="w-full overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex flex-col items-center justify-center px-6 text-center text-white bg-[#0B1120]">
        <div className="absolute top-[20%] left-[10%] w-[300px] h-[300px] rounded-full bg-teal-500/20 blur-[100px] pointer-events-none" />
        <div className="absolute top-[10%] right-[20%] w-[400px] h-[400px] rounded-full bg-blue-600/20 blur-[120px] pointer-events-none" />

        <motion.div
          initial="hidden" animate="visible" variants={containerVariants}
          className="max-w-4xl z-10"
        >
          <motion.div variants={itemVariants} className="mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-sm font-medium">
            <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" /> Platform Live 2.0
          </motion.div>
          <motion.h1 variants={itemVariants} className="text-6xl md:text-8xl font-black mb-8 leading-tight tracking-tight text-white drop-shadow-lg">
            Smart Healthcare,<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-blue-500">
              Simplified.
            </span>
          </motion.h1>
          <motion.p variants={itemVariants} className="text-xl text-slate-400 mb-12 max-w-2xl mx-auto">
            Connect with top doctors, manage your health records, and schedule online consultations seamlessly from anywhere.
          </motion.p>
          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link to="/register">
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="px-8 py-4 rounded-full bg-gradient-to-r from-teal-400 to-blue-500 text-white font-bold shadow-[0_0_30px_rgba(20,184,166,0.4)] flex items-center gap-2 group">
                Get Started
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </motion.button>
            </Link>
            <Link to="/login" className="px-8 py-4 rounded-full bg-white/5 border border-white/10 text-white font-semibold hover:bg-white/10 transition-colors">
              Patient Login
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-32 px-6 bg-[#0a0f1d] relative z-10">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            className="text-center mb-20"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Powerful Features</h2>
            <p className="text-slate-400 max-w-xl mx-auto text-lg">Everything you need for modern healthcare management in one secure platform.</p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: <VideoCamera weight="duotone" className="w-8 h-8 text-blue-400" />, title: "Video Consults", desc: "High-quality secure video calls with your doctors." },
              { icon: <Stethoscope weight="duotone" className="w-8 h-8 text-teal-400" />, title: "Doctor Dashboard", desc: "Manage appointments and prescriptions effortlessly." },
              { icon: <ShieldCheck weight="duotone" className="w-8 h-8 text-emerald-400" />, title: "Bank-level Security", desc: "Your data is encrypted end-to-end and HIPAA compliant." },
              { icon: <UserGear weight="duotone" className="w-8 h-8 text-indigo-400" />, title: "Admin Portal", desc: "Comprehensive system controls for healthcare providers." }
            ].map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.05, y: -5 }}
                className="p-8 rounded-3xl bg-slate-800/40 border border-slate-700/50 backdrop-blur-sm group hover:border-teal-500/30 hover:bg-slate-800/60 transition-colors cursor-default"
              >
                <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-6 group-hover:bg-white/10 transition-colors">
                  {f.icon}
                </div>
                <h3 className="text-xl font-bold mb-3">{f.title}</h3>
                <p className="text-slate-400">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works / Timeline */}
      <section id="how-it-works" className="py-32 px-6 bg-[#0B1120] relative">
        <div className="absolute top-[30%] left-[5%] w-[400px] h-[400px] rounded-full bg-blue-600/10 blur-[100px] pointer-events-none" />

        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-16">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="flex-1"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Simple, secure, and intuitive.</h2>
            <p className="text-slate-400 text-lg mb-8">Follow three simple steps to start taking care of your health with Medora.</p>
            
            <div className="space-y-8">
              {[
                { step: "1", title: "Create an Account", desc: "Sign up in seconds, choose whether you're a patient or provider." },
                { step: "2", title: "Book or Manage", desc: "Find the right doctor, check availability, and lock in your slot." },
                { step: "3", title: "Consult Online", desc: "Join your secure video room when it’s time. Easy!" },
              ].map((item, idx) => (
                <div key={idx} className="flex gap-4 items-start">
                  <div className="w-12 h-12 rounded-full bg-teal-500/20 flex items-center justify-center font-black text-teal-400 text-lg shrink-0">
                    {item.step}
                  </div>
                  <div>
                    <h4 className="text-xl font-bold mb-2">{item.title}</h4>
                    <p className="text-slate-400">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="flex-1 self-stretch rounded-3xl bg-gradient-to-br from-teal-400 to-blue-500 p-1 md:min-h-[500px]"
          >
            <div className="w-full h-full bg-slate-900 rounded-[22px] overflow-hidden relative flex flex-col p-8">
              <div className="flex gap-2 mb-8">
                <div className="w-3 h-3 rounded-full bg-rose-500" />
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
              </div>
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <motion.div
                    key={i}
                    animate={{ y: [0, -10, 0] }}
                    transition={{ repeat: Infinity, duration: 4, delay: i * 0.5, ease: "easeInOut" }}
                    className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 w-[80%] flex items-center gap-4"
                  >
                    <CheckCircle className="w-6 h-6 text-teal-400" />
                    <div className="h-4 bg-slate-700 rounded-full w-full" />
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-32 px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-6xl mx-auto rounded-3xl bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 p-12 md:p-20 text-center relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-teal-500/20 to-transparent pointer-events-none" />
          
          <h2 className="text-4xl md:text-6xl font-bold mb-6">Ready to prioritize your health?</h2>
          <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto">Join thousands of patients and doctors experiencing the future of healthcare today.</p>
          <Link to="/register">
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="shadow-2xl shadow-teal-500/20 px-10 py-5 rounded-full bg-white text-slate-900 font-black text-lg">
              Join Medora Today
            </motion.button>
          </Link>
        </motion.div>
      </section>

    </div>
  );
}
