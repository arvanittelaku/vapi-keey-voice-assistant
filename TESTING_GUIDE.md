# Keey Voice Assistant - Testing Guide

## 🧪 Testing with Postman (No Real Calls Yet!)

This guide shows you how to test the GHL → Vapi integration using Postman **without making real expensive calls**.

---

## 📋 Prerequisites

1. ✅ Squad created and configured
2. ✅ Server running locally
3. ✅ Postman installed
4. ✅ Your `.env` configured with:
   - `VAPI_API_KEY`
   - `VAPI_SQUAD_ID`
   - `VAPI_PHONE_NUMBER_ID`

---

## 🚀 Step 1: Start Your Server

```bash
# Start the webhook server
npm start
```

**Expected output:**
```
🚀 Starting Keey GHL to Vapi Bridge Server...
==================================================
✅ GHL to Vapi Bridge running on port 3000
📡 GHL Webhook: http://localhost:3000/webhook/ghl-trigger-call
🧪 Test Endpoint: http://localhost:3000/test/trigger-call
🏥 Health Check: http://localhost:3000/health
```

---

## 📥 Step 2: Import Postman Collection

### Option A: Import File
1. Open Postman
2. Click "Import"
3. Select `postman/Keey-Voice-Assistant-Testing.postman_collection.json`
4. Click "Import"

### Option B: Manual Setup
Create these requests in Postman:

#### 1. Health Check
- **Method**: GET
- **URL**: `http://localhost:3000/health`

#### 2. Test Call Trigger
- **Method**: POST  
- **URL**: `http://localhost:3000/test/trigger-call`
- **Headers**: `Content-Type: application/json`
- **Body** (raw JSON):
```json
{
  "phone": "+447700900000",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "contactId": "test-123"
}
```

#### 3. GHL Webhook Simulation
- **Method**: POST
- **URL**: `http://localhost:3000/webhook/ghl-trigger-call`
- **Headers**: `Content-Type: application/json`
- **Body** (raw JSON):
```json
{
  "id": "contact_12345",
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "jane.smith@example.com",
  "phone": "+447700900111",
  "address1": "123 Property Street",
  "city": "London",
  "postalCode": "SW1A 1AA",
  "customField": {
    "bedrooms": "2",
    "region": "London"
  }
}
```

---

## 🧪 Step 3: Test the Endpoints

### Test 1: Health Check ✅
```
GET http://localhost:3000/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "service": "GHL to Vapi Bridge",
  "timestamp": "2025-11-04T14:25:00.000Z"
}
```

---

### Test 2: Trigger Test Call (DRY RUN) 🧪

⚠️ **WARNING**: This will make a **REAL CALL** to the phone number you provide!

**Only use this when you're ready to test with a real call.**

```
POST http://localhost:3000/test/trigger-call

Body:
{
  "phone": "+YOUR_TEST_NUMBER",
  "firstName": "Test",
  "lastName": "User",
  "email": "test@example.com"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Test call initiated successfully",
  "callId": "call_abc123...",
  "status": "queued",
  "customer": {
    "name": "Test User",
    "phone": "+YOUR_TEST_NUMBER"
  },
  "metadata": {
    "contactId": "test-1234567890",
    "firstName": "Test",
    "lastName": "User",
    "region": "London",
    "callSource": "Manual Test"
  }
}
```

---

### Test 3: Simulate GHL Webhook 📞

This simulates what GHL will send when a contact is created:

```
POST http://localhost:3000/webhook/ghl-trigger-call

Body:
{
  "id": "contact_12345",
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "jane.smith@example.com",
  "phone": "+447700900111",
  "address1": "123 Property Street",
  "city": "London",
  "postalCode": "SW1A 1AA",
  "customField": {
    "bedrooms": "2",
    "region": "London"
  }
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Call initiated successfully",
  "callId": "call_xyz789...",
  "status": "queued",
  "customer": {
    "name": "Jane Smith",
    "phone": "+447700900111"
  }
}
```

---

## 🔧 Step 4: Configure GHL Workflow

Once you've tested with Postman and everything works:

### In Your GHL Workflow:

1. **Trigger**: Contact Created
2. **Action**: Send Webhook Request
3. **Webhook URL**: `https://your-domain.com/webhook/ghl-trigger-call`
4. **Method**: POST
5. **Headers**: 
   ```
   Content-Type: application/json
   ```
6. **Body**: Select "Custom"
7. **Custom Body**:
   ```json
   {
     "id": "{{contact.id}}",
     "firstName": "{{contact.first_name}}",
     "lastName": "{{contact.last_name}}",
     "email": "{{contact.email}}",
     "phone": "{{contact.phone}}",
     "address1": "{{contact.address1}}",
     "city": "{{contact.city}}",
     "postalCode": "{{contact.postal_code}}",
     "customField": {
       "bedrooms": "{{contact.custom_field.bedrooms}}",
       "region": "{{contact.custom_field.region}}"
     }
   }
   ```

---

## 📊 What Happens in a Real Call

When the webhook triggers a call:

1. **GHL creates contact** → Triggers workflow
2. **Workflow sends webhook** → Your server receives data
3. **Your server calls Vapi API** → Initiates outbound call
4. **Vapi calls the customer** → Using your squad
5. **Assistant greets with name**: "Hi Jane, this is Keey calling about your property inquiry..."
6. **Metadata available**: Assistant has access to all contact data
7. **Seamless transfers**: Can move between Main, Services, Pricing

---

## 🎯 Testing Strategy (Cost-Effective)

### Phase 1: Webhook Testing (FREE) ✅
- Test with Postman
- Verify server receives data correctly
- Check Vapi API calls are formatted properly
- Review server logs

### Phase 2: Single Test Call ($$$)
- Use your own number
- Test ONE call end-to-end
- Verify greeting personalization
- Test agent transfers
- Review call quality

### Phase 3: Limited Production ($$)
- Enable for small batch (5-10 contacts)
- Monitor call success rate
- Collect feedback
- Optimize based on results

### Phase 4: Full Production ($$$)
- Enable for all new contacts
- Monitor costs and ROI
- Scale based on performance

---

## 🔍 Monitoring & Debugging

### Server Logs
Your server will show:
```
📥 2025-11-04T14:25:00.000Z - POST /webhook/ghl-trigger-call

🔔 GHL WEBHOOK RECEIVED - TRIGGER CALL
📦 Payload: {
  "id": "contact_12345",
  "firstName": "Jane",
  ...
}

📋 Extracted Contact Data:
   Name: Jane Smith
   Phone: +447700900111
   Email: jane.smith@example.com
   Contact ID: contact_12345
   Region: London

📞 Initiating Vapi outbound call...
✅ Call initiated successfully!
📞 Call ID: call_abc123
📊 Call Status: queued
```

### Vapi Dashboard
Check https://dashboard.vapi.ai:
- Go to "Calls"
- See all initiated calls
- View call status
- Listen to recordings
- Review transcripts

### GHL Dashboard
Check your workflow:
- Go to Workflows → Execution Logs
- See webhook success/failure
- Review response data

---

## ⚠️ Important Notes

### Cost Considerations:
- **Each call costs money** in Vapi
- **Test thoroughly with Postman first**
- Use test phone numbers initially
- Monitor spending in Vapi dashboard

### Phone Number Format:
- Always use E.164 format: `+[country code][number]`
- UK: `+447700900000`
- Dubai: `+971501234567`

### Metadata Usage:
The assistant can access this data during the call:
- `{{metadata.firstName}}` - Personalized greeting
- `{{metadata.region}}` - London vs Dubai
- `{{metadata.bedrooms}}` - Property details
- `{{metadata.contactId}}` - Link to GHL contact

---

## 🆘 Troubleshooting

### "Call initiated but no call received"
- Check phone number format (E.164)
- Verify VAPI_PHONE_NUMBER_ID is correct
- Check Vapi account has credits
- Review Vapi dashboard for call status

### "Webhook returns 500 error"
- Check server logs for error details
- Verify VAPI_API_KEY is valid
- Ensure VAPI_SQUAD_ID is correct
- Check phone number is assigned to squad

### "Assistant doesn't use contact name"
- Verify metadata is being sent
- Check assistantOverrides.firstMessage
- Review call logs in Vapi dashboard

### "GHL workflow not triggering"
- Test webhook URL with Postman first
- Check GHL workflow is published
- Verify trigger conditions are met
- Review GHL execution logs

---

## ✅ Pre-Production Checklist

Before enabling for real contacts:

- [ ] Tested all endpoints with Postman
- [ ] Made at least 1 test call successfully
- [ ] Verified personalized greeting works
- [ ] Tested agent transfers (Main → Services → Pricing)
- [ ] Confirmed metadata is accessible
- [ ] Reviewed call quality and clarity
- [ ] Server is deployed to production (not localhost)
- [ ] Webhook URL is publicly accessible (HTTPS)
- [ ] GHL workflow configured correctly
- [ ] Cost monitoring set up
- [ ] Team trained on monitoring calls

---

## 📚 Additional Resources

- **Vapi API Docs**: https://docs.vapi.ai
- **GHL Webhooks**: https://highlevel.stoplight.io
- **Postman Docs**: https://learning.postman.com

---

**Ready to test?** Start with `GET /health`, then try a Postman webhook simulation! 🚀

