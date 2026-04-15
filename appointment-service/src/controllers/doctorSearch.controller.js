const {
  searchDoctorsBySpecialty,
  ServiceIntegrationError,
  ServiceConfigurationError
} = require('../services/doctorSearch.service');

const searchDoctors = async (req, res) => {
  const specialty = req.query.specialty;

  if (!specialty || !specialty.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Query parameter specialty is required'
    });
  }

  try {
    const doctors = await searchDoctorsBySpecialty(specialty);

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
