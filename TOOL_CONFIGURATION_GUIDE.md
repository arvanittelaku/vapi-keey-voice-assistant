# 🔧 Vapi Tool Configuration Guide

## Current Status

You mentioned: "I created the tool, configured it"

This suggests you have a **Transfer Call** tool configured in Vapi Dashboard.

---

## How Vapi Transfer Call Tool Works

### Tool Type: Transfer Call (Built-in Vapi Function)

**Configuration in Vapi Dashboard:**
1. Go to Tools → Create Tool
2. Select "Transfer Call" type
3. Configure:
   - **Tool Name**: What the AI will call (e.g., `transferCall`)
   - **Description**: When to use this tool
   - **Assistant/Squad**: Where to transfer to
   - **Message**: What to say during transfer (you left blank - good!)

---

## PROBLEM: We Need 2 Separate Transfer Destinations

Your AI needs to transfer to:
1. **Services Assistant** - When asked about services
2. **Pricing Assistant** - When asked about pricing

### Solution A: Two Separate Transfer Tools (RECOMMENDED)

Create **TWO** transfer tools in Vapi Dashboard:

**Tool 1:**
- Name: `transferCall` or `transfer_to_services`
- Type: Transfer Call
- Destination: Services Assistant (ID: `${VAPI_SERVICES_ASSISTANT_ID}`)
- Description: "Transfer to Services specialist when customer asks about specific services, what services we offer, how services work, or service details"
- Attach to: Main Assistant, Pricing Assistant

**Tool 2:**
- Name: `transferCall` or `transfer_to_pricing`
- Type: Transfer Call  
- Destination: Pricing Assistant (ID: `${VAPI_PRICING_ASSISTANT_ID}`)
- Description: "Transfer to Pricing specialist when customer asks about costs, pricing, fees, packages, or how much services cost"
- Attach to: Main Assistant, Services Assistant

### Solution B: One Dynamic Transfer Tool with Assistant Parameter

Some Vapi plans support dynamic transfers where you pass assistant ID as parameter.

**If your tool supports parameters:**
- Name: `transferCall`
- Type: Transfer Call (with destination parameter)
- Parameters: 
  - `assistantId` or `destination`
- Attach to: All assistants

**Then update system prompts to:**
```
When customer asks about services: Use transferCall with destination="services"
When customer asks about pricing: Use transferCall with destination="pricing"
```

---

## RECOMMENDED: Check Your Current Tool Configuration

Go to Vapi Dashboard → Tools → transfer_call_keey

**What you need to know:**
1. Can this tool transfer to MULTIPLE destinations?
2. Or is it configured for ONE specific destination?
3. Does it accept a `destination` or `assistantId` parameter?

---

## SIMPLEST SOLUTION FOR NOW

### Create 2 Simple Transfer Tools:

**Tool 1: transfer_services**
```
Type: Transfer Call
Destination: Services Assistant
Description: Transfer to Services specialist
Attached to: Main Assistant
```

**Tool 2: transfer_pricing**
```
Type: Transfer Call
Destination: Pricing Assistant
Description: Transfer to Pricing specialist
Attached to: Main Assistant
```

Then I'll update system prompts to use `transfer_services` and `transfer_pricing`.

---

## What About create_contact Tool?

### Question: Do you want INBOUND call support?

**Scenario 1: OUTBOUND ONLY** (Current Implementation)
- GHL creates contact → Workflow triggers → Vapi calls contact
- Contact data already in GHL
- AI doesn't need to create contacts
- **Action**: Remove `create_contact` from system prompts

**Scenario 2: INBOUND + OUTBOUND** (Full Support)
- Inbound: Customer calls → AI collects info → Creates contact in GHL
- Outbound: GHL triggers → Vapi calls existing contact
- **Action**: Keep `create_contact` and create tool in Vapi Dashboard

### Recommendation:
Start with **OUTBOUND ONLY** (simpler, fewer tools, lower cost per call)

You can add inbound support later if needed.

---

## Action Items for You

### Before Next Steps:

1. **Check Vapi Dashboard** - Go to Tools section
   - How many transfer tools do you have?
   - What are they named?
   - What destinations are configured?

2. **Decide on Inbound Calls**
   - Do you want customers to call YOU?
   - Or only outbound calls TO customers?

3. **Share Screenshots** (optional)
   - Tool list from Vapi Dashboard
   - Tool configuration details
   - Assistant tool attachments

### I'll Then:
1. Update system prompts to match your EXACT tool configuration
2. Remove unnecessary tool references
3. Ensure 100% match between prompts and Vapi setup

---

## Current Tool Status

✅ `check_calendar_availability_keey` - Working (tested via Postman)
✅ `book_calendar_appointment_keey` - Working (tested via Postman)
❓ `transfer_call_keey` - Exists but configuration unknown
❓ `create_contact` - Unknown if exists

---

*Waiting for your confirmation on tool setup before updating prompts*

