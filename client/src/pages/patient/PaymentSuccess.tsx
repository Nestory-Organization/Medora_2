import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, ArrowRight } from 'phosphor-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import PageTransition from '../../components/PageTransition';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';

const PaymentSuccess: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [isVerifying, setIsVerifying] = useState(true);
  const [message, setMessage] = useState('Confirming your payment...');

  useEffect(() => {
    const verifyPayment = async () => {
      if (!sessionId) {
        setMessage('Payment completed. Your appointment status will update shortly.');
        setIsVerifying(false);
        return;
      }

      try {
        const token = localStorage.getItem('authToken');
        await axios.post(
          `${API_BASE_URL}/payments/confirm-session`,
          { sessionId },
          { headers: { ...(token && { Authorization: `Bearer ${token}` }) } }
        );
        setMessage('Payment confirmed! Your appointment is now active.');
      } catch (error) {
        console.error('Payment verification error:', error);
        setMessage('Payment completed! Your appointment is being processed. Please refresh your appointments in a few seconds.');
      } finally {
        setIsVerifying(false);
      }
    };

    verifyPayment();
  }, [sessionId]);

  return (
    <PageTransition>
      <div className="max-w-2xl mx-auto px-6 py-12 flex flex-col items-center justify-center min-h-[60vh]">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity }}
            className="mb-8"
          >
            <CheckCircle size={80} className="text-emerald-400 mx-auto" weight="fill" />
          </motion.div>

          <h1 className="text-4xl font-black text-white mb-4">Payment Successful!</h1>
          
          <p className="text-lg text-slate-300 mb-8">
            {message}
          </p>

          {!isVerifying && (
            <div className="flex flex-col gap-4">
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                onClick={() => navigate('/patient/appointments')}
                className="bg-teal-500 hover:bg-teal-400 text-white font-black py-3 px-8 rounded-2xl transition-all inline-flex items-center justify-center gap-2"
              >
                Go to Appointments <ArrowRight size={20} />
              </motion.button>
              <p className="text-sm text-slate-400 mt-4">
                Please wait 2-3 seconds for your appointment status to update with the payment information.
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </PageTransition>
  );
};

export default PaymentSuccess;
