const getGatewayHealth = (req, res) => {
  res.status(200).json({
    service: 'api-gateway',
    status: 'ok',
    timestamp: new Date().toISOString()
  });
};

module.exports = {
  getGatewayHealth
};

