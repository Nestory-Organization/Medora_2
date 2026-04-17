import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, PhoneX, Microphone, MicrophoneSlash, Camera, CameraSlash, Copy, Check, Warning } from '@phosphor-icons/react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import PageTransition from '../../components/PageTransition';

interface TelemedicineSession {
  _id: string;
  appointmentId: string;
  sessionId: string;
  roomId: string;
  startTime: string;
  endTime?: string;
  status: 'ACTIVE' | 'SCHEDULED' | 'COMPLETED';
  patientJoined: boolean;
  createdAt: string;
}

export default function DoctorTelemedicine() {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const navigate = useNavigate();
  const [session, setSession] = useState<TelemedicineSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [initiating, setInitiating] = useState(false);
  const [callActive, setCallActive] = useState(false);
  const [micEnabled, setMicEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [paymentRequired, setPaymentRequired] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    fetchSession();
    return () => stopLocalStream();
  }, [appointmentId]);

  const fetchSession = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get(
        `http://localhost:4000/api/appointments/${appointmentId}/telemedicine`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success && response.data.data) {
        setSession(response.data.data);
      }
    } catch (error: any) {
      if (error.response?.status === 402) {
        setPaymentRequired(true);
        setMessage({ type: 'error', text: 'Payment required to start telemedicine session' });
      }
    } finally {
      setLoading(false);
    }
  };

  const initiateSession = async () => {
    setInitiating(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.post(
        `http://localhost:4000/api/appointments/${appointmentId}/telemedicine`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        setSession(response.data.data);
        setMessage({ type: 'success', text: 'Video session initiated' });
        setTimeout(() => startCall(), 1000);
      }
    } catch (error: any) {
      if (error.response?.status === 402) {
        setPaymentRequired(true);
      }
      const errorMsg = error.response?.data?.message || 'Failed to initiate session';
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setInitiating(false);
    }
  };

  const startCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true
      });
      localStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCallActive(true);
    } catch (error: any) {
      setMessage({ type: 'error', text: 'Failed to access camera/microphone' });
    }
  };

  const stopLocalStream = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
  };

  const toggleMic = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setMicEnabled(!micEnabled);
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setVideoEnabled(!videoEnabled);
    }
  };

  const endCall = async () => {
    stopLocalStream();
    setCallActive(false);
    try {
      const token = localStorage.getItem('authToken');
      await axios.put(`http://localhost:4000/api/appointments/${appointmentId}/telemedicine`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setTimeout(() => navigate('/doctor/appointments'), 1500);
    } catch (error) {
      console.error('End call error:', error);
    }
  };

  const copyRoomLink = () => {
    if (session?.roomId) {
      const link = `${window.location.origin}/patient-telemedicine/${session.roomId}`;
      navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        <header className="flex items-center gap-4">
          <button onClick={() => navigate('/doctor/appointments')} disabled={callActive} className="p-2 hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            <ArrowLeft size={20} className="text-slate-400" />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-6 h-1 bg-pink-500 rounded-full" />
              <span className="text-[9px] font-black text-pink-500 tracking-[0.2em] uppercase italic">Video Consultation</span>
            </div>
            <h1 className="text-2xl font-black tracking-tighter text-white uppercase italic">Telemedicine Session</h1>
          </div>
        </header>

        {message && (
          <div className={`p-4 rounded-lg border flex items-center gap-3 ${message.type === 'success' ? 'bg-green-500/10 border-green-500/30 text-green-300' : 'bg-red-500/10 border-red-500/30 text-red-300'}`}>
            {message.type === 'success' ? <Check size={20} weight="bold" /> : <Warning size={20} weight="bold" />}
            <span className="text-sm font-semibold">{message.text}</span>
          </div>
        )}

        {loading && (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-40 bg-slate-800/50 rounded-xl animate-pulse border border-white/5" />
            ))}
          </div>
        )}

        {!loading && paymentRequired && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <Warning size={32} className="text-red-400" />
              <div>
                <h2 className="text-xl font-black text-red-300">Payment Required</h2>
                <p className="text-sm text-red-200">Complete payment to start telemedicine session</p>
              </div>
            </div>
            <button onClick={() => navigate('/doctor/appointments')} className="px-6 py-3 bg-slate-800 hover:bg-slate-700 rounded-lg font-bold text-white transition-colors uppercase tracking-wide">
              Back to Appointments
            </button>
          </div>
        )}

        {!loading && !paymentRequired && !callActive && (
          <div className="space-y-6">
            <div className="bg-slate-900/60 border border-white/10 rounded-lg p-6">
              <h2 className="text-lg font-black text-white mb-4 uppercase">Session Setup</h2>
              {session && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Session ID:</span>
                    <span className="text-white font-mono">{session.sessionId?.slice(-8)}</span>
                  </div>
                  <div className="bg-slate-800/50 p-4 rounded">
                    <p className="text-slate-400 text-sm mb-2">Patient Join Link:</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-slate-300 text-xs break-all">{window.location.origin}/patient-telemedicine/{session.roomId}</code>
                      <button onClick={copyRoomLink} className={`p-2 rounded ${copied ? 'bg-green-500/20 text-green-300' : 'bg-slate-700 hover:bg-slate-600 text-slate-300'}`}>
                        {copied ? <Check size={16} /> : <Copy size={16} />}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <button onClick={() => navigate('/doctor/appointments')} className="flex-1 px-6 py-3 bg-slate-800 hover:bg-slate-700 rounded-lg font-bold text-white transition-colors uppercase">
                Cancel
              </button>
              <button onClick={initiateSession} disabled={initiating} className="flex-1 px-6 py-3 bg-pink-500 hover:bg-pink-600 disabled:opacity-50 rounded-lg font-bold text-white transition-all uppercase flex items-center justify-center gap-2">
                {initiating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Initiating...
                  </>
                ) : (
                  <>
                    <Camera size={16} weight="bold" />
                    Start Session
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {!loading && !paymentRequired && callActive && (
          <div className="space-y-6">
            <div className="bg-black rounded-lg overflow-hidden aspect-video flex items-center justify-center border-4 border-pink-500/30">
              <video ref={videoRef} autoPlay muted className="w-full h-full object-cover" />
            </div>
            <div className="bg-slate-900/60 border border-white/10 rounded-lg p-6 flex justify-center gap-4">
              <button onClick={toggleMic} className={`p-4 rounded-full ${micEnabled ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-red-500/30 text-red-300'}`}>
                {micEnabled ? <Microphone size={20} weight="bold" /> : <MicrophoneSlash size={20} weight="bold" />}
              </button>
              <button onClick={toggleVideo} className={`p-4 rounded-full ${videoEnabled ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-red-500/30 text-red-300'}`}>
                {videoEnabled ? <Camera size={20} weight="bold" /> : <CameraSlash size={20} weight="bold" />}
              </button>
              <button onClick={endCall} className="p-4 rounded-full bg-red-500 hover:bg-red-600 text-white">
                <PhoneX size={20} weight="bold" />
              </button>
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  );
}