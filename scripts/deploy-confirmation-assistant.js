#!/usr/bin/env node

/**
 * Deploy Keey Appointment Confirmation Assistant to Vapi
 * 
 * This script deploys the confirmation assistant that calls customers
 * 1 hour before their scheduled appointments to confirm attendance.
 * 
 * Usage: npm run deploy-confirmation
 */

const axios = require("axios")
require("dotenv").config()

const VAPI_API_KEY = process.env.VAPI_API_KEY
const VAPI_BASE_URL = "https://api.vapi.ai"
const SERVER_URL = process.env.WEBHOOK_BASE_URL || "http://localhost:3000"

// Import the confirmation assistant configuration
const confirmationAssistantConfig = require("../src/config/confirmation-assistant-config")

async function deployConfirmationAssistant() {
  console.log("\n🚀 Deploying Keey Appointment Confirmation Assistant to Vapi...\n")
  console.log("=".repeat(60))

  // Validate API key
  if (!VAPI_API_KEY) {
    console.error("❌ ERROR: VAPI_API_KEY not found in environment variables")
    console.error("Please set VAPI_API_KEY in your .env file")
    process.exit(1)
  }

  try {
    // Prepare assistant payload
    const assistantPayload = {
      ...confirmationAssistantConfig,
      serverUrl: `${SERVER_URL}/webhook/vapi`,
    }

    console.log("📋 Assistant Configuration:")
    console.log(`   Name: ${assistantPayload.name}`)
    console.log(`   Model: ${assistantPayload.model.provider} ${assistantPayload.model.model}`)
    console.log(`   Voice: ${assistantPayload.voice.provider} ${assistantPayload.voice.voiceId}`)
    console.log(`   Server URL: ${assistantPayload.serverUrl}`)
    console.log(`   Max Duration: ${assistantPayload.maxDurationSeconds}s`)
    console.log()

    // Check if assistant already exists
    console.log("🔍 Checking for existing assistant...")
    const listResponse = await axios.get(`${VAPI_BASE_URL}/assistant`, {
      headers: {
        Authorization: `Bearer ${VAPI_API_KEY}`,
      },
    })

    const existingAssistant = listResponse.data.find(
      (assistant) => assistant.name === assistantPayload.name
    )

    let assistant
    if (existingAssistant) {
      console.log(`✅ Found existing assistant: ${existingAssistant.id}`)
      console.log("🔄 Updating assistant configuration...\n")

      // Update existing assistant
      const updateResponse = await axios.patch(
        `${VAPI_BASE_URL}/assistant/${existingAssistant.id}`,
        assistantPayload,
        {
          headers: {
            Authorization: `Bearer ${VAPI_API_KEY}`,
            "Content-Type": "application/json",
          },
        }
      )

      assistant = updateResponse.data
      console.log("✅ Assistant updated successfully!")
    } else {
      console.log("📝 Creating new assistant...\n")

      // Create new assistant
      const createResponse = await axios.post(
        `${VAPI_BASE_URL}/assistant`,
        assistantPayload,
        {
          headers: {
            Authorization: `Bearer ${VAPI_API_KEY}`,
            "Content-Type": "application/json",
          },
        }
      )

      assistant = createResponse.data
      console.log("✅ Assistant created successfully!")
    }

    // Display results
    console.log("\n" + "=".repeat(60))
    console.log("✅ DEPLOYMENT SUCCESSFUL!")
    console.log("=".repeat(60))
    console.log()
    console.log("📋 Assistant Details:")
    console.log(`   ID: ${assistant.id}`)
    console.log(`   Name: ${assistant.name}`)
    console.log(`   Model: ${assistant.model.model}`)
    console.log(`   Voice: ${assistant.voice.voiceId}`)
    console.log()
    console.log("⚠️  IMPORTANT NEXT STEPS:")
    console.log()
    console.log("1. Add this assistant ID to your .env file:")
    console.log(`   VAPI_CONFIRMATION_ASSISTANT_ID=${assistant.id}`)
    console.log()
    console.log("2. Update Render environment variables:")
    console.log("   Go to Render Dashboard → Environment")
    console.log(`   Add: VAPI_CONFIRMATION_ASSISTANT_ID=${assistant.id}`)
    console.log()
    console.log("3. Create GHL Workflow for appointment confirmations:")
    console.log("   • Trigger: Appointment Start Time - 1 hour")
    console.log("   • Action: Webhook")
    console.log("   • URL: https://vapi-keey-voice-assistant.onrender.com/webhook/ghl-trigger-call")
    console.log("   • Method: POST")
    console.log("   • Body: Include contact info + appointment details")
    console.log()
    console.log("📋 This assistant will:")
    console.log("   • Call customers 1 hour before appointments")
    console.log("   • Confirm their attendance (yes/no)")
    console.log("   • Keep calls brief (under 2 minutes)")
    console.log()
    console.log("🔗 Vapi Dashboard: https://dashboard.vapi.ai/assistants")
    console.log()

  } catch (error) {
    console.error("\n❌ DEPLOYMENT FAILED!")
    console.error("=".repeat(60))
    
    if (error.response) {
      console.error(`Status: ${error.response.status}`)
      console.error(`Message: ${error.response.data.message || error.response.statusText}`)
      if (error.response.data.errors) {
        console.error("Errors:", JSON.stringify(error.response.data.errors, null, 2))
      }
    } else if (error.request) {
      console.error("No response received from Vapi API")
      console.error("Please check your internet connection and try again")
    } else {
      console.error(`Error: ${error.message}`)
    }
    
    console.error()
    process.exit(1)
  }
}

// Run deployment
deployConfirmationAssistant()

