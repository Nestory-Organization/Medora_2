const mongoose = require('mongoose');
const Notification = require('./src/models/notification.model');
require('dotenv').config();

const MONGO_URI_NOTIFICATION = 'mongodb://notification-mongodb:27017/notification_db';
const MONGO_URI_AUTH = 'mongodb://auth-mongodb:27017/auth_db';

const userSchema = new mongoose.Schema({
  email: String,
  firstName: String,
  lastName: String,
  role: String
}, { collection: 'users' });

const seedNotifications = async () => {
  let authConn;
  let notifConn;

  try {
    // Connect to notification DB
    notifConn = await mongoose.createConnection(MONGO_URI_NOTIFICATION).asPromise();
    console.log('Connected to Notification MongoDB');
    const NotificationModel = notifConn.model('Notification', Notification.schema);

    // Connect to auth DB to get users
    authConn = await mongoose.createConnection(MONGO_URI_AUTH).asPromise();
    console.log('Connected to Auth MongoDB');
    const UserModel = authConn.model('User', userSchema);

    const users = await UserModel.find({});
    console.log(`Found ${users.length} users`);

    if (users.length === 0) {
      console.log('No users found to seed notifications for.');
      process.exit(0);
    }

    const mockNotifications = [];

    for (const user of users) {
      // Welcome notification
      mockNotifications.push({
        channel: 'EMAIL',
        eventType: 'WELCOME',
        recipient: user.email,
        subject: 'Welcome to Medora!',
        message: `Hello ${user.firstName}, welcome to Medora Healthcare platform.`,
        status: 'SENT',
        provider: 'mock',
        metadata: { userId: user._id }
      });

      // Role specific notification
      if (user.role === 'patient') {
        mockNotifications.push({
          channel: 'EMAIL',
          eventType: 'SYSTEM',
          recipient: user.email,
          subject: 'Complete Your Profile',
          message: 'Please complete your medical profile to get better service.',
          status: 'SENT',
          provider: 'mock',
          metadata: { userId: user._id }
        });
      } else if (user.role === 'doctor') {
        mockNotifications.push({
          channel: 'EMAIL',
          eventType: 'SYSTEM',
          recipient: user.email,
          subject: 'Appointment Schedule Updated',
          message: 'Your schedule for tomorrow has been updated with new appointments.',
          status: 'SENT',
          provider: 'mock',
          metadata: { userId: user._id }
        });
      }
    }

    // Clear existing (optional - commented out for safety)
    // await NotificationModel.deleteMany({});

    await NotificationModel.insertMany(mockNotifications);
    console.log(`✅ Successfully seeded ${mockNotifications.length} notifications for ${users.length} users.`);

  } catch (error) {
    console.error('❌ Error seeding notifications:', error);
  } finally {
    if (authConn) await authConn.close();
    if (notifConn) await notifConn.close();
    process.exit(0);
  }
};

seedNotifications();
