const mongoose = require('mongoose');
const env = require('./env');

const connectDatabase = async () => {
  try {
    const options = {
      autoIndex: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000
    };

    const connection = await mongoose.connect(env.mongoUri, options);
    console.info(`MongoDB connected to ${connection.connection.host}`);
  } catch (error) {
    console.error(`Database connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDatabase;
