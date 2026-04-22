import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, CheckCircle, WarningCircle, CaretLeft } from 'phosphor-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import PageTransition from '../../components/PageTransition';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';

interface Appointment {
  _id: string;
  patientId: string;
  doctorId: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  consultationFee: number;
  specialty: string;
  status: string;
  paymentStatus: string;
}

const PaymentPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const appointmentId = searchParams.get('appointmentId');

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (appointmentId) {
      fetchAppointmentDetails();
    } else {
      setLoading(false);
      setMessage({ type: 'error', text: 'No appointment found. Please book an appointment first.' });
    }
  }, [appointmentId]);

  const fetchAppointmentDetails = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      const response = await axios.get(`${API_BASE_URL}/appointments/${appointmentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setAppointment(response.data.data);
      } else {
        setMessage({ type: 'error', text: 'Failed to load appointment details' });
      }
    } catch (err: any) {
      console.error('Fetch appointment error:', err);
      setMessage({ 
        type: 'error', 
        text: err.response?.data?.message || 'Failed to load appointment details'
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!appointment) return;

    setProcessing(true);
    setMessage(null);

    try {
      const token = localStorage.getItem('authToken');
      const paymentData = {
        appointmentId: appointment._id,
        amount: appointment.consultationFee,
        currency: 'USD',
        patientId: appointment.patientId
      };

      const response = await axios.post(`${API_BASE_URL}/payments`, paymentData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success && response.data.data?.checkoutUrl) {
        // Store appointment ID for payment confirmation on return
        sessionStorage.setItem('lastAppointmentIdForPayment', appointment._id);
        // Redirect to Stripe checkout
        window.location.href = response.data.data.checkoutUrl;
      } else {
        setMessage({ type: 'error', text: response.data.message || 'Payment failed' });
      }
    } catch (err: any) {
      console.error('Payment error:', err);
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Payment failed. Please try again.'
      });
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <PageTransition>
        <div className="max-w-2xl mx-auto px-6 py-12 flex justify-center">
          <div className="w-12 h-12 border-4 border-teal-500/20 border-t-teal-500 rounded-full animate-spin" />
        </div>
      </PageTransition>
    );
  }

  if (!appointment) {
    return (
      <PageTransition>
        <div className="max-w-2xl mx-auto px-6 py-12">
          <button
            onClick={() => navigate('/patient/book')}
            className="flex items-center gap-2 text-teal-400 hover:text-teal-300 mb-8 font-bold"
          >
            <CaretLeft size={20} /> Back to Booking
          </button>
          <div className="bg-red-500/10 border border-red-500/20 rounded-3xl p-8 text-center">
            <WarningCircle size={48} className="text-red-400 mx-auto mb-4" />
            <p className="text-red-400 font-bold text-lg">{message?.text || 'Appointment not found'}</p>
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="max-w-2xl mx-auto px-6 py-12">
        <button
          onClick={() => navigate('/patient/book')}
          className="flex items-center gap-2 text-teal-400 hover:text-teal-300 mb-8 font-bold"
        >
          <CaretLeft size={20} /> Back to Booking
        </button>

        <header className="mb-12">
          <h1 className="text-4xl font-black text-white tracking-tight mb-4">
            Complete <span className="text-teal-400">Payment</span>
          </h1>
          <p className="text-slate-400 font-medium">Secure your appointment with a quick payment</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Appointment Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-8"
          >
            <h2 className="text-xl font-black text-white mb-6">Appointment Summary</h2>

            <div className="space-y-4">
              <div className="flex justify-between items-center pb-4 border-b border-white/5">
                <span className="text-slate-400">Date & Time</span>
                <span className="text-white font-bold">
                  {new Date(appointment.appointmentDate).toLocaleDateString()} at {appointment.startTime}
                </span>
              </div>

              <div className="flex justify-between items-center pb-4 border-b border-white/5">
                <span className="text-slate-400">Specialty</span>
                <span className="text-white font-bold">{appointment.specialty}</span>
              </div>

              <div className="flex justify-between items-center pb-4 border-b border-white/5">
                <span className="text-slate-400">Duration</span>
                <span className="text-white font-bold">
                  {appointment.startTime} - {appointment.endTime}
                </span>
              </div>

              <div className="flex justify-between items-center pt-4">
                <span className="text-lg font-black text-white">Consultation Fee</span>
                <span className="text-2xl font-black text-teal-400">${appointment.consultationFee}</span>
              </div>
            </div>
          </motion.div>

          {/* Payment Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-8"
          >
            <h2 className="text-xl font-black text-white mb-6">Secure Payment via Stripe</h2>
            
            <p className="text-slate-400 mb-8">
              Click the button below to proceed to our secure payment portal powered by Stripe. 
              We accept all major credit and debit cards.
            </p>

            {message && (
              <div className={`mb-6 p-4 rounded-2xl text-sm font-bold flex items-center gap-3 ${
                message.type === 'success' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
              }`}>
                <CheckCircle size={20} />
                {message.text}
              </div>
            )}

            <button
              onClick={handlePayment}
              disabled={processing}
              className="w-full bg-teal-500 hover:bg-teal-400 disabled:opacity-30 disabled:hover:bg-teal-500 text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-teal-500/20"
            >
              {processing ? (
                <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto" />
              ) : (
                <>
                  <CreditCard className="inline mr-2" size={20} />
                  Pay ${appointment.consultationFee}
                </>
              )}
            </button>
          </motion.div>
        </div>
      </div>
    </PageTransition>
  );
};

export default PaymentPage;
