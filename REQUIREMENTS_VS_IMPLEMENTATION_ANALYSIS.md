# Requirements vs Implementation Analysis
## Keey Voice Assistant System

---

## 📋 YOUR REQUIREMENTS

### Outbound Calls Flow
**Purpose**: Educational/sales calls triggered from GHL workflow  
**Architecture**: Squad of assistants
- **Main Assistant**: Handles company info, benefits, processes, general conversation
- **Pricing Sub-Assistant**: Handles detailed pricing questions
- **Services Sub-Assistant**: Handles detailed services questions
- **Voice**: All same voice (seamless transitions)
- **User Experience**: User should NOT know they're talking to multiple assistants
- **Data Access**: Receive contact data from GHL (firstName, lastName, email, phone, contactId, etc.)
- **Capabilities**:
  - ✅ Check calendar availability (GHL Calendar Tool)
  - ✅ Book appointments (GHL Calendar Tool)
  - ✅ Personalized greeting with firstName
  - ✅ Try to convince user to book free consultation

**Flow**: Contact created in GHL → Wait 1 min → Trigger outbound call → Squad handles conversation → Try to book appointment

---

### Inbound Calls Flow
**Purpose**: Lead qualification from website form submissions  
**Architecture**: Single assistant (no squad needed)
- **Inbound Lead Qualification Assistant**: Dedicated to capturing lead information
- **Voice**: Professional and friendly
- **User Experience**: Quick, efficient data collection
- **Data Collection** (from form/call):
  - Full Name
  - Email
  - Contact Number
  - Property Street & Number
  - City
  - Postcode
  - Number of Bedrooms
  - Call Date (preferred)
  - Call Time (preferred)
- **Capabilities**:
  - ✅ Capture all form fields
  - ✅ Send data to GHL via tool
  - ✅ Book initial consultation

**Flow**: User fills form on website → Call triggered → Inbound assistant captures remaining info → Sends to GHL → Books appointment

---

## 🔍 CURRENT IMPLEMENTATION ANALYSIS

### ✅ What's Built and Working

#### 1. Outbound Squad Architecture ✅
- **Main Assistant Config**: `src/config/main-assistant-config.js` ✅
- **Pricing Assistant Config**: `src/config/pricing-assistant-config.js` ✅
- **Services Assistant Config**: `src/config/services-assistant-config.js` ✅
- **Same Voice**: All use OpenAI "alloy" voice ✅
- **Seamless Transitions**: Configured for smooth handoffs ✅
- **Transfer Tool**: Uses `transferCall` function ✅

#### 2. Outbound Call Triggering ✅
- **GHL Webhook Handler**: `src/webhooks/ghl-to-vapi.js` ✅
- **Endpoint**: `/webhook/ghl-trigger-call` ✅
- **Data Passing**: Uses `variableValues` to pass contact data ✅
- **Personalized Greeting**: Includes firstName in greeting ✅
- **Squad ID**: Configured in `callData.squadId` ✅

#### 3. Calendar & Booking Tools ✅
- **Check Availability**: `checkCalendarAvailability()` ✅
- **Book Appointment**: `bookCalendarAppointment()` ✅
- **GHL Integration**: `src/services/ghl-client.js` ✅
- **Function Handler**: `src/webhooks/vapi-function-handler.js` ✅

#### 4. Contact Management ✅
- **Create Contact**: `createContact()` function ✅
- **Update Contact**: Supported ✅
- **GHL API Client**: Fully implemented ✅

---

## ❌ GAPS & ISSUES

### Critical Issues

#### 1. ❌ NO SEPARATE INBOUND ASSISTANT
**Issue**: Currently using the SAME main assistant for both inbound and outbound calls.

**Current State**:
```javascript
// main-assistant-config.js
IMPORTANT - CALL HANDLING:
- For INBOUND calls: Welcome callers warmly...
- For OUTBOUND calls: You will have access to the caller's firstName...
```

**Problem**: The main assistant tries to handle BOTH scenarios, which leads to:
- Confusion about whether to collect data or assume it's already available
- No specialized flow for lead qualification
- No clear form-based data capture
- Not optimized for the inbound use case

**Required**: A completely separate assistant configuration for inbound lead qualification.

---

#### 2. ❌ INBOUND ASSISTANT NOT CONFIGURED
**Missing File**: `src/config/inbound-assistant-config.js`

**What's Needed**:
- Dedicated inbound assistant focused ONLY on lead qualification
- System prompt optimized for capturing form data
- No transfer capabilities (single assistant, not a squad)
- Specific flow for the 9 data fields from your form
- Tool to send captured data to GHL

---

#### 3. ❌ SQUAD USED FOR BOTH INBOUND & OUTBOUND
**Issue**: Current setup doesn't separate inbound from outbound.

**Current Setup**:
- Phone number → Assigned to Main Assistant (which tries to handle both)
- Squad → Not clearly separated for outbound only

**Required Setup**:
- **Inbound Phone Number** → Inbound Lead Qualification Assistant (single assistant)
- **Outbound Calls** → Squad (main + pricing + services) triggered via API, NOT phone number

---

#### 4. ❌ NO DEDICATED INBOUND DEPLOYMENT SCRIPT
**Missing File**: `scripts/deploy-inbound-assistant.js`

**Current Scripts**:
- ✅ `deploy-main-assistant.js`
- ✅ `deploy-services-assistant.js`
- ✅ `deploy-pricing-assistant.js`
- ✅ `deploy-squad.js`
- ❌ Missing: `deploy-inbound-assistant.js`

---

#### 5. ⚠️ LEAD QUALIFICATION DATA CAPTURE FLOW
**Issue**: No structured flow specifically for the form data from screenshot #1.

**Your Form Fields** (Screenshot #1):
1. Full Name
2. Email
3. Contact Number
4. Property Street & Number
5. City
6. Postcode
7. Number of Bedrooms
8. Call Date
9. Call Time

**Current Implementation**: 
- Main assistant has `createContact()` but it's generic
- No specific flow to capture these exact fields in order
- No dedicated tool for inbound lead submission

**Needed**:
- Structured data collection flow in inbound assistant prompt
- Dedicated function `capture_inbound_lead()` to send this exact data structure to GHL

---

## 📊 DETAILED COMPARISON TABLE

| Feature | Required | Current Status | Gap |
|---------|----------|----------------|-----|
| **Outbound: Squad Architecture** | ✅ Main + Pricing + Services | ✅ Implemented | ✅ COMPLETE |
| **Outbound: Same Voice** | ✅ All assistants same voice | ✅ All use "alloy" | ✅ COMPLETE |
| **Outbound: Seamless Transfers** | ✅ User shouldn't notice | ✅ Configured | ✅ COMPLETE |
| **Outbound: GHL Trigger** | ✅ Contact created → call | ✅ `/webhook/ghl-trigger-call` | ✅ COMPLETE |
| **Outbound: Contact Data Access** | ✅ firstName, email, etc. | ✅ Uses `variableValues` | ✅ COMPLETE |
| **Outbound: Calendar Tools** | ✅ Check & book appointments | ✅ Both functions work | ✅ COMPLETE |
| **Outbound: Personalized Greeting** | ✅ "Hi {firstName}..." | ✅ Implemented | ✅ COMPLETE |
| **Inbound: Separate Assistant** | ✅ Single dedicated assistant | ❌ Not created | ❌ **MISSING** |
| **Inbound: Lead Qualification** | ✅ Capture 9 form fields | ❌ No structured flow | ❌ **MISSING** |
| **Inbound: Send to GHL** | ✅ Tool to submit lead data | ⚠️ Generic `createContact` | ⚠️ **NEEDS IMPROVEMENT** |
| **Inbound: Phone Number Assignment** | ✅ Dedicated phone for inbound | ❌ Not separated | ❌ **MISSING** |
| **Inbound: Deployment Script** | ✅ Deploy inbound assistant | ❌ Script doesn't exist | ❌ **MISSING** |

**Legend**:
- ✅ = Complete and working
- ⚠️ = Partially implemented
- ❌ = Missing/not implemented

---

## 🎯 WHAT NEEDS TO BE BUILT

### 1. Inbound Lead Qualification Assistant
**File**: `src/config/inbound-assistant-config.js`
- Dedicated configuration for inbound calls ONLY
- System prompt focused on lead qualification
- Structured data collection flow for all 9 fields
- Professional, efficient, friendly tone
- No transfer capabilities (single assistant)
- Uses GHL calendar tools for appointment booking

### 2. Inbound Lead Capture Tool
**Update**: `src/webhooks/vapi-function-handler.js`
- New function: `captureInboundLead(params)`
- Parameters match your form exactly:
  - fullName, email, phone, propertyAddress, city, postcode, bedrooms, preferredDate, preferredTime
- Sends structured data to GHL
- Returns confirmation to assistant

### 3. Inbound Assistant Deployment Script
**File**: `scripts/deploy-inbound-assistant.js`
- Deploy the inbound assistant to Vapi
- Configure with server URL
- Return assistant ID for environment variables
- Similar structure to existing deployment scripts

### 4. Environment Variable Updates
**File**: `.env` / `env.example`
- Add: `VAPI_INBOUND_ASSISTANT_ID` (separate from squad)
- Add: `VAPI_INBOUND_PHONE_NUMBER_ID` (if using different phone)
- Clarify: `VAPI_SQUAD_ID` is for outbound only

### 5. Documentation Updates
**Files**: 
- `README.md`: Add section on inbound vs outbound setup
- `DEPLOYMENT_GUIDE.md`: Separate deployment instructions
- New file: `INBOUND_SETUP_GUIDE.md`

### 6. Architecture Separation
**Clear Distinction**:
```
INBOUND FLOW:
Website Form → Inbound Phone Number → Inbound Assistant → Capture Data → GHL → Book Appointment

OUTBOUND FLOW:
GHL Contact Created → Wait → Webhook Trigger → Squad (Main + Pricing + Services) → Try to Book
```

---

## 🚀 IMPLEMENTATION PLAN

### Phase 1: Create Inbound Assistant (30 minutes)
1. ✅ Create `src/config/inbound-assistant-config.js`
2. ✅ Configure system prompt for lead qualification
3. ✅ Add all 9 form field collection in structured flow
4. ✅ Configure same voice settings (consistency)

### Phase 2: Update Function Handler (20 minutes)
1. ✅ Add `captureInboundLead()` function
2. ✅ Map parameters to GHL contact creation
3. ✅ Add appointment booking after data capture
4. ✅ Return friendly confirmation messages

### Phase 3: Deployment Script (15 minutes)
1. ✅ Create `scripts/deploy-inbound-assistant.js`
2. ✅ Deploy inbound assistant to Vapi
3. ✅ Output assistant ID
4. ✅ Add to `package.json` scripts

### Phase 4: Environment & Documentation (15 minutes)
1. ✅ Update `env.example` with new variables
2. ✅ Update `README.md` with inbound/outbound separation
3. ✅ Create `INBOUND_SETUP_GUIDE.md`
4. ✅ Update existing docs to clarify separation

### Phase 5: Testing (20 minutes)
1. ✅ Test inbound assistant lead capture
2. ✅ Test GHL contact creation from inbound
3. ✅ Test outbound squad separately
4. ✅ Verify separation works correctly

**Total Estimated Time**: ~2 hours

---

## 📝 SUMMARY

### Currently Working ✅
- Outbound squad architecture (main + pricing + services)
- Seamless transitions with same voice
- GHL webhook trigger for outbound calls
- Contact data passing to assistants
- Calendar availability checking
- Appointment booking
- GHL integration

### Critical Gaps ❌
1. **No separate inbound assistant** - Using generic main assistant for both
2. **No structured lead qualification flow** - Missing specific form data capture
3. **No clear inbound/outbound separation** - Phone number assignment unclear
4. **Missing deployment script** - Can't deploy dedicated inbound assistant
5. **No specialized inbound tool** - Generic contact creation, not optimized for lead qualification

### What We'll Build 🔨
1. Dedicated inbound lead qualification assistant
2. Specialized lead capture function
3. Deployment script for inbound assistant
4. Clear architectural separation
5. Comprehensive documentation

---

## ✅ READY TO PROCEED?

Once you confirm you understand this analysis, I will:
1. Create the inbound assistant configuration
2. Update the function handler with specialized inbound tool
3. Create deployment script
4. Update documentation
5. Test the complete separation

This will give you:
- **Inbound calls** → Dedicated lead qualification assistant
- **Outbound calls** → Squad of specialists (main + pricing + services)
- Clear separation and optimal performance for each use case

Shall we proceed with the implementation?

