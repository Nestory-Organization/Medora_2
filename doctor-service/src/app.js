const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const systemRoutes = require('./routes/system.routes');
const doctorRoutes = require('./routes/doctor.routes');
const {
  searchDoctorsBySpecialty,
  getDoctorProfile,
  getVerifiedDoctors
} = require('./controllers/doctorSearch.controller');
const { getAllDoctors, verifyDoctor } = require('./controllers/system.controller');

const app = express();

app.use(helmet());
app.use(cors());
app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// System endpoints - DIRECT HANDLERS (no middleware interference)
app.get('/system/doctors', getAllDoctors);
app.patch('/system/doctors/:doctorId/verify', verifyDoctor);

// Legacy system routes for health/status
app.use('/system', systemRoutes);

// PUBLIC SEARCH ENDPOINTS (no auth required - must be BEFORE protected routes)
app.get('/doctor/search', searchDoctorsBySpecialty);
app.get('/doctor/verified', getVerifiedDoctors);

// Protected doctor routes (auth required)
// This includes the /:doctorId GET route which requires authentication
app.use('/doctor', doctorRoutes);

app.use((req, res) => {
  res.status(404).json({
    message: 'Route not found'
  });
});

app.use((err, req, res, next) => {
  if (err.code === 'ECONNABORTED' || err.type === 'request.aborted') {
    console.error('Stream aborted:', {
      method: req.method,
      url: req.url,
      contentLength: req.headers['content-length'],
      code: err.code
    });
    return res.status(400).json({
      success: false,
      message: 'Request stream interrupted'
    });
  }
  console.error('Unhandled error:', err);
  res.status(500).json({
    message: 'Internal server error'
  });
});

module.exports = app;

