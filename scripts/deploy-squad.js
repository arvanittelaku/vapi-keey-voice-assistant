const VapiClient = require("../src/services/vapi-client")
const mainConfig = require("../src/config/main-assistant-config")
const servicesConfig = require("../src/config/services-assistant-config")
const pricingConfig = require("../src/config/pricing-assistant-config")
require("dotenv").config()

async function deploySquad() {
  try {
    console.log("🚀 Deploying Keey Voice Assistant Squad...")
    console.log("=" .repeat(50))
    
    const vapi = new VapiClient()
    
    // Step 1: Create individual assistants first
    console.log("\n📝 Step 1: Creating individual assistants...")
    
    // Add server URLs to configs
    const baseWebhookUrl = process.env.WEBHOOK_BASE_URL 
      ? `${process.env.WEBHOOK_BASE_URL}/webhook/vapi` 
      : undefined
    
    const mainConfigWithUrl = {
      ...mainConfig,
      serverUrl: baseWebhookUrl
    }
    
    const servicesConfigWithUrl = {
      ...servicesConfig,
      serverUrl: baseWebhookUrl
    }
    
    const pricingConfigWithUrl = {
      ...pricingConfig,
      serverUrl: baseWebhookUrl
    }
    
    // Create Main Assistant
    console.log("\n1️⃣ Creating Main Assistant...")
    const mainAssistant = await vapi.createAssistant(mainConfigWithUrl)
    console.log(`✅ Main Assistant created: ${mainAssistant.id}`)
    
    // Create Services Assistant
    console.log("\n2️⃣ Creating Services Assistant...")
    const servicesAssistant = await vapi.createAssistant(servicesConfigWithUrl)
    console.log(`✅ Services Assistant created: ${servicesAssistant.id}`)
    
    // Create Pricing Assistant
    console.log("\n3️⃣ Creating Pricing Assistant...")
    const pricingAssistant = await vapi.createAssistant(pricingConfigWithUrl)
    console.log(`✅ Pricing Assistant created: ${pricingAssistant.id}`)
    
    // Step 2: Create the Squad
    console.log("\n📝 Step 2: Creating Squad with all members...")
    
    const squadConfig = {
      name: "Keey Property Management Squad",
      members: [
        {
          assistantId: mainAssistant.id,
          assistantDestinations: [
            {
              type: "assistant",
              assistantName: servicesAssistant.name,
              message: "Transferring you to our services specialist who can provide detailed information about everything we offer.",
              description: "Transfer to services specialist for detailed service information"
            },
            {
              type: "assistant",
              assistantName: pricingAssistant.name,
              message: "Let me connect you with our pricing specialist who can discuss costs and packages.",
              description: "Transfer to pricing specialist for pricing information"
            }
          ]
        },
        {
          assistantId: servicesAssistant.id,
          assistantDestinations: [
            {
              type: "assistant",
              assistantName: mainAssistant.name,
              message: "Let me transfer you back to continue with your inquiry.",
              description: "Transfer back to main assistant"
            },
            {
              type: "assistant",
              assistantName: pricingAssistant.name,
              message: "Let me connect you with our pricing specialist.",
              description: "Transfer to pricing specialist"
            }
          ]
        },
        {
          assistantId: pricingAssistant.id,
          assistantDestinations: [
            {
              type: "assistant",
              assistantName: mainAssistant.name,
              message: "Let me transfer you back to continue.",
              description: "Transfer back to main assistant"
            },
            {
              type: "assistant",
              assistantName: servicesAssistant.name,
              message: "Let me connect you with our services specialist.",
              description: "Transfer to services specialist"
            }
          ]
        }
      ]
    }
    
    const squad = await vapi.createSquad(squadConfig)
    console.log(`\n✅ Squad created successfully: ${squad.id}`)
    
    // Step 3: Display summary
    console.log("\n" + "=".repeat(50))
    console.log("🎉 SQUAD DEPLOYMENT COMPLETE!")
    console.log("=".repeat(50))
    
    console.log("\n📋 ASSISTANT IDs:")
    console.log(`Main Assistant:     ${mainAssistant.id}`)
    console.log(`Services Assistant: ${servicesAssistant.id}`)
    console.log(`Pricing Assistant:  ${pricingAssistant.id}`)
    
    console.log("\n📋 SQUAD ID:")
    console.log(`Squad: ${squad.id}`)
    
    console.log("\n⚠️  IMPORTANT: Add these to your .env file:")
    console.log("=" .repeat(50))
    console.log(`VAPI_MAIN_ASSISTANT_ID=${mainAssistant.id}`)
    console.log(`VAPI_SERVICES_ASSISTANT_ID=${servicesAssistant.id}`)
    console.log(`VAPI_PRICING_ASSISTANT_ID=${pricingAssistant.id}`)
    console.log(`VAPI_SQUAD_ID=${squad.id}`)
    
    console.log("\n📱 NEXT STEPS:")
    console.log("1. Copy the IDs above and add them to your .env file")
    console.log("2. In Vapi Dashboard → Phone Numbers:")
    console.log(`   - Assign your phone number to SQUAD: ${squad.id}`)
    console.log("   - (NOT to individual assistants)")
    console.log("3. The squad will automatically handle transfers between agents")
    console.log("4. Test by calling your Vapi phone number")
    
    console.log("\n✨ Your Keey Voice Assistant Squad is ready!")
    
  } catch (error) {
    console.error("❌ Error deploying squad:", error.message)
    if (error.response) {
      console.error("API Error Details:", JSON.stringify(error.response.data, null, 2))
    }
    process.exit(1)
  }
}

deploySquad()

