const {
  searchDoctorsBySpecialty,
  ServiceIntegrationError,
  ServiceConfigurationError
} = require('../services/doctorSearch.service');

const searchDoctors = async (req, res) => {
  const specialty = req.query.specialty;
  const date = req.query.date; // Optional: filter doctors by availability on specific date

  if (!specialty || !specialty.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Query parameter specialty is required'
    });
  }

  try {
    console.log(`[Search] specialty=${specialty}, date=${date || 'not specified'}`);
    
    // Fetch doctors from doctor-service with optional date for availability
    const doctors = await searchDoctorsBySpecialty(specialty, date);

    return res.status(200).json({
      success: true,
      specialty: specialty.trim(),
      count: doctors.length,
      data: doctors
    });
  } catch (error) {
    console.error('Doctor search error:', error);

    if (
      error instanceof ServiceIntegrationError ||
      error instanceof ServiceConfigurationError
    ) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to search doctors'
    });
  }
};

module.exports = {
  searchDoctors
};
