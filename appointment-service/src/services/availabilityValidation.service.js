/**
 * Enhanced Appointment Service with Doctor Availability Validation
 * Integrates with Doctor Service to ensure availability
 */

const env = require('../config/env');
const Appointment = require('../models/appointment.model');

class AvailabilityValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AvailabilityValidationError';
    this.statusCode = 409;
  }
}

class DoctorServiceError extends Error {
  constructor(message) {
    super(message);
    this.name = 'DoctorServiceError';
    this.statusCode = 502;
  }
}

/**
 * Fetch doctor availability from doctor-service
 */
const fetchDoctorAvailability = async (doctorId, date) => {
  try {
    const baseUrl = env.doctorServiceUrl?.replace(/\/+$/, '') || 'http://localhost:3002';
    const formattedDate = new Date(date).toISOString().split('T')[0];
    const url = `${baseUrl}/doctor/availability?date=${formattedDate}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Authorization': `Bearer ${env.serviceToken || ''}`
      },
      signal: AbortSignal.timeout(5000)
    });

    if (!response.ok && response.status !== 404) {
      throw new DoctorServiceError(`Doctor service returned status ${response.status}`);
    }

    if (response.status === 404) {
      return null;
    }

    const payload = await response.json();
    return payload.data || null;
  } catch (error) {
    if (error instanceof DoctorServiceError) {
      throw error;
    }
    console.error('Availability fetch error:', error);
    // Continue without validation if service is unavailable
    return null;
  }
};

/**
 * Validate if appointment slot is available in doctor's schedule
 */
const validateAppointmentSlotAvailability = async (doctorId, appointmentDate, startTime, endTime) => {
  try {
    const availabilities = await fetchDoctorAvailability(doctorId, appointmentDate);
    
    if (!availabilities) {
      // If we can't fetch availability, allow booking (doctor-service may be down)
      console.warn(`Could not validate availability for doctor ${doctorId}`);
      return true;
    }

    // Find availability for the specific date
    const dateAvailability = Array.isArray(availabilities) 
      ? availabilities.find(a => {
        const aDate = new Date(a.date);
        const reqDate = new Date(appointmentDate);
        return aDate.toDateString() === reqDate.toDateString();
      })
      : availabilities;

    if (!dateAvailability || !dateAvailability.slots || dateAvailability.slots.length === 0) {
      throw new AvailabilityValidationError(`Doctor is not available on ${appointmentDate}`);
    }

    // Check if the requested slot is within available slots
    const requestedStart = startTime;
    const requestedEnd = endTime;

    const slotAvailable = dateAvailability.slots.some(slot => {
      return slot.startTime === requestedStart && slot.endTime === requestedEnd && !slot.isBooked;
    });

    if (!slotAvailable) {
      throw new AvailabilityValidationError(`Requested time slot ${startTime}-${endTime} is not available`);
    }

    return true;
  } catch (error) {
    if (error instanceof AvailabilityValidationError) {
      throw error;
    }
    console.error('Availability validation error:', error);
    throw error;
  }
};

/**
 * Mark appointment slot as booked in doctor availability
 */
const markSlotAsBooked = async (doctorId, appointmentDate, startTime) => {
  try {
    const baseUrl = env.doctorServiceUrl?.replace(/\/+$/, '') || 'http://localhost:3002';
    const url = `${baseUrl}/doctor/availability/mark-booked`;

    await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.serviceToken || ''}`
      },
      body: JSON.stringify({
        doctorId,
        date: appointmentDate,
        startTime
      }),
      signal: AbortSignal.timeout(5000)
    });
  } catch (error) {
    console.warn('Could not mark slot as booked in doctor-service:', error);
    // Don't fail the appointment if marking fails
  }
};

/**
 * Release booked slot
 */
const releaseBookedSlot = async (doctorId, appointmentDate, startTime) => {
  try {
    const baseUrl = env.doctorServiceUrl?.replace(/\/+$/, '') || 'http://localhost:3002';
    const url = `${baseUrl}/doctor/availability/release-slot`;

    await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.serviceToken || ''}`
      },
      body: JSON.stringify({
        doctorId,
        date: appointmentDate,
        startTime
      }),
      signal: AbortSignal.timeout(5000)
    });
  } catch (error) {
    console.warn('Could not release slot in doctor-service:', error);
  }
};

/**
 * Check for appointment conflicts at doctor-service
 */
const checkDoctorAppointmentConflict = async (doctorId, appointmentDate, startTime) => {
  try {
    const baseUrl = env.doctorServiceUrl?.replace(/\/+$/, '') || 'http://localhost:3002';
    const url = `${baseUrl}/doctor/appointments?date=${appointmentDate}&startTime=${startTime}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${env.serviceToken || ''}`
      },
      signal: AbortSignal.timeout(5000)
    });

    if (!response.ok) {
      return false; // Assume no conflict if check fails
    }

    const payload = await response.json();
    return !payload.success || (payload.data && payload.data.length === 0);
  } catch (error) {
    console.warn('Could not check doctor conflicts:', error);
    return true; // Assume available if check fails
  }
};

module.exports = {
  fetchDoctorAvailability,
  validateAppointmentSlotAvailability,
  markSlotAsBooked,
  releaseBookedSlot,
  checkDoctorAppointmentConflict,
  AvailabilityValidationError,
  DoctorServiceError
};
