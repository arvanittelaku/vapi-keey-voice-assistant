# ✅ FINAL PRE-LIVE TESTING CHECKLIST

**Last Updated**: November 5, 2025  
**Status**: Ready for boss to configure Vapi and test

---

## 🎯 WHAT WE FIXED

### ✅ Fixed Issues:
1. **Personalized Greeting** - Now explicitly set in `assistantOverrides.firstMessage`
2. **Tool Name Mismatches** - Updated all system prompts to use generic `transferCall`, `check_calendar_availability`, `book_appointment`
3. **Removed create_contact** - Simplified to outbound-only calls (contact data already in GHL)
4. **Clarified Tool Usage** - All three assistants now have clear, consistent tool references
5. **Function Handler Flexibility** - Already supports multiple tool name variations (`_keey` suffixes, etc.)

---

## 📋 YOUR BOSS NEEDS TO DO (In Vapi Dashboard)

### 1. Fix Phone Number Settings ⚠️ CRITICAL
**Location**: Vapi Dashboard → Phone Numbers → `+1 213-672-1526`

- [ ] **Assign User**: Add your user account to this phone number
- [ ] **Set Call Timeout**: Change from `0` to `30-60` seconds

**Why**: Without this, calls ring once and stop immediately

---

### 2. Verify Transfer Tool Configuration 🔧 IMPORTANT

**Option A: If you have ONE transfer tool** (most likely)

Tool Name: `transfer_call_keey` or `transferCall`

**Check in Vapi Dashboard**:
- [ ] Tool is attached to **Main Assistant**
- [ ] Tool is configured to allow transfers to Services AND Pricing assistants
- [ ] OR you need to create TWO separate transfer tools (one for Services, one for Pricing)

**Option B: If you need TWO transfer tools** (recommended)

Create:
1. **transfer_to_services**
   - Type: Transfer Call (built-in)
   - Destination: Services Assistant (ID from .env)
   - Description: "Transfer when customer asks about services"
   - Attach to: Main Assistant

2. **transfer_to_pricing**
   - Type: Transfer Call (built-in)
   - Destination: Pricing Assistant (ID from .env)
   - Description: "Transfer when customer asks about pricing"
   - Attach to: Main Assistant

---

### 3. Verify Tool Attachments ✅

**Main Assistant** should have:
- [ ] transferCall (or transfer_to_services + transfer_to_pricing)
- [ ] check_calendar_availability_keey
- [ ] book_calendar_appointment_keey

**Services Assistant** should have:
- [ ] transferCall (to Pricing)
- [ ] check_calendar_availability_keey
- [ ] book_calendar_appointment_keey

**Pricing Assistant** should have:
- [ ] transferCall (to Services)
- [ ] check_calendar_availability_keey
- [ ] book_calendar_appointment_keey

---

## 🧪 LIVE TESTING SEQUENCE (After Boss Fixes Vapi)

### Test 1: Simple Outbound Call - Greeting Only
**Purpose**: Verify personalized greeting works

**Steps**:
1. Use Postman: POST to `https://vapi-keey-voice-assistant-production.up.railway.app/test/trigger-call`
2. Body:
```json
{
  "phone": "+12136721526",
  "firstName": "YourName",
  "lastName": "LastName"
}
```
3. Answer the call

**Expected**:
- ✅ Call comes through within 5-10 seconds
- ✅ AI says: "Hi YourName, this is Keey calling. This is a test call..."
- ✅ NOT "Hello! Thank you for calling Keey..." (that's inbound greeting)

**If it works**: ✅ Personalized greeting is working!  
**If it fails**: Check Railway logs for errors

---

### Test 2: Calendar Availability Check
**Purpose**: Verify AI can check calendar during call

**Steps**:
1. Make a test call (same as Test 1)
2. When AI asks, say: "I'd like to book a consultation for tomorrow at 2 PM"
3. Listen to AI's response

**Expected**:
- ✅ AI says something like "Let me check if that time is available..."
- ✅ AI tells you if slot is available or not (based on actual GHL calendar)
- ✅ Check Railway logs - you should see `check_calendar_availability` function called

**If it works**: ✅ Calendar integration working!  
**If it fails**: Check tool is attached to assistant in Vapi Dashboard

---

### Test 3: Book Appointment
**Purpose**: Verify AI can book appointments during call

**Steps**:
1. Make a test call
2. Request an appointment time that you know is AVAILABLE
3. Confirm when AI asks

**Expected**:
- ✅ AI checks availability
- ✅ AI says "Great! I've booked your consultation for..."
- ✅ Appointment appears in GHL calendar
- ✅ Railway logs show `book_appointment` function called

**If it works**: ✅ Booking integration working!  
**If it fails**: Check tool is attached and GHL calendar ID is correct

---

### Test 4: Transfer to Services
**Purpose**: Verify seamless assistant transfer

**Steps**:
1. Make a test call
2. Say: "Can you tell me more about your services?"
3. Listen for transfer

**Expected**:
- ✅ Main AI says something like "Let me connect you with our specialist..."
- ✅ Seamless transition (no "Please hold", same voice)
- ✅ Services Assistant responds: "I'd be happy to tell you more about our services..."
- ✅ Can continue conversation naturally

**If it works**: ✅ Transfers working!  
**If it fails**: Check transferCall tool is attached and configured with correct destination

---

### Test 5: Transfer to Pricing
**Purpose**: Verify pricing specialist transfer

**Steps**:
1. Make a test call
2. Say: "How much does this cost?"
3. Listen for transfer

**Expected**:
- ✅ Transfer to Pricing Assistant
- ✅ Pricing specialist explains costs
- ✅ Seamless conversation

**If it works**: ✅ All transfers working!  
**If it fails**: Check transfer tool configuration

---

### Test 6: GHL Workflow Trigger (Real Scenario)
**Purpose**: Verify end-to-end automation

**Steps**:
1. Go to GHL
2. Create a new contact manually:
   - firstName: TestUser
   - lastName: Auto
   - phone: +12136721526 (your test number)
   - email: test@example.com
3. Workflow should auto-trigger
4. You should receive a call

**Expected**:
- ✅ Call initiated within 30 seconds of contact creation
- ✅ AI greets: "Hi TestUser, this is Keey calling about your property inquiry..."
- ✅ All contact data available to AI

**Check Railway Logs**:
```
🔔 GHL WEBHOOK RECEIVED - TRIGGER CALL
📋 Extracted Contact Data:
   Name: TestUser Auto
   Phone: +12136721526
   ...
✅ Call initiated successfully!
```

**If it works**: 🎉 FULL SYSTEM WORKING!  
**If it fails**: Check GHL workflow webhook URL and configuration

---

## 💰 COST-SAVING TIPS

### Before Live Testing:
1. ✅ Verify ALL configurations in Vapi Dashboard first
2. ✅ Double-check tool attachments
3. ✅ Review Railway logs to ensure webhook is receiving data correctly
4. ✅ Test with ONE number first (yours)

### During Testing:
- Keep calls SHORT (under 2 minutes)
- Test one feature at a time
- Have a clear test plan
- Take notes on what works/doesn't work

### After First Successful Test:
- If Test 1 (greeting) works → Test 2 (calendar)
- If Test 2 works → Test 3 (booking)
- If Test 3 works → Test 4 & 5 (transfers)
- If ALL work → Test 6 (GHL automation)

**DON'T**: Make 10 test calls without checking results in between

---

## ⚠️ COMMON ISSUES & FIXES

### Issue: Call doesn't come through
- **Fix**: Boss needs to assign user to phone number in Vapi

### Issue: Call rings once and stops
- **Fix**: Boss needs to increase timeout to 30+ seconds in Vapi

### Issue: Generic greeting instead of personalized
- **Fix**: Check Railway logs - is `firstName` being passed correctly?
- **Debug**: Look for "Call Data" in logs to see what's sent to Vapi

### Issue: AI can't check calendar
- **Fix**: Verify `check_calendar_availability_keey` tool is attached to assistant

### Issue: AI can't book appointments
- **Fix**: Verify `book_calendar_appointment_keey` tool is attached to assistant

### Issue: Transfer doesn't work
- **Fix**: Verify `transferCall` or `transfer_call_keey` tool is attached and configured with correct destination assistant IDs

### Issue: GHL workflow doesn't trigger calls
- **Fix**: Check webhook URL in GHL workflow points to: `https://vapi-keey-voice-assistant-production.up.railway.app/webhook/ghl-trigger-call`

---

## 📊 SUCCESS CRITERIA

System is **production ready** when:

- ✅ Test 1: Personalized greeting works
- ✅ Test 2: Calendar check works
- ✅ Test 3: Appointment booking works
- ✅ Test 4: Services transfer works
- ✅ Test 5: Pricing transfer works
- ✅ Test 6: GHL automation works

**All 6 tests pass = Ready for real customers!** 🎉

---

## 🚀 DEPLOYMENT STATUS

### Code Changes:
✅ Personalized greeting fixed
✅ System prompts updated
✅ Tool references corrected
✅ create_contact removed (outbound-only mode)
✅ All configs simplified and production-ready

### Ready to Deploy:
- [ ] Push code to GitHub
- [ ] Railway auto-deploys
- [ ] Boss configures Vapi
- [ ] Run 6 live tests
- [ ] Launch! 🎉

---

## 📝 FINAL NOTES

**Current Status**: 90% ready

**Remaining**: Boss needs to fix 2 Vapi settings + verify tool attachments

**Estimated Time**: 30 mins configuration + 20 mins testing = **50 minutes to launch**

**Confidence Level**: 85% - Code is solid, just need Vapi configuration confirmed

---

*Ready to save you money and make this work on the first try!* 💪

