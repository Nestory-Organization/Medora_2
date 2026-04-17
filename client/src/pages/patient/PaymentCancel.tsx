import React from 'react';
import { motion } from 'framer-motion';
import { WarningCircle, CaretLeft, ArrowRight } from 'phosphor-react';
import { useNavigate } from 'react-router-dom';
import PageTransition from '../../components/PageTransition';

const PaymentCancel: React.FC = () => {
  const navigate = useNavigate();

  return (
    <PageTransition>
      <div className="max-w-2xl mx-auto px-6 py-12 flex flex-col items-center justify-center min-h-[60vh]">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: [0, -5, 5, -5, 0] }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <WarningCircle size={80} className="text-orange-400 mx-auto" weight="fill" />
          </motion.div>

          <h1 className="text-4xl font-black text-white mb-4">Payment Cancelled</h1>
          
          <p className="text-lg text-slate-300 mb-8">
            Your payment was cancelled. No charges have been made to your account.
            You can try again whenever you're ready.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              onClick={() => navigate('/patient/appointments')}
              className="bg-white/10 hover:bg-white/20 text-white font-black py-3 px-8 rounded-2xl transition-all inline-flex items-center justify-center gap-2"
            >
              <CaretLeft size={20} /> Back to Appointments
            </motion.button>

            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              onClick={() => navigate(-1)}
              className="bg-teal-500 hover:bg-teal-400 text-white font-black py-3 px-8 rounded-2xl transition-all inline-flex items-center justify-center gap-2"
            >
              Try Again <ArrowRight size={20} />
            </motion.button>
          </div>
        </motion.div>
      </div>
    </PageTransition>
  );
};

export default PaymentCancel;
