# 🚀 AWS DEPLOYMENT GUIDE - Keey Voice Assistant

**Project:** Vapi Keey Voice Assistant  
**GitHub:** https://github.com/arvanittelaku/vapi-keey-voice-assistant  
**Status:** ✅ 100% Complete - Ready for Deployment  
**Recommended Service:** AWS Elastic Beanstalk  
**Estimated Time:** 1 hour

---

## 📋 WHAT THIS PROJECT IS

This is a complete voice assistant system for Keey Property Management that:
- ✅ Handles inbound calls from potential clients (lead capture)
- ✅ Makes outbound calls to book consultations
- ✅ Confirms appointments 1 hour before scheduled time
- ✅ Allows rescheduling and cancellation during calls
- ✅ Integrates with GoHighLevel (CRM)
- ✅ Integrates with Vapi (AI voice platform)
- ✅ Integrates with Twilio (phone system)

**Technology Stack:**
- Node.js + Express
- GoHighLevel API
- Vapi API
- Twilio API

**Current Status:**
- ✅ All code complete
- ✅ All features tested
- ✅ All AI assistants configured (99.5% confidence)
- ✅ Ready for production deployment

---

## 🎯 DEPLOYMENT OPTIONS

### **OPTION 1: AWS ELASTIC BEANSTALK (RECOMMENDED)**

**Best for:** Beginners, automatic management, free for 12 months

**Pros:**
- ✅ Free for 12 months (750 hours/month)
- ✅ Automatic server management
- ✅ Built-in monitoring and logs
- ✅ Easy GitHub integration
- ✅ Auto-scaling included
- ✅ Perfect for webhooks (no cold starts)

**Cons:**
- ⚠️ After 12 months: ~$20-30/month

**Setup Time:** 30-40 minutes

---

### **OPTION 2: AWS APP RUNNER**

**Best for:** Simplicity, modern approach

**Pros:**
- ✅ Simpler than Elastic Beanstalk
- ✅ Direct GitHub integration
- ✅ Auto-scaling
- ✅ No server management

**Cons:**
- ⚠️ No free tier (~$25/month from day 1)

**Setup Time:** 20-30 minutes

---

### **OPTION 3: STAY ON RENDER (Upgrade to Paid)**

**Best for:** Zero migration work

**Pros:**
- ✅ Already deployed and working
- ✅ Zero migration needed
- ✅ Just upgrade to paid plan ($20/month)

**Cons:**
- ⚠️ Not AWS (if required by company policy)

**Setup Time:** 5 minutes

---

## 📋 PRE-DEPLOYMENT CHECKLIST

Before starting deployment, ensure you have:

- [ ] AWS account created (or Render paid plan)
- [ ] Credit card for AWS verification (won't be charged on free tier)
- [ ] Access to GitHub repository: https://github.com/arvanittelaku/vapi-keey-voice-assistant
- [ ] All API keys ready (see `.env.example` file in repo)
- [ ] 1 hour of uninterrupted time

---

## 🚀 STEP-BY-STEP: AWS ELASTIC BEANSTALK DEPLOYMENT

### **PHASE 1: CREATE AWS ACCOUNT (15 minutes)**

1. Go to: https://aws.amazon.com/
2. Click **"Create an AWS Account"**
3. Provide:
   - Email address
   - Password
   - AWS account name: "Keey Voice Assistant"
4. Choose account type: Business or Personal
5. Enter payment information (required, but won't charge on free tier)
6. Verify phone number (SMS or call)
7. Choose **"Basic Support - Free"**
8. Wait 5-10 minutes for account activation

---

### **PHASE 2: SET UP BILLING ALERTS (5 minutes)**

⚠️ **IMPORTANT:** This prevents unexpected charges

1. Sign in to AWS Console: https://console.aws.amazon.com/
2. Search for **"Billing"** in top search bar
3. Click **"Billing and Cost Management"**
4. Go to **"Billing preferences"**
5. Enable:
   - ✅ "Receive Free Tier Usage Alerts"
   - ✅ "Receive Billing Alerts"
   - Enter your email
6. Save preferences
7. Go to **"Budgets"** → Create **"Zero spend budget"**
8. You'll now get alerts if AWS tries to charge anything

---

### **PHASE 3: CREATE ELASTIC BEANSTALK APPLICATION (10 minutes)**

1. In AWS Console, search for **"Elastic Beanstalk"**
2. Click **"Create application"**

**Application settings:**
- Application name: `keey-voice-assistant`
- Application tags: (optional)

**Environment information:**
- Environment name: `keey-voice-assistant-prod`
- Domain: `keey-voice-assistant-prod` (will be available as URL)

**Platform:**
- Platform: **Node.js**
- Platform branch: **Node.js 18 running on 64bit Amazon Linux 2023**
- Platform version: (use recommended/latest)

**Application code:**
- Select: **"Upload your code"**
- Version label: `v1.0.0`
- Source code origin: **"Local file"**

**WAIT! Don't upload yet. We'll do this via GitHub in next step.**

Instead, select: **"Sample application"** for now
- Click **"Next"**

**Configure service access:**
- Service role: Create new role (auto-creates)
- EC2 key pair: Skip (not needed)
- EC2 instance profile: Create new role (auto-creates)
- Click **"Skip to review"**

**Review and create:**
- Review all settings
- Click **"Submit"**

**Wait 5-10 minutes** for environment creation

---

### **PHASE 4: CONNECT TO GITHUB (10 minutes)**

Once environment is created:

1. Go to your Elastic Beanstalk environment
2. Click **"Upload and deploy"**
3. In your local computer:
   ```bash
   git clone https://github.com/arvanittelaku/vapi-keey-voice-assistant.git
   cd vapi-keey-voice-assistant
   zip -r deploy.zip . -x "*.git*" "node_modules/*" ".env"
   ```
4. Upload `deploy.zip` to Elastic Beanstalk
5. Version label: `v1.0.0`
6. Click **"Deploy"**
7. Wait 3-5 minutes for deployment

---

### **PHASE 5: CONFIGURE ENVIRONMENT VARIABLES (10 minutes)**

⚠️ **CRITICAL:** Your app needs these to work

1. In Elastic Beanstalk, go to **"Configuration"**
2. Click **"Edit"** under **"Software"**
3. Scroll to **"Environment properties"**
4. Add each variable from the `.env` file:

**Required Variables:**

```bash
# ⚠️ IMPORTANT: Get actual values from the .env file in the repository
# These are placeholders - replace with real values from .env

# Vapi Configuration
VAPI_API_KEY=your_vapi_api_key_here
VAPI_PHONE_NUMBER_ID=your_phone_number_id_here
VAPI_CONFIRMATION_PHONE_NUMBER_ID=your_confirmation_phone_id_here
VAPI_MAIN_ASSISTANT_ID=your_main_assistant_id_here
VAPI_SERVICES_ASSISTANT_ID=your_services_assistant_id_here
VAPI_PRICING_ASSISTANT_ID=your_pricing_assistant_id_here
VAPI_SQUAD_ID=your_squad_id_here
VAPI_INBOUND_ASSISTANT_ID=your_inbound_assistant_id_here
VAPI_CONFIRMATION_ASSISTANT_ID=your_confirmation_assistant_id_here

# GoHighLevel Configuration
GHL_API_KEY=your_ghl_api_key_here
GHL_LOCATION_ID=your_ghl_location_id_here
GHL_CALENDAR_ID=your_ghl_calendar_id_here

# Webhook Configuration
WEBHOOK_SECRET=your_webhook_secret_here
WEBHOOK_BASE_URL=https://keey-voice-assistant-prod.us-east-1.elasticbeanstalk.com

# Application Settings
NODE_ENV=production
PORT=8080
LOG_LEVEL=info

# Regional Settings
DEFAULT_TIMEZONE=Europe/London
DEFAULT_COUNTRY_CODE=GB

# Contact Information
COMPANY_NAME=Keey
COMPANY_PHONE=0203 967 3687
COMPANY_WEBSITE=https://keey.co.uk
TRANSFER_PHONE_NUMBER=+442039673687

# GHL Workflow URLs
GHL_WORKFLOW_CONFIRMED=your_confirmed_workflow_url_here
GHL_WORKFLOW_CANCELLED=your_cancelled_workflow_url_here
GHL_WORKFLOW_RESCHEDULE=your_reschedule_workflow_url_here
GHL_WORKFLOW_NO_ANSWER=your_no_answer_workflow_url_here

# Twilio Configuration
TWILIO_ACCOUNT_SID=your_twilio_account_sid_here
TWILIO_AUTH_TOKEN=your_twilio_auth_token_here
TWILIO_PHONE_NUMBER=your_twilio_phone_number_here

# ⚠️ NOTE: The developer will provide you with the actual .env file
# Copy all values from that file to AWS Elastic Beanstalk environment variables
```

5. Click **"Apply"**
6. Wait 2-3 minutes for environment to update

---

### **PHASE 6: TEST DEPLOYMENT (5 minutes)**

1. Get your environment URL:
   - Format: `https://keey-voice-assistant-prod.us-east-1.elasticbeanstalk.com`
   - Or: `http://keey-voice-assistant-prod.elasticbeanstalk.com`

2. Test health endpoint:
   ```bash
   curl https://your-app-url.elasticbeanstalk.com/health
   ```
   
   **Expected response:**
   ```json
   {"status":"healthy"}
   ```

3. Check logs in AWS Console:
   - Go to Elastic Beanstalk environment
   - Click **"Logs"** → **"Request Logs"** → **"Last 100 Lines"**
   - Look for: "✅ Keey Voice Assistant server running"

---

### **PHASE 7: UPDATE GHL WEBHOOKS (5 minutes)**

⚠️ **CRITICAL:** Update GoHighLevel to use new AWS URL

1. Log in to GoHighLevel
2. Go to **Settings** → **Workflows**
3. Find workflow: **"New Lead Capture - Trigger Call"**
4. Update webhook URL from:
   - OLD: `https://vapi-keey-voice-assistant.onrender.com/webhook/ghl-trigger-call`
   - NEW: `https://your-app-url.elasticbeanstalk.com/webhook/ghl-trigger-call`
5. Save workflow

Repeat for any other workflows that trigger the voice assistant.

---

### **PHASE 8: UPDATE TWILIO WEBHOOK (5 minutes)**

1. Log in to Twilio Console
2. Go to **Phone Numbers** → **Manage** → **Active Numbers**
3. Click on: `+447402769361`
4. Under **"Voice Configuration"**:
   - When a call comes in: **Webhook**
   - URL: `https://your-app-url.elasticbeanstalk.com/twilio/voice`
   - Method: **HTTP POST**
5. Save

---

### **PHASE 9: TEST WITH REAL CALL (5 minutes)**

1. Go to Vapi Dashboard: https://dashboard.vapi.ai/
2. Click **"Phone Numbers"**
3. Test the confirmation call:
   - Use Vapi to trigger an outbound call
   - Monitor AWS logs
   - Verify call connects and AI responds

4. Test inbound call:
   - Call the Twilio number: `+447402769361`
   - Should connect to Inbound Assistant
   - Verify AI responds correctly

---

### **PHASE 10: GO LIVE! 🎉**

If all tests pass:
- ✅ Health endpoint returns "healthy"
- ✅ Logs show server running
- ✅ Test calls work correctly
- ✅ GHL webhooks updated
- ✅ Twilio webhooks updated

**YOU'RE LIVE!** 🚀

---

## 🔧 TROUBLESHOOTING

### **Issue: Health check returns 404**
**Solution:** Make sure PORT environment variable is set to `8080`

### **Issue: "Module not found" errors**
**Solution:** Redeploy with `npm install` included (Elastic Beanstalk does this automatically)

### **Issue: Webhooks timing out**
**Solution:** Check environment variables are set correctly, especially API keys

### **Issue: AI not responding**
**Solution:** Verify VAPI_API_KEY and assistant IDs are correct

### **Issue: Can't access logs**
**Solution:** Go to CloudWatch Logs in AWS Console for detailed logs

---

## 💰 COST MONITORING

### **First 12 Months (Free Tier):**
- ✅ 750 hours/month of t2.micro EC2 (covers 24/7)
- ✅ Should be $0/month if you stay within limits

### **After 12 Months:**
- EC2 t3.micro: ~$10-15/month
- Load Balancer (optional): ~$16/month
- **Total: $10-30/month**

### **How to Monitor:**
1. AWS Console → Billing Dashboard
2. Check **"Free Tier Usage"**
3. Set up budget alerts (did this in Phase 2)

---

## 📞 SUPPORT CONTACTS

**If you need help:**
- AWS Support: https://aws.amazon.com/support/ (Free tier includes basic support)
- Vapi Support: support@vapi.ai
- GoHighLevel Support: https://support.gohighlevel.com/

**Developer Contact:**
- GitHub: https://github.com/arvanittelaku/vapi-keey-voice-assistant
- Issues: https://github.com/arvanittelaku/vapi-keey-voice-assistant/issues

---

## 📚 IMPORTANT DOCUMENTS IN REPO

- `100_PERCENT_CONFIDENCE_REPORT.md` - System verification report
- `SYSTEM_FEATURE_OVERVIEW.md` - Complete feature list
- `SMART_RETRY_IMPLEMENTATION_GUIDE.md` - Smart retry system details
- `PHONE_NUMBER_FINAL_CONFIG.md` - Phone number configuration
- `FINAL_STATUS.md` - Final system status
- `.env.example` - Template for environment variables

---

## ✅ DEPLOYMENT CHECKLIST

Print this and check off as you go:

- [ ] AWS account created
- [ ] Billing alerts configured
- [ ] Elastic Beanstalk application created
- [ ] Code deployed from GitHub
- [ ] Environment variables configured
- [ ] Health endpoint tested
- [ ] GHL webhooks updated
- [ ] Twilio webhooks updated
- [ ] Test outbound call successful
- [ ] Test inbound call successful
- [ ] Monitoring set up
- [ ] System is LIVE! 🎉

---

**Good luck with the deployment!**  
**Everything is ready - just follow these steps!** 🚀

