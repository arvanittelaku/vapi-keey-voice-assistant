# Keey Voice Assistant System

Comprehensive AI voice assistant system for Keey Airbnb Property Management, powered by Vapi AI and integrated with GoHighLevel CRM.

## Overview

This system consists of three specialized AI voice assistants:

1. **Main Assistant** - Company information, lead qualification, appointment booking
2. **Services Sub-Agent** - Detailed information about all Keey services
3. **Pricing Sub-Agent** - Transparent pricing information and ROI calculations

## Features

### Inbound Call Handling
- ✅ Lead qualification and information collection
- ✅ Calendar availability checking
- ✅ Appointment booking directly in GHL
- ✅ Contact creation/update in CRM
- ✅ Regional handling (London & Dubai)
- ✅ Seamless agent transfers

### Outbound Call Handling
- ✅ Educational calls about Keey services
- ✅ Follow-up calls to warm leads
- ✅ Service and pricing information delivery
- ✅ Consultation booking

### CRM Integration
- ✅ GoHighLevel contact management
- ✅ Real-time calendar availability checking
- ✅ Automated appointment booking
- ✅ Call data and transcript logging
- ✅ Custom field population

## Project Structure

```
keey-voice-assistant/
├── src/
│   ├── config/
│   │   ├── main-assistant-config.js      # Main assistant configuration
│   │   ├── services-assistant-config.js  # Services sub-agent config
│   │   └── pricing-assistant-config.js   # Pricing sub-agent config
│   ├── services/
│   │   ├── vapi-client.js               # Vapi API client
│   │   └── ghl-client.js                # GoHighLevel API client
│   ├── webhooks/
│   │   └── vapi-webhook.js              # Webhook handler for function calls
│   └── index.js                         # Express server entry point
├── scripts/
│   ├── deploy-main-assistant.js         # Deploy main assistant
│   ├── deploy-services-assistant.js     # Deploy services sub-agent
│   ├── deploy-pricing-assistant.js      # Deploy pricing sub-agent
│   ├── create-vapi-tools.js             # Create Vapi function tools
│   ├── test-webhook.js                  # Test webhook endpoints
│   └── test-ghl.js                      # Test GHL integration
├── knowledge-base/
│   ├── Company_Overview.txt             # Company information and benefits
│   ├── Services_Detailed.txt            # All services explained
│   ├── Pricing_Details.txt              # Pricing structure and packages
│   ├── FAQ.txt                          # Frequently asked questions
│   └── Regional_Information.txt         # London & Dubai market info
├── .env.example                         # Environment variables template
├── package.json                         # Node.js dependencies
└── README.md                            # This file
```

## Setup Instructions

### 1. Prerequisites

- Node.js 18+ and npm 9+
- Vapi AI account with API key
- GoHighLevel account with API access
- Domain or ngrok for webhook URL

### 2. Installation

```bash
# Clone the repository
git clone https://github.com/arvanittelaku/vapi-keey-voice-assistant.git
cd vapi-keey-voice-assistant

# Install dependencies
npm install

# Create environment file
cp .env.example .env
```

### 3. Configure Environment Variables

Edit `.env` with your credentials:

```env
# Vapi Configuration
VAPI_API_KEY=your_vapi_api_key
VAPI_PHONE_NUMBER_ID=your_phone_number_id

# GoHighLevel Configuration
GHL_API_KEY=your_ghl_api_key
GHL_LOCATION_ID=your_location_id
GHL_CALENDAR_ID=your_calendar_id

# Webhook Configuration
WEBHOOK_BASE_URL=https://your-domain.com
WEBHOOK_SECRET=random_secure_string

# Application Settings
NODE_ENV=production
PORT=3000
```

### 4. Deploy Assistants

```bash
# Deploy all assistants at once
npm run deploy-all

# Or deploy individually
npm run deploy-main
npm run deploy-services
npm run deploy-pricing
```

After deployment, copy the assistant IDs from the console output and add them to your `.env` file.

### 5. Create Vapi Function Tools

```bash
npm run create-tools
```

This creates the necessary function tools in Vapi:
- `create_contact` - Save lead information to GHL
- `check_calendar_availability` - Check GHL calendar availability
- `book_appointment` - Book appointments in GHL
- `transfer_to_services` - Transfer to services specialist
- `transfer_to_pricing` - Transfer to pricing specialist

### 6. Start the Webhook Server

```bash
# Production
npm start

# Development (with auto-reload)
npm run dev
```

The server will start on the port specified in `.env` (default: 3000).

### 7. Configure Vapi Webhook URL

In your Vapi dashboard:
1. Go to each assistant's settings
2. Set Server URL to: `https://your-domain.com/webhook/vapi`
3. Set Server URL Secret to match your `.env` `WEBHOOK_SECRET`

### 8. Configure Phone Number

In Vapi dashboard:
1. Go to Phone Numbers
2. Select your phone number
3. Set the assistant to your Main Assistant ID

## Testing

### Test Webhook Endpoints

```bash
npm run test-webhook
```

### Test GHL Integration

```bash
npm run test-ghl-integration
```

### Manual Testing

1. **Inbound Test**: Call your Vapi phone number
2. **Webhook Test**: Check logs for incoming webhook events
3. **GHL Test**: Verify contacts and appointments are created in GHL

## Conversation Flows

### Inbound Lead Qualification Flow

```
1. Greeting → "Thank you for calling Keey. How can I help you?"
2. Identify Interest → Property location, current status, goals
3. Collect Information:
   - Full Name
   - Email
   - Phone Number
   - Property Address
   - City, Postcode
   - Number of Bedrooms
   - Region (London/Dubai)
4. Create Contact in GHL → Use create_contact function
5. Offer Consultation → Check availability and book appointment
6. Confirmation → Provide next steps and contact information
```

### Services Information Flow

```
1. Main Assistant identifies services interest
2. Transfer to Services Agent → Seamless handoff
3. Provide Detailed Information → Specific services explained
4. Answer Questions → Address concerns and details
5. If pricing needed → Transfer to Pricing Agent
6. If ready to proceed → Book consultation
```

### Pricing Information Flow

```
1. Main Assistant or Services Agent identifies pricing interest
2. Transfer to Pricing Agent → Seamless handoff
3. Explain Pricing Structure → Transparent, detailed
4. Provide ROI Examples → Real calculations
5. Address Objections → Value proposition
6. Book Consultation → For custom quote
```

## Key Functions

### create_contact
Saves lead information to GoHighLevel CRM.

**Parameters:**
- firstName (required)
- lastName (required)
- email (required)
- phone (required)
- propertyAddress
- city
- postcode
- bedrooms
- region (London/Dubai)

### check_calendar_availability
Checks if a consultation time slot is available.

**Parameters:**
- date (YYYY-MM-DD)
- time (HH:MM)
- timezone (default: Europe/London)

### book_appointment
Books a confirmed consultation appointment.

**Parameters:**
- contactId (from create_contact)
- date
- time
- timezone
- appointmentTitle

### transfer_to_services / transfer_to_pricing
Transfers the call to specialized sub-agents seamlessly.

## Regional Handling

The system handles two operating regions:

- **London, UK**: Default timezone Europe/London, country code GB
- **Dubai, UAE**: Timezone Asia/Dubai, country code AE

Phone numbers are automatically normalized to E.164 format based on detected region.

## Monitoring & Logs

- All webhook events are logged to console
- Call transcripts are saved to GHL contact records
- Server logs available at `./logs/` (if configured)

## Troubleshooting

### Webhook Not Receiving Events
1. Check `WEBHOOK_BASE_URL` is publicly accessible
2. Verify `WEBHOOK_SECRET` matches in both .env and Vapi dashboard
3. Check server logs for incoming requests

### GHL Integration Issues
1. Verify `GHL_API_KEY` has proper permissions (Contacts, Calendar)
2. Check `GHL_LOCATION_ID` and `GHL_CALENDAR_ID` are correct
3. Test with: `npm run test-ghl-integration`

### Assistant Not Responding Correctly
1. Verify assistant configuration includes all function tools
2. Check system prompts are properly loaded
3. Test function calls independently

### Phone Number Issues
1. Verify `VAPI_PHONE_NUMBER_ID` is correct
2. Check phone number is assigned to Main Assistant
3. Ensure phone number is active and funded (if Twilio)

## Production Deployment

### Recommended Hosting

- **Railway**: Easy Node.js hosting with environment variables
- **Heroku**: Simple deployment with add-ons
- **DigitalOcean**: VPS with full control
- **AWS/Google Cloud**: Scalable cloud infrastructure

### Deployment Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Configure production `WEBHOOK_BASE_URL`
- [ ] Secure `WEBHOOK_SECRET` is set
- [ ] GHL API credentials are production keys
- [ ] All assistant IDs are configured
- [ ] Webhook URLs are updated in Vapi dashboard
- [ ] Test all conversation flows
- [ ] Monitor initial calls for issues

## Support

For issues or questions:
- GitHub: https://github.com/arvanittelaku/vapi-keey-voice-assistant
- Vapi Documentation: https://docs.vapi.ai
- GHL API Docs: https://highlevel.stoplight.io/

## License

MIT License - See LICENSE file for details

## Credits

Built with:
- [Vapi AI](https://vapi.ai) - Voice AI platform
- [GoHighLevel](https://gohighlevel.com) - CRM and automation
- [Express.js](https://expressjs.com) - Web framework
- [Luxon](https://moment.github.io/luxon/) - Date/time handling

---

**Keey - Airbnb Property Management**
Website: https://keey.co.uk
Phone: 0203 967 3687

