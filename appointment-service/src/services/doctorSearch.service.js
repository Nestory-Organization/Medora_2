const env = require('../config/env');

const MOCK_DOCTORS = [
  {
    doctorId: 'doc-1001',
    name: 'Dr. Maya Fernando',
    specialty: 'Cardiology',
    hospitalOrClinic: 'City Heart Clinic',
    consultationFee: 85,
    availableSlots: ['2026-04-17T09:00:00.000Z', '2026-04-17T10:30:00.000Z']
  },
  {
    doctorId: 'doc-1002',
    name: 'Dr. Sameera Perera',
    specialty: 'Cardiology',
    hospitalOrClinic: 'Central Medical Center',
    consultationFee: 95,
    availableSlots: ['2026-04-17T13:00:00.000Z', '2026-04-18T08:30:00.000Z']
  },
  {
    doctorId: 'doc-1003',
    name: 'Dr. Anika Senanayake',
    specialty: 'Dermatology',
    hospitalOrClinic: 'Lakeside Dermatology',
    consultationFee: 70,
    availableSlots: ['2026-04-19T11:00:00.000Z']
  },
  {
    doctorId: 'doc-1004',
    name: 'Dr. Nuwan Rajapaksa',
    specialty: 'Neurology',
    hospitalOrClinic: 'Metro Neuro Care',
    consultationFee: 110,
    availableSlots: ['2026-04-20T09:15:00.000Z', '2026-04-20T12:00:00.000Z']
  }
];

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
  specialty: doctor.specialty,
  hospitalOrClinic: doctor.hospitalOrClinic,
  consultationFee: doctor.consultationFee,
  availableSlots: Array.isArray(doctor.availableSlots) ? doctor.availableSlots : []
});

const searchMockDoctorsBySpecialty = (specialty) => {
  const normalizedSpecialty = normalizeSpecialty(specialty);

  return MOCK_DOCTORS.filter(
    (doctor) => normalizeSpecialty(doctor.specialty) === normalizedSpecialty
  ).map(mapDoctorToSearchResult);
};

const fetchDoctorsFromDoctorService = async (specialty) => {
  const baseUrl = env.doctorServiceUrl.replace(/\/+$/, '');

  // Future inter-service communication: replace this route with the finalized doctor-service API contract.
  const url =
    baseUrl + '/doctor/search?specialty=' + encodeURIComponent(specialty);

  let response;
  try {
    response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json'
      },
      signal: AbortSignal.timeout(5000)
    });
  } catch (error) {
    throw new ServiceIntegrationError('doctor-service is unreachable');
  }

  if (!response.ok) {
    throw new ServiceIntegrationError(
      'doctor-service returned status ' + response.status
    );
  }

  const payload = await response.json();

  // Future inter-service communication: adjust payload parsing once doctor-service response schema is finalized.
  const doctors = Array.isArray(payload?.data)
    ? payload.data
    : Array.isArray(payload?.doctors)
      ? payload.doctors
      : [];

  return doctors.map(mapDoctorToSearchResult).filter((doctor) => doctor.specialty);
};

const searchDoctorsBySpecialty = async (specialty) => {
  const source = env.doctorSearchSource.toLowerCase();

  if (source === 'mock') {
    return searchMockDoctorsBySpecialty(specialty);
  }

  if (source === 'http') {
    return fetchDoctorsFromDoctorService(specialty);
  }

  throw new ServiceConfigurationError(
    'Invalid DOCTOR_SEARCH_SOURCE value: ' + env.doctorSearchSource
  );
};

module.exports = {
  searchDoctorsBySpecialty,
  ServiceIntegrationError,
  ServiceConfigurationError
};
