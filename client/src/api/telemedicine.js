import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

/**
 * Create a telemedicine session for an appointment
 * @param {string} appointmentId - The ID of the appointment
 * @returns {Promise<{meetingLink: string, sessionId: string}>}
 */
export const createTelemedicineSession = async (appointmentId) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/doctors/telemedicine/create-session`,
      { appointmentId },
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data.success) {
      return {
        meetingLink: response.data.data.meetingLink,
        sessionId: response.data.data.sessionId,
        appointmentId: response.data.data.appointmentId
      };
    } else {
      throw new Error(response.data.message || 'Failed to create session');
    }
  } catch (error) {
    console.error('Error creating telemedicine session:', error);
    throw error;
  }
};

/**
 * Join a telemedicine meeting
 * @param {string} meetingLink - The Jitsi meeting link
 * @returns {void}
 */
export const joinTelemeetingFunction = (meetingLink) => {
  if (meetingLink) {
    window.open(meetingLink, '_blank');
  }
};
