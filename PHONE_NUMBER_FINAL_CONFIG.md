# 📞 FINAL PHONE NUMBER CONFIGURATION

## ✅ **YOUR SMART TWO-NUMBER SETUP**

### **Strategy:**
- **Number 1 (+44 7402 769361):** Main business line (inbound + outbound lead calls)
- **Number 2 (+44 7427 920136):** Appointment confirmation line (outbound only)

---

## 🔧 **EXACT .env CONFIGURATION:**

Add/update these lines in your `.env` file:

```env
# ========================================
# PHONE NUMBER CONFIGURATION
# ========================================

# Main business number (for lead calls + inbound)
# Number: +44 7402 769361
# Used by: Main Squad (outbound) + Inbound Assistant (inbound)
VAPI_PHONE_NUMBER_ID=03251648-7837-4e7f-a981-b2dfe4f88881

# Confirmation number (for confirmation calls only)
# Number: +44 7427 920136
# Used by: Confirmation Assistant (outbound only)
VAPI_CONFIRMATION_PHONE_NUMBER_ID=f9372426-fb13-43d5-9bd6-8a3545800ece

# Twilio phone number (for inbound call routing)
# This is the same as main business number
TWILIO_PHONE_NUMBER=+447402769361
```

---

## 📊 **HOW IT WORKS:**

### **Scenario 1: Customer Calls You**
```
Customer dials: +44 7402 769361
         ↓
Twilio receives call
         ↓
Routes to: /twilio/voice endpoint
         ↓
Uses: Inbound Assistant (36728053-c5f8-48e6-a3fe-33d6c95348ce)
         ↓
AI captures lead information
         ↓
Creates contact in GHL
         ↓
Books consultation
```

### **Scenario 2: Lead Submits Form (Outbound Lead Call)**
```
Lead submits form in GHL
         ↓
GHL workflow triggers
         ↓
Webhook to: /webhook/ghl-trigger-call
         ↓
Server initiates call using:
  - Phone: +44 7402 769361 (VAPI_PHONE_NUMBER_ID)
  - Assistant: Main Squad (7cc6e04f-116c-491c-a5b0-00b430bb24db)
         ↓
AI qualifies lead & books appointment
```

### **Scenario 3: Confirmation Call (1hr Before Appointment)**
```
1 hour before appointment
         ↓
GHL workflow triggers
         ↓
Webhook to: /webhook/ghl-trigger-call
         ↓
Server detects: callType = "appointment_confirmation"
         ↓
Server initiates call using:
  - Phone: +44 7427 920136 (VAPI_CONFIRMATION_PHONE_NUMBER_ID)
  - Assistant: Confirmation Assistant (9ade430e-913f-468c-b9a9-e705f64646ab)
         ↓
AI confirms/reschedules/cancels appointment
```

---

## 🎯 **PHONE NUMBER ASSIGNMENT:**

| Number | Name | Outbound | Inbound | Purpose |
|--------|------|----------|---------|---------|
| **+44 7402 769361** | Main Business | Main Squad | Inbound Assistant | Lead generation & qualification |
| **+44 7427 920136** | Appointment Line | Confirmation Assistant | None | Appointment confirmations only |

---

## 🔍 **VAPI DASHBOARD CONFIGURATION:**

### **Number 1: +44 7402 769361**

**In Vapi Dashboard:**
1. Go to Phone Numbers
2. Click on **+44 7402 769361**

**Inbound Settings:**
- Assistant: **Keey Inbound Lead Assistant**
- Squad: (leave empty)

**Outbound Settings:**
- Assistant: (leave empty)
- Squad: **Your Main Squad** (the one with ID: 7cc6e04f-116c-491c-a5b0-00b430bb24db)

---

### **Number 2: +44 7427 920136**

**In Vapi Dashboard:**
1. Go to Phone Numbers
2. Click on **+44 7427 920136**

**Inbound Settings:**
- Assistant: (leave empty - not used for inbound)
- Squad: (leave empty)

**Outbound Settings:**
- Assistant: **Keey Appointment Confirmation Assistant**
- Squad: (leave empty)

---

## 🏆 **WHY THIS SETUP IS EXCELLENT:**

### **1. Clear Separation** ✅
```
Main number → New business & inquiries
Confirmation number → Existing appointments only
```

### **2. Customer Experience** ✅
```
Customers recognize main number for business
Separate number builds trust for appointments
Can label in phone: "Keey Main" vs "Keey Appointments"
```

### **3. Operational Benefits** ✅
```
Can track metrics separately
Can update confirmation logic without affecting leads
Can set different schedules if needed
```

### **4. Professional Appearance** ✅
```
Two dedicated lines = established business
Specialized numbers = organized operation
Consistent communication = trustworthy brand
```

---

## 🔄 **CALL FLOW SUMMARY:**

```
┌─────────────────────────────────────────────┐
│  CUSTOMER ACTIONS                            │
└─────────────────────────────────────────────┘
                    │
        ┌───────────┼───────────┐
        │           │           │
        ▼           ▼           ▼
   
 [Calls You]  [Submits Form]  [Has Appointment]
        │           │           │
        │           │           │
┌───────▼──────┐ ┌──▼────────┐ ┌──▼────────────┐
│ +44 7402... │ │ +44 7402...│ │ +44 7427...   │
│ INBOUND     │ │ OUTBOUND   │ │ OUTBOUND      │
└─────────────┘ └────────────┘ └───────────────┘
        │           │           │
        ▼           ▼           ▼
   
[Inbound Asst] [Main Squad]  [Conf. Assistant]
        │           │           │
        ▼           ▼           ▼
   
[Lead Capture] [Lead Qualify] [Confirm/Cancel]
        │           │           │
        └───────────┴───────────┘
                    │
                    ▼
              [GHL Contact]
```

---

## ✅ **CONFIGURATION CHECKLIST:**

### **Before Deployment:**
- ✅ Both numbers imported to Vapi
- ✅ Both numbers configured in Vapi dashboard
- ⏳ Update .env file with correct IDs
- ⏳ Redeploy with new configuration

### **After Deployment:**
- ⏳ Update Twilio webhook for +44 7402 769361
- ⏳ Test inbound call to +44 7402 769361
- ⏳ Test outbound lead call (should use +44 7402 769361)
- ⏳ Test confirmation call (should use +44 7427 920136)

---

## 🎊 **YOUR SETUP IS PERFECT!**

This two-number strategy is:
- ✅ Professional
- ✅ Scalable
- ✅ Clear
- ✅ Flexible

**Ready to update your .env and deploy!** 🚀

---

**Generated: November 24, 2025**
**All phone numbers configured and ready!**

