# 🧪 Pre-Flight Testing Guide

**Purpose:** Test all tools locally BEFORE making real Vapi calls to ensure everything works and is fast.

---

## 📋 Testing Checklist

Run these tests **in order** after Render deploys the latest changes:

### ✅ Test 1: Availability Check (First Call)
```bash
npm run test-exact-payload
```

**Expected Result:**
- ✅ Response time: 300-1500ms
- ✅ Returns 17 available slots
- ✅ Message includes formatted times (e.g., "8:30 AM, 9:00 AM...")

**What to look for:**
```json
{
  "success": true,
  "message": "Great! On November 13, we have availability at: 8:30 AM, 9:00 AM...",
  "data": {
    "availableSlots": [...],
    "displaySlots": "8:30 AM, 9:00 AM, 9:30 AM, 10:00 AM, 10:30 AM"
  }
}
```

---

### ✅ Test 2: Availability Check (Cached - Run Immediately After Test 1)
```bash
npm run test-exact-payload
```

**Expected Result:**
- ✅ Response time: **<100ms** (should be 10-50ms!)
- ✅ Same data as Test 1
- ✅ Render logs show: `"✅ Using cached calendar availability (fresh data)"`

**This proves caching is working!** ⚡

---

### ✅ Test 3: Booking Tool (Isolated Test)
```bash
npm run test-booking
```

**Expected Result:**
- ✅ Response time: 1000-4000ms (booking is slower than checking)
- ✅ Appointment created successfully
- ✅ Returns appointment ID, date, and time

**What to look for:**
```json
{
  "success": true,
  "message": "Perfect! I've scheduled your appointment for Wednesday, November 13 at 3:00 PM...",
  "data": {
    "appointmentId": "PEAfl4XNxGOTa4aV0I6d",
    "dateFormatted": "Wednesday, November 13",
    "timeFormatted": "3:00 PM"
  }
}
```

**⚠️ IMPORTANT:** This creates a REAL appointment in GHL! You'll need to delete it after testing.

**How to delete:**
1. Go to GHL → Calendars → Appointments
2. Find appointment with ID shown in the test output
3. Delete it

---

### ✅ Test 4: Full Flow (Availability → Booking)
```bash
npm run test-full-flow
```

**Expected Result:**
- ✅ Step 1 (Availability): 300-1500ms
- ✅ Step 2 (Booking): 1000-4000ms
- ✅ Total flow time: <6 seconds (including 2s wait)
- ✅ Both steps complete successfully

**What to look for:**
```
🎉 FULL FLOW TEST COMPLETED SUCCESSFULLY!

📊 PERFORMANCE SUMMARY:
   Step 1 (Availability): 850ms
   Step 2 (Booking): 1200ms
   Total API time: 2050ms
   Total flow time: 4050ms (including 2s wait)

✅ ASSESSMENT:
   ✅ EXCELLENT - Both tools respond quickly!
   ✅ Ready for production use
```

**⚠️ IMPORTANT:** This also creates a REAL appointment in GHL! Delete it after testing.

---

## 🎯 Performance Targets

### Acceptable Performance:
| Tool | First Call | Cached Call | Status |
|------|-----------|-------------|--------|
| **Availability Check** | <2 seconds | <100ms | ✅ Safe for Vapi |
| **Booking** | <4 seconds | N/A | ✅ Safe for Vapi |

### Warning Signs:
| Tool | Response Time | Issue |
|------|--------------|-------|
| **Availability Check** | >3 seconds | ⚠️ May timeout in some cases |
| **Booking** | >5 seconds | ⚠️ May timeout with slow GHL API |

---

## 🚨 Troubleshooting

### Problem: "Connection refused" or "ECONNREFUSED"
**Cause:** Render server is asleep or not deployed yet.

**Solution:**
```bash
# Wake up the server first
curl https://vapi-keey-voice-assistant.onrender.com/health

# Wait 30 seconds, then try again
npm run test-exact-payload
```

---

### Problem: Test times out (>25 seconds)
**Cause:** Server is in cold start or GHL API is extremely slow.

**Solution:**
1. Check Render logs for errors
2. Try again in 1-2 minutes
3. If persists, GHL API might be having issues

---

### Problem: "Invalid JWT" or 401 errors
**Cause:** GHL API key is invalid or expired.

**Solution:**
1. Check `.env` file has correct `GHL_API_KEY`
2. Verify API key has "Calendar" permissions in GHL
3. Generate a new API key if needed

---

### Problem: Booking returns "No result" but availability works
**Cause:** Missing contact ID or invalid appointment parameters.

**Solution:**
1. Check that `contactId: "ZtrIOxo50WVcsLbWK961"` exists in GHL
2. Verify the contact has valid email and phone
3. Check GHL calendar permissions

---

### Problem: Cache not working (Test 2 still takes >1 second)
**Cause:** Either cache didn't persist or you waited >60 seconds.

**Solution:**
1. Run Test 1 and Test 2 **back-to-back** (within 10 seconds)
2. Check Render logs for `"✅ Using cached calendar availability"`
3. If still not working, check that the optimization deployed correctly

---

## 📊 What Success Looks Like

### Perfect Test Results:
```bash
$ npm run test-exact-payload
✅ SUCCESS! Response received in 850ms

$ npm run test-exact-payload  # Run immediately after
✅ SUCCESS! Response received in 45ms  # <-- CACHED! ⚡

$ npm run test-booking
✅ SUCCESS! Response received in 1200ms
🎉 BOOKING TOOL TEST PASSED!

$ npm run test-full-flow
🎉 FULL FLOW TEST COMPLETED SUCCESSFULLY!
📊 Total API time: 2050ms
✅ EXCELLENT - Both tools respond quickly!
```

---

## 🚀 After All Tests Pass

### Next Steps:
1. ✅ All 4 tests passed
2. ✅ Cache is working (Test 2 was fast)
3. ✅ Booking creates real appointments
4. ✅ Total flow time is under 5 seconds

**YOU ARE READY FOR A REAL VAPI CALL!** 🎉

### Making the Real Call:
1. Call your Vapi phone number: `+447402769361`
2. Say: "I want to book an appointment"
3. Say: "Today at 11 AM" (or any time)
4. Listen for the AI to read back available times
5. Choose a time slot
6. Confirm the booking

### Monitor the Call:
- **Render Logs:** Watch for tool call webhooks
- **Vapi Logs:** Check for "No result returned" errors
- **GHL Calendar:** Verify appointment was created

---

## 📝 Test Results Template

Copy this and fill it out after running tests:

```
## My Test Results (Date: ______)

### Test 1: Availability (First Call)
- Response time: _____ ms
- Success: YES / NO
- Notes: _________________________

### Test 2: Availability (Cached)
- Response time: _____ ms
- Cached: YES / NO
- Notes: _________________________

### Test 3: Booking Tool
- Response time: _____ ms
- Appointment ID: _________________
- Success: YES / NO
- Notes: _________________________

### Test 4: Full Flow
- Total time: _____ ms
- Success: YES / NO
- Notes: _________________________

### Overall Assessment:
- Ready for production: YES / NO
- Issues found: _________________________
- Next steps: _________________________
```

---

## 🎯 Summary

**Run these 4 tests in order:**
1. `npm run test-exact-payload` (first call)
2. `npm run test-exact-payload` (cached call)
3. `npm run test-booking` (creates real appointment!)
4. `npm run test-full-flow` (creates real appointment!)

**If all pass → Make a real Vapi call!** 📞

**If any fail → Check troubleshooting section above** 🔧

