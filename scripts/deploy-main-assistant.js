const VapiClient = require("../src/services/vapi-client")
const mainConfig = require("../src/config/main-assistant-config")
require("dotenv").config()

async function deployMainAssistant() {
  try {
    console.log("🚀 Deploying Main Keey Assistant...")
    
    const vapi = new VapiClient()
    
    // Check if assistant already exists
    const existingAssistantId = process.env.VAPI_MAIN_ASSISTANT_ID
    
    // Add server URL to config
    const config = {
      ...mainConfig,
      serverUrl: process.env.WEBHOOK_BASE_URL 
        ? `${process.env.WEBHOOK_BASE_URL}/webhook/vapi` 
        : undefined
    }
    
    if (existingAssistantId) {
      console.log(`📝 Updating existing assistant: ${existingAssistantId}`)
      const assistant = await vapi.updateAssistant(existingAssistantId, config)
      console.log("\n✅ Main Assistant updated successfully!")
      console.log(`📋 Assistant ID: ${assistant.id}`)
      console.log(`📝 Name: ${assistant.name}`)
    } else {
      console.log("📝 Creating new assistant...")
      const assistant = await vapi.createAssistant(config)
      console.log("\n✅ Main Assistant created successfully!")
      console.log(`📋 Assistant ID: ${assistant.id}`)
      console.log(`📝 Name: ${assistant.name}`)
      console.log("\n⚠️  IMPORTANT: Add this to your .env file:")
      console.log(`VAPI_MAIN_ASSISTANT_ID=${assistant.id}`)
    }
    
  } catch (error) {
    console.error("❌ Error deploying Main Assistant:", error.message)
    if (error.response) {
      console.error("API Error Details:", JSON.stringify(error.response.data, null, 2))
    }
    process.exit(1)
  }
}

deployMainAssistant()

