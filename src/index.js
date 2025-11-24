const VapiWebhookHandler = require("./webhooks/vapi-webhook")
const TwilioRouter = require("./webhooks/twilio-router")
require("dotenv").config()

// Start the webhook server
const webhookHandler = new VapiWebhookHandler()
const port = process.env.PORT || 3000

console.log("🚀 Starting Keey Vapi Voice Assistant...")
console.log("📡 Setting up webhook endpoints...")

const app = webhookHandler.start(port)

// Setup Twilio router for inbound calls
console.log("📞 Setting up Twilio inbound call routing...")
const twilioRouter = new TwilioRouter(app)
twilioRouter.setupRoutes()
console.log("✅ Twilio inbound routing ready!")
console.log(`   📞 Inbound calls to ${process.env.TWILIO_PHONE_NUMBER} → Vapi Inbound Assistant`)

