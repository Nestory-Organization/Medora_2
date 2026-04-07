const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const systemRoutes = require('./routes/system.routes');
const doctorRoutes = require('./routes/doctor.routes');

const app = express();

app.use(helmet());
app.use(cors());
app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/', systemRoutes);
app.use('/', doctorRoutes);

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

