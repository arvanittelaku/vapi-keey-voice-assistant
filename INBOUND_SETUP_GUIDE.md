# Keey Inbound Lead Qualification Assistant - Setup Guide

## 🎯 Purpose

This guide explains how to set up and configure the **Inbound Lead Qualification Assistant** for Keey. This assistant handles incoming calls from potential clients (typically from website form submissions) and is completely separate from the outbound squad.

---

## 📋 Architecture Overview

### Inbound vs Outbound

```
┌─────────────────────────────────────────────────────────────┐
│                    INBOUND FLOW                             │
├─────────────────────────────────────────────────────────────┤
│ Website Form → Inbound Phone Number                         │
│              ↓                                               │
│ Inbound Lead Qualification Assistant (Single Assistant)     │
│              ↓                                               │
│ 1. Capture lead data                                        │
│ 2. Create contact in GHL                                    │
│ 3. Try to book consultation                                 │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    OUTBOUND FLOW                            │
├─────────────────────────────────────────────────────────────┤
│ GHL Contact Created → Wait 1 min → Trigger API Call        │
│              ↓                                               │
│ Outbound Squad (Main + Pricing + Services)                 │
│              ↓                                               │
│ 1. Give info about Keey                                     │
│ 2. Answer questions (transfer to specialists)              │
│ 3. Try to book consultation                                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### Step 1: Deploy Inbound Assistant

```bash
# Make sure you're in the project directory
cd vapi-keey-voice-assistant

# Deploy the inbound assistant to Vapi
npm run deploy-inbound
```

The script will output an **Assistant ID**. Copy it!

### Step 2: Add Assistant ID to Environment

Add the assistant ID to your `.env` file:

```env
VAPI_INBOUND_ASSISTANT_ID=your_inbound_assistant_id_here
```

### Step 3: Configure GHL Tools in Vapi Dashboard

Go to [Vapi Dashboard](https://dashboard.vapi.ai) → Assistants → **Keey Inbound Lead Assistant** → Tools

Attach the following **3 GHL integrated tools**:

#### 1. Contact Create (GHL)
- **Purpose**: Create new contact in GoHighLevel
- **When used**: After collecting lead information
- **Required fields**:
  - `firstName`
  - `lastName`
  - `email`
  - `phone`
  - `address1` (property address)
  - `city`
  - `postalCode`
  - Custom fields: `bedrooms`, `region`, `leadSource`

#### 2. Calendar Check Availability (GHL)
- **Purpose**: Check if a consultation time slot is available
- **When used**: After lead expresses interest in booking
- **Required fields**:
  - `calendarId` (use your GHL calendar ID)
  - `startTime` (ISO format)
  - `endTime` (ISO format)

#### 3. Calendar Create Event (GHL)
- **Purpose**: Book the consultation appointment
- **When used**: After confirming availability
- **Required fields**:
  - `calendarId`
  - `contactId` (from Contact Create response)
  - `startTime`
  - `title` (e.g., "Keey Property Consultation")
  - `appointmentStatus` (usually "confirmed")

> **Note**: These are the same GHL tools shown in your screenshot. They should already be configured in your Vapi dashboard under the Integrations section.

### Step 4: Assign Phone Number

Go to Vapi Dashboard → **Phone Numbers** → Select your **inbound phone number**

- **Assistant**: Select "Keey Inbound Lead Assistant"
- **Save**

⚠️ **Important**: This should be a DIFFERENT phone number from your outbound squad!

### Step 5: Test the Setup

Call your inbound phone number and verify:
1. ✅ Assistant greets you professionally
2. ✅ Assistant asks for your information naturally
3. ✅ Assistant offers to book a consultation
4. ✅ Contact is created in GHL
5. ✅ Appointment is booked in GHL calendar

---

## 📞 How the Inbound Assistant Works

### Conversation Flow

#### 1. Greeting (5-10 seconds)
```
Assistant: "Hello! Thank you for calling Keey. I'm here to help you 
            maximize your property's rental income. How can I assist 
            you today?"
```

#### 2. Understanding Interest (30-60 seconds)
The assistant asks:
- Are you currently renting on Airbnb?
- What's your main reason for interest? (earn more, reduce hassle, etc.)

#### 3. Information Collection (2-3 minutes)
The assistant naturally collects:
- ✅ Full Name
- ✅ Phone Number
- ✅ Email Address
- ✅ Property Address (street & number)
- ✅ City
- ✅ Postcode
- ✅ Number of Bedrooms

**Note**: Questions are asked conversationally, not like a form!

#### 4. Create Contact in GHL
After collecting information, the assistant uses the **Contact Create** tool to save the lead in GoHighLevel.

#### 5. Provide Value (1-2 minutes)
The assistant gives a brief value proposition:
- "Properties like yours typically earn..."
- "We handle everything for you..."
- "Many clients see 30-40% increase in income..."

#### 6. Book Consultation (1-2 minutes)
**This is the PRIMARY GOAL!**

The assistant:
1. Asks for preferred date/time
2. Uses **Calendar Check Availability** to verify slot
3. Uses **Calendar Create Event** to book appointment
4. Confirms booking details

#### 7. Closing
- **If booked**: "Perfect! Your consultation is confirmed for [date] at [time]."
- **If not booked**: "No problem! You'll receive information via email."

---

## 🛠️ Configuration Details

### Assistant Configuration File
**Location**: `src/config/inbound-assistant-config.js`

Key settings:
- **Model**: GPT-4o (OpenAI)
- **Voice**: Alloy (same as squad for consistency)
- **Max Duration**: 15 minutes
- **Language**: British English (en-GB)
- **Recording**: Enabled

### System Prompt Highlights

The inbound assistant is trained to:
- ✅ Be conversational and natural (not robotic)
- ✅ Show genuine interest in helping
- ✅ Ask questions naturally (not like a form)
- ✅ Handle objections professionally
- ✅ Always try to book the consultation
- ✅ Be patient and understanding

### Objection Handling

The assistant is prepared for common objections:

| Objection | Response |
|-----------|----------|
| "I need to think about it" | Emphasize free consultation, no obligation |
| "How much does it cost?" | Brief answer + emphasize ROI + consultation for details |
| "I'm not sure yet" | Free consultation helps decision-making |
| "Can you email me info?" | Yes + still offer consultation |

---

## 🔧 Troubleshooting

### Issue: Assistant doesn't create contact in GHL

**Solution**:
1. Verify GHL Contact Create tool is attached to assistant in Vapi dashboard
2. Check GHL API key is valid in Vapi integrations
3. Ensure `locationId` is correctly configured
4. Check Vapi function call logs for errors

### Issue: Calendar booking fails

**Solution**:
1. Verify GHL Calendar tools are attached to assistant
2. Confirm `GHL_CALENDAR_ID` is correct
3. Check calendar permissions in GHL
4. Ensure time zone settings are correct

### Issue: Assistant asks for information already provided

**Solution**:
This is expected! The inbound assistant is designed to collect information during the call, even if some was provided in the form. It asks naturally to verify and complete the data.

### Issue: Assistant doesn't try to book appointment

**Solution**:
1. Review call transcript - assistant should always suggest consultation
2. Check if Calendar tools are properly configured
3. Verify system prompt in config file (should emphasize booking)

---

## 📊 Success Metrics

Track these KPIs for your inbound assistant:

### Call Metrics
- **Answer Rate**: % of inbound calls answered
- **Average Call Duration**: ~5-7 minutes expected
- **Completion Rate**: % of calls that collect full information

### Conversion Metrics
- **Lead Capture Rate**: % of calls that create GHL contact
- **Booking Rate**: % of calls that book consultation
- **Contact Quality**: % of contacts with complete information

### Quality Metrics
- **Customer Satisfaction**: Survey after call
- **Information Accuracy**: % of correctly captured data
- **Follow-up Success**: % of leads that convert after consultation

---

## 🎓 Best Practices

### For Optimal Performance

1. **Monitor Call Transcripts**
   - Review first 10-20 calls carefully
   - Identify patterns in objections
   - Refine system prompt if needed

2. **Update Calendar Regularly**
   - Keep GHL calendar up to date
   - Ensure available slots are realistic
   - Block out holidays and unavailable times

3. **Test Regularly**
   - Make test calls weekly
   - Verify contact creation works
   - Check appointment booking flow

4. **Optimize Based on Data**
   - Track which time slots get most bookings
   - Identify common questions/objections
   - Update value propositions that work

5. **Keep Information Current**
   - Update pricing if it changes
   - Add new services/features
   - Adjust regional information as needed

---

## 🔄 Updating the Assistant

### To Update System Prompt or Settings

1. Edit: `src/config/inbound-assistant-config.js`
2. Run: `npm run deploy-inbound`
3. The script will update the existing assistant

### To Change Voice or Model

Edit the configuration file:

```javascript
// Voice Settings
voice: {
  provider: "openai",
  voiceId: "alloy", // Change to: nova, shimmer, onyx, etc.
},

// Model Settings
model: {
  provider: "openai",
  model: "gpt-4o", // Or: gpt-4-turbo, gpt-3.5-turbo
  ...
}
```

Then redeploy: `npm run deploy-inbound`

---

## 🆘 Getting Help

### Resources
- **Vapi Documentation**: https://docs.vapi.ai
- **GHL API Docs**: https://highlevel.stoplight.io
- **Support**: Check call logs in Vapi dashboard

### Common Questions

**Q: Can I use the same phone number for inbound and outbound?**  
A: Not recommended. Use separate phone numbers for clarity and better tracking.

**Q: Do I need to manually enter tools in Vapi dashboard?**  
A: Yes, GHL tools must be attached manually after deployment.

**Q: Can I customize the greeting message?**  
A: Yes, edit the system prompt in `inbound-assistant-config.js`

**Q: How do I test without calling?**  
A: Use Vapi's built-in testing feature in the dashboard or make real test calls.

---

## ✅ Checklist

Before going live with your inbound assistant:

- [ ] Deployed inbound assistant (`npm run deploy-inbound`)
- [ ] Added `VAPI_INBOUND_ASSISTANT_ID` to `.env`
- [ ] Attached 3 GHL tools in Vapi dashboard
- [ ] Assigned inbound phone number to assistant
- [ ] Configured GHL calendar availability
- [ ] Made 3+ test calls successfully
- [ ] Verified contact creation in GHL
- [ ] Verified appointment booking in GHL
- [ ] Reviewed call transcripts for quality
- [ ] Set up monitoring/alerts

---

## 🎉 You're Ready!

Your inbound lead qualification assistant is now configured and ready to capture leads and book consultations automatically!

**Next Steps**:
1. Promote your phone number on website
2. Monitor first calls closely
3. Optimize based on performance data
4. Scale up marketing efforts

For outbound setup, see: `SQUAD_DEPLOYMENT_GUIDE.md`

---

**Questions?** Review the main README.md or check Vapi dashboard for logs and analytics.

