#!/bin/bash

# Medora Notification System Test Script
# Tests the full appointment booking → email notification flow

set -e

API_GATEWAY="http://localhost:4000"
NOTIFICATION_SERVICE="http://localhost:4006"

echo "=========================================="
echo "Medora Notification System Test"
echo "=========================================="
echo ""

# Test 1: Health check
echo "[1] Checking services health..."
if curl -s "$API_GATEWAY/health" > /dev/null; then
    echo "✓ API Gateway is running (port 4000)"
else
    echo "✗ API Gateway is NOT running"
    exit 1
fi

if curl -s "$NOTIFICATION_SERVICE/health" > /dev/null; then
    echo "✓ Notification Service is running (port 4006)"
else
    echo "✗ Notification Service is NOT running"
    exit 1
fi

echo ""

# Test 2: Send manual notification event
echo "[2] Testing manual notification event..."
RESPONSE=$(curl -s -X POST "$NOTIFICATION_SERVICE/notify/event" \
  -H "Content-Type: application/json" \
  -d '{
    "eventType": "APPOINTMENT_BOOKED",
    "email": "test@example.com",
    "phone": "+1234567890",
    "appointmentDate": "2026-05-20",
    "startTime": "10:00",
    "doctorName": "Dr. John Doe",
    "specialty": "Cardiology"
  }')

if echo "$RESPONSE" | grep -q '"success":true'; then
    echo "✓ Notification event processed successfully"
    echo "  Response:"
    echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
else
    echo "✗ Notification event failed"
    echo "$RESPONSE"
    exit 1
fi

echo ""

# Test 3: Search for doctors
echo "[3] Searching for doctors..."
DOCTORS=$(curl -s "$API_GATEWAY/api/appointments/doctors/search?specialty=Cardiology")

if echo "$DOCTORS" | grep -q "doctorId"; then
    echo "✓ Found doctors in system"
    DOCTOR_ID=$(echo "$DOCTORS" | jq -r '.[0].doctorId' 2>/dev/null)
    echo "  Sample Doctor ID: $DOCTOR_ID"
else
    echo "⚠ No doctors found - appointment booking will fail"
    echo "  Make sure doctor-service is running with sample data"
fi

echo ""

# Test 4: Book appointment with email
if [ ! -z "$DOCTOR_ID" ]; then
    echo "[4] Testing appointment booking with email notification..."
    
    APPOINTMENT=$(curl -s -X POST "$API_GATEWAY/api/appointments" \
      -H "Content-Type: application/json" \
      -d "{
        \"patientId\": \"patient-test-123\",
        \"doctorId\": \"$DOCTOR_ID\",
        \"patientName\": \"Test Patient\",
        \"patientEmail\": \"patient@example.com\",
        \"patientPhone\": \"+1234567890\",
        \"specialty\": \"Cardiology\",
        \"appointmentDate\": \"2026-05-25\",
        \"startTime\": \"14:00\",
        \"endTime\": \"15:00\",
        \"consultationFee\": 5000,
        \"reason\": \"Regular checkup\"
      }")
    
    if echo "$APPOINTMENT" | grep -q '"appointmentId"'; then
        APPOINTMENT_ID=$(echo "$APPOINTMENT" | jq -r '.data.appointmentId' 2>/dev/null)
        echo "✓ Appointment booked successfully"
        echo "  Appointment ID: $APPOINTMENT_ID"
        echo "  Patient Email: patient@example.com"
        echo "  → Email notification should be sent automatically"
    else
        echo "✗ Appointment booking failed"
        echo "$APPOINTMENT"
    fi
else
    echo "[4] Skipping appointment booking test (no doctors available)"
fi

echo ""
echo "=========================================="
echo "Test Summary"
echo "=========================================="
echo "✓ Services are running"
echo "✓ Notification API is responding"
echo ""
echo "Next steps:"
echo "1. Check notification-service logs:"
echo "   docker logs medora-notification-service | tail -20"
echo ""
echo "2. For real email sending, configure SMTP:"
echo "   export SMTP_USER=your-gmail@gmail.com"
echo "   export SMTP_PASS=your-app-password"
echo "   docker compose up --build"
echo ""
echo "See NOTIFICATION_SETUP_GUIDE.md for detailed setup"
echo "=========================================="
