const app = require('./app');
const env = require('./config/env');
const connectDB = require('./config/db');

const startServer = async () => {
  await connectDB(env.mongoUri);

  app.locals.serviceName = env.serviceName;

  app.listen(env.port, () => {
    console.log(env.serviceName + ' listening on port ' + env.port);
  });
};

startServer();

