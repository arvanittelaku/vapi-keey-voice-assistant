const express = require("express")
const GHLToVapiWebhook = require("./src/webhooks/ghl-to-vapi")
const VapiFunctionHandler = require("./src/webhooks/vapi-function-handler")
require("dotenv").config()

console.log("🚀 Starting Keey Voice Assistant Server...")
console.log("=".repeat(50))

// Create unified Express app
const app = express()
const port = process.env.PORT || 3000

// Add middleware
app.use(express.json())

// Logging middleware
app.use((req, res, next) => {
  console.log(`📥 ${new Date().toISOString()} - ${req.method} ${req.path}`)
  next()
})

// Initialize webhook handlers - PASS THE APP TO THEM
const ghlWebhook = new GHLToVapiWebhook(app)
const vapiHandler = new VapiFunctionHandler(app)

// Start server
app.listen(port, () => {
  console.log(`\n✅ Keey Voice Assistant Server running on port ${port}`)
  console.log(`\n📡 Webhook Endpoints:`)
  console.log(`   GHL Trigger: http://localhost:${port}/webhook/ghl-trigger-call`)
  console.log(`   Vapi Functions: http://localhost:${port}/webhook/vapi`)
  console.log(`   Test Endpoint: http://localhost:${port}/test/trigger-call`)
  console.log(`   Health Check: http://localhost:${port}/health\n`)
})
