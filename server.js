const express = require("express")
const axios = require("axios")
const GHLToVapiWebhook = require("./src/webhooks/ghl-to-vapi")
const VapiFunctionHandler = require("./src/webhooks/vapi-function-handler")
const TwilioRouter = require("./src/webhooks/twilio-router")
const GHLSmsHandler = require("./src/webhooks/ghl-sms-handler")
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

// TEST: Register a route directly in server.js to confirm Express works
app.get("/test-direct", (req, res) => {
  res.json({ message: "Direct route in server.js works!" })
})

// Initialize webhook handlers - PASS THE APP TO THEM
const ghlWebhook = new GHLToVapiWebhook(app)
const vapiHandler = new VapiFunctionHandler(app)
const twilioRouter = new TwilioRouter(app)
const smsHandler = new GHLSmsHandler(app)

// TEST: Register another route AFTER handlers to see order
app.get("/test-after", (req, res) => {
  res.json({ message: "Route registered AFTER handlers works!" })
})

// Catch-all 404 handler
app.use((req, res) => {
  console.log(`❌ 404 - Route not found: ${req.method} ${req.path}`)
  res.status(404).json({ error: "Not found" })
})

// Start server
app.listen(port, () => {
  console.log(`\n✅ Keey Voice Assistant Server running on port ${port}`)
  console.log(`\n📡 Webhook Endpoints:`)
  console.log(`   Twilio Voice: http://localhost:${port}/twilio/voice`)
  console.log(`   GHL Trigger: http://localhost:${port}/webhook/ghl-trigger-call`)
  console.log(`   Vapi Functions: http://localhost:${port}/webhook/vapi`)
  console.log(`   GHL SMS Reply: http://localhost:${port}/webhook/ghl-sms-reply`)
  console.log(`   Test Endpoint: http://localhost:${port}/test/trigger-call`)
  console.log(`   Health Check: http://localhost:${port}/health`)
  
  // List all routes AFTER server starts
  console.log(`\n📋 All Registered Routes:`)
  if (app._router && app._router.stack) {
    app._router.stack.forEach((middleware) => {
      if (middleware.route) {
        const methods = Object.keys(middleware.route.methods).join(',').toUpperCase()
        console.log(`   ${methods} ${middleware.route.path}`)
      }
    })
  }
  console.log('\n')
  
  // 🔥 SELF-PING: Keep server awake on Render free tier
  // Ping health endpoint every 14 minutes to prevent cold start
  if (process.env.RENDER) {
    const RENDER_URL = process.env.RENDER_EXTERNAL_URL || `https://vapi-keey-voice-assistant.onrender.com`
    const PING_INTERVAL = 14 * 60 * 1000 // 14 minutes
    
    console.log(`🔄 Self-ping enabled: Will ping ${RENDER_URL}/health every 14 minutes`)
    console.log(`   This keeps the server awake on Render's free tier\n`)
    
    setInterval(async () => {
      try {
        await axios.get(`${RENDER_URL}/health`, { timeout: 5000 })
        console.log(`💓 Self-ping successful at ${new Date().toISOString()}`)
      } catch (error) {
        console.error(`⚠️ Self-ping failed:`, error.message)
      }
    }, PING_INTERVAL)
    
    // Initial ping after 1 minute
    setTimeout(async () => {
      try {
        await axios.get(`${RENDER_URL}/health`, { timeout: 5000 })
        console.log(`💓 Initial self-ping successful at ${new Date().toISOString()}`)
      } catch (error) {
        console.error(`⚠️ Initial self-ping failed:`, error.message)
      }
    }, 60000)
  }
})
