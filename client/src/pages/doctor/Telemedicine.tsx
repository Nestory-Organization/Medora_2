import { useState, useEffect } from 'react';
import { ArrowLeft, VideoCamera, Warning, CheckCircle, Clock, User, Calendar, Phone } from '@phosphor-icons/react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import PageTransition from '../../components/PageTransition';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';

interface TelemedicineSession {
  _id: string;
  appointmentId: string;
  sessionId: string;
  roomId: string;
  startTime: string;
  endTime?: string;
  status: 'ACTIVE' | 'SCHEDULED' | 'COMPLETED';
  doctorJoined: boolean;
  patientJoined: boolean;
}

interface Appointment {
  _id: string;
  doctorId: string;
  doctorName: string;
  patientName?: string;
  specialty: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  consultationFee: number;
  status: string;
  paymentStatus: string;
}

export default function DoctorTelemedicine() {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const navigate = useNavigate();
  const [session, setSession] = useState<TelemedicineSession | null>(null);
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [notEligible, setNotEligible] = useState(false);
  const [eligibilityReason, setEligibilityReason] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchAppointmentAndSession();
  }, [appointmentId]);

  const fetchAppointmentAndSession = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const [aptRes, sessionRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/appointments/${appointmentId}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_BASE_URL}/appointments/${appointmentId}/telemedicine`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      if (aptRes.data?.success) {
        setAppointment(aptRes.data.data);
      }

      if (sessionRes.data?.success) {
        setSession(sessionRes.data.data);
      } else if (sessionRes.data?.data?.appointmentStatus || sessionRes.data?.data?.paymentStatus) {
        setNotEligible(true);
        const aptStatus = sessionRes.data.data?.appointmentStatus || '';
        const payStatus = sessionRes.data.data?.paymentStatus || '';
        setEligibilityReason(
          aptStatus !== 'CONFIRMED'
            ? `Appointment status is "${aptStatus}". Must be CONFIRMED before starting.`
            : `Payment status is "${payStatus}". Must be PAID before starting.`
        );
      }
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } } };
      const reason = err.response?.data?.message || '';
      if (reason.includes('CONFIRMED') || reason.includes('PAID')) {
        setNotEligible(true);
        setEligibilityReason(reason);
      }
    } finally {
      setLoading(false);
    }
  };

  const generateMeetingCode = () => {
    return `medora-${appointmentId?.slice(-8) || Date.now().toString(36)}`;
  };

  const createSession = async () => {
    setCreating(true);
    try {
      const token = localStorage.getItem('authToken');
      const meetingCode = generateMeetingCode();
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const body = { sessionId: meetingCode };
      const response = await axios.post(
        `${API_BASE_URL}/appointments/${appointmentId}/telemedicine`,
        body,
        config
      );
      if (response.data.success) {
        setSession(response.data.data);
        setMessage({ type: 'success', text: 'Session created! Click "Join Meeting" to start.' });
      }
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } } };
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to create session' });
    } finally {
      setCreating(false);
    }
  };

  const getJitsiLink = () => {
    const code = session?.sessionId || generateMeetingCode();
    return `https://meet.jit.si/${code}`;
  };

  const joinMeeting = () => {
    window.open(getJitsiLink(), '_blank');
  };

  const copyLink = () => {
    navigator.clipboard.writeText(getJitsiLink());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
    });
  };

  if (loading) {
    return (
      <PageTransition>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-48 bg-slate-800/40 rounded-xl animate-pulse border border-white/5" />
          ))}
        </div>
      </PageTransition>
    );
  }

  if (notEligible) {
    return (
      <PageTransition>
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-8 space-y-4">
          <div className="flex items-center gap-4">
            <Warning size={36} className="text-red-400" />
            <div>
              <h2 className="text-2xl font-black text-red-300 uppercase italic">Cannot Start Session</h2>
              <p className="text-red-200 text-sm mt-1">{eligibilityReason}</p>
            </div>
          </div>
          <div className="bg-slate-800/50 border border-white/5 rounded-xl p-4 text-sm text-slate-300">
            <strong>Requirements:</strong>
            <ul className="mt-2 space-y-1 list-disc ml-5">
              <li>Appointment must be CONFIRMED</li>
              <li>Patient must have PAID the consultation fee</li>
            </ul>
          </div>
          <button
            onClick={() => navigate('/doctor/appointments')}
            className="px-6 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl font-bold text-white"
          >
            Back to Appointments
          </button>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="max-w-3xl mx-auto space-y-6">
        <header className="flex items-center gap-4">
          <button onClick={() => navigate('/doctor/appointments')} className="p-2 hover:bg-slate-800 rounded-lg">
            <ArrowLeft size={22} className="text-slate-400" />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-6 h-1 bg-pink-500 rounded-full" />
              <span className="text-[9px] font-black text-pink-500 tracking-[0.2em] uppercase">Telemedicine</span>
            </div>
            <h1 className="text-2xl font-black text-white uppercase italic">Video Consultation</h1>
          </div>
        </header>

        {message && (
          <div className={`p-4 rounded-xl border flex items-center gap-3 ${
            message.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-red-500/10 border-red-500/30 text-red-300'
          }`}>
            {message.type === 'success' ? <CheckCircle size={18} /> : <Warning size={18} />}
            {message.text}
          </div>
        )}

        <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-6">
          <h2 className="text-lg font-black text-white mb-4 uppercase">Appointment Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-800/50 rounded-xl p-4">
              <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase mb-2">
                <Calendar size={14} className="text-pink-400" /> Date
              </div>
              <p className="text-white font-bold">{appointment ? formatDate(appointment.appointmentDate) : '-'}</p>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-4">
              <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase mb-2">
                <Clock size={14} className="text-pink-400" /> Time
              </div>
              <p className="text-white font-bold">{appointment ? `${appointment.startTime} - ${appointment.endTime}` : '-'}</p>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-4">
              <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase mb-2">
                <User size={14} className="text-pink-400" /> Patient
              </div>
              <p className="text-white font-bold">{appointment?.patientName || 'Patient'}</p>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-4">
              <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase mb-2">
                <VideoCamera size={14} className="text-pink-400" /> Specialty
              </div>
              <p className="text-white font-bold">{appointment?.specialty || '-'}</p>
            </div>
          </div>
        </div>

        {session && (
          <div className="bg-slate-800/50 border border-white/10 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className={`w-3 h-3 rounded-full ${session.status === 'ACTIVE' ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`} />
              <span className="text-slate-300 text-sm font-bold uppercase">Session: {session.status}</span>
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-slate-400 text-sm break-all font-mono bg-slate-900 p-2 rounded-lg">
                {getJitsiLink()}
              </code>
              <button
                onClick={copyLink}
                className={`px-3 py-2 rounded-lg font-bold text-sm ${copied ? 'bg-emerald-500 text-white' : 'bg-slate-700 hover:bg-slate-600 text-white'}`}
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            {session.patientJoined && (
              <div className="mt-3 flex items-center gap-2 text-emerald-400 text-sm font-bold">
                <CheckCircle size={16} /> Patient is waiting
              </div>
            )}
          </div>
        )}

        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
          <h3 className="text-base font-black text-blue-300 mb-3 uppercase">How it works</h3>
          <ol className="text-sm text-blue-200 space-y-1 list-decimal ml-5">
            <li>Click "Create Session" to generate a meeting link</li>
            <li>Click "Join Meeting" to open the video call</li>
            <li>Share the link with your patient</li>
          </ol>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => navigate('/doctor/appointments')}
            className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl font-bold text-white"
          >
            Cancel
          </button>
          {!session ? (
            <button
              onClick={createSession}
              disabled={creating}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-pink-600 to-pink-500 hover:from-pink-500 hover:to-pink-400 disabled:opacity-50 rounded-xl font-bold text-white"
            >
              {creating ? 'Creating...' : 'Create Session'}
            </button>
          ) : (
            <button
              onClick={joinMeeting}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-500 hover:to-emerald-400 rounded-xl font-bold text-white flex items-center justify-center gap-2"
            >
              <Phone size={18} />
              Join Meeting
            </button>
          )}
        </div>
      </div>
    </PageTransition>
  );
}