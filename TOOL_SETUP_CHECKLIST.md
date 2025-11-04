# 🔧 Vapi Tools Setup Checklist

Complete these steps to finish your Keey Voice Assistant setup.

---

## ✅ **Step 1: Deploy Your Server to Get Public URL**

### Option A: Railway (Recommended for Production)

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Initialize project
railway init

# Deploy
railway up

# Get your URL
railway domain
```

Your URL will be like: `https://vapi-keey-voice-assistant-production.up.railway.app`

### Option B: ngrok (Quick for Testing)

```bash
# Start your local server
npm start

# In another terminal, start ngrok
ngrok http 3000
```

Your URL will be like: `https://abc123def.ngrok.io`

---

## ✅ **Step 2: Update .env with Public URL**

Add to your `.env` file:

```bash
# Webhook Configuration
WEBHOOK_BASE_URL=https://YOUR-PUBLIC-URL
WEBHOOK_SECRET=your_secure_random_string_here

# GHL Configuration (if not already set)
GHL_API_KEY=your_ghl_api_key
GHL_LOCATION_ID=your_ghl_location_id
GHL_CALENDAR_ID=your_ghl_calendar_id
```

---

## ✅ **Step 3: Update Your Vapi Tools**

### Tool 1: `check_calendar_availability_keey`

1. Go to https://dashboard.vapi.ai/tools
2. Click on `check_calendar_availability_keey`
3. **Update Server Settings:**

   - Server URL: `https://YOUR-PUBLIC-URL/webhook/vapi`
   - Timeout: `20` seconds

4. **Update Authorization Headers:**

   ```
   Authorization: Bearer YOUR_WEBHOOK_SECRET
   ngrok-skip-browser-warning: true
   ```

5. **Click "Save"**
6. **Copy the Tool ID** (from URL or tool page)

---

### Tool 2: `book_calendar_appointment_keey`

1. Click on `book_calendar_appointment_keey`
2. **Update Server Settings:**

   - Server URL: `https://YOUR-PUBLIC-URL/webhook/vapi`
   - Timeout: `20` seconds

3. **Update Authorization Headers:**

   ```
   Authorization: Bearer YOUR_WEBHOOK_SECRET
   ngrok-skip-browser-warning: true
   ```

4. **Click "Save"**
5. **Copy the Tool ID**

---

## ✅ **Step 4: Add Tools to Your Assistants**

1. Open `scripts/add-tools-to-assistants.js`
2. Replace these lines with your actual tool IDs:

   ```javascript
   const TOOL_IDS = {
     checkCalendar: "YOUR_CHECK_CALENDAR_TOOL_ID", // Paste your ID here
     bookAppointment: "YOUR_BOOK_APPOINTMENT_TOOL_ID", // Paste your ID here
   };
   ```

3. Run the script:

   ```bash
   npm run add-tools
   ```

4. Verify success ✅

---

## ✅ **Step 5: Restart Your Server**

```bash
# Stop current server (Ctrl+C)

# Start with new configuration
npm start
```

You should see:

```
✅ Keey Voice Assistant Server running on port 3000

📡 Webhook Endpoints:
   GHL Trigger: http://localhost:3000/webhook/ghl-trigger-call
   Vapi Functions: http://localhost:3000/webhook/vapi
   Test Endpoint: http://localhost:3000/test/trigger-call
   Health Check: http://localhost:3000/health
```

---

## ✅ **Step 6: Test the Tools**

### Test 1: Make a Test Call

```bash
# Use Postman or your GHL workflow to trigger a call
# The assistant should now be able to:
# - Check calendar availability
# - Book appointments
```

### Test 2: Check Logs

Watch your server console for:

```
🔔 VAPI FUNCTION CALL RECEIVED
🛠️  Function Called: check_calendar_availability_keey
✅ Function result: {...}
```

---

## 📋 **Quick Reference**

| What                     | Where                                |
| ------------------------ | ------------------------------------ |
| Tool Dashboard           | https://dashboard.vapi.ai/tools      |
| Assistant Dashboard      | https://dashboard.vapi.ai/assistants |
| Call Logs                | https://dashboard.vapi.ai/calls      |
| Your Server (local)      | http://localhost:3000                |
| Your Server (production) | YOUR_RAILWAY/NGROK_URL               |

---

## 🎯 **What Should Work After This**

✅ Assistant can check calendar availability  
✅ Assistant can book appointments  
✅ Contact data syncs to GHL  
✅ Appointments appear in GHL calendar  
✅ Squad transfers work seamlessly  
✅ Outbound calls triggered from GHL

---

## 🆘 **Troubleshooting**

### Tools Not Working?

1. Check server logs for function call events
2. Verify tool URLs point to your public URL
3. Confirm WEBHOOK_SECRET matches in both places
4. Test with: `curl https://YOUR-URL/webhook/vapi -X POST`

### Can't Add Tools to Assistants?

1. Verify tool IDs are correct
2. Check `.env` has correct assistant IDs
3. Ensure Vapi API key has permissions

### GHL Not Syncing?

1. Verify GHL_API_KEY in `.env`
2. Check GHL_LOCATION_ID is correct
3. Test GHL connection: `npm run test-ghl-integration`

---

## 🚀 **You're Almost Done!**

After completing these steps, your voice assistant will be **fully functional** with:

- Outbound calling
- Inbound call handling
- Calendar booking
- Contact management
- Squad transfers

**Need help?** Check the error logs and Vapi dashboard for detailed debugging info.
