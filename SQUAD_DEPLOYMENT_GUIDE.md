# Keey Voice Assistant - Squad Deployment Guide

## 🎯 What is a Vapi Squad?

A **Squad** in Vapi is a group of AI assistants that work together as a team. When you use a squad:

✅ **One phone number** routes to multiple specialized agents
✅ **Seamless transfers** between agents automatically handled
✅ **Same voice** maintained across all agents (user doesn't notice switches)
✅ **Centralized management** of the entire voice assistant system

---

## 🏗️ Keey Squad Architecture

```
📞 Incoming Call
    ↓
┌─────────────────────────────────────┐
│   KEEY PROPERTY MANAGEMENT SQUAD    │
├─────────────────────────────────────┤
│                                     │
│  🤖 Main Assistant (Entry Point)   │
│     ├──→ Company info               │
│     ├──→ Lead qualification         │
│     ├──→ Appointment booking        │
│     └──→ Routes to specialists      │
│          ↓                ↓         │
│    ┌──────────┐    ┌──────────┐   │
│    │ Services │    │ Pricing  │   │
│    │  Agent   │ ←→ │  Agent   │   │
│    └──────────┘    └──────────┘   │
│                                     │
└─────────────────────────────────────┘
```

---

## 🚀 Quick Deployment

### Step 1: Ensure Your .env is Configured

Make sure you have at least:

```env
VAPI_API_KEY=your_actual_vapi_key_here
WEBHOOK_BASE_URL=https://your-domain.com
WEBHOOK_SECRET=your_webhook_secret
```

**Note**: You DON'T need GHL credentials yet for squad creation. They're only needed when the assistants make function calls during actual conversations.

### Step 2: Deploy the Squad

Run this single command:

```bash
npm run deploy-squad
```

This will:
1. ✅ Create the Main Assistant
2. ✅ Create the Services Assistant
3. ✅ Create the Pricing Assistant
4. ✅ Create the Squad linking all three together
5. ✅ Set up automatic transfer routes between agents

### Step 3: Copy the IDs

After deployment, you'll see output like:

```
📋 ASSISTANT IDs:
Main Assistant:     asst_abc123...
Services Assistant: asst_def456...
Pricing Assistant:  asst_ghi789...

📋 SQUAD ID:
Squad: squad_xyz123...

⚠️  IMPORTANT: Add these to your .env file:
VAPI_MAIN_ASSISTANT_ID=asst_abc123...
VAPI_SERVICES_ASSISTANT_ID=asst_def456...
VAPI_PRICING_ASSISTANT_ID=asst_ghi789...
VAPI_SQUAD_ID=squad_xyz123...
```

**Copy these IDs** and add them to your `.env` file.

### Step 4: Configure Your Phone Number

1. Go to **[Vapi Dashboard](https://dashboard.vapi.ai)**
2. Navigate to **Phone Numbers**
3. Select your phone number
4. Under **"Assistant"**, select **"Squad"** (not individual assistant)
5. Choose your **"Keey Property Management Squad"**
6. Click **Save**

**IMPORTANT**: Assign the phone number to the **SQUAD**, not to individual assistants!

### Step 5: Test!

Call your Vapi phone number and test:

**Test 1 - Main Assistant:**
- Call the number
- AI: "Thank you for calling Keey. How can I help you?"
- You: "I want to learn about property management"
- ✅ Main assistant handles the conversation

**Test 2 - Transfer to Services:**
- You: "Can you tell me more about your services?"
- ✅ Seamlessly transfers to Services specialist
- ✅ Same voice continues (user doesn't notice transfer)

**Test 3 - Transfer to Pricing:**
- You: "How much does it cost?"
- ✅ Seamlessly transfers to Pricing specialist
- ✅ Same voice continues

---

## 📋 What Gets Created

### 1. Main Assistant
- **Name**: Keey Main Assistant
- **Role**: Entry point, lead qualification, routing
- **Can transfer to**: Services, Pricing
- **Functions**: create_contact, check_calendar_availability, book_appointment

### 2. Services Assistant
- **Name**: Keey Services Specialist
- **Role**: Detailed service information
- **Can transfer to**: Main, Pricing
- **Knowledge**: All 13+ Keey services in detail

### 3. Pricing Assistant
- **Name**: Keey Pricing Specialist
- **Role**: Pricing information, ROI calculations
- **Can transfer to**: Main, Services
- **Knowledge**: All pricing details, packages, examples

### 4. The Squad
- **Name**: Keey Property Management Squad
- **Purpose**: Orchestrates all three assistants
- **Transfer Routes**: Automatically configured
- **Phone Assignment**: This is what you assign to your phone number

---

## 🔄 How Transfers Work

### Automatic Routing

When a user says something like:
- "Tell me about your services" → Transfers to Services Agent
- "How much does it cost?" → Transfers to Pricing Agent
- "Can you book me a consultation?" → Stays with Main Agent

### Transfer Messages

Users hear smooth transition messages:
- To Services: *"Transferring you to our services specialist who can provide detailed information..."*
- To Pricing: *"Let me connect you with our pricing specialist who can discuss costs and packages..."*
- Back to Main: *"Let me transfer you back to continue with your inquiry..."*

### Voice Consistency

All agents use the **same voice** (OpenAI Alloy), so transfers are seamless and professional.

---

## ⚙️ Configuration Details

### Squad Members

Each member has:
- **Assistant**: The actual AI assistant
- **Assistant Destinations**: Where this agent can transfer to
- **Transfer Message**: What the user hears during transfer
- **Description**: For Vapi dashboard visibility

### Transfer Routes

```
Main Assistant can transfer to:
├─→ Services Assistant
└─→ Pricing Assistant

Services Assistant can transfer to:
├─→ Main Assistant
└─→ Pricing Assistant

Pricing Assistant can transfer to:
├─→ Main Assistant
└─→ Services Assistant
```

This creates a fully connected system where any agent can reach any other agent if needed.

---

## 🆘 Troubleshooting

### "401 Unauthorized" Error
**Problem**: Invalid Vapi API key

**Solution**:
1. Check `.env` has correct `VAPI_API_KEY`
2. Use the **Private/Server Key** (not Public Key)
3. Verify key is active in Vapi dashboard
4. Make sure you have credits in your Vapi account

### "Assistant creation failed"
**Problem**: Configuration issue

**Solution**:
1. Check `WEBHOOK_BASE_URL` is set correctly
2. Verify webhook URL is publicly accessible
3. Review error message for specific details

### "Squad not showing in phone number dropdown"
**Problem**: Squad not created or dashboard not refreshed

**Solution**:
1. Verify squad deployment completed successfully
2. Refresh Vapi dashboard (Ctrl+F5 or Cmd+Shift+R)
3. Check "Squads" section in Vapi dashboard to confirm it exists
4. Try logging out and back in to Vapi dashboard

### "Transfers not working during calls"
**Problem**: Squad might not be properly configured

**Solution**:
1. Verify phone number is assigned to **Squad** (not individual assistant)
2. Check squad members all have correct assistant IDs
3. Test transfer phrases: "tell me about your services" or "how much does it cost?"
4. Review call logs in Vapi dashboard for error messages

---

## 📊 Managing Your Squad

### View Squad Details

To see your squad configuration:
```bash
# Add this script if you want to inspect the squad
node -e "const VapiClient = require('./src/services/vapi-client'); require('dotenv').config(); new VapiClient().getSquad(process.env.VAPI_SQUAD_ID).then(console.log)"
```

### Update Squad Configuration

If you need to update the squad (e.g., change transfer messages):

1. Edit `scripts/deploy-squad.js`
2. Add check for existing squad ID
3. Use `updateSquad()` instead of `createSquad()`

### Delete and Recreate

If you want to start fresh:

```bash
# In Vapi dashboard:
# 1. Go to Squads
# 2. Delete "Keey Property Management Squad"
# 3. Go to Assistants
# 4. Delete all three Keey assistants
# 5. Run: npm run deploy-squad
```

---

## 🎯 Best Practices

### Do's ✅
- **Assign phone number to the Squad** (not individual assistants)
- **Test all transfer routes** after deployment
- **Use the same voice** across all assistants for consistency
- **Keep transfer messages brief** and natural
- **Update all three assistants together** when making changes

### Don'ts ❌
- **Don't assign phone to individual assistants** (defeats the purpose)
- **Don't use different voices** for different agents (breaks immersion)
- **Don't overcomplicate transfer logic** (keep it simple)
- **Don't forget to update .env** with squad and assistant IDs

---

## 🔧 Advanced Configuration

### Adding More Agents

To add a 4th agent (e.g., "Franchise Specialist"):

1. Create assistant configuration in `src/config/franchise-assistant-config.js`
2. Update `scripts/deploy-squad.js`:
   - Add franchise assistant creation
   - Add it to squad members array
   - Configure transfer routes
3. Redeploy: `npm run deploy-squad`

### Custom Transfer Logic

To customize when transfers happen:

1. Edit the system prompts in `src/config/` files
2. Add specific trigger phrases for transfers
3. Update transfer destination messages
4. Test thoroughly

### Multi-Language Support

To add Arabic support for Dubai:

1. Create Arabic versions of assistant configs
2. Use language detection in Main Assistant
3. Transfer to appropriate language squad
4. Or create separate squads per language

---

## 📞 Testing Checklist

After deployment, test:

- [ ] Call connects successfully
- [ ] Main assistant greets appropriately
- [ ] Can transfer to Services by asking about services
- [ ] Voice stays consistent during Services transfer
- [ ] Can transfer to Pricing by asking about costs
- [ ] Voice stays consistent during Pricing transfer
- [ ] Can transfer back to Main from sub-agents
- [ ] Information collection works (name, email, etc.)
- [ ] Appointment booking works
- [ ] Call ends gracefully

---

## 📚 Additional Resources

- **Vapi Squad Docs**: https://docs.vapi.ai/squads
- **Vapi Dashboard**: https://dashboard.vapi.ai
- **Project README**: See README.md for full technical docs
- **Quick Start Guide**: See QUICK_START_GUIDE.md for setup

---

## ✨ Summary

**What you've deployed**:
- ✅ One unified Squad managing three specialized agents
- ✅ Automatic transfer routing between agents
- ✅ Seamless voice consistency across all agents
- ✅ Professional transfer messages
- ✅ Scalable architecture for future expansion

**Next steps**:
1. Add Squad and Assistant IDs to your `.env`
2. Assign your phone number to the Squad in Vapi dashboard
3. Test all conversation flows
4. Monitor and optimize based on real calls

**Your Keey Voice Assistant Squad is ready to handle calls!** 🎉

---

**Need help?** 
- Check the troubleshooting section above
- Review Vapi documentation
- Examine call logs in Vapi dashboard
- Test with simple phrases first, then complex scenarios

