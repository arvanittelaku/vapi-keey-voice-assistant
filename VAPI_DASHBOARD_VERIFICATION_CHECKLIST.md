# 🔍 Vapi Dashboard Verification Checklist

**Complete this BEFORE making any test calls to ensure 95%+ confidence**

---

## 📋 STEP-BY-STEP VERIFICATION

### ✅ Step 1: Phone Number Configuration

**Location**: Vapi Dashboard → Phone Numbers

1. [ ] Find phone number: `+1 213-672-1526`
2. [ ] Click on it to view settings
3. [ ] **Check**: Is a user assigned to this number?
   - If NO → Assign user now
4. [ ] **Check**: What is the "Ring Timeout" or "Call Timeout" setting?
   - If `0` or empty → Change to `30` seconds
5. [ ] **Check**: What is this number assigned to?
   - Should be: Squad (`Keey Squad`) OR Main Assistant
   - Take screenshot for reference

**Screenshot Checklist**:
- [ ] Take screenshot showing user assignment
- [ ] Take screenshot showing timeout setting
- [ ] Take screenshot showing squad/assistant assignment

---

### ✅ Step 2: Squad Configuration

**Location**: Vapi Dashboard → Squads → Keey Squad

1. [ ] Verify squad exists
2. [ ] **Check members**:
   - [ ] Main Assistant is listed
   - [ ] Services Assistant is listed
   - [ ] Pricing Assistant is listed
3. [ ] **Check default/entry assistant**:
   - Should be: Main Assistant (first contact point)
4. [ ] Take screenshot of squad configuration

---

### ✅ Step 3: Main Assistant - Tool Attachments

**Location**: Vapi Dashboard → Assistants → Keey Main Assistant

1. [ ] Click "Edit" or view assistant details
2. [ ] Find "Tools" section
3. [ ] **Verify these tools are attached**:
   - [ ] Transfer Call tool (name: `transfer_call_keey` or `transferCall`)
   - [ ] Calendar Availability tool (name: `check_calendar_availability_keey` or similar)
   - [ ] Book Appointment tool (name: `book_calendar_appointment_keey` or similar)

4. [ ] **For EACH tool, record**:
   - Tool 1 Name: ________________
   - Tool 2 Name: ________________
   - Tool 3 Name: ________________

5. [ ] Take screenshot showing all attached tools

**CRITICAL**: Write down the EXACT tool names. We need these to match our code.

---

### ✅ Step 4: Services Assistant - Tool Attachments

**Location**: Vapi Dashboard → Assistants → Keey Services Specialist

1. [ ] Click "Edit" or view assistant details
2. [ ] **Verify these tools are attached**:
   - [ ] Transfer Call tool (for transferring to Pricing)
   - [ ] Calendar Availability tool
   - [ ] Book Appointment tool

3. [ ] Take screenshot showing all attached tools

---

### ✅ Step 5: Pricing Assistant - Tool Attachments

**Location**: Vapi Dashboard → Assistants → Keey Pricing Specialist

1. [ ] Click "Edit" or view assistant details
2. [ ] **Verify these tools are attached**:
   - [ ] Transfer Call tool (for transferring to Services)
   - [ ] Calendar Availability tool
   - [ ] Book Appointment tool

3. [ ] Take screenshot showing all attached tools

---

### ✅ Step 6: Transfer Call Tool Configuration

**Location**: Vapi Dashboard → Tools → Transfer Call Tool

1. [ ] Find your transfer tool (name: `transfer_call_keey` or similar)
2. [ ] Click to view configuration
3. [ ] **Check tool type**: Should be "Transfer Call" (Vapi built-in)
4. [ ] **IMPORTANT - Check transfer destination**:
   - Can this tool transfer to MULTIPLE destinations?
   - Or is it fixed to ONE destination?

**If ONE transfer tool for all transfers**:
- [ ] Does it accept a parameter to specify destination?
- [ ] What parameter name? ________________

**If you have SEPARATE transfer tools**:
- [ ] Tool for Services transfer: ________________ (name)
- [ ] Tool for Pricing transfer: ________________ (name)

5. [ ] Take screenshot of transfer tool configuration

**CRITICAL QUESTION**: 
- Do you have ONE transfer tool or TWO separate ones?
- Answer: ________________

---

### ✅ Step 7: Calendar Tool Configuration

**Location**: Vapi Dashboard → Tools → Calendar Availability Tool

1. [ ] Find calendar tool (name: `check_calendar_availability_keey` or similar)
2. [ ] **Check tool type**: Should be "Server Function" or "Custom Function"
3. [ ] **Check Server URL**: Should be:
   ```
   https://vapi-keey-voice-assistant-production.up.railway.app/webhook/vapi
   ```
4. [ ] **Verify it matches EXACTLY** (no trailing slash, correct domain)
5. [ ] Take screenshot

---

### ✅ Step 8: Booking Tool Configuration

**Location**: Vapi Dashboard → Tools → Book Appointment Tool

1. [ ] Find booking tool (name: `book_calendar_appointment_keey` or similar)
2. [ ] **Check Server URL**: Should be:
   ```
   https://vapi-keey-voice-assistant-production.up.railway.app/webhook/vapi
   ```
3. [ ] **Verify it matches EXACTLY**
4. [ ] Take screenshot

---

### ✅ Step 9: Assistant System Prompts

**Location**: Vapi Dashboard → Assistants

**Main Assistant**:
1. [ ] Open Main Assistant
2. [ ] View "System Prompt" section
3. [ ] **Verify it includes**: "For OUTBOUND calls: You will have access to the caller's firstName"
4. [ ] Take screenshot of first 10 lines of system prompt

**Services Assistant**:
1. [ ] Open Services Assistant
2. [ ] **Verify system prompt starts with**: "You are a services specialist for Keey"
3. [ ] Take screenshot

**Pricing Assistant**:
1. [ ] Open Pricing Assistant
2. [ ] **Verify system prompt starts with**: "You are a pricing specialist for Keey"
3. [ ] Take screenshot

---

### ✅ Step 10: Voice Settings

**All Three Assistants**:

1. [ ] Main Assistant - Voice Provider: _________ Voice ID: _________
2. [ ] Services Assistant - Voice Provider: _________ Voice ID: _________
3. [ ] Pricing Assistant - Voice Provider: _________ Voice ID: _________

**VERIFY**: All three should use the SAME voice
- Expected: OpenAI Alloy (or same voice for all)
- If different → Update to match

---

## 📊 VERIFICATION SUMMARY

After completing all steps above, fill this out:

### Tools Attached to Main Assistant:
1. ________________ (tool name)
2. ________________ (tool name)
3. ________________ (tool name)

### Tools Attached to Services Assistant:
1. ________________ (tool name)
2. ________________ (tool name)
3. ________________ (tool name)

### Tools Attached to Pricing Assistant:
1. ________________ (tool name)
2. ________________ (tool name)
3. ________________ (tool name)

### Transfer Configuration:
- Number of transfer tools: _____ (1 or 2?)
- Transfer tool name(s): _________________
- Can transfer to multiple destinations?: _____ (Yes/No)

### Server URLs (All Should Match):
- Calendar Tool URL: _________________
- Booking Tool URL: _________________
- Expected URL: `https://vapi-keey-voice-assistant-production.up.railway.app/webhook/vapi`
- [ ] URLs match exactly ✅

### Phone Number Settings:
- User assigned: _____ (Yes/No)
- Timeout setting: _____ seconds
- Assigned to: _____ (Squad/Assistant)

---

## 🚨 COMMON ISSUES TO FIX

### Issue 1: No User Assigned to Phone
**Symptom**: Phone number shows "No user assigned"
**Fix**: Assign your user account to this number

### Issue 2: Timeout is 0
**Symptom**: "Ring timeout: 0 seconds" or empty
**Fix**: Set to 30-60 seconds

### Issue 3: Different Voices
**Symptom**: Assistants use different voices (e.g., "Alloy" vs "Nova")
**Fix**: Change all to use the same voice (Alloy)

### Issue 4: Server URLs Don't Match
**Symptom**: Tool URLs point to old domain or localhost
**Fix**: Update to Railway URL: `https://vapi-keey-voice-assistant-production.up.railway.app/webhook/vapi`

### Issue 5: Tools Not Attached
**Symptom**: Tool list is empty or missing tools
**Fix**: Manually attach tools to each assistant

### Issue 6: Only 1 Transfer Tool for 2 Destinations
**Symptom**: One transfer tool but needs to go to Services AND Pricing
**Fix Option A**: Create second transfer tool
**Fix Option B**: Configure dynamic transfer with parameters (if supported)

---

## ✅ WHEN ALL CHECKS PASS

If you complete this checklist and everything matches:

**Confidence Level**: 95%+ 🎯

**What's verified**:
- ✅ Phone number configured
- ✅ Squad structure correct
- ✅ All tools attached to all assistants
- ✅ Tool server URLs pointing to Railway
- ✅ System prompts deployed
- ✅ Voice settings consistent
- ✅ Transfer tools configured

**What's NOT verified** (requires test call):
- ❌ Voice behavior in real conversation
- ❌ Tool execution timing during call
- ❌ Actual transfer experience
- ❌ AI prompt following in practice

**Next Step**: Make ONE 30-second test call to verify greeting
- Cost: $0.02-0.05
- Risk: Very low
- Benefit: Confirms everything works end-to-end

---

## 📸 SCREENSHOT CHECKLIST

Send these screenshots (you can blur sensitive info):

1. [ ] Phone number settings page
2. [ ] Squad configuration page
3. [ ] Main Assistant - tools section
4. [ ] Services Assistant - tools section
5. [ ] Pricing Assistant - tools section
6. [ ] Transfer tool configuration
7. [ ] Calendar tool - server URL
8. [ ] Booking tool - server URL

**Optional but helpful**:
- System prompt first 10 lines (Main Assistant)
- Voice settings for all assistants

---

*Complete this checklist and we'll know if everything is configured correctly BEFORE making expensive test calls!*





