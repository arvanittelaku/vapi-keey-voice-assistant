const express = require("express")
const GHLToVapiWebhook = require("./src/webhooks/ghl-to-vapi")
const VapiFunctionHandler = require("./src/webhooks/vapi-function-handler")
require("dotenv").config()

console.log("🚀 Starting Keey Voice Assistant Server...")
console.log("=".repeat(50))

// Create unified Express app
const app = express()
const port = process.env.PORT || 3000

// Initialize webhook handlers
const ghlWebhook = new GHLToVapiWebhook()
const vapiHandler = new VapiFunctionHandler()

// Mount both handlers on the same app
app.use(ghlWebhook.app)
app.use(vapiHandler.app)

// Start server
app.listen(port, () => {
  console.log(`\n✅ Keey Voice Assistant Server running on port ${port}`)
  console.log(`\n📡 Webhook Endpoints:`)
  console.log(`   GHL Trigger: http://localhost:${port}/webhook/ghl-trigger-call`)
  console.log(`   Vapi Functions: http://localhost:${port}/webhook/vapi`)
  console.log(`   Test Endpoint: http://localhost:${port}/test/trigger-call`)
  console.log(`   Health Check: http://localhost:${port}/health\n`)
})
