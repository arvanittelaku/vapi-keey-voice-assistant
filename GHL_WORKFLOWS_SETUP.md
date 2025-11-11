# GHL Workflows Setup Guide - Phase 3
## Automatic Actions Based on Confirmation Outcome

---

## 🎯 Overview

After a confirmation call completes, the system will automatically trigger different GHL workflows based on what happened:

| Status | Workflow Triggered | Actions |
|--------|-------------------|---------|
| **Confirmed** ✅ | Confirmation Success | Send SMS confirmation, add positive tag |
| **Cancelled** ❌ | Cancellation Follow-up | Send rebooking email, add to re-engagement workflow |
| **Reschedule** 🔄 | Reschedule Success | Send new appointment confirmation |
| **No Answer** 📞 | No Answer Follow-up | Send SMS reminder, schedule retry call |

---

## 📋 Workflows to Create in GHL

### 1. Confirmed Appointment Workflow ✅

**Workflow Name:** `Confirmation - Appointment Confirmed`

**Trigger:** Manual (triggered by API)

**Actions:**

1. **Send SMS** (Immediate)
   ```
   Hi {{contact.first_name}}, 
   
   Your appointment with Keey is confirmed for {{custom_values.appointmentTime}}. 
   
   We're looking forward to speaking with you!
   
   If you need to reschedule, call us at 0203 967 3687.
   
   - Keey Team
   ```

2. **Add Tag** (Immediate)
   - Tag: `Appointment Confirmed`

3. **Optional: Send Email** (Immediate)
   - Subject: `Your Keey Consultation is Confirmed`
   - Body: Confirmation details with calendar invite

4. **Optional: Add to Calendar** (if not already done)
   - Ensure appointment is marked as "confirmed" status

**When to Use:**
- Customer answers call and confirms they can attend
- After customer says "yes" to the confirmation question

---

### 2. Cancelled Appointment Workflow ❌

**Workflow Name:** `Confirmation - Appointment Cancelled`

**Trigger:** Manual (triggered by API)

**Actions:**

1. **Add Tag** (Immediate)
   - Tag: `Appointment Cancelled`
   - Remove Tag: `Appointment Confirmed` (if exists)

2. **Send Rebooking Email** (5 minutes delay)
   ```
   Subject: Let's Find a Better Time - Keey

   Hi {{contact.first_name}},

   We understand things come up! We'd still love to speak with you about how Keey can help with your property.

   📅 Book a new time that works for you:
   [Your GHL Calendar Booking Link]

   Or call us directly at 0203 967 3687.

   Looking forward to connecting soon!

   - The Keey Team
   ```

3. **Add to Re-engagement Workflow** (1 hour delay)
   - Start nurture sequence
   - Follow-up reminders

4. **Optional: Notify Team** (Immediate)
   - Send Slack notification or email to sales team
   - Include cancellation reason if provided

**When to Use:**
- Customer says they cannot attend and don't want to reschedule immediately
- Customer explicitly requests cancellation

---

### 3. Rescheduled Appointment Workflow 🔄

**Workflow Name:** `Confirmation - Appointment Rescheduled`

**Trigger:** Manual (triggered by API)

**Actions:**

1. **Add Tag** (Immediate)
   - Tag: `Appointment Rescheduled`

2. **Send New Appointment Confirmation** (Immediate)
   ```
   Hi {{contact.first_name}},
   
   Perfect! Your appointment has been rescheduled.
   
   📅 New Date & Time: {{custom_values.newAppointmentTime}}
   
   You'll receive a calendar invite shortly.
   
   See you then!
   
   - Keey Team
   ```

3. **Optional: Send Calendar Invite** (Immediate)
   - For new appointment time

4. **Optional: Update CRM** (Immediate)
   - Log activity: "Appointment rescheduled"
   - Update custom field with new time

**When to Use:**
- After AI successfully reschedules appointment during call
- New appointment is booked and old one is cancelled

---

### 4. No Answer Workflow 📞

**Workflow Name:** `Confirmation - No Answer`

**Trigger:** Manual (triggered by API)

**Actions:**

1. **Send SMS** (Immediate)
   ```
   Hi {{contact.first_name}},
   
   We tried calling about your appointment with Keey today at {{custom_values.appointmentTime}}.
   
   Reply YES to confirm or RESCHEDULE to pick a new time.
   
   Or call us: 0203 967 3687
   
   - Keey Team
   ```

2. **Wait** (30 minutes)

3. **Check if Confirmed** (Conditional)
   - If still not confirmed → Proceed to next step
   - If confirmed → End workflow

4. **Try Calling Again** (30 min before appointment)
   - Trigger another confirmation call

5. **If Still No Answer** (1 hour after missed call)
   - **Notify Team**
   - Send internal alert about unconfirmed appointment
   - Consider appointment as "at risk"

**When to Use:**
- Call goes to voicemail
- Customer doesn't pick up
- Phone number not reachable

---

## 🔧 Setup Instructions

### Step 1: Create Workflows in GHL

**For each workflow above:**

1. Go to **Automations** → **Workflows** in GHL
2. Click **Create Workflow**
3. Name it (use names from above)
4. Set **Trigger** to "Manual" (we'll trigger via API)
5. Add **Actions** as described above
6. **IMPORTANT: Publish the workflow** (not draft!)
7. Copy the **Workflow ID** from the URL

**Example Workflow URL:**
```
https://app.gohighlevel.com/v2/location/YOUR_LOCATION/workflows/WORKFLOW_ID_HERE
```

Copy the `WORKFLOW_ID_HERE` part.

---

### Step 2: Add Workflow IDs to Environment Variables

#### Local `.env` File

Add these lines to your `.env` file:

```env
# GHL Workflow IDs for Confirmation Assistant
GHL_WORKFLOW_CONFIRMED=your_confirmed_workflow_id_here
GHL_WORKFLOW_CANCELLED=your_cancelled_workflow_id_here
GHL_WORKFLOW_RESCHEDULE=your_reschedule_workflow_id_here
GHL_WORKFLOW_NO_ANSWER=your_no_answer_workflow_id_here
```

#### Render Environment Variables

1. Go to **Render Dashboard** → Your Service
2. Go to **Environment** tab
3. Add these variables:

| Key | Value |
|-----|-------|
| `GHL_WORKFLOW_CONFIRMED` | Your confirmed workflow ID |
| `GHL_WORKFLOW_CANCELLED` | Your cancelled workflow ID |
| `GHL_WORKFLOW_RESCHEDULE` | Your reschedule workflow ID |
| `GHL_WORKFLOW_NO_ANSWER` | Your no answer workflow ID |

4. Click **Save Changes**
5. Service will auto-redeploy

---

### Step 3: Test Workflow Triggering

Once workflows are created and IDs are added:

#### Test Locally:
```bash
# This will test workflow triggering
npm run test-all-tools
```

#### Test on Production:
1. Trigger a test confirmation call
2. Check GHL workflow history
3. Verify actions executed (SMS sent, tags added, etc.)

---

## 📊 Workflow Testing Checklist

### Before Going Live:

- [ ] All 4 workflows created in GHL
- [ ] All workflows **Published** (not draft)
- [ ] Workflow IDs copied correctly
- [ ] Environment variables added locally
- [ ] Environment variables added to Render
- [ ] Render service redeployed
- [ ] Test workflow triggering with test tools
- [ ] Verify SMS sent (if configured)
- [ ] Verify tags added correctly
- [ ] Verify emails sent (if configured)

---

## 🎨 Customization Options

### SMS Templates

You can customize the SMS messages in each workflow to match your brand voice. Keep them:
- Short (under 160 characters for single SMS)
- Clear and actionable
- Include contact information
- Friendly but professional

### Email Templates

For email workflows, you can:
- Use GHL's email builder
- Add your branding/logo
- Include calendar booking links
- Add tracking pixels

### Actions You Can Add

Beyond SMS and tags, you can add:
- **Slack Notifications** - Alert your team
- **Webhooks** - Integrate with other tools
- **Update Custom Fields** - Track additional data
- **Add to Campaigns** - Start email sequences
- **Assign to User** - Route to specific team members

---

## 🔍 Monitoring & Analytics

### Check Workflow Performance:

1. **GHL Workflow History**
   - Go to Automations → Workflows
   - Click on workflow → History tab
   - See all triggers and executions

2. **Render Server Logs**
   - Check for workflow trigger messages
   - Look for: `🔔 Triggering workflow for status: confirmed`
   - Verify no errors

3. **Contact Timeline**
   - Open contact in GHL
   - Check timeline for workflow actions
   - Verify SMS/emails sent

---

## ⚠️ Troubleshooting

### Workflow Not Triggering

**Symptoms:** No workflow shows in history, no actions executed

**Checks:**
1. Is workflow **Published**? (Not draft)
2. Is workflow ID correct in environment variables?
3. Are environment variables loaded? (Check Render logs)
4. Is API key valid and has workflow permissions?

### Workflow Triggers but Actions Don't Execute

**Symptoms:** Workflow appears in history but no SMS/email sent

**Checks:**
1. Are SMS/Email services enabled in GHL?
2. Is phone number/email valid in contact?
3. Check workflow action configuration
4. Check GHL sending limits

### Wrong Workflow Triggered

**Symptoms:** Confirmed status triggers cancelled workflow

**Checks:**
1. Verify workflow IDs match correct workflows
2. Check environment variable names (exact spelling)
3. Check Render deployment (may need to re-deploy)

---

## 💡 Pro Tips

### 1. Start Simple
- Begin with just SMS for confirmed/cancelled
- Add complexity (emails, campaigns) later
- Test each workflow individually

### 2. Use Workflow Folders
- Organize workflows: "Confirmation System" folder
- Easier to manage and find

### 3. Monitor Initially
- First week: Check every workflow trigger
- Look for patterns or issues
- Adjust messaging based on responses

### 4. A/B Test Messages
- Create duplicate workflows with different messages
- Test which gets better response rates
- Optimize over time

---

## 📝 Workflow ID Reference

Keep this updated as you create workflows:

```
✅ Confirmed Workflow ID: _____________________
❌ Cancelled Workflow ID: _____________________
🔄 Reschedule Workflow ID: _____________________
📞 No Answer Workflow ID: _____________________
```

---

## ✅ Phase 3 Complete When:

- [x] Code deployed with workflow triggering
- [ ] All 4 workflows created in GHL
- [ ] Workflow IDs added to environment variables
- [ ] Tested workflow triggering
- [ ] SMS/emails sending correctly
- [ ] Team trained on monitoring

---

**Status:** Code Ready - Workflows Setup Required
**Next Action:** Create workflows in GHL and add IDs to environment variables

