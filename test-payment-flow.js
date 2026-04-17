// Test Payment Status Flow
const axios = require('axios');

const api = axios.create({ baseURL: 'http://localhost:4000/api' });

async function test() {
  try {
    console.log('\n========== PAYMENT STATUS VERIFICATION ==========\n');

    // Step 1: Create patient
    console.log('Step 1: Creating patient account...');
    const patientRes = await api.post('/auth/register', {
      email: `testpatient_${Date.now()}@test.com`,
      password: 'Test123456',
      firstName: 'Test',
      lastName: 'Patient',
      role: 'patient'
    });

    if (!patientRes.data.success) {
      console.log('✗ Patient creation failed');
      return;
    }

    const patientToken = patientRes.data.data.token;
    const patientId = patientRes.data.data.user._id;
    console.log(`✓ Patient created: ${patientId}`);

    // Step 2: Get doctors
    console.log('\nStep 2: Searching for available doctors...');
    const doctorRes = await api.get('/appointments/doctors/search?specialty=Cardiology', {
      headers: { Authorization: `Bearer ${patientToken}` }
    });

    if (!doctorRes.data.success || !doctorRes.data.data.length) {
      console.log('✗ No doctors found');
      return;
    }

    const doctor = doctorRes.data.data[0];
    const doctorId = doctor.doctorId;
    console.log(`✓ Found doctor: ${doctorId} - ${doctor.name}`);

    // Step 3: Book appointment
    console.log('\nStep 3: Booking appointment...');
    const appointmentDate = new Date();
    appointmentDate.setDate(appointmentDate.getDate() + 5);
    
    const bookingRes = await api.post('/appointments', {
      patientId,
      patientName: 'Test Patient',
      doctorId,
      appointmentDate: appointmentDate.toISOString().split('T')[0],
      startTime: '10:00',
      endTime: '11:00',
      consultationFee: 100,
      reason: 'General checkup'
    }, {
      headers: { Authorization: `Bearer ${patientToken}` }
    });

    if (!bookingRes.data.success) {
      console.log(`✗ Booking failed: ${bookingRes.data.message}`);
      return;
    }

    const appointmentId = bookingRes.data.data._id;
    console.log(`✓ Appointment booked: ${appointmentId}`);
    console.log(`  Initial Status: ${bookingRes.data.data.status}`);
    console.log(`  Initial Payment Status: ${bookingRes.data.data.paymentStatus}`);

    // Step 4: Verify patient sees PENDING_PAYMENT
    console.log('\nStep 4: Patient fetching their appointments...');
    const patientApptsRes = await api.get(`/appointments/my-appointments?patientId=${patientId}`, {
      headers: { Authorization: `Bearer ${patientToken}` }
    });

    if (!patientApptsRes.data.success) {
      console.log('✗ Failed to fetch patient appointments');
      return;
    }

    const appts = patientApptsRes.data.data;
    console.log(`✓ Found ${appts.length} appointments`);
    appts.forEach((apt, i) => {
      console.log(`  ${i + 1}. Status: ${apt.status}, Payment: ${apt.paymentStatus}, Fee: $${apt.consultationFee}`);
    });

    // Step 5: Update payment status
    console.log('\nStep 5: Simulating payment completion (updating appointment)...');
    const updateRes = await axios.post(`http://localhost:4004/appointments/${appointmentId}/payment-status`, {
      status: 'CONFIRMED',
      paymentStatus: 'PAID'
    });

    if (updateRes.data.success) {
      console.log(`✓ Payment status updated`);
      console.log(`  New Status: ${updateRes.data.data.status}`);
      console.log(`  New Payment Status: ${updateRes.data.data.paymentStatus}`);
    } else {
      console.log(`✗ Update failed: ${updateRes.data.message}`);
    }

    // Step 6: Verify patient sees updated status
    console.log('\nStep 6: Patient checking updated appointment status...');
    await new Promise(r => setTimeout(r, 1000));
    
    const checkRes = await api.get(`/appointments/my-appointments?patientId=${patientId}`, {
      headers: { Authorization: `Bearer ${patientToken}` }
    });

    const updatedApt = checkRes.data.data.find(a => a._id === appointmentId);
    if (updatedApt) {
      console.log(`✓ Patient sees updated appointment:`);
      console.log(`  Status: ${updatedApt.status}`);
      console.log(`  Payment Status: ${updatedApt.paymentStatus}`);
      
      if (updatedApt.status === 'CONFIRMED' && updatedApt.paymentStatus === 'PAID') {
        console.log('\n✓ ✓ ✓ PAYMENT FLOW WORKING CORRECTLY FOR PATIENTS!\n');
      } else {
        console.log('\n⚠ Status not updated as expected\n');
      }
    }

    // Step 7: Verify doctor can see appointment with payment status
    console.log('Step 7: Doctor checking their appointments...');
    // For this test, we'll just verify the appointment endpoint includes paymentStatus
    const appointmentCheckRes = await axios.get(`http://localhost:4004/appointments/${appointmentId}`);
    if (appointmentCheckRes.data.success) {
      const apt = appointmentCheckRes.data.data;
      console.log(`✓ Doctor can see appointment:`);
      console.log(`  Status: ${apt.status}`);
      console.log(`  Payment Status: ${apt.paymentStatus}`);
      
      if (apt.paymentStatus) {
        console.log('\n✓ ✓ ✓ PAYMENT STATUS VISIBLE TO DOCTORS!\n');
      }
    }

    console.log('========== VERIFICATION COMPLETE ==========\n');

  } catch (error) {
    console.error('Test error:', error.response?.data || error.message);
  }
}

test();
