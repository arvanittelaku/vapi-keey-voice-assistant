# 🚨 CRITICAL FIXES BEFORE LIVE TESTING

## Issue 1: Tool Name Mismatch - CRITICAL ⚠️

### Problem:
System prompts tell AI to use these function names:
- `transfer_to_services`
- `transfer_to_pricing`
- `create_contact`
- `check_calendar_availability`
- `book_appointment`

But Vapi Dashboard tools are named:
- `transfer_call_keey` (Transfer Call - Vapi built-in)
- `check_calendar_availability_keey`
- `book_calendar_appointment_keey`

### Current Status:
✅ Function handler ALREADY handles both naming conventions (lines 51-72 in vapi-function-handler.js)
❌ System prompts reference incorrect function names for AI to call

### Impact:
- For calendar/booking: **Will work** (handler supports both names)
- For transfers: **Will NOT work** (AI will try to call non-existent function)
- For create_contact: **Question**: Do we have this tool or not?

### Solution Needed:
**Option 1 (Recommended)**: Update Vapi tool configurations to match system prompts
- Rename tools in Vapi Dashboard to match what AI expects
- OR create function properties in tool config to map names

**Option 2**: Update system prompts to match Vapi tool names
- Change all prompts to reference exact Vapi tool names
- More confusing for AI but guaranteed to work

---

## Issue 2: Transfer Tool Configuration - CRITICAL ⚠️

### Problem:
Transfer Call is a **Vapi built-in tool**, not a server-side function. It doesn't hit our `/webhook/vapi` endpoint.

### How Transfer Call Tool Works in Vapi:
1. Tool is configured in Vapi Dashboard
2. You specify:
   - **Destination**: Which assistant/squad to transfer to
   - **Description**: When to use this tool
3. When AI calls it, Vapi handles the transfer internally
4. NO webhook request to our server

### Current Configuration:
Tool Name: `transfer_call_keey`
Tool ID: e428aef0-bbd6-4870-aa42-96d08480abe7

### Required Configuration in Vapi Dashboard:
You need **TWO separate transfer tools** (or one with parameters):

**Tool 1: transfer_to_services**
- Type: Transfer Call (built-in)
- Destination Assistant ID: `{SERVICES_ASSISTANT_ID}`
- Description: "Transfer call to Services specialist when customer asks about what services Keey offers, how services work, or wants detailed service information"

**Tool 2: transfer_to_pricing** 
- Type: Transfer Call (built-in)
- Destination Assistant ID: `{PRICING_ASSISTANT_ID}`
- Description: "Transfer call to Pricing specialist when customer asks about costs, fees, pricing packages, or wants to know how much services cost"

### Action Required:
- [ ] Create TWO transfer tools in Vapi Dashboard
- [ ] OR rename existing tool to match system prompt
- [ ] OR update system prompts to use generic transfer_call with parameters

---

## Issue 3: create_contact Tool - CLARIFICATION NEEDED ⚠️

### Question:
Do we want the AI to create contacts during **INBOUND** calls?

### Current Situation:
- System prompt tells AI to use `create_contact` function
- Function handler has `createContact()` method ready
- But NO tool configured in Vapi Dashboard for this

### Scenarios:

**Scenario A: OUTBOUND calls (GHL → Vapi)**
- Contact ALREADY exists in GHL
- GHL workflow sends contact data to Vapi
- AI has all contact info in variableValues
- **No need to create contact** ✅

**Scenario B: INBOUND calls (Customer → Vapi)**
- Customer calls directly
- AI collects information (name, email, phone, property details)
- AI SHOULD create contact in GHL CRM
- **Need create_contact tool** ❌ (Not configured)

### Decision Needed:
**If you want inbound call support:**
1. Create `create_contact` tool in Vapi Dashboard
2. Type: Server Function
3. Server URL: `https://vapi-keey-voice-assistant-production.up.railway.app/webhook/vapi`
4. Function Name: `create_contact`
5. Add all required parameters
6. Attach to Main Assistant

**If outbound only:**
1. Remove `create_contact` references from system prompt
2. Remove "Lead Qualification" section
3. Simplify flow to only booking appointments for existing contacts

---

## Issue 4: Tool Attachment Verification - HIGH PRIORITY 🔧

### Current Tool Status (From PRODUCTION_CHECKLIST.md):
✅ `transfer_call_keey` (e428aef0-bbd6-4870-aa42-96d08480abe7)
✅ `check_calendar_availability_keey` (22eb8501-80fb-4971-87e8-6f0a88ac5eab)
✅ `book_calendar_appointment_keey` (d25e90cd-e6dc-423f-9719-96ca8c6541cb)

### Required: Verify Tool Attachments

**Main Assistant** should have:
- [ ] Transfer tool (for Services)
- [ ] Transfer tool (for Pricing)
- [ ] Check Calendar Availability
- [ ] Book Appointment
- [ ] Create Contact (if inbound calls supported)

**Services Assistant** should have:
- [ ] Transfer tool (back to Main? to Pricing?)
- [ ] Check Calendar Availability (if booking from Services)
- [ ] Book Appointment (if booking from Services)

**Pricing Assistant** should have:
- [ ] Transfer tool (back to Main? to Services?)
- [ ] Check Calendar Availability (if booking from Pricing)
- [ ] Book Appointment (if booking from Pricing)

### Action Required:
- [ ] Screenshot Vapi Dashboard showing tools attached to each assistant
- [ ] Verify all required tools are attached
- [ ] Confirm tool names match what AI will call

---

## Issue 5: GHL Workflow Data Format - MEDIUM PRIORITY 🔍

### Unknown:
What exact field names does GHL send when contact is created?

### Our Code Handles (ghl-to-vapi.js lines 44-55):
```javascript
const firstName = contactData.firstName || contactData.first_name || contactData.name?.split(' ')[0] || "there"
const lastName = contactData.lastName || contactData.last_name || contactData.name?.split(' ')[1] || ""
const phone = contactData.phone || contactData.contactPhone
const bedrooms = contactData.customField?.bedrooms || contactData.bedrooms || ""
const region = contactData.customField?.region || contactData.region || "London"
```

### Fallback Logic:
✅ Code has multiple fallbacks for field name variations
✅ Defaults provided if fields missing
✅ Should handle most GHL payload formats

### Action Required:
- [ ] Create test contact in GHL
- [ ] Trigger workflow
- [ ] Check Railway logs for actual payload
- [ ] Verify all fields extracted correctly

---

## Recommended Action Plan

### Before ANY Live Testing:

1. **Fix Tool Names** (30 mins)
   - Create TWO transfer tools in Vapi OR
   - Update system prompts to match existing tool

2. **Decide on Inbound Calls** (5 mins)
   - Do you want inbound call support?
   - If yes, create `create_contact` tool
   - If no, remove from system prompts

3. **Verify Tool Attachments** (10 mins)
   - Screenshot each assistant's tool list
   - Confirm all required tools attached
   - Test that tool names match

4. **Test GHL Workflow Data** (10 mins)
   - Create test contact in GHL
   - Check Railway logs for payload
   - Verify field extraction

### After Boss Fixes Vapi Settings:

5. **Live Test Call #1** - Greeting
   - Verify personalized greeting
   - No transfer, no tools
   - Just test greeting works

6. **Live Test Call #2** - Calendar Check
   - Request appointment
   - Verify AI uses check_calendar tool
   - Confirm response is correct

7. **Live Test Call #3** - Booking
   - Book actual appointment
   - Verify AI uses book_appointment tool
   - Confirm appointment appears in GHL

8. **Live Test Call #4** - Transfer
   - Ask about services
   - Verify seamless transfer
   - Confirm Services assistant responds

---

## Summary

**Status**: 🔴 **NOT PRODUCTION READY**

**Blockers**:
1. Transfer tool names don't match system prompts
2. Unknown if create_contact tool exists
3. Tool attachments not verified
4. No end-to-end test completed

**Confidence Level**: 60%

**Est. Time to Production Ready**: 1-2 hours of configuration + 30 mins of live testing

---

*Generated: November 5, 2025 - Before live testing*

