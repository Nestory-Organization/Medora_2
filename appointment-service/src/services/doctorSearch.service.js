const env = require('../config/env');

class ServiceIntegrationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ServiceIntegrationError';
    this.statusCode = 502;
  }
}

class ServiceConfigurationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ServiceConfigurationError';
    this.statusCode = 500;
  }
}

const normalizeSpecialty = (specialty) => specialty.trim().toLowerCase();

const mapDoctorToSearchResult = (doctor) => ({
  doctorId: doctor.doctorId,
  name: doctor.name,
  specialization: doctor.specialization,
  qualification: doctor.qualification,
  yearsOfExperience: doctor.yearsOfExperience,
  consultationFee: doctor.consultationFee,
  bio: doctor.bio,
  clinicAddress: doctor.clinicAddress,
  isVerified: doctor.isVerified || true,
  availableSlots: Array.isArray(doctor.availableSlots) ? doctor.availableSlots : []
});

/**
 * Fetch doctors from Doctor Service with availability
 * Always uses real data from MongoDB, never falls back to mock
 */
const fetchDoctorsFromDoctorService = async (specialty, date = null) => {
  const baseUrl = env.doctorServiceUrl.replace(/\/+$/, '');

  // Build query params: specialty is required, date is optional for filtering availability
  let url = baseUrl + '/doctor/search?specialty=' + encodeURIComponent(specialty);
  
  if (date) {
    url += '&date=' + encodeURIComponent(date);
  }

  console.log(`[Doctor Search] Fetching from: ${url}`);

  let response;
  try {
    response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      signal: AbortSignal.timeout(8000)
    });
  } catch (error) {
    console.error('[Doctor Search Error]', error.message);
    throw new ServiceIntegrationError(
      `doctor-service is unreachable: ${error.message}`
    );
  }

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[Doctor Search Error] Status: ${response.status}, Body:`, errorText);
    throw new ServiceIntegrationError(
      `doctor-service returned status ${response.status}: ${response.statusText}`
    );
  }

  const payload = await response.json();
  console.log(`[Doctor Search] Response:`, payload);

  // Extract doctors from response - doctor-service returns { success, data: [], count }
  const doctors = Array.isArray(payload?.data)
    ? payload.data
    : Array.isArray(payload?.doctors)
      ? payload.doctors
      : [];

  if (doctors.length === 0) {
    console.log(`[Doctor Search] No doctors found for specialty: ${specialty}`);
    return [];
  }

  const mappedDoctors = doctors.map(mapDoctorToSearchResult);
  console.log(`[Doctor Search] Mapped ${mappedDoctors.length} doctors`);
  
  return mappedDoctors;
};

/**
 * Search doctors by specialty and optional date
 * Always fetches real data from doctor-service (no mock fallback)
 */
const searchDoctorsBySpecialty = async (specialty, date = null) => {
  if (!specialty || specialty.trim().length === 0) {
    throw new ServiceConfigurationError('Specialty parameter is required');
  }

  const source = env.doctorSearchSource.toLowerCase();

  if (source !== 'http') {
    console.warn(`[Doctor Search] DOCTOR_SEARCH_SOURCE is set to '${source}' but only 'http' is supported. Using doctor-service anyway.`);
  }

  // Always use real doctor-service data
  return fetchDoctorsFromDoctorService(specialty, date);
};

/**
 * Fetch a single doctor by ID from Doctor Service
 */
const fetchDoctorById = async (doctorId) => {
  if (!doctorId) {
    throw new ServiceConfigurationError('Doctor ID is required');
  }

  const baseUrl = env.doctorServiceUrl.replace(/\/+$/, '');
  const url = baseUrl + '/doctor/search/' + encodeURIComponent(String(doctorId).trim());

  console.log(`[Doctor Fetch] Fetching doctor from: ${url}`);

  let response;
  try {
    response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      signal: AbortSignal.timeout(8000)
    });
  } catch (error) {
    console.error('[Doctor Fetch Error]', error.message);
    // Return null instead of throwing to gracefully handle doctor service downtime
    return null;
  }

  if (!response.ok) {
    console.error(`[Doctor Fetch Error] Status: ${response.status}`);
    // Return null instead of throwing to gracefully handle 404s
    return null;
  }

  try {
    const payload = await response.json();
    console.log(`[Doctor Fetch] Response:`, payload);

    // Extract doctor from response - doctor-service returns { success, data: {...} }
    return payload?.data || null;
  } catch (error) {
    console.error('[Doctor Fetch] JSON parse error:', error.message);
    return null;
  }
};

module.exports = {
  searchDoctorsBySpecialty,
  fetchDoctorById,
  ServiceIntegrationError,
  ServiceConfigurationError
};
