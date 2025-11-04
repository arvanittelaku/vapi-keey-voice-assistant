const VapiWebhookHandler = require("./webhooks/vapi-webhook")
require("dotenv").config()

// Start the webhook server
const webhookHandler = new VapiWebhookHandler()
const port = process.env.PORT || 3000

console.log("🚀 Starting Keey Vapi Voice Assistant...")
console.log("📡 Setting up webhook endpoints...")

webhookHandler.start(port)

