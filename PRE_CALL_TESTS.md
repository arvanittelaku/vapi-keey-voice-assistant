# 🧪 Pre-Call Tests (No Real Calls Needed)

**Run these tests to verify everything works BEFORE making expensive test calls**

---

## ✅ TEST 1: Server Health Check

**What it tests**: Railway deployment is live and healthy

**How to run**:
1. Open browser
2. Go to: `https://vapi-keey-voice-assistant-production.up.railway.app/health`

**Expected result**:
```json
{
  "status": "healthy",
  "service": "GHL to Vapi Bridge",
  "timestamp": "2025-11-05T..."
}
```

**If you see this**: ✅ Server is running correctly  
**If you see error**: ❌ Server is down or not deployed properly

---

## ✅ TEST 2: Webhook Endpoint Exists

**What it tests**: Vapi function webhook is accessible

**How to run**:
1. Open browser
2. Go to: `https://vapi-keey-voice-assistant-production.up.railway.app/webhook/vapi`

**Expected result**:
```json
{
  "status": "VapiFunctionHandler is working!",
  "message": "Use POST to this endpoint for function calls"
}
```

**If you see this**: ✅ Webhook endpoint is ready  
**If you see 404**: ❌ Route not registered (check Railway logs)

---

## ✅ TEST 3: GHL Workflow Can Reach Server

**What it tests**: Your webhook URL is accessible from outside

**How to run**:
1. Use an online tool like: https://reqbin.com/ or Postman
2. Make a POST request to:
   ```
   https://vapi-keey-voice-assistant-production.up.railway.app/webhook/ghl-trigger-call
   ```
3. Body (JSON):
   ```json
   {
     "phone": "+12136721526",
     "firstName": "Test",
     "lastName": "User",
     "email": "test@example.com"
   }
   ```

**Expected result**:
```json
{
  "success": true,
  "message": "Call initiated successfully",
  "callId": "019a4f...",
  "status": "queued"
}
```

**What this proves**:
- ✅ Server receives GHL webhooks
- ✅ Contact data is extracted correctly
- ✅ Vapi API call is initiated
- ✅ Call will be queued (won't actually ring due to timeout setting)

**If you see error**: Check Railway logs for details

---

## ✅ TEST 4: Calendar Availability (Mock Call)

**What it tests**: Calendar check function works

**How to run** (using Postman or reqbin.com):

**POST** to: `https://vapi-keey-voice-assistant-production.up.railway.app/webhook/vapi`

**Body**:
```json
{
  "message": {
    "type": "function-call",
    "functionCall": {
      "id": "test-123",
      "name": "check_calendar_availability",
      "parameters": {
        "date": "2025-11-10",
        "time": "14:00",
        "timezone": "Europe/London"
      }
    }
  }
}
```

**Expected result**:
```json
{
  "functionCall": {
    "id": "test-123",
    "result": "{\"success\":true,\"available\":true/false,\"message\":\"...\"}"
  }
}
```

**What this proves**:
- ✅ Function handler receives Vapi webhooks
- ✅ Calendar API integration works
- ✅ GHL calendar can be checked
- ✅ Response format is correct for Vapi

---

## ✅ TEST 5: Book Appointment (Mock Call)

**What it tests**: Booking function works

**POST** to: `https://vapi-keey-voice-assistant-production.up.railway.app/webhook/vapi`

**Body**:
```json
{
  "message": {
    "type": "function-call",
    "functionCall": {
      "id": "test-456",
      "name": "book_appointment",
      "parameters": {
        "contactId": "YOUR_TEST_CONTACT_ID",
        "date": "2025-11-12",
        "time": "10:00",
        "timezone": "Europe/London"
      }
    }
  }
}
```

**Expected result**:
```json
{
  "functionCall": {
    "id": "test-456",
    "result": "{\"success\":true,\"appointmentId\":\"...\",\"message\":\"...\"}"
  }
}
```

**What this proves**:
- ✅ Booking function works
- ✅ GHL appointment creation works
- ✅ Appointment appears in GHL calendar

---

## ✅ TEST 6: Check Railway Logs

**What it tests**: Server is logging correctly for debugging

**How to check**:
1. Go to Railway Dashboard
2. Click on your project
3. View "Logs" tab
4. Look for recent activity

**What to look for**:
```
✅ Keey Voice Assistant Server running on port 3000
📡 Webhook Endpoints:
   GHL Trigger: ...
   Vapi Functions: ...
```

**If you see errors**: Read them and we can fix before testing

---

## ✅ TEST 7: Verify Environment Variables (Railway)

**What it tests**: All secrets are configured

**How to check**:
1. Railway Dashboard → Your Project
2. Click "Variables" tab
3. Verify these exist (don't need to see values):

- [ ] VAPI_PRIVATE_KEY
- [ ] VAPI_PHONE_NUMBER_ID
- [ ] VAPI_SQUAD_ID
- [ ] VAPI_MAIN_ASSISTANT_ID
- [ ] VAPI_SERVICES_ASSISTANT_ID
- [ ] VAPI_PRICING_ASSISTANT_ID
- [ ] GHL_PRIVATE_API_KEY
- [ ] GHL_LOCATION_ID
- [ ] GHL_CALENDAR_ID
- [ ] PORT

**If any missing**: Add them before testing

---

## ✅ TEST 8: Verify GHL Workflow Configuration

**What it tests**: Workflow will trigger when contact created

**How to check**:
1. Go to GHL → Automations → Workflows
2. Find your "Trigger Vapi Call" workflow
3. Verify settings:

**Trigger**:
- [ ] Trigger Type: "Contact Created" or "Contact Tag Added" or similar

**Action**:
- [ ] Type: Custom Webhook
- [ ] Method: POST
- [ ] URL: `https://vapi-keey-voice-assistant-production.up.railway.app/webhook/ghl-trigger-call`
- [ ] Body: JSON with contact fields

**Workflow Status**:
- [ ] Status: Active (not paused)

**Take screenshot for reference**

---

## 📊 RESULTS SUMMARY

After running all tests, fill this out:

### Server Tests:
- [ ] Test 1: Health Check - PASS / FAIL
- [ ] Test 2: Webhook Endpoint - PASS / FAIL
- [ ] Test 3: GHL Trigger - PASS / FAIL
- [ ] Test 4: Calendar Check - PASS / FAIL
- [ ] Test 5: Booking - PASS / FAIL

### Configuration Tests:
- [ ] Test 6: Railway Logs - PASS / FAIL
- [ ] Test 7: Environment Variables - PASS / FAIL
- [ ] Test 8: GHL Workflow - PASS / FAIL

**If ALL tests PASS**: 🎯 **95% confidence** everything works!

**If ANY test FAILS**: 🔧 Fix it before making test calls

---

## 🎯 CONFIDENCE LEVELS

### If 8/8 tests pass:
**Confidence**: 95%+
**What's verified**: Server, APIs, webhooks, GHL integration
**What's not verified**: Voice AI behavior, transfers (needs live call)
**Recommended**: Make ONE 30-second test call ($0.02-0.05)

### If 6-7 tests pass:
**Confidence**: 80-90%
**What to do**: Fix failing tests first, then make test call

### If <6 tests pass:
**Confidence**: <80%
**What to do**: DON'T make test calls yet - fix issues first

---

## 💡 BEST TESTING STRATEGY

**Step 1**: Complete `VAPI_DASHBOARD_VERIFICATION_CHECKLIST.md` (15 mins)

**Step 2**: Run these 8 pre-call tests (10 mins)

**Step 3**: If all pass → Make ONE 30-second greeting test call

**Step 4**: If greeting works → Make 5 more targeted test calls

**Total time**: 30-40 mins  
**Total cost**: $0.20-0.60 (vs $2-3 if you skip verification)

---

*Run these tests and report back - we'll know exactly what's working before spending money on calls!*



