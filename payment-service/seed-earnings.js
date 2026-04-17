const mongoose = require('mongoose');
const Transaction = require('./src/models/transaction.model');
const Payment = require('./src/models/payment.model');
require('dotenv').config();

const MOCK_DOCTORS = [
  { id: '69ce4274684d1fb301f463f8', name: 'Dr. John Doe' },
  { id: '69ce4274684d1fb301f463f9', name: 'Dr. Jane Smith' },
  { id: '69ce4274684d1fb301f463fa', name: 'Dr. Robert Brown' }
];

const seedMockEarnings = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/payment_db';
    console.log(`Connecting to MongoDB at ${mongoUri}...`);
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Clear existing mock data
    await Transaction.deleteMany({ referenceId: { $regex: /^MOCK-/ } });
    await Payment.deleteMany({ appointmentId: { $regex: /^MOCK-APP-/ } });

    const transactions = [];
    const payments = [];
    const now = new Date();

    for (const doctor of MOCK_DOCTORS) {
      // Create data for the last 45 days
      for (let i = 0; i < 45; i++) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        
        // Random number of appointments per day (1 to 5)
        const numAppointments = Math.floor(Math.random() * 5) + 1;
        
        for (let j = 0; j < numAppointments; j++) {
          const amount = 50 + Math.floor(Math.random() * 150); // $50 - $200
          const appointmentId = `MOCK-APP-${doctor.id}-${i}-${j}`;
          
          transactions.push({
            referenceId: `MOCK-REF-${appointmentId}`,
            patientId: `MOCK-PATIENT-${Math.floor(Math.random() * 100)}`,
            doctorId: doctor.id,
            appointmentId: appointmentId,
            amount: amount,
            currency: 'USD',
            status: 'completed',
            description: `Mock appointment for ${doctor.name}`,
            createdAt: date,
            updatedAt: date
          });

          payments.push({
            appointmentId: appointmentId,
            patientId: `MOCK-PATIENT-${Math.floor(Math.random() * 100)}`,
            amount: amount,
            currency: 'USD',
            gateway: 'STRIPE',
            status: 'SUCCESS',
            createdAt: date,
            updatedAt: date
          });
        }
      }
    }

    console.log(`Inserting ${transactions.length} mock transactions and ${payments.length} mock payments...`);
    await Transaction.insertMany(transactions);
    await Payment.insertMany(payments);
    console.log('Mock earnings data inserted successfully');

    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  } catch (error) {
    console.error('Error seeding mock data:', error);
    process.exit(1);
  }
};

seedMockEarnings();
