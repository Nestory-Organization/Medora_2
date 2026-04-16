import React, { useState } from 'react';
import JitsiMeeting from './JitsiMeeting';
import { createTelemedicineSession } from '../api/telemedicine';

/**
 * TelemedicineSession Component
 * Manages the complete telemedicine flow:
 * 1. Show button to initiate session
 * 2. Create session via API (generates Jitsi link)
 * 3. Embed Jitsi iframe in modal/full-page
 * 
 * Props:
 * - appointmentId: string - The appointment ID
 * - doctorName: string - Doctor's display name
 * - patientName: string - Patient's display name
 * - userEmail: string - User's email
 * - isDoctor: boolean - Whether current user is the doctor
 */
const TelemedicineSession = ({
  appointmentId,
  doctorName,
  patientName,
  userEmail,
  isDoctor
}) => {
  const [sessionId, setSessionId] = useState(null);
  const [meetingLink, setMeetingLink] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [inMeeting, setInMeeting] = useState(false);

  const handleInitiateSession = async () => {
    setLoading(true);
    setError(null);

    try {
      const sessionData = await createTelemedicineSession(appointmentId);
      setSessionId(sessionData.sessionId);
      setMeetingLink(sessionData.meetingLink);
      setInMeeting(true);
    } catch (err) {
      setError(err.message || 'Failed to create telemedicine session');
      console.error('Session creation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEndMeeting = () => {
    setInMeeting(false);
    setSessionId(null);
    setMeetingLink(null);
  };

  if (inMeeting && sessionId) {
    return (
      <div style={{ position: 'relative' }}>
        <button
          onClick={handleEndMeeting}
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            zIndex: 1000,
            padding: '8px 16px',
            backgroundColor: '#f44336',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          End Meeting
        </button>
        <JitsiMeeting
          sessionId={sessionId}
          userName={isDoctor ? doctorName : patientName}
          userEmail={userEmail}
          onReady={() => console.log('Jitsi is ready')}
          onConferenceJoined={() => console.log('Conference joined')}
          onConferenceLeft={handleEndMeeting}
        />
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h3>Start Video Consultation</h3>
      {error && (
        <div
          style={{
            padding: '10px',
            marginBottom: '15px',
            backgroundColor: '#ffebee',
            color: '#c62828',
            borderRadius: '4px'
          }}
        >
          {error}
        </div>
      )}
      <button
        onClick={handleInitiateSession}
        disabled={loading}
        style={{
          padding: '12px 32px',
          backgroundColor: loading ? '#ccc' : '#2196F3',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: loading ? 'not-allowed' : 'pointer',
          fontSize: '16px',
          fontWeight: 'bold'
        }}
      >
        {loading ? 'Initiating...' : 'Start Video Call'}
      </button>
      {meetingLink && (
        <div style={{ marginTop: '15px' }}>
          <p>Meeting link: {meetingLink}</p>
          <a
            href={meetingLink}
            target="_blank"
            rel="noopener noreferrer"
            style={{ marginLeft: '10px', color: '#2196F3' }}
          >
            Open in New Window
          </a>
        </div>
      )}
    </div>
  );
};

export default TelemedicineSession;
