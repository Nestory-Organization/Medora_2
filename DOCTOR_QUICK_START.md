# Doctor Profile & Appointments - Quick Start Guide

## What's New

### 🆕 Two New Doctor Pages
1. **Doctor Profile** (`/doctor/profile`)
   - Create and edit doctor profile
   - Add specialization, experience, fees, and bio

2. **Patient Appointments** (`/doctor/appointments`)  
   - View all patients who booked appointments
   - Filter by status, search by name
   - Accept or decline bookings

### 🎯 Updated Dashboard
- New navigation buttons for Profile and Appointments
- Quick access from dashboard action center

---

## How to Use

### Create/Edit Your Profile
1. Login as a doctor
2. Click "My Profile" button on dashboard
3. Fill in your professional details
4. Click "Create Profile" or "Update Profile"
5. Get redirected to dashboard on success

### View Booked Appointments
1. Click "Patient Bookings" on dashboard
2. See all patients who booked appointments
3. Use search to find specific patients
4. Filter by status (pending, confirmed, etc.)
5. For pending bookings, accept or decline them

---

## API Endpoints Reference

### Doctor Service (`http://localhost:4000/api/doctors/`)

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| POST | `/profile` | Create new profile | ✅ |
| GET | `/profile` | Get your profile | ✅ |
| PUT | `/profile` | Update your profile | ✅ |
| GET | `/appointments` | List all appointments | ✅ |
| PUT | `/appointment/:id/status` | Accept/Decline appointment | ✅ |

---

## Required Fields for Profile

```javascript
{
  "firstName": "string (required)",
  "lastName": "string (required)",
  "specialization": "string (required)",
  "phone": "string (optional)",
  "yearsOfExperience": "number (optional)",
  "consultationFee": "number (optional)",
  "qualification": "string (optional)",
  "bio": "string (optional)",
  "clinicAddress": "string (optional)"
}
```

---

## Available Specializations

- Cardiology
- Dermatology
- Neurology
- Orthopedics
- Pediatrics
- Psychiatry
- Gynecology
- General Medicine
- Dentistry
- ENT
- Ophthalmology
- Urology

---

## Appointment Data Structure

```javascript
{
  "_id": "ObjectId",
  "patientId": "string",
  "doctorId": "string",
  "specialty": "string",
  "appointmentDate": "ISO 8601 datetime",
  "startTime": "HH:MM format",
  "endTime": "HH:MM format",
  "consultationFee": "number",
  "reason": "string",
  "status": "PENDING_PAYMENT|CONFIRMED|CANCELLED|COMPLETED",
  "paymentStatus": "UNPAID|PAID|FAILED|REFUNDED",
  "createdAt": "ISO 8601 datetime",
  "updatedAt": "ISO 8601 datetime"
}
```

---

## Status Updates

When accepting/declining appointments:

```javascript
// Accept an appointment
PUT /appointment/{appointmentId}/status
{
  "status": "CONFIRMED"
}

// Decline an appointment
PUT /appointment/{appointmentId}/status
{
  "status": "CANCELLED"
}
```

---

## File Locations

**Frontend:**
- `client/src/pages/doctor/DoctorProfile.tsx` - Profile creation/editing
- `client/src/pages/doctor/PatientAppointments.tsx` - Appointment viewing
- `client/src/pages/doctor/DoctorDashboard.tsx` - Dashboard with new buttons
- `client/src/App.tsx` - Routes configuration

**Backend:**
- `doctor-service/src/controllers/doctor.controller.js` - Business logic
- `doctor-service/src/routes/doctor.routes.js` - API routes
- `doctor-service/src/models/doctorProfile.model.js` - Database schema

---

## Environment Setup

Ensure these services are running:
1. **API Gateway** - Port 4000
2. **Doctor Service** - Internal port (specified in docker-compose)
3. **Patient Service** - (Optional for future enhancements)
4. **MongoDB** - Database

---

## Testing the Feature

### Test Case 1: Create Profile
```bash
POST /api/doctors/profile
{
  "firstName": "John",
  "lastName": "Doe",
  "specialization": "Cardiology",
  "phone": "+1234567890",
  "consultationFee": 75,
  "bio": "Experienced cardiologist with 10+ years",
  "yearsOfExperience": 10
}
```

### Test Case 2: Get Profile
```bash
GET /api/doctors/profile
# Returns the doctor's profile
```

### Test Case 3: Update Profile
```bash
PUT /api/doctors/profile
{
  "consultationFee": 100,
  "bio": "Updated bio text"
}
```

### Test Case 4: List Appointments
```bash
GET /api/doctors/appointments
# Returns array of appointments
```

### Test Case 5: Filter Appointments
```bash
GET /api/doctors/appointments?status=CONFIRMED
# Returns only confirmed appointments
```

### Test Case 6: Update Appointment Status
```bash
PUT /api/doctors/appointment/[appointmentId]/status
{
  "status": "CONFIRMED"
}
```

---

## Common Issues & Solutions

**Issue: "Invalid doctor identifier"**
- Check JWT token is valid
- Ensure user is authenticated
- Verify role is 'DOCTOR'

**Issue: "Doctor profile not found" (404)**
- Profile hasn't been created yet
- Try creating a new profile first
- Wrong doctor ID in token

**Issue: Appointments not loading**
- No appointments exist for this doctor
- Check filter/search isn't too restrictive
- Verify API gateway is running

**Issue: Status update fails**
- Appointment ID might be invalid
- Appointment might belong to different doctor
- Status value might be wrong

---

## Response Format

All API responses follow this format:

```javascript
// Success
{
  "success": true,
  "message": "Action completed successfully",
  "data": { /* response data */ }
}

// Error
{
  "success": false,
  "message": "Error description"
}
```

---

## Features Summary

✅ **Profile Management**
- Create doctor profile
- Edit profile information
- View current profile
- Store specialization, experience, fees

✅ **Appointment Management**
- View all booked appointments
- See patient information
- Filter by appointment status
- Search appointments
- Accept pending appointments
- Decline appointments
- View payment status

✅ **User Experience**
- Responsive design for mobile/desktop
- Loading states
- Error handling
- Success notifications
- Intuitive navigation

✅ **Security**
- JWT authentication required
- Doctor can only view/manage own appointments
- Authorization checks on all endpoints

---

## Next Steps (Optional Future Enhancements)

1. **Patient Info Integration**
   - Fetch patient name, email, phone from patient-service
   - Display enhanced patient information

2. **Telemedicine**
   - Start video calls from appointments
   - Jitsi Meet integration

3. **Prescriptions**
   - Add prescriptions after appointment
   - View prescription history

4. **Reporting**
   - Generate appointment reports
   - Export data to PDF/CSV

5. **Availability Management**
   - Better integration with calendar
   - Bulk availability setting
   - Automatic slot management

---

## Support

For issues or questions:
1. Check the DOCTOR_FEATURE_GUIDE.md for detailed documentation
2. Review backend logs for API errors
3. Check browser console for frontend errors
4. Verify all services are running on correct ports

---

**Last Updated:** April 17, 2024
**Version:** 1.0
**Status:** ✅ Complete & Ready for Testing
