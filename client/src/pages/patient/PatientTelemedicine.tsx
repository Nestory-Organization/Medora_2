import { useState, useEffect } from 'react';
import { ArrowLeft, VideoCamera, CheckCircle, Link, Phone } from '@phosphor-icons/react';
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

export default function PatientTelemedicine() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const [session, setSession] = useState<TelemedicineSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    fetchSession();
  }, [roomId]);

  const fetchSession = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/appointments/telemedicine/room/${roomId}`);
      if (response.data.success && response.data.data) {
        setSession(response.data.data);
      }
    } catch {
      // API error - that's ok, use roomId directly
    } finally {
      setLoading(false);
    }
  };

  const getJitsiLink = () => {
    // Use roomId from URL directly - that's the meeting code
    return `https://meet.jit.si/${roomId}`;
  };

  const joinMeeting = async () => {
    setJoining(true);
    // Try to notify backend
    try {
      const token = localStorage.getItem('authToken');
      if (session?.appointmentId) {
        await axios.patch(
          `${API_BASE_URL}/appointments/${session.appointmentId}/telemedicine/participant`,
          { participantType: 'patient', joined: true },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
    } catch {
      // Silent - just open Jitsi
    }
    // Open Jitsi meeting
    window.open(getJitsiLink(), '_blank');
    setTimeout(() => setJoining(false), 2000);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(getJitsiLink());
    alert('Meeting link copied to clipboard!');
  };

  if (loading) {
    return (
      <PageTransition>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-40 bg-slate-800/50 rounded-xl animate-pulse border border-white/5" />
          ))}
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="max-w-3xl mx-auto space-y-6">
        <header className="flex items-center gap-4">
          <button onClick={() => navigate('/patient/appointments')} className="p-2 hover:bg-slate-800 rounded-lg">
            <ArrowLeft size={20} className="text-slate-400" />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-6 h-1 bg-blue-500 rounded-full" />
              <span className="text-[9px] font-black text-blue-500 tracking-[0.2em] uppercase">Video Consultation</span>
            </div>
            <h1 className="text-2xl font-black text-white uppercase italic">Telemedicine Session</h1>
          </div>
        </header>

        <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-6">
          <h2 className="text-xl font-black text-white mb-4 uppercase">Session Details</h2>
          
          <div className="bg-slate-800/50 p-4 rounded-xl mb-4">
            <p className="text-xs text-slate-400 font-bold uppercase mb-1">Meeting Code</p>
            <p className="text-lg font-mono text-white">{roomId}</p>
          </div>

          {session?.doctorJoined ? (
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
              <p className="text-green-300 font-bold flex items-center gap-2">
                <CheckCircle size={18} weight="fill" />
                Doctor is online and waiting
              </p>
            </div>
          ) : (
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
              <p className="text-blue-300 font-bold flex items-center gap-2">
                <VideoCamera size={18} />
                Ready to join
              </p>
            </div>
          )}
        </div>

        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
          <h3 className="text-lg font-black text-blue-300 mb-3 uppercase">Before Joining</h3>
          <ul className="text-sm text-blue-200 space-y-2">
            <li className="flex items-center gap-2">
              <CheckCircle size={14} /> Ensure camera & microphone are connected
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle size={14} /> Test your internet connection
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle size={14} /> Find a quiet, well-lit location
            </li>
          </ul>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => navigate('/patient/appointments')}
            className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl font-bold text-white"
          >
            Cancel
          </button>
          <button
            onClick={copyLink}
            className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl font-bold text-white flex items-center justify-center gap-2"
          >
            <Link size={18} />
            Copy Link
          </button>
          <button
            onClick={joinMeeting}
            disabled={joining}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 disabled:opacity-50 rounded-xl font-bold text-white flex items-center justify-center gap-2"
          >
            <Phone size={18} />
            {joining ? 'Opening...' : 'Join Meeting'}
          </button>
        </div>
      </div>
    </PageTransition>
  );
}