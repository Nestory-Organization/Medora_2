# Payment Status Update Debugging Guide

## Issues Fixed

### ✅ 1. Auto-Logout After Payment
**Problem**: User was automatically logged out after completing payment
**Fix**: Removed auto-redirect from PaymentSuccess page. User now sees a message and clicks button to navigate back, preserving the session.

**Changes Made**:
- `client/src/pages/patient/PaymentSuccess.tsx`: Changed from auto-redirect to manual button click

---

## 2. Payment Status Not Updating 

### How Payment Status Update Works

```
1. User completes Stripe checkout
2. Stripe sends webhook to payment-service
3. Payment service updates its Payment record
4. Payment service calls appointment-service:
   PATCH /appointments/{appointmentId}/payment-status
   Body: { paymentStatus: 'PAID', status: 'CONFIRMED' }
5. Appointment service updates Appointment record
```

### Added Logging

Enhanced logging has been added at multiple points to debug the status update:

**Payment Service** (`payment-service/src/services/payment.service.js`):
```
[Appointment Sync] Syncing payment status for appointment: {appointmentId}
[Appointment Sync] Result: {detailed sync result}
```

**Appointment Sync Service** (`payment-service/src/services/appointmentSync.service.js`):
```
[Appointment Sync] Calling: {URL} with body: {payload}
[Appointment Sync] Response status: {status} Body: {response}
[Appointment Sync] Successfully synced appointment status
OR
[Appointment Sync] Error response from appointment-service: {error}
OR
[Appointment Sync] Fetch error: {error message}
```

**Appointment Service** (`appointment-service/src/controllers/appointment.controller.js`):
```
[Payment Status Update] Request received: { appointmentId, body }
[Payment Status Update] Success: { appointmentId, newStatus, newPaymentStatus }
OR
[Payment Status Update] Error: { appointmentId, error, stack }
```

---

## Debugging Steps

### Step 1: Check Payment Service Logs
```bash
docker-compose logs payment-service | grep -A 5 "Appointment Sync"
```

Look for:
- ✅ `[Appointment Sync] Syncing payment status for appointment: {id}` - indicates webhook was processed
- ❌ No such line - webhook not reaching payment service

### Step 2: Check Appointment Service Logs  
```bash
docker-compose logs appointment-service | grep -A 5 "Payment Status Update"
```

Look for:
- ✅ `[Payment Status Update] Success:` - appointment was updated
- ❌ `[Payment Status Update] Error:` - appointment update failed
- ❌ No such line - payment service didn't call appointment service

### Step 3: Check Webhook Connectivity
```bash
# Check if Stripe can reach your payment service
# Look for this error in payment-service logs:
# "[ERROR] Failed to POST: Post \"http://host.docker.internal:4005/payment/webhook\""
docker-compose logs payment-service | grep "Failed to POST"
```

If you see this error:
- Your payment service is not accessible to Stripe
- **Fix**: Use ngrok to expose your service:
  ```bash
  ngrok http 4005
  # Get the URL and update Stripe dashboard webhook endpoint
  ```

### Step 4: Verify Appointment Record
After making a payment, check the appointment status:

```bash
# Query the appointment from appointment-service logs
# OR use MongoDB CLI:
docker exec medora-mongodb mongosh appointment_db
db.appointments.find({ _id: ObjectId("69e0cb57cdc0857cf3b05e62") })
```

Expected after payment:
```
"status": "CONFIRMED",        // Changed from "PENDING_PAYMENT"
"paymentStatus": "PAID"       // Changed from "UNPAID"
```

---

## Common Issues & Solutions

### Issue: Logs show "Request timed out while calling appointment-service"
**Cause**: Appointment service is not running or not reachable
**Solution**:
```bash
docker-compose ps  # Check if appointment-service is running
docker-compose up -d appointment-service  # Restart it
```

### Issue: Logs show "Appointment-service returned a non-success response"
**Cause**: Appointment service returned an error
**Check**: Look at appointment-service logs for `[Payment Status Update] Error`
**Common causes**:
- Invalid appointment ID format
- Appointment already cancelled/completed
- Service-to-service auth issue

### Issue: No logs appear in appointment-service
**Cause**: Payment service is not calling appointment service
**Check**: 
1. Look for sync logs in payment-service
2. Check `APPOINTMENT_SERVICE_URL` environment variable in payment-service

---

## Testing Payment Flow

1. **Start a payment**:
   - Go to /patient/book
   - Create an appointment
   - Click "Pay Now"
   - Use Stripe test card: `4242 4242 4242 4242` with any future date

2. **Monitor logs** (in separate terminal):
   ```bash
   docker-compose logs -f payment-service appointment-service | grep -E "(Appointment Sync|Payment Status Update|ERROR)"
   ```

3. **Complete payment** in Stripe

4. **Check results**:
   - Look for success logs (see Step 1-2 above)
   - Navigate to appointments page
   - Verify status changed to "CONFIRMED" and payment to "PAID"

---

## API Endpoint Reference

**Payment Status Update Endpoint**:
- URL: `/appointments/{appointmentId}/payment-status`
- Method: `PATCH`
- Body: `{ paymentStatus: 'PAID', status: 'CONFIRMED' }`
- Required: Both paymentStatus and optional status
- No authentication needed (called from payment service)

**Valid Payment Statuses**: `UNPAID`, `PAID`, `FAILED`, `REFUNDED`
**Valid Appointment Statuses**: `PENDING_PAYMENT`, `CONFIRMED`, `CANCELLED`, `COMPLETED`

---

## Network Debugging

If webhook is not reaching payment service:

```bash
# From within payment-service container:
docker exec medora-payment-service ping appointment-service
docker exec medora-payment-service curl -X PATCH http://appointment-service:4004/appointments/test/payment-status \
  -H "Content-Type: application/json" \
  -d '{"paymentStatus":"PAID","status":"CONFIRMED"}'
```

---

## Next Steps

1. Make a test payment
2. Check logs using the debugging steps above
3. Share the relevant log output if issues persist
4. If webhook not reaching payment service, use ngrok workaround

