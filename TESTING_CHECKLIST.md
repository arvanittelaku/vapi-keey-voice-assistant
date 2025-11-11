# Testing Checklist - Appointment Confirmation System
## Created: November 11, 2025

---

## 🎯 What We Built Today

### Phase 1: Smart Cancellation & Proactive Rescheduling

**Completed Features:**
1. ✅ `cancel_appointment` tool - Cancels appointments in GHL calendar
2. ✅ Enhanced AI prompt - Proactive problem-solving approach
3. ✅ Multi-tool integration - AI can check availability, book appointments, and cancel
4. ✅ Updated confirmation assistant deployed to Vapi
5. ✅ All tools attached to assistant in Vapi dashboard

**What Changed:**
- **Before:** AI just tracks status ("confirmed" or "cancelled") but doesn't take action
- **After:** AI actively helps customers reschedule during the confirmation call

---

## 🧪 Pre-Flight Checklist (Before First Real Call)

### Environment Variables (Verify These First)

**Local `.env` file:**
```
✅ GHL_API_KEY=your_ghl_api_key
✅ GHL_LOCATION_ID=SMEvb6HVyyzvx0EekevW
✅ VAPI_API_KEY=your_vapi_private_key
✅ VAPI_PHONE_NUMBER_ID=your_main_phone_number_id
✅ VAPI_CONFIRMATION_PHONE_NUMBER_ID=your_confirmation_phone_id
✅ VAPI_SQUAD_ID=your_squad_id
✅ VAPI_CONFIRMATION_ASSISTANT_ID=9ade430e-913f-468c-b9a9-e705f64646ab
✅ WEBHOOK_SECRET=your_webhook_secret (optional)
```

**Render Environment Variables:**
```
✅ GHL_API_KEY
✅ GHL_LOCATION_ID
✅ VAPI_API_KEY
✅ VAPI_PHONE_NUMBER_ID
✅ VAPI_CONFIRMATION_PHONE_NUMBER_ID
✅ VAPI_SQUAD_ID
✅ VAPI_CONFIRMATION_ASSISTANT_ID=9ade430e-913f-468c-b9a9-e705f64646ab
```

---

## 📋 Test Scenarios (When You Have Vapi Credits)

### Test Scenario 1: Customer Confirms Appointment ✅

**Setup:**
1. Create a test appointment in GHL for a test contact
2. Trigger the confirmation workflow manually (or wait 1 hour before appointment)

**Expected Flow:**
```
AI: "Hello, this is Keey calling. May I speak with [Name]?"
Customer: "Yes, this is [Name]"
AI: "Hi [Name], I'm calling to confirm your consultation appointment with Keey today at [Time]. 
     Can you still make it, or would you like me to help you find a better time?"
Customer: "Yes, I can make it"
AI: "Perfect! Thank you for confirming. We're looking forward to speaking with you at [Time]. Have a great day!"
```

**Verify After Call:**
- [ ] GHL Contact custom field "Confirmation" = "confirmed"
- [ ] Appointment still exists in GHL calendar
- [ ] No errors in Render logs

---

### Test Scenario 2: Customer Cancels Appointment ❌

**Setup:**
1. Create a test appointment in GHL for a test contact
2. Trigger the confirmation workflow

**Expected Flow:**
```
AI: "Can you still make it at [Time], or would you like me to help you find a better time?"
Customer: "No, I can't make it. Just cancel it."
AI: "I completely understand - things come up! Would you like me to help you reschedule right now? 
     It will only take a moment."
Customer: "No, just cancel it please."
AI: "No problem at all. I'll cancel this appointment for you."
    [Cancels appointment]
    "All set! Feel free to call us at 0203 967 3687 when you're ready to reschedule. Thank you!"
```

**Verify After Call:**
- [ ] GHL Contact custom field "Confirmation" = "cancelled"
- [ ] Appointment is **removed from GHL calendar** (status = cancelled)
- [ ] Tool calls visible in Vapi call logs
- [ ] Server logs show successful cancellation
- [ ] No errors in Render logs

---

### Test Scenario 3: Customer Wants to Reschedule 🔄 (🆕 NEW FEATURE)

**Setup:**
1. Create a test appointment in GHL for a test contact
2. Trigger the confirmation workflow

**Expected Flow:**
```
AI: "Can you still make it at [Time], or would you like me to help you find a better time?"
Customer: "I need to reschedule"
AI: "Absolutely! Would you prefer earlier this week or later next week?"
Customer: "Later this week"
AI: [Checks calendar availability]
    "I have Thursday at 10 AM, 2 PM, or Friday at 11 AM. Which works best?"
Customer: "Thursday at 2 PM"
AI: [Books new appointment for Thursday 2 PM]
    [Cancels old appointment]
    "Perfect! I've rescheduled your consultation to Thursday at 2 PM. 
     You'll receive a confirmation email shortly. Have a great day!"
```

**Verify After Call:**
- [ ] OLD appointment cancelled in GHL calendar
- [ ] NEW appointment created in GHL calendar for Thursday 2 PM
- [ ] GHL Contact custom field "Confirmation" = "confirmed" (for new appointment)
- [ ] Contact received confirmation email for new appointment
- [ ] Tool calls visible in Vapi logs:
  - `check_calendar_availability_keey`
  - `book_calendar_appointment_keey`
  - `cancel_appointment`
  - `update_appointment_confirmation`
- [ ] No errors in Render logs

---

### Test Scenario 4: Customer is Uncertain 🤔

**Expected Flow:**
```
AI: "Can you still make it at [Time]?"
Customer: "I'm not sure yet, I'll let you know"
AI: "I understand. We'll keep the appointment scheduled for now. 
     If anything changes, just call us at 0203 967 3687. Otherwise, we'll speak at [Time]!"
```

**Verify After Call:**
- [ ] GHL Contact custom field "Confirmation" = "confirmed" (keeps appointment)
- [ ] Appointment still exists in GHL calendar
- [ ] Notes field may contain "customer uncertain but keeping appointment"

---

## 🔧 Tools Configuration Check

### In Vapi Dashboard

**Confirmation Assistant (`9ade430e-913f-468c-b9a9-e705f64646ab`) must have these 4 tools attached:**

1. ✅ `update_appointment_confirmation` (ID: `keey_confirmation_tool`)
   - Purpose: Track confirmation status
   - Parameters: contactId, appointmentId, status, notes

2. ✅ `cancel_appointment` (ID: `45580452-1407-40b0-b714-df7914d05604`)
   - Purpose: Cancel appointments in GHL calendar
   - Parameters: appointmentId, contactId, reason

3. ✅ `check_calendar_availability_keey`
   - Purpose: Check available time slots for rescheduling
   - Parameters: calendarId, startDate, endDate, timezone

4. ✅ `book_calendar_appointment_keey`
   - Purpose: Book new appointments
   - Parameters: calendarId, contactId, startTime, timezone, title

---

## 🛠️ GHL Workflow Configuration

### Confirmation Call Workflow

**Trigger:** Appointment Start Time - 1 hour before

**Actions:**
1. **Wait** - 1 minute (allows appointment to be fully created)
2. **Custom Webhook** - Trigger Vapi call
   - URL: `https://vapi-keey-voice-assistant.onrender.com/webhook/ghl-trigger-call`
   - Method: POST
   - Body (JSON):
   ```json
   {
     "contactId": "{{contact.id}}",
     "firstName": "{{contact.first_name}}",
     "lastName": "{{contact.last_name}}",
     "phone": "{{contact.phone}}",
     "email": "{{contact.email}}",
     "appointmentId": "{{appointment.id}}",
     "appointmentTime": "{{appointment.start_time}}",
     "calendarId": "{{appointment.calendar_id}}",
     "callType": "confirmation"
   }
   ```

**Important Settings:**
- [ ] Workflow is **Published** (not Draft)
- [ ] Workflow is **Active**
- [ ] Custom field "Confirmation" exists in GHL
- [ ] Custom field ID: `YLvP62hGzQMhfl2YMxTj`

---

## 🚨 Common Issues & Solutions

### Issue 1: Call Not Triggered
**Symptoms:** Workflow runs but no call is made
**Check:**
- Vapi credits available
- `VAPI_CONFIRMATION_PHONE_NUMBER_ID` set correctly
- Phone number in E.164 format (+447700900123)
- Render server is running (check logs)

### Issue 2: Tool Not Called
**Symptoms:** AI talks but doesn't cancel/reschedule
**Check:**
- All 4 tools attached to assistant in Vapi dashboard
- Tool server URL correct: `https://vapi-keey-voice-assistant.onrender.com/webhook/vapi`
- Check Vapi call logs for tool call attempts
- Check Render logs for tool execution

### Issue 3: Appointment Not Cancelled
**Symptoms:** AI says it cancelled but appointment still shows in GHL
**Check:**
- GHL API key has calendar permissions
- Appointment ID is correct in tool call
- Check Render logs for GHL API errors
- Verify appointment status changed to "cancelled" (it may still show in "All" view)

### Issue 4: Rescheduling Fails
**Symptoms:** AI can't find available slots or booking fails
**Check:**
- Calendar ID is correct
- Calendar has available slots in the requested time range
- GHL API key has calendar write permissions
- Time zone is set to "Europe/London"

---

## 📊 Success Criteria

**Phase 1 is successful when:**
- [x] ✅ `cancel_appointment` tool works (tested with Postman)
- [ ] ⏳ Confirmation calls are triggered 1 hour before appointments
- [ ] ⏳ AI successfully confirms appointments and updates custom field
- [ ] ⏳ AI successfully cancels appointments when customer can't attend
- [ ] ⏳ AI successfully reschedules appointments during the call
- [ ] ⏳ All tool calls execute without errors
- [ ] ⏳ GHL calendar reflects all changes correctly

---

## 🎯 What to Do When You Have Credits

### Step 1: Add Vapi Credits
1. Go to Vapi Dashboard → Billing
2. Add credits (recommend starting with $10-20 for testing)

### Step 2: Create Test Appointment
1. Go to GHL Calendar
2. Create appointment for ~1.5 hours from now
3. Assign to a test contact with a real phone number you can answer

### Step 3: Monitor the Call
1. Open Render logs: https://dashboard.render.com
2. Open Vapi call logs: https://dashboard.vapi.ai/calls
3. Answer the call and test different scenarios

### Step 4: Verify Results
- Check GHL calendar for changes
- Check contact's "Confirmation" custom field
- Review call transcript in Vapi
- Check for any errors in logs

### Step 5: Report Back
Tell me what worked and what didn't, and we'll fix any issues!

---

## 📝 Quick Reference

**Vapi Confirmation Assistant ID:**
```
9ade430e-913f-468c-b9a9-e705f64646ab
```

**Cancel Appointment Tool ID:**
```
45580452-1407-40b0-b714-df7914d05604
```

**GHL Custom Field (Confirmation) ID:**
```
YLvP62hGzQMhfl2YMxTj
```

**Server URL:**
```
https://vapi-keey-voice-assistant.onrender.com
```

**Webhook Endpoints:**
- GHL → Vapi trigger: `/webhook/ghl-trigger-call`
- Vapi → Server tools: `/webhook/vapi`

---

## 🚀 Next Phases (Not Yet Implemented)

### Phase 2: Automatic Calendar Management
- Update appointment status in GHL based on confirmation outcome
- Mark appointments as "confirmed" when customer confirms

### Phase 3: Workflow Triggers
- Trigger different GHL workflows based on status:
  - "confirmed" → Send confirmation SMS
  - "cancelled" → Trigger rebooking workflow
  - "reschedule" → Send new appointment details

### Phase 4: SMS Fallback
- Send SMS if customer doesn't answer call
- Handle SMS responses (YES/NO/RESCHEDULE)

---

**Status:** Phase 1 Implementation Complete - Ready for Testing
**Last Updated:** November 11, 2025
**Next Action:** Add Vapi credits and test with real calls

