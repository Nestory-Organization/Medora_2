# Notification System Setup Guide

This guide explains how the notification system works and how to set it up for sending real emails and SMS alerts.

## How It Works

### Flow Diagram

```
User Books Appointment
         ↓
Appointment Service (POST /appointments)
         ↓
Creates Appointment in Database
         ↓
Calls publishNotificationEvent()
         ↓
Fetches Doctor Details (name, specialty)
         ↓
Sends to Notification Service (POST /notify/event)
         ↓
Notification Service
         ├─→ Builds Email Template (appointment date, doctor name, specialty)
         ├─→ Sends to Patient Email
         └─→ Sends to Patient Phone (SMS)
         ↓
Saves Notification Record in MongoDB
         ↓
Returns Response to Appointment Service
```

## Architecture

### Services Involved

1. **appointment-service** (Port 4004)
   - Handles appointment booking
   - Publishes `APPOINTMENT_BOOKED` event with patient email/phone
   - Fetches doctor details and enriches the payload

2. **notification-service** (Port 4006)
   - Receives events from other services
   - Sends emails via SMTP (Gmail)
   - Sends SMS (mock or real provider)
   - Stores all notifications in MongoDB

### Event Types

| Event | Trigger | Recipients | Details Included |
|-------|---------|------------|------------------|
| `APPOINTMENT_BOOKED` | User books appointment | Patient email/SMS | Date, time, doctor name, specialty |
| `APPOINTMENT_RESCHEDULED` | Appointment rescheduled | Patient email/SMS | New date, new time, reason |
| `APPOINTMENT_CANCELLED` | Appointment cancelled | Patient email/SMS | Date, time, cancellation reason |
| `APPOINTMENT_COMPLETED` | Doctor marks appointment done | Patient email/SMS | Appointment ID, completion confirmation |
| `PAYMENT_SUCCESS` | Payment processed | Patient email/SMS | Amount, currency, appointment ID |

## Setup Steps

### 1. Mock Mode (Testing/Development)

**Default** - Emails logged to console, no real SMTP needed:

```bash
docker compose up --build
```

Notifications are created with `provider: "mock-email"` and stored in MongoDB.

### 2. Real Email with Gmail SMTP

#### Step A: Create Gmail App Password

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable **2-Step Verification** if not already enabled
3. Go to **App Passwords** section
4. Select "Mail" and "Windows Computer" (or your device)
5. Google generates a 16-character password (e.g., `abcd efgh ijkl mnop`)
6. Copy this password

#### Step B: Configure Environment Variables

Create `.env` file in project root:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=abcd efgh ijkl mnop
EMAIL_FROM=your-email@gmail.com
NOTIFICATION_EMAIL_MODE=auto
```

Or use environment variables:

```bash
export SMTP_USER=your-email@gmail.com
export SMTP_PASS=abcd-efgh-ijkl-mnop
export EMAIL_FROM=your-email@gmail.com
export NOTIFICATION_EMAIL_MODE=auto
docker compose up --build
```

#### Step C: Verify Configuration

Check if notification-service started correctly:

```bash
docker logs medora-notification-service | grep -i "smtp\|notification"
```

Expected output:
```
[Notification] Event published successfully: { eventType: 'APPOINTMENT_BOOKED', recipient: 'patient@gmail.com', doctor: 'Dr. John Doe' }
```

## Testing

### Test 1: Manual Notification Event

```bash
curl -X POST http://localhost:4006/notify/event \
  -H "Content-Type: application/json" \
  -d '{
    "eventType": "APPOINTMENT_BOOKED",
    "email": "your-email@gmail.com",
    "phone": "+1234567890",
    "appointmentDate": "2026-05-15",
    "startTime": "10:00",
    "doctorName": "Dr. John Doe",
    "specialty": "Cardiology"
  }'
```

**Response (Mock Mode):**
```json
{
  "success": true,
  "message": "Event notification processed",
  "data": {
    "eventType": "APPOINTMENT_BOOKED",
    "notifications": [
      {
        "notificationId": "69e25e200fdf7c1d2f1c95c0",
        "channel": "EMAIL",
        "status": "SENT",
        "provider": "mock-email",
        "recipient": "your-email@gmail.com"
      },
      {
        "notificationId": "69e25e200fdf7c1d2f1c95c2",
        "channel": "SMS",
        "status": "SENT",
        "provider": "mock-sms",
        "recipient": "+1234567890"
      }
    ]
  }
}
```

**Response (Real SMTP):**
```json
{
  "success": true,
  "message": "Event notification processed",
  "data": {
    "eventType": "APPOINTMENT_BOOKED",
    "notifications": [
      {
        "notificationId": "69e25e200fdf7c1d2f1c95c0",
        "channel": "EMAIL",
        "status": "SENT",
        "provider": "smtp",
        "recipient": "your-email@gmail.com",
        "providerMessageId": "<message-id@smtp.google.com>"
      }
    ]
  }
}
```

### Test 2: Book Real Appointment with Email

```bash
# 1. Get a doctor ID
curl http://localhost:4000/api/appointments/doctors/search?specialty=Cardiology

# 2. Book appointment with patient email
curl -X POST http://localhost:4000/api/appointments \
  -H "Content-Type: application/json" \
  -d '{
    "patientId": "patient123",
    "doctorId": "doctor-id-from-step-1",
    "patientName": "John Smith",
    "patientEmail": "your-email@gmail.com",
    "patientPhone": "+1234567890",
    "specialty": "Cardiology",
    "appointmentDate": "2026-05-20",
    "startTime": "10:00",
    "endTime": "11:00",
    "consultationFee": 5000,
    "reason": "Regular checkup"
  }'
```

**What happens:**
1. Appointment created in database ✓
2. Doctor details fetched automatically ✓
3. Notification event sent to notification-service ✓
4. Email sent to patient@gmail.com with:
   - Appointment date and time
   - Doctor name and specialty
   - Confirmation message

### Test 3: Check Sent Notifications

```bash
# Check logs for what was sent
docker logs medora-notification-service | tail -50

# Query MongoDB (if you have access)
db.notifications.find({ channel: "EMAIL", eventType: "APPOINTMENT_BOOKED" })
```

## Email Template Examples

### APPOINTMENT_BOOKED Email

```
Subject: Appointment booked successfully

Body:
Your appointment has been booked for 2026-05-20 at 10:00.
Doctor: Dr. John Doe
Specialty: Cardiology
```

### APPOINTMENT_RESCHEDULED Email

```
Subject: Appointment rescheduled

Body:
Your appointment has been rescheduled to 2026-05-25 at 14:00.
Reason: Doctor availability
```

### APPOINTMENT_CANCELLED Email

```
Subject: Appointment cancelled

Body:
Your appointment for 2026-05-20 at 10:00 has been cancelled.
Reason: Patient requested cancellation
```

## Troubleshooting

### Problem: Emails not being sent

**Check 1: Service running?**
```bash
docker ps | grep notification-service
```

**Check 2: Service logs**
```bash
docker logs medora-notification-service | grep -i error
```

**Check 3: SMTP credentials**
- Verify Gmail account has 2FA enabled
- Verify app password (not regular password)
- Verify email address matches SMTP_USER
- No spaces in password

**Check 4: Firewall/Network**
```bash
# From notification-service container, test SMTP connection
docker exec medora-notification-service nc -zv smtp.gmail.com 587
```

### Problem: "Request timed out"

- Check `SERVICE_REQUEST_TIMEOUT_MS` (default: 5000ms)
- Increase timeout: `SERVICE_REQUEST_TIMEOUT_MS=10000`

### Problem: "Error fetching doctor details"

- Ensure doctor-service is running
- Check `DOCTOR_SERVICE_URL` in appointment-service
- Doctor ID must exist in doctor-service database

## Production Checklist

- [ ] Configure real Gmail SMTP credentials
- [ ] Set `NOTIFICATION_EMAIL_MODE=auto`
- [ ] Set `NODE_ENV=production`
- [ ] Test email delivery
- [ ] Monitor notification logs
- [ ] Set up email alerting for failed deliveries
- [ ] Document support email for bounced messages
- [ ] Consider email rate limiting if high volume
- [ ] Use environment files (not hardcoded credentials)

## Advanced Configuration

### Custom SMTP Provider (e.g., SendGrid)

Update `notification-service/src/services/notification.service.js`:

```javascript
const transporter = nodemailer.createTransport({
  host: env.smtpHost,
  port: env.smtpPort,
  auth: {
    user: env.smtpUser,
    pass: env.smtpPass
  }
});
```

Any SMTP provider can be used (SendGrid, AWS SES, Mailgun, etc.) as long as you provide:
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`

### Enable Real SMS (Twilio)

Currently SMS is in mock mode. To enable real SMS:

1. Get Twilio account and credentials
2. Update `notification-service/src/services/notification.service.js`
3. Set `NOTIFICATION_SMS_MODE=real`
4. Add Twilio environment variables

## API Reference

### Send Notification Event

```
POST /notify/event
Content-Type: application/json

{
  "eventType": "APPOINTMENT_BOOKED",
  "email": "patient@example.com",
  "phone": "+1234567890",
  "appointmentDate": "2026-05-20",
  "startTime": "10:00",
  "doctorName": "Dr. John Doe",
  "specialty": "Cardiology",
  "metadata": {}
}
```

### Send Direct Email

```
POST /notify/email
Content-Type: application/json

{
  "to": "patient@example.com",
  "subject": "Your Appointment Confirmation",
  "text": "Your appointment is confirmed for 2026-05-20 at 10:00 AM",
  "eventType": "APPOINTMENT_BOOKED"
}
```

### Send Direct SMS

```
POST /notify/sms
Content-Type: application/json

{
  "to": "+1234567890",
  "message": "Medora: Your appointment is confirmed for 2026-05-20 at 10:00 AM",
  "eventType": "APPOINTMENT_BOOKED"
}
```

## Database Schema

Notifications are stored in MongoDB with this structure:

```javascript
{
  _id: ObjectId,
  channel: "EMAIL" | "SMS",
  eventType: "APPOINTMENT_BOOKED" | "APPOINTMENT_CANCELLED" | etc,
  recipient: "email@example.com" | "+1234567890",
  subject: "Appointment booked successfully",
  message: "Your appointment has been booked...",
  status: "SENT" | "FAILED" | "SKIPPED",
  provider: "smtp" | "mock-email" | "twilio" | "mock-sms",
  providerMessageId: "message-id-from-provider",
  metadata: { appointmentId, doctorId, specialty, etc },
  error: null | "error message",
  createdAt: Date,
  updatedAt: Date
}
```

## Monitoring & Alerts

### Prometheus Metrics (Optional)

Add to notification-service to track:
- `notification_sent_total`
- `notification_failed_total`
- `notification_processing_duration_seconds`

### Alert on Failures

Monitor logs for:
```
[Notification] Event publish failed
[Notification] Error fetching doctor details
```

Set up alerts in your logging system (DataDog, ELK, etc.)
