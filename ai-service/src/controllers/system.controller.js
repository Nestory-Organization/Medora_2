const getHealth = async (req, res) => {
  return res.status(200).json({
    service: req.app.locals.serviceName,
    status: 'ok',
    timestamp: new Date().toISOString()
  });
};

const getStatus = async (req, res) => {
  return res.status(200).json({
    message: req.app.locals.serviceName + ' is operational'
  });
};

module.exports = {
  getHealth,
  getStatus
};

