# Keey Voice Assistant - Quick Start Guide

## 🚀 Get Running in 15 Minutes

This guide will get your Keey Voice Assistant up and running quickly.

### Prerequisites Checklist

Before starting, make sure you have:
- [ ] Node.js 18+ installed (`node --version`)
- [ ] npm 9+ installed (`npm --version`)
- [ ] Vapi AI account with API key
- [ ] GoHighLevel account with API access
- [ ] A domain or ngrok for webhooks (development)

---

## Step 1: Install Dependencies (2 minutes)

```bash
# Navigate to project directory
cd vapi-keey-voice-assistant

# Install all required packages
npm install
```

**Expected output**: All dependencies installed successfully, no errors.

---

## Step 2: Configure Environment (5 minutes)

```bash
# Copy the example environment file
cp env.example .env

# Open .env in your editor
# On Windows:
notepad .env

# On Mac/Linux:
nano .env
```

### Required Configuration

Fill in these essential variables in `.env`:

```env
# Get from Vapi Dashboard → Settings → API Keys
VAPI_API_KEY=vapi_xxx...

# Get from Vapi Dashboard → Phone Numbers (after purchasing)
VAPI_PHONE_NUMBER_ID=xxx...

# Get from GHL → Settings → API → Location API Key
GHL_API_KEY=eyJhbGci...

# Get from GHL → Settings → Business Profile
GHL_LOCATION_ID=xxx...

# Get from GHL → Calendars (create a calendar for consultations)
GHL_CALENDAR_ID=xxx...

# Your webhook URL (use ngrok for development)
WEBHOOK_BASE_URL=https://your-domain.com

# Generate a random secret (use: openssl rand -hex 32)
WEBHOOK_SECRET=random_secret_here_make_it_long
```

### Quick Setup Tips

**For Development - Use ngrok:**
```bash
# Install ngrok (if not installed)
npm install -g ngrok

# Start ngrok in a separate terminal
ngrok http 3000

# Copy the https URL (e.g., https://abc123.ngrok.io)
# Set this as your WEBHOOK_BASE_URL
```

**Finding GHL Credentials:**
1. **API Key**: GHL Dashboard → Settings → Integrations → API
2. **Location ID**: GHL Dashboard → Settings → Business Info (URL bar)
3. **Calendar ID**: GHL Dashboard → Calendars → Select calendar → URL bar

---

## Step 3: Start the Server (1 minute)

```bash
# Start the webhook server
npm start
```

**Expected output:**
```
🚀 Starting Keey Vapi Voice Assistant...
📡 Setting up webhook endpoints...

✅ Keey Voice Assistant server running on port 3000
📡 Webhook endpoint: http://localhost:3000/webhook/vapi
🏥 Health check: http://localhost:3000/health
```

**Keep this terminal running!**

---

## Step 4: Test the Server (1 minute)

Open a new terminal and run:

```bash
# Test the webhook endpoints
npm run test-webhook
```

**Expected output:**
```
🧪 Testing Webhook Endpoints...
✅ Health check passed
✅ create_contact test passed
✅ check_calendar_availability test passed
✅ end-of-call-report test passed
🎉 All webhook tests passed!
```

---

## Step 5: Test GHL Integration (2 minutes)

```bash
# Test GoHighLevel connectivity
npm run test-ghl-integration
```

**Expected output:**
```
🧪 Testing GoHighLevel Integration...
✅ Contact created successfully!
✅ Contact retrieved successfully!
✅ Contact updated successfully!
✅ Calendar availability checked!
✅ Appointment created successfully!
🎉 All GHL integration tests passed!
```

If this fails, double-check your GHL API credentials in `.env`.

---

## Step 6: Deploy Assistants (3 minutes)

```bash
# Deploy all three assistants at once
npm run deploy-all
```

**Expected output:**
```
🚀 Deploying Main Keey Assistant...
✅ Main Assistant created successfully!
📋 Assistant ID: asst_xxx...

🚀 Deploying Services Sub-Agent...
✅ Services Assistant created successfully!
📋 Assistant ID: asst_yyy...

🚀 Deploying Pricing Sub-Agent...
✅ Pricing Assistant created successfully!
📋 Assistant ID: asst_zzz...
```

**IMPORTANT:** Copy the three Assistant IDs and add them to your `.env`:

```env
VAPI_MAIN_ASSISTANT_ID=asst_xxx...
VAPI_SERVICES_ASSISTANT_ID=asst_yyy...
VAPI_PRICING_ASSISTANT_ID=asst_zzz...
```

---

## Step 7: Configure Vapi Dashboard (3 minutes)

### A. Configure Webhook URL

For each assistant:

1. Go to https://dashboard.vapi.ai
2. Click "Assistants"
3. Select "Keey Main Assistant"
4. Scroll to "Server URL" section
5. Set Server URL: `https://your-domain.com/webhook/vapi`
6. Set Server URL Secret: (copy from your `.env` WEBHOOK_SECRET)
7. Click "Save"
8. Repeat for Services and Pricing assistants

### B. Configure Phone Number

1. Go to "Phone Numbers" in Vapi dashboard
2. Select your phone number
3. Under "Assistant", select "Keey Main Assistant"
4. Click "Save"

---

## Step 8: Test with a Real Call! 🎉

**You're ready!**

Call your Vapi phone number and test the system:

### Test Script for Inbound:

**You**: "Hello"
**AI**: "Thank you for calling Keey. How can I help you with your property today?"
**You**: "I'd like to learn about your property management services"
**AI**: (Asks about your property, collects information)
**You**: (Provide test information)
**AI**: (Offers to book consultation)

### Test Script for Services:

**You**: "Can you tell me more about what services you offer?"
**AI**: (Provides overview)
**You**: "Tell me more about the cleaning service"
**AI**: (Transfers to Services agent, provides details)

### Test Script for Pricing:

**You**: "How much does your service cost?"
**AI**: (Transfers to Pricing agent, explains pricing)

---

## Troubleshooting

### "Cannot connect to Vapi"
✅ Check `VAPI_API_KEY` is correct
✅ Make sure you have credits in your Vapi account

### "GHL API error"
✅ Check `GHL_API_KEY` has proper permissions (Contacts, Calendar)
✅ Verify `GHL_LOCATION_ID` matches your GHL location
✅ Make sure `GHL_CALENDAR_ID` is a valid calendar

### "Webhook not receiving calls"
✅ Verify `WEBHOOK_BASE_URL` is publicly accessible
✅ Test with: `curl https://your-domain.com/health`
✅ Check `WEBHOOK_SECRET` matches in Vapi dashboard
✅ Restart your server after changes

### "Assistant doesn't respond correctly"
✅ Check assistant is deployed: `npm run deploy-main`
✅ Verify webhook URL is configured in Vapi dashboard
✅ Check server logs for errors

---

## What to Test

### ✅ Inbound Call Flow
- [ ] Call connects successfully
- [ ] Assistant greets you warmly
- [ ] Can collect your information
- [ ] Contact created in GHL
- [ ] Can book an appointment
- [ ] Appointment appears in GHL calendar

### ✅ Agent Transfers
- [ ] Can transfer to Services agent (ask about services)
- [ ] Voice stays consistent during transfer
- [ ] Can transfer to Pricing agent (ask about pricing)
- [ ] Transfer is seamless (no awkward handoff)

### ✅ Regional Handling
- [ ] Test with London property (postcode SW1A 1AA)
- [ ] Test with Dubai property (mention Dubai)
- [ ] Phone numbers formatted correctly

---

## Next Steps

Once everything is working:

1. **Customize System Prompts**: Edit files in `src/config/` to match your exact needs
2. **Update Knowledge Bases**: Add more details to `knowledge-base/` files
3. **Deploy to Production**: Move from ngrok to permanent hosting
4. **Monitor Calls**: Check Vapi dashboard for call logs and transcripts
5. **Optimize**: Adjust based on real call feedback

---

## Support Resources

- **README.md**: Full documentation
- **IMPLEMENTATION_SUMMARY.md**: Complete overview
- **Vapi Docs**: https://docs.vapi.ai
- **GHL API Docs**: https://highlevel.stoplight.io
- **GitHub Repo**: https://github.com/arvanittelaku/vapi-keey-voice-assistant

---

## 🎉 Congratulations!

Your Keey Voice Assistant is now live and ready to handle calls!

**What you've accomplished:**
✅ Set up a complete AI voice assistant system
✅ Integrated with GoHighLevel CRM
✅ Created 3 specialized AI agents
✅ Configured automatic lead qualification
✅ Enabled appointment booking
✅ Deployed to production

**Start taking calls and growing your business!** 🚀

---

**Need Help?**
- Check server logs: Look at your terminal running `npm start`
- Test endpoints: Run `npm run test-webhook`
- Verify GHL: Run `npm run test-ghl-integration`
- Review docs: See README.md for detailed information

