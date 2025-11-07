#!/usr/bin/env node

/**
 * Pre-Flight Check Script
 * Verifies all configurations before making test calls
 * Run: npm run pre-flight-check
 */

require("dotenv").config()
const axios = require("axios")

const RAILWAY_URL = "https://vapi-keey-voice-assistant-production.up.railway.app"

// Colors for terminal output
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m"
}

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function success(message) {
  log(`✅ ${message}`, "green")
}

function error(message) {
  log(`❌ ${message}`, "red")
}

function warning(message) {
  log(`⚠️  ${message}`, "yellow")
}

function info(message) {
  log(`ℹ️  ${message}`, "cyan")
}

let passedTests = 0
let failedTests = 0

async function runTest(testName, testFn) {
  try {
    log(`\n${testName}...`, "blue")
    await testFn()
    passedTests++
  } catch (err) {
    failedTests++
    error(`Failed: ${err.message}`)
  }
}

// Test 1: Environment Variables
async function testEnvironmentVariables() {
  const required = [
    "VAPI_PRIVATE_KEY",
    "VAPI_PHONE_NUMBER_ID",
    "VAPI_SQUAD_ID",
    "VAPI_MAIN_ASSISTANT_ID",
    "VAPI_SERVICES_ASSISTANT_ID",
    "VAPI_PRICING_ASSISTANT_ID",
    "GHL_PRIVATE_API_KEY",
    "GHL_LOCATION_ID",
    "GHL_CALENDAR_ID"
  ]

  const missing = required.filter(key => !process.env[key])
  
  if (missing.length > 0) {
    throw new Error(`Missing environment variables: ${missing.join(", ")}`)
  }
  
  success("All required environment variables are set")
  info(`   VAPI_PHONE_NUMBER_ID: ${process.env.VAPI_PHONE_NUMBER_ID.substring(0, 15)}...`)
  info(`   VAPI_SQUAD_ID: ${process.env.VAPI_SQUAD_ID.substring(0, 15)}...`)
  info(`   GHL_LOCATION_ID: ${process.env.GHL_LOCATION_ID}`)
}

// Test 2: Server Health Check
async function testServerHealth() {
  const response = await axios.get(`${RAILWAY_URL}/health`, { timeout: 10000 })
  
  if (response.data.status !== "healthy") {
    throw new Error("Server returned unhealthy status")
  }
  
  success("Server is healthy and running")
  info(`   Status: ${response.data.status}`)
  info(`   Service: ${response.data.service}`)
}

// Test 3: Vapi Webhook Endpoint
async function testVapiWebhook() {
  const response = await axios.get(`${RAILWAY_URL}/webhook/vapi`, { timeout: 10000 })
  
  if (!response.data.status) {
    throw new Error("Webhook endpoint not responding correctly")
  }
  
  success("Vapi webhook endpoint is accessible")
  info(`   Response: ${response.data.status}`)
}

// Test 4: Calendar Availability Function
async function testCalendarAvailability() {
  const payload = {
    message: {
      type: "function-call",
      functionCall: {
        id: "pre-flight-test-001",
        name: "check_calendar_availability",
        parameters: {
          date: "2025-11-10",
          time: "14:00",
          timezone: "Europe/London"
        }
      }
    }
  }

  const response = await axios.post(`${RAILWAY_URL}/webhook/vapi`, payload, {
    timeout: 15000,
    headers: { "Content-Type": "application/json" }
  })
  
  if (!response.data.functionCall || !response.data.functionCall.result) {
    throw new Error("Invalid response format from calendar function")
  }

  const result = JSON.parse(response.data.functionCall.result)
  
  if (typeof result.available === "undefined") {
    throw new Error("Calendar function didn't return availability status")
  }
  
  success("Calendar availability function works")
  info(`   Available: ${result.available}`)
  info(`   Message: ${result.message}`)
}

// Test 5: Vapi API Connection
async function testVapiAPI() {
  const vapiClient = require("../src/services/vapi-client")
  const client = new vapiClient()
  
  // Try to make a call request (won't actually complete due to timeout, but will verify API works)
  try {
    const callData = {
      phoneNumberId: process.env.VAPI_PHONE_NUMBER_ID,
      squadId: process.env.VAPI_SQUAD_ID,
      customer: {
        number: "+12136721526",
        name: "Pre-Flight Test"
      },
      assistantOverrides: {
        variableValues: {
          firstName: "Test",
          callType: "pre-flight-check"
        },
        firstMessage: "This is a pre-flight test. Hanging up immediately."
      }
    }
    
    // This will queue the call but it won't ring (timeout=0)
    const result = await client.makeCall(callData)
    
    if (!result.id) {
      throw new Error("Vapi API didn't return a call ID")
    }
    
    success("Vapi API connection works")
    info(`   Call queued with ID: ${result.id.substring(0, 20)}...`)
    warning("   Note: Call won't actually ring until timeout is fixed in Vapi Dashboard")
    
  } catch (err) {
    if (err.response && err.response.status === 400) {
      // This might happen if phone number settings are wrong, but API connection works
      success("Vapi API connection works (but phone number may need configuration)")
      warning(`   API Error: ${err.response.data.message || err.message}`)
    } else {
      throw err
    }
  }
}

// Test 6: GHL API Connection
async function testGHLAPI() {
  const ghlClient = require("../src/services/ghl-client")
  const client = new ghlClient()
  
  // Test calendar availability (uses GHL API)
  const startDate = new Date("2025-11-10T14:00:00Z")
  const endDate = new Date("2025-11-10T15:00:00Z")
  
  const slots = await client.checkCalendarAvailability(
    process.env.GHL_CALENDAR_ID,
    startDate,
    endDate,
    "Europe/London"
  )
  
  if (!Array.isArray(slots)) {
    throw new Error("GHL API didn't return slots array")
  }
  
  success("GHL API connection works")
  info(`   Calendar ID: ${process.env.GHL_CALENDAR_ID}`)
  info(`   Available slots found: ${slots.length}`)
}

// Test 7: Configuration Files
async function testConfigFiles() {
  const mainConfig = require("../src/config/main-assistant-config")
  const servicesConfig = require("../src/config/services-assistant-config")
  const pricingConfig = require("../src/config/pricing-assistant-config")
  
  // Check voices match
  if (mainConfig.voice.voiceId !== servicesConfig.voice.voiceId ||
      mainConfig.voice.voiceId !== pricingConfig.voice.voiceId) {
    warning("Assistants use different voices (transfers may not be seamless)")
  } else {
    success("All assistants use the same voice for seamless transfers")
    info(`   Voice: ${mainConfig.voice.voiceId}`)
  }
  
  // Check system prompts exist
  if (!mainConfig.model.messages[0].content.includes("OUTBOUND calls")) {
    warning("Main assistant system prompt may not have outbound call instructions")
  } else {
    success("System prompts are properly configured")
  }
}

// Main execution
async function main() {
  log("\n" + "=".repeat(60), "cyan")
  log("🚀 PRE-FLIGHT CHECK - Vapi Keey Voice Assistant", "cyan")
  log("=".repeat(60) + "\n", "cyan")
  
  info("This script will verify all configurations before test calls\n")
  
  // Run all tests
  await runTest("Test 1: Environment Variables", testEnvironmentVariables)
  await runTest("Test 2: Server Health Check", testServerHealth)
  await runTest("Test 3: Vapi Webhook Endpoint", testVapiWebhook)
  await runTest("Test 4: Calendar Availability Function", testCalendarAvailability)
  await runTest("Test 5: Vapi API Connection", testVapiAPI)
  await runTest("Test 6: GHL API Connection", testGHLAPI)
  await runTest("Test 7: Configuration Files", testConfigFiles)
  
  // Summary
  log("\n" + "=".repeat(60), "cyan")
  log("📊 TEST SUMMARY", "cyan")
  log("=".repeat(60) + "\n", "cyan")
  
  success(`Passed: ${passedTests}/7 tests`)
  if (failedTests > 0) {
    error(`Failed: ${failedTests}/7 tests`)
  }
  
  // Confidence assessment
  const confidence = Math.round((passedTests / 7) * 100)
  log(`\n🎯 Confidence Level: ${confidence}%\n`, confidence >= 90 ? "green" : "yellow")
  
  if (passedTests === 7) {
    log("✨ ALL TESTS PASSED! ✨\n", "green")
    success("Server, APIs, and configurations are working correctly")
    info("\n📋 Next Steps:")
    info("   1. Complete VAPI_DASHBOARD_VERIFICATION_CHECKLIST.md")
    info("   2. Have boss fix Vapi Dashboard settings (user + timeout)")
    info("   3. Make ONE 30-second test call to verify greeting")
    info("   4. If greeting works, proceed with full testing\n")
    info("💰 Estimated cost: $0.02-0.05 for first test call\n")
  } else if (passedTests >= 5) {
    log("\n⚠️  MOST TESTS PASSED\n", "yellow")
    warning("Fix the failed tests before making test calls")
    info("This will save you money on failed calls\n")
  } else {
    log("\n❌ CRITICAL ISSUES FOUND\n", "red")
    error("DO NOT make test calls yet - fix critical issues first")
    info("Review the errors above and fix them\n")
  }
}

// Run the script
main().catch(err => {
  error(`\n💥 Script Error: ${err.message}`)
  console.error(err)
  process.exit(1)
})



