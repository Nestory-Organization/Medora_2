import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, PhoneX, Camera, VideoCamera, Warning, CheckCircle, Clock, User, Calendar } from '@phosphor-icons/react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import PageTransition from '../../components/PageTransition';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';

import type { JitsiApi } from '../../types/jitsi';

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
  createdAt: string;
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
  const [initiating, setInitiating] = useState(false);
  const [callActive, setCallActive] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [notEligible, setNotEligible] = useState(false);
  const [eligibilityReason, setEligibilityReason] = useState('');
  const [copied, setCopied] = useState(false);
  const jitsiContainerRef = useRef<HTMLDivElement>(null);
  const jitsiApiRef = useRef<JitsiApi | null>(null);

  useEffect(() => {
    fetchAppointmentAndSession();
    return () => {
      jitsiApiRef.current?.dispose();
      jitsiApiRef.current = null;
    };
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
    } catch (error: any) {
      const reason = error.response?.data?.message || '';
      if (reason.includes('CONFIRMED') || reason.includes('PAID') || error.response?.status === 402) {
        setNotEligible(true);
        setEligibilityReason(reason);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadJitsiApiScript = () =>
    new Promise<void>((resolve, reject) => {
      if (window.JitsiMeetExternalAPI) { 
        resolve(); 
        return; 
      }

      const script = document.createElement('script');
      script.src = 'https://meet.jit.si/external_api.js';
      script.async = true;
      
      script.onload = () => {
        setTimeout(() => {
          if (window.JitsiMeetExternalAPI) {
            resolve();
          } else {
            reject(new Error('Jitsi API not available'));
          }
        }, 500);
      };
      
      script.onerror = () => {
        reject(new Error('Failed to load Jitsi API'));
      };
      
      document.head.appendChild(script);
    });

  const initializeJitsiMeeting = async (roomName: string, isHost: boolean) => {
    await loadJitsiApiScript();
    if (!window.JitsiMeetExternalAPI || !jitsiContainerRef.current) {
      throw new Error('Jitsi API not available');
    }

    jitsiApiRef.current?.dispose();

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userName = user.name || user.fullName || user.firstName
      ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
      : 'Doctor';

    jitsiApiRef.current = new window.JitsiMeetExternalAPI('meet.jit.si', {
      roomName,
      parentNode: jitsiContainerRef.current,
      width: '100%',
      height: '100%',
      userInfo: {
        displayName: userName,
        email: user.email || undefined
      },
      configOverwrite: {
        startWithAudioMuted: false,
        startWithVideoMuted: false,
        prejoinPageEnabled: true,
        prejoinPageHideDomain: 'meet.jit.si',
        disableDeepLinking: true,
        disableInviteFunctions: true,
        enableWelcomePage: false,
        enableClosePage: false,
        showConnecting: true,
        brandingRoomUrl: '',
      },
      interfaceConfigOverwrite: {
        SHOW_JITSI_WATERMARK: false,
        SHOW_WATERMARK_AT_GLOBAL_HEADER: false,
        SHOW_BRAND_WATERMARK: false,
        BRAND_WATERMARK_LINK_URL: '',
        DEFAULT_REMOTE_DISPLAY_NAME: 'Patient',
        TOOLBAR_BUTTONS: [
          'microphone', 'camera', 'closedcaptions', 'desktop',
          'chat', 'raisehand', 'videoquality', 'tileview',
          'select-background', 'fullscreen', 'settings', 'hangup'
        ],
        TOOLBAR_ALWAYS_VISIBLE: true,
        SETTINGS_SECTIONS: ['devices', 'language', 'moderator', 'profile'],
        SHOW_PROMOTIONAL_CLOSE: false,
      },
      onload: () => {
        if (isHost) {
          jitsiApiRef.current?.executeCommand('toggleLobby', { enabled: true });
        }
      }
    });

    jitsiApiRef.current.addEventListener('videoConferenceJoined', () => {
      setMessage({ type: 'success', text: 'You have joined the session' });
    });

    jitsiApiRef.current.addEventListener('participantJoined', (participant: any) => {
      setMessage({ type: 'success', text: `${participant.displayName || 'Patient'} joined the call` });
    });

    jitsiApiRef.current.addEventListener('videoConferenceLeft', () => {
      setCallActive(false);
      setMessage({ type: 'success', text: 'Session ended' });
    });
  };

  const initiateSession = async () => {
    setInitiating(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.post(
        `${API_BASE_URL}/appointments/${appointmentId}/telemedicine`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        setSession(response.data.data);
        const roomName = response.data.data.sessionId;
        await initializeJitsiMeeting(roomName, true);
        setCallActive(true);
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Failed to initiate session';
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setInitiating(false);
    }
  };

  const startExistingSession = async () => {
    if (!session?.sessionId) return;
    try {
      await initializeJitsiMeeting(session.sessionId, true);
      setCallActive(true);
    } catch (error: any) {
      setMessage({ type: 'error', text: error?.message || 'Failed to start' });
    }
  };

  const endCall = async () => {
    jitsiApiRef.current?.dispose();
    jitsiApiRef.current = null;
    setCallActive(false);
    try {
      const token = localStorage.getItem('authToken');
      await axios.put(
        `${API_BASE_URL}/appointments/${appointmentId}/telemedicine`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (_) {}
    setTimeout(() => navigate('/doctor/appointments'), 1000);
  };

  const copyRoomLink = () => {
    if (session?.roomId) {
      const link = `${window.location.origin}/patient-telemedicine/${session.roomId}`;
      navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
    });
  };

  return (
    <PageTransition>
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <header className="flex items-center gap-4">
          <button
            onClick={() => navigate('/doctor/appointments')}
            disabled={callActive}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-30"
          >
            <ArrowLeft size={22} className="text-slate-400" />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-6 h-1 bg-pink-500 rounded-full" />
              <span className="text-[9px] font-black text-pink-500 tracking-[0.2em] uppercase italic">Video Consultation</span>
            </div>
            <h1 className="text-2xl font-black tracking-tighter text-white uppercase italic">Telemedicine Session</h1>
          </div>
        </header>

        {/* Messages */}
        {message && (
          <div className={`p-4 rounded-xl border flex items-center gap-3 text-sm font-semibold ${
            message.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-red-500/10 border-red-500/30 text-red-300'
          }`}>
            {message.type === 'success' ? <CheckCircle size={18} /> : <Warning size={18} />}
            {message.text}
          </div>
        )}

        {loading && (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-48 bg-slate-800/40 rounded-xl animate-pulse border border-white/5" />
            ))}
          </div>
        )}

        {!loading && notEligible && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-8 space-y-4">
            <div className="flex items-center gap-4">
              <Warning size={36} className="text-red-400" />
              <div>
                <h2 className="text-2xl font-black text-red-300 uppercase italic">Cannot Start Session</h2>
                <p className="text-red-200 text-sm mt-1">{eligibilityReason}</p>
              </div>
            </div>
            <div className="bg-slate-800/50 border border-white/5 rounded-xl p-4 text-sm text-slate-300">
              <strong>Requirements to start a telemedicine session:</strong>
              <ul className="mt-2 space-y-1 list-disc ml-5">
                <li>Appointment must be CONFIRMED (not PENDING_DOCTOR_APPROVAL)</li>
                <li>Patient must have PAID the consultation fee</li>
              </ul>
            </div>
            <button
              onClick={() => navigate('/doctor/appointments')}
              className="px-6 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl font-bold text-white transition-colors uppercase tracking-wide"
            >
              Back to Appointments
            </button>
          </div>
        )}

        {!loading && !notEligible && !callActive && (
          <div className="space-y-6">

            {/* Appointment Details Card */}
            <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-8 shadow-xl">
              <h2 className="text-lg font-black text-white mb-5 uppercase italic tracking-tight">Appointment Details</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="bg-slate-800/50 rounded-xl p-4 border border-white/5">
                  <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-2">
                    <Calendar size={14} className="text-pink-400" /> Date
                  </div>
                  <p className="text-white font-bold">{appointment ? formatDate(appointment.appointmentDate) : '-'}</p>
                </div>
                <div className="bg-slate-800/50 rounded-xl p-4 border border-white/5">
                  <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-2">
                    <Clock size={14} className="text-pink-400" /> Time Slot
                  </div>
                  <p className="text-white font-bold">{appointment ? `${appointment.startTime} - ${appointment.endTime}` : '-'}</p>
                </div>
                <div className="bg-slate-800/50 rounded-xl p-4 border border-white/5">
                  <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-2">
                    <User size={14} className="text-pink-400" /> Patient
                  </div>
                  <p className="text-white font-bold text-sm">{appointment?.patientName || 'Patient'}</p>
                </div>
                <div className="bg-slate-800/50 rounded-xl p-4 border border-white/5">
                  <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-2">
                    <VideoCamera size={14} className="text-pink-400" /> Specialty
                  </div>
                  <p className="text-white font-bold text-sm">{appointment?.specialty || '-'}</p>
                </div>
              </div>

              {session && (
                <div className="mt-6 bg-slate-800/50 rounded-xl p-4 border border-white/5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-3 h-3 rounded-full ${session.status === 'ACTIVE' ? 'bg-green-500 animate-pulse' : session.status === 'SCHEDULED' ? 'bg-yellow-500' : 'bg-slate-500'}`} />
                    <span className="text-slate-300 text-sm font-semibold uppercase">
                      Session Status: {session.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-slate-400 text-xs break-all font-mono">
                      {window.location.origin}/patient-telemedicine/{session.roomId}
                    </code>
                    <button
                      onClick={copyRoomLink}
                      className={`px-3 py-2 rounded-lg font-bold text-xs uppercase transition-all shrink-0 ${
                        copied ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-slate-700 hover:bg-slate-600 text-slate-300 border border-white/5'
                      }`}
                    >
                      {copied ? 'Copied!' : 'Copy Link'}
                    </button>
                  </div>
                  {session.patientJoined && (
                    <div className="mt-3 flex items-center gap-2 text-emerald-400 text-sm font-semibold">
                      <CheckCircle size={16} weight="bold" /> Patient is online and waiting
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Session Controls */}
            <div className="bg-slate-900/40 border border-white/10 rounded-2xl p-8">
              <div className="flex items-center gap-3 mb-5">
                <VideoCamera size={24} className="text-pink-400" weight="duotone" />
                <h3 className="text-lg font-black text-white uppercase italic">Session Controls</h3>
              </div>
              <p className="text-slate-400 text-sm mb-6">
                {session?.sessionId
                  ? 'An existing session was found. Click "Start Session" to join the video call with the patient.'
                  : 'Click "Start Session" to initiate the Jitsi video call. Share the link with your patient so they can join.'}
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => navigate('/doctor/appointments')}
                  className="flex-1 px-6 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl font-bold text-white transition-colors uppercase tracking-wide text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={session?.sessionId ? startExistingSession : initiateSession}
                  disabled={initiating}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-pink-600 to-pink-500 hover:from-pink-500 hover:to-pink-400 disabled:opacity-50 rounded-xl font-bold text-white transition-all uppercase tracking-wide text-sm flex items-center justify-center gap-2 shadow-lg shadow-pink-500/20"
                >
                  {initiating ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Starting...
                    </>
                  ) : (
                    <>
                      <VideoCamera size={18} weight="bold" />
                      {session?.sessionId ? 'Start Session' : 'Create & Start Session'}
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Pre-call Checklist */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-6">
              <h3 className="text-base font-black text-blue-300 mb-4 uppercase italic tracking-tight">Pre-call Checklist</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-blue-200">
                {[
                  'Ensure your camera and microphone are connected',
                  'Test your internet connection for stable video quality',
                  'Choose a quiet, well-lit location for the consultation',
                  'Have patient medical records ready if needed'
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-lg px-3 py-2">
                    <CheckCircle size={14} className="text-blue-400 shrink-0" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {!loading && !notEligible && callActive && (
          <div className="space-y-4">
            {/* Call Timer + Controls */}
            <div className="bg-slate-900/60 border border-white/10 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                <span className="text-white font-bold text-sm uppercase tracking-wide">Live Session</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    jitsiApiRef.current?.executeCommand('toggleAudio');
                  }}
                  className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition-all"
                  title="Toggle Microphone"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8"/>
                  </svg>
                </button>
                <button
                  onClick={() => {
                    jitsiApiRef.current?.executeCommand('toggleVideo');
                  }}
                  className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition-all"
                  title="Toggle Camera"
                >
                  <Camera size={18} />
                </button>
                <button
                  onClick={copyRoomLink}
                  className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition-all text-xs font-bold"
                  title="Copy patient link"
                >
                  {copied ? 'Copied!' : 'Copy Link'}
                </button>
                <button
                  onClick={endCall}
                  className="px-5 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold uppercase text-sm flex items-center gap-2 transition-all shadow-lg shadow-red-500/20"
                >
                  <PhoneX size={18} weight="bold" />
                  End Call
                </button>
              </div>
            </div>

            {/* Jitsi Embedded */}
            <div className="bg-black rounded-2xl overflow-hidden border-2 border-pink-500/30 shadow-2xl shadow-pink-500/10" style={{ height: '70vh' }}>
              <div ref={jitsiContainerRef} className="w-full h-full" />
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  );
}