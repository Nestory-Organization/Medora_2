# Doctor Profile & Patient Appointments Feature Guide

## Overview
This feature enables doctors to:
1. Create and manage their professional profile
2. View all patient appointments booked with them
3. Accept or decline pending appointments
4. Search and filter appointments

---

## Frontend Components

### 1. Doctor Profile Page (`/doctor/profile`)
**Location:** `client/src/pages/doctor/DoctorProfile.tsx`

**Features:**
- Create doctor profile on first visit
- Edit existing profile
- Form fields:
  - First Name (required)
  - Last Name (required)
  - Phone Number
  - Specialization (required, dropdown with 12 options)
  - Years of Experience
  - Consultation Fee
  - Professional Qualification
  - Professional Bio
  - Clinic Address

**Key Functionality:**
```tsx
// Fetch existing profile
GET /api/doctors/profile

// Create new profile
POST /api/doctors/profile

// Update existing profile
PUT /api/doctors/profile
```

**User Flow:**
1. Doctor visits `/doctor/profile`
2. Component fetches existing profile (if any)
3. Shows creation form or edit form
4. On submit, sends data to backend
5. Redirects to dashboard on success

---

### 2. Patient Appointments Page (`/doctor/appointments`)
**Location:** `client/src/pages/doctor/PatientAppointments.tsx`

**Features:**
- View all patient appointments
- Statistics dashboard (Total, Confirmed, Pending, Completed)
- Search appointments by:
  - Patient name
  - Specialty
  - Reason for visit
- Filter by status:
  - ALL
  - PENDING_PAYMENT
  - CONFIRMED
  - CANCELLED
  - COMPLETED
- Accept/Decline pending appointments
- Display patient contact information with each appointment

**Data Displayed:**
```json
{
  "_id": "appointment_id",
  "patientId": "patient_id",
  "patientName": "John Doe",
  "patientPhone": "+1234567890",
  "patientEmail": "john@example.com",
  "specialty": "Cardiology",
  "appointmentDate": "2024-04-20T10:00:00Z",
  "startTime": "10:00",
  "endTime": "11:00",
  "consultationFee": 50,
  "reason": "Regular checkup",
  "status": "PENDING_PAYMENT",
  "paymentStatus": "UNPAID"
}
```

**Key Functionality:**
```tsx
// Fetch doctor's appointments
GET /api/doctors/appointments

// Update appointment status
PUT /api/doctors/appointment/{id}/status
Body: { status: "CONFIRMED" | "CANCELLED" }
```

---

### 3. Updated Dashboard
**Location:** `client/src/pages/doctor/DoctorDashboard.tsx`

**New Navigation Elements:**
1. "My Profile" button - Navigate to profile page
2. "Patient Bookings" button - Navigate to appointments
3. "Set Availability" button - Existing availability management

**Action Center Cards:**
- My Profile card with UserCircle icon
- Patient Bookings card with Calendar icon
- Upload Labs card (existing)

---

## Backend API Endpoints

### Doctor Service Base URL
```
http://localhost:4000/api/doctors
```

### Endpoints

#### 1. Get Doctor Profile
```http
GET /profile
Authorization: Bearer {token}

Response:
{
  "success": true,
  "data": {
    "_id": "...",
    "doctorId": "...",
    "firstName": "John",
    "lastName": "Doe",
    "specialization": "Cardiology",
    "yearsOfExperience": 10,
    "consultationFee": 50,
    "phone": "+1234567890",
    "qualification": "MD",
    "bio": "Experienced cardiologist...",
    "clinicAddress": "123 Medical St",
    "isVerified": true,
    "createdAt": "2024-04-15T10:00:00Z",
    "updatedAt": "2024-04-15T10:00:00Z"
  }
}
```

#### 2. Create Doctor Profile
```http
POST /profile
Authorization: Bearer {token}
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890",
  "specialization": "Cardiology",
  "qualification": "MD",
  "yearsOfExperience": 10,
  "consultationFee": 50,
  "bio": "Experienced cardiologist...",
  "clinicAddress": "123 Medical St"
}

Response:
{
  "success": true,
  "message": "Doctor profile created successfully",
  "data": { ... }
}
```

#### 3. Update Doctor Profile
```http
PUT /profile
Authorization: Bearer {token}
Content-Type: application/json

{
  "firstName": "John",
  "phone": "+1234567890",
  ...
}

Response:
{
  "success": true,
  "message": "Doctor profile updated successfully",
  "data": { ... }
}
```

#### 4. Get Doctor's Appointments
```http
GET /appointments?status=CONFIRMED
Authorization: Bearer {token}

Query Parameters:
- status (optional): PENDING_PAYMENT, CONFIRMED, CANCELLED, COMPLETED

Response:
{
  "success": true,
  "data": [
    {
      "_id": "appointment_id",
      "patientId": "patient_id",
      "doctorId": "doctor_id",
      "specialty": "Cardiology",
      "appointmentDate": "2024-04-20T10:00:00Z",
      "startTime": "10:00",
      "endTime": "11:00",
      "consultationFee": 50,
      "reason": "Regular checkup",
      "status": "CONFIRMED",
      "paymentStatus": "PAID",
      "createdAt": "2024-04-15T10:00:00Z"
    }
  ]
}
```

#### 5. Update Appointment Status
```http
PUT /appointment/{appointmentId}/status
Authorization: Bearer {token}
Content-Type: application/json

{
  "status": "CONFIRMED" | "CANCELLED" | "COMPLETED"
}

Response:
{
  "success": true,
  "message": "Appointment status updated successfully",
  "data": { ... }
}
```

---

## Status Values & Mapping

### Appointment Statuses
- `PENDING_PAYMENT` - Awaiting payment confirmation
- `CONFIRMED` - Appointment accepted by doctor
- `CANCELLED` - Appointment rejected/cancelled
- `COMPLETED` - Appointment finished

### Frontend Status to Backend Mapping
| Frontend | Backend |
|----------|---------|
| ACCEPTED | CONFIRMED |
| CONFIRMED | CONFIRMED |
| REJECTED | CANCELLED |
| CANCELLED | CANCELLED |

---

## Component Structure

### DoctorProfile Component
```
DoctorProfile
├── Header (with back button)
├── Message Display (success/error)
├── Form Container
│   ├── Name Fields (firstName, lastName)
│   ├── Contact & Specialization
│   ├── Experience & Fee
│   ├── Qualification
│   ├── Bio
│   ├── Clinic Address
│   └── Submit Buttons
└── Loading State
```

### PatientAppointments Component
```
PatientAppointments
├── Header (with back button)
├── Message Display
├── Statistics Cards
│   ├── Total Appointments
│   ├── Confirmed
│   ├── Pending
│   └── Completed
├── Filter & Search
│   ├── Search Input
│   └── Status Filter Buttons
├── Appointments List
│   └── AppointmentCard (repeated)
│       ├── Patient Info
│       ├── Status Badge
│       ├── Date & Time
│       ├── Contact Info
│       ├── Reason
│       ├── Fee & Payment Status
│       └── Action Buttons (if pending)
└── Empty State
```

---

## Styling

**Color Scheme:**
- Primary: Blue (#3B82F6)
- Secondary: Indigo (#4F46E5)
- Status Colors:
  - PENDING: Yellow (#FCD34D)
  - CONFIRMED: Green (#10B981)
  - CANCELLED: Red (#EF4444)
  - COMPLETED: Blue (#3B82F6)

**Framework:** Tailwind CSS
**Icons:** Phosphor Icons

---

## Error Handling

### Common Error Responses

**400 - Bad Request**
```json
{
  "success": false,
  "message": "First name, last name, and specialization are required"
}
```

**404 - Not Found**
```json
{
  "success": false,
  "message": "Doctor profile not found"
}
```

**409 - Conflict**
```json
{
  "success": false,
  "message": "Doctor profile already exists"
}
```

**500 - Server Error**
```json
{
  "success": false,
  "message": "Failed to create doctor profile"
}
```

---

## LocalStorage Usage

**Keys Used:**
- `authToken` - JWT bearer token for API calls
- `user` - Current user object with firstName, lastName, id, role

**Example:**
```javascript
const token = localStorage.getItem('authToken');
const user = JSON.parse(localStorage.getItem('user'));
```

---

## Testing Checklist

- [ ] Doctor can create profile with all fields
- [ ] Doctor can edit existing profile
- [ ] Doctor can view list of all appointments
- [ ] Doctor can filter appointments by status
- [ ] Doctor can search appointments
- [ ] Doctor can accept pending appointments
- [ ] Doctor can decline pending appointments
- [ ] Error messages display correctly
- [ ] Loading states show during API calls
- [ ] Success messages display after actions
- [ ] Navigation works between pages
- [ ] Mobile responsive design works

---

## Future Enhancements

1. **Patient Info Population**
   - Call patient-service to fetch patient name, email, phone
   - Display in appointment cards

2. **Telemedicine Integration**
   - Start video call from appointment
   - Jitsi Meet integration

3. **Prescription Management**
   - Add prescriptions to appointments
   - View prescription history

4. **Notes & Reports**
   - Add notes after consultation
   - Generate appointment reports

5. **Ratings & Reviews**
   - Display patient ratings
   - View feedback

6. **Export Appointments**
   - Export to PDF/CSV
   - Print appointment list

---

## Dependencies

**Frontend:**
- React 18+
- Axios (HTTP client)
- React Router (Navigation)
- Tailwind CSS (Styling)
- Phosphor Icons (Icons)

**Backend:**
- Express.js
- MongoDB/Mongoose
- JWT (Authentication)

---

## Support & Troubleshooting

### Issue: Profile not found when creating
**Solution:** Ensure user is authenticated and token is valid

### Issue: Appointments not loading
**Solution:** Check if doctor has any appointments in the system

### Issue: Status update fails
**Solution:** Verify appointment ID is valid and belongs to the doctor

### Issue: CORS errors
**Solution:** Ensure API gateway is running on http://localhost:4000

---

Last Updated: April 17, 2024
