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
  const [appointmentId, setAppointmentId] = useState<string | null>(null);

  useEffect(() => {
    const verifyAndConfirmPayment = async () => {
      if (!sessionId) {
        // Mock payment scenario - appointment already confirmed on the backend
        const storedAppointmentId = sessionStorage.getItem('lastAppointmentIdForPayment');
        if (storedAppointmentId) {
          setAppointmentId(storedAppointmentId);
          sessionStorage.removeItem('lastAppointmentIdForPayment');
        }
        setMessage('Payment confirmed! Your appointment is now active.');
        setIsVerifying(false);
        return;
      }

      // Real Stripe payment - wait for webhook then confirm as fallback
      try {
        await new Promise(resolve => setTimeout(resolve, 3000));

        if (appointmentId) {
          const token = localStorage.getItem('authToken');
          await axios.post(
            `${API_BASE_URL}/appointments/${appointmentId}/confirm-from-payment`,
            {},
            { headers: { Authorization: `Bearer ${token}` } }
          );
        }

        setMessage('Payment confirmed! Your appointment is now active.');
      } catch (error: any) {
        console.error('Payment confirmation error:', error);
        setMessage('Payment completed! Your appointment is being processed.');
      } finally {
        setIsVerifying(false);
      }
    };

    const storedAppointmentId = sessionStorage.getItem('lastAppointmentIdForPayment');
    if (storedAppointmentId) {
      setAppointmentId(storedAppointmentId);
    }

    verifyAndConfirmPayment();
  }, [sessionId, appointmentId]);

  return (
    <PageTransition>
      <div className="max-w-2xl mx-auto px-6 py-12 flex flex-col items-center justify-center min-h-[60vh]">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <motion.div
            animate={isVerifying ? { rotate: 360 } : {}}
            transition={{ duration: 2, repeat: isVerifying ? Infinity : 0 }}
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
                Click above to view your updated appointment status.
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </PageTransition>
  );
};

export default PaymentSuccess;
