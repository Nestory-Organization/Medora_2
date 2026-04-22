import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, PhoneX, Camera, Warning } from '@phosphor-icons/react';
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

export default function PatientTelemedicineSession() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const [session, setSession] = useState<TelemedicineSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [callActive, setCallActive] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [_notEligible, setNotEligible] = useState(false);
  const jitsiContainerRef = useRef<HTMLDivElement>(null);
  const jitsiApiRef = useRef<JitsiApi | null>(null);

  useEffect(() => {
    fetchSession();
    return () => {
      jitsiApiRef.current?.dispose();
      jitsiApiRef.current = null;
    };
  }, [roomId]);

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

  const initializeJitsiMeeting = async (sessionId: string) => {
    await loadJitsiApiScript();

    if (!window.JitsiMeetExternalAPI || !jitsiContainerRef.current) {
      throw new Error('Jitsi API not available');
    }

    jitsiApiRef.current?.dispose();

    const user = localStorage.getItem('user');
    const parsedUser = user ? JSON.parse(user) : null;

    const api = new window.JitsiMeetExternalAPI('meet.jit.si', {
      roomName: sessionId,
      parentNode: jitsiContainerRef.current,
      width: '100%',
      height: '100%',
      userInfo: {
        displayName: parsedUser?.name || parsedUser?.fullName || 'Patient',
        email: parsedUser?.email || undefined
      },
      configOverwrite: {
        prejoinPageEnabled: true
      }
    });

    api.addEventListener('videoConferenceLeft', () => {
      handleLeaveSession(false);
    });

    jitsiApiRef.current = api;
  };

  const fetchSession = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${API_BASE_URL}/appointments/telemedicine/room/${roomId}`
      );

      if (response.data.success && response.data.data) {
        setSession(response.data.data);
      } else {
        setNotEligible(true);
        setMessage({
          type: 'error',
          text: response.data.message || 'Session is not available'
        });
      }
    } catch (error: any) {
      console.error('Fetch session error:', error);
      if (error.response?.status === 410) {
        setNotEligible(true);
        setMessage({ type: 'error', text: 'This session is no longer available' });
      } else {
        setMessage({
          type: 'error',
          text: error.response?.data?.message || 'Failed to load telemedicine session'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const joinCall = async () => {
    setJoining(true);
    try {
      if (!session?.sessionId) {
        throw new Error('Session not ready');
      }

      await initializeJitsiMeeting(session.sessionId);
      setCallActive(true);

      if (session) {
        const token = localStorage.getItem('authToken');
        try {
          await axios.patch(
            `${API_BASE_URL}/appointments/${session.appointmentId}/telemedicine/participant`,
            { participantType: 'patient', joined: true },
            {
              headers: { Authorization: `Bearer ${token}` }
            }
          );
        } catch (error) {
          console.error('Failed to notify participant join:', error);
        }
      }

      setMessage({ type: 'success', text: 'Connected to session' });
    } catch (error: any) {
      console.error('Join call error:', error);
      const errorMsg = error?.message || 'Failed to join Jitsi meeting';
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setJoining(false);
    }
  };
  const handleLeaveSession = async (navigateAway = true) => {
    jitsiApiRef.current?.dispose();
    jitsiApiRef.current = null;
    setCallActive(false);

    try {
      const token = localStorage.getItem('authToken');
      if (session) {
        await axios.patch(
          `${API_BASE_URL}/appointments/${session.appointmentId}/telemedicine/participant`,
          { participantType: 'patient', joined: false },
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
      }
    } catch (error: any) {
      console.error('Leave session error:', error);
    }

    if (navigateAway) {
      setTimeout(() => {
        navigate('/patient/dashboard');
      }, 600);
    }
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header */}
        <header className="flex items-center gap-4">
          <button
            onClick={() => navigate('/patient/appointments')}
            disabled={callActive}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowLeft size={20} className="text-slate-400" />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-6 h-1 bg-blue-500 rounded-full" />
              <span className="text-[9px] font-black text-blue-500 tracking-[0.2em] uppercase italic">
                Video Consultation
              </span>
            </div>
            <h1 className="text-2xl font-black tracking-tighter text-white uppercase italic">
              Doctor's Telemedicine Session
            </h1>
          </div>
        </header>

        {/* Messages */}
        {message && (
          <div className={`p-4 rounded-lg border flex items-center gap-3 ${
            message.type === 'success'
              ? 'bg-green-500/10 border-green-500/30 text-green-300'
              : 'bg-red-500/10 border-red-500/30 text-red-300'
          }`}>
            {message.type === 'error' && <Warning size={20} weight="bold" />}
            <span className="text-sm font-semibold">{message.text}</span>
          </div>
        )}

        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-40 bg-slate-800/50 rounded-xl animate-pulse border border-white/5" />
            ))}
          </div>
        ) : !session ? (
          <div className="bg-linear-to-br from-slate-900/60 to-slate-800/40 border border-red-500/30 rounded-2xl p-8">
            <div className="flex items-center gap-4 mb-4">
              <Warning size={32} className="text-red-400" />
              <h2 className="text-2xl font-black text-red-300 uppercase italic">Invalid Session</h2>
            </div>
            <p className="text-slate-300 mb-6">This telemedicine session is no longer available.</p>
            <button
              onClick={() => navigate('/patient/dashboard')}
              className="px-6 py-3 bg-slate-800 hover:bg-slate-700 rounded-lg font-bold text-white transition-colors uppercase tracking-wide"
            >
              Back to Dashboard
            </button>
          </div>
        ) : !callActive ? (
          /* Waiting to Join */
          <div className="space-y-6">
            {/* Session Info Card */}
            <div className="bg-linear-to-br from-slate-900/60 to-slate-800/40 border border-white/10 rounded-2xl p-8 shadow-2xl">
              <h2 className="text-xl font-black text-white mb-4 uppercase italic tracking-tight">Session Details</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-slate-800/50 p-4 rounded-lg border border-white/5">
                  <p className="text-xs text-slate-400 font-semibold uppercase mb-1">Session ID</p>
                  <p className="text-lg font-mono text-white">{session.sessionId?.slice(-8)}</p>
                </div>
                <div className="bg-slate-800/50 p-4 rounded-lg border border-white/5">
                  <p className="text-xs text-slate-400 font-semibold uppercase mb-1">Status</p>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${session.status === 'ACTIVE' ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`} />
                    <span className="text-lg font-bold text-white capitalize">{session.status}</span>
                  </div>
                </div>
              </div>

              {session.doctorJoined && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 mb-6">
                  <p className="text-green-300 font-semibold">✓ Doctor is online and waiting</p>
                  <p className="text-green-200 text-sm mt-1">Click the button below to join the video call</p>
                </div>
              )}

              {!session.doctorJoined && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-6">
                  <p className="text-yellow-300 font-semibold">⏱ Waiting for doctor</p>
                  <p className="text-yellow-200 text-sm mt-1">The doctor will join shortly. Please stand by.</p>
                </div>
              )}
            </div>

            {/* Camera Preview */}
            <div className="bg-linear-to-br from-slate-900/60 to-slate-800/40 border border-white/10 rounded-2xl p-8 overflow-hidden">
              <h2 className="text-xl font-black text-white mb-4 uppercase italic tracking-tight">Camera Preview</h2>
              <div className="bg-black rounded-lg overflow-hidden aspect-video flex items-center justify-center mb-4 border border-white/10">
                <div className="text-center">
                  <Camera size={48} className="text-slate-600 mx-auto mb-3" weight="light" />
                  <p className="text-slate-500 text-sm">Camera will display here when you join</p>
                </div>
              </div>
            </div>

            {/* Information Card */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-6">
              <h3 className="text-lg font-black text-blue-300 mb-3 uppercase italic">📋 Before Joining</h3>
              <ul className="space-y-2 text-sm text-blue-200">
                <li className="flex items-start gap-3">
                  <span className="font-bold mt-0.5">✓</span>
                  <span>Ensure your camera and microphone are properly connected</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="font-bold mt-0.5">✓</span>
                  <span>Test your internet connection for stable video quality</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="font-bold mt-0.5">✓</span>
                  <span>Choose a quiet, well-lit location for the consultation</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="font-bold mt-0.5">✓</span>
                  <span>Have your medical information ready if needed</span>
                </li>
              </ul>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => navigate('/patient/dashboard')}
                className="flex-1 px-6 py-3 bg-slate-800 hover:bg-slate-700 rounded-lg font-bold text-white transition-colors uppercase tracking-wide"
              >
                Cancel
              </button>
              <button
                onClick={joinCall}
                disabled={joining}
                className="flex-1 px-6 py-3 bg-linear-to-r from-blue-500 to-cyan-600 hover:shadow-lg hover:shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-bold text-white transition-all uppercase tracking-wide flex items-center justify-center gap-2"
              >
                {joining ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Joining...
                  </>
                ) : (
                  <>
                    <Camera size={18} weight="bold" />
                    Join Video Call
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* During Call */
          <div className="space-y-6">
            <div className="bg-black rounded-2xl overflow-hidden aspect-video border-4 border-blue-500/30 shadow-2xl shadow-blue-500/20 min-h-140">
              <div ref={jitsiContainerRef} className="w-full h-full" />
            </div>

            <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-6">
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => handleLeaveSession(true)}
                  className="p-4 rounded-full bg-red-500 hover:bg-red-600 text-white transition-all shadow-lg shadow-red-500/30"
                  title="End Call"
                >
                  <PhoneX size={24} weight="bold" />
                </button>
              </div>
            </div>

            {/* Call Info */}
            <div className="text-center text-slate-300">
              <p className="text-sm">Call in progress • Session ID: {session.sessionId?.slice(-8)}</p>
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
