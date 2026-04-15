import React, { useEffect, useState } from 'react';

/**
 * JitsiMeeting Component
 * Embeds a Jitsi Meet iframe for video consultation
 * 
 * Props:
 * - sessionId: string - The unique Jitsi room ID
 * - userName: string - Display name of the participant
 * - userEmail: string - User email
 * - onReady: function - Called when the Jitsi API is ready
 * - onConferenceJoined: function - Called when user joins the conference
 * - onConferenceLeft: function - Called when user leaves the conference
 */
const JitsiMeeting = ({
  sessionId,
  userName,
  userEmail,
  onReady,
  onConferenceJoined,
  onConferenceLeft
}) => {
  const [jitsiApiReady, setJitsiApiReady] = useState(false);

  useEffect(() => {
    // Load Jitsi Meet API script
    const script = document.createElement('script');
    script.src = 'https://meet.jit.si/external_api.js';
    script.async = true;
    script.onload = () => {
      setJitsiApiReady(true);
      if (onReady) onReady();
    };
    document.body.appendChild(script);

    return () => {
      // Cleanup script on unmount
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [onReady]);

  useEffect(() => {
    if (!jitsiApiReady || !sessionId || !window.JitsiMeetExternalAPI) {
      return;
    }

    const domain = 'meet.jit.si';
    const options = {
      roomName: sessionId,
      width: '100%',
      height: 700,
      parentNode: document.querySelector('#jitsi-container'),
      userInfo: {
        displayName: userName || 'Guest',
        email: userEmail
      },
      interfaceConfigOverwrite: {
        TOOLBAR_BUTTONS: [
          'microphone',
          'camera',
          'closedcaptions',
          'desktop',
          'fullscreen',
          'fodeviceselection',
          'hangup',
          'chat',
          'raisehand',
          'videoquality'
        ],
        DEFAULT_WELCOME_PAGE_LOGO_URL: 'https://medora.local/logo.png'
      }
    };

    try {
      const api = new window.JitsiMeetExternalAPI(domain, options);

      api.addEventListener('videoConferenceJoined', () => {
        console.log('Video conference joined');
        if (onConferenceJoined) onConferenceJoined();
      });

      api.addEventListener('videoConferenceLeft', () => {
        console.log('Video conference left');
        if (onConferenceLeft) onConferenceLeft();
      });

      // Cleanup on unmount
      return () => {
        try {
          api.dispose();
        } catch (error) {
          console.error('Error disposing Jitsi API:', error);
        }
      };
    } catch (error) {
      console.error('Error initializing Jitsi Meeting:', error);
    }
  }, [jitsiApiReady, sessionId, userName, userEmail, onConferenceJoined, onConferenceLeft]);

  return (
    <div
      id="jitsi-container"
      style={{
        width: '100%',
        height: '700px',
        borderRadius: '8px',
        overflow: 'hidden',
        border: '1px solid #e0e0e0'
      }}
    />
  );
};

export default JitsiMeeting;
