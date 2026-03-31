const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const proxyRoutes = require('./routes/proxy.routes');
const { getGatewayHealth } = require('./controllers/health.controller');

const app = express();

const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false
});

app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined'));
app.use(globalRateLimiter);

app.get('/health', getGatewayHealth);
app.use('/api', proxyRoutes);

app.use((req, res) => {
  res.status(404).json({
    message: 'Gateway route not found'
  });
});

app.use((err, req, res, next) => {
  console.error('Gateway error:', err);
  res.status(500).json({
    message: 'Gateway internal server error'
  });
});

module.exports = app;

