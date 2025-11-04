const VapiClient = require("../src/services/vapi-client")
require("dotenv").config()

async function createSquadOnly() {
  try {
    console.log("🚀 Creating Keey Voice Assistant Squad...")
    console.log("=" .repeat(50))
    
    const vapi = new VapiClient()
    
    // Get assistant IDs from .env
    const mainAssistantId = process.env.VAPI_MAIN_ASSISTANT_ID
    const servicesAssistantId = process.env.VAPI_SERVICES_ASSISTANT_ID
    const pricingAssistantId = process.env.VAPI_PRICING_ASSISTANT_ID
    
    // Validate IDs exist
    if (!mainAssistantId || !servicesAssistantId || !pricingAssistantId) {
      console.error("❌ ERROR: Missing assistant IDs in .env file!")
      console.error("   Please make sure these are set:")
      console.error("   - VAPI_MAIN_ASSISTANT_ID")
      console.error("   - VAPI_SERVICES_ASSISTANT_ID")
      console.error("   - VAPI_PRICING_ASSISTANT_ID")
      process.exit(1)
    }
    
    console.log("\n📋 Using existing assistants:")
    console.log(`   Main Assistant:     ${mainAssistantId}`)
    console.log(`   Services Assistant: ${servicesAssistantId}`)
    console.log(`   Pricing Assistant:  ${pricingAssistantId}`)
    
    // Fetch assistant details to get their names
    console.log("\n📝 Fetching assistant details...")
    const mainAssistant = await vapi.getAssistant(mainAssistantId)
    const servicesAssistant = await vapi.getAssistant(servicesAssistantId)
    const pricingAssistant = await vapi.getAssistant(pricingAssistantId)
    
    console.log(`✅ Main: ${mainAssistant.name}`)
    console.log(`✅ Services: ${servicesAssistant.name}`)
    console.log(`✅ Pricing: ${pricingAssistant.name}`)
    
    // Create the Squad
    console.log("\n📝 Creating Squad with all members...")
    
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
    console.log(`\n✅ Squad created successfully!`)
    
    // Display summary
    console.log("\n" + "=".repeat(50))
    console.log("🎉 SQUAD CREATION COMPLETE!")
    console.log("=".repeat(50))
    
    console.log("\n📋 SQUAD DETAILS:")
    console.log(`Squad ID: ${squad.id}`)
    console.log(`Squad Name: ${squad.name}`)
    
    console.log("\n📋 SQUAD MEMBERS:")
    console.log(`1. Main Assistant:     ${mainAssistant.name}`)
    console.log(`   ID: ${mainAssistant.id}`)
    console.log(`2. Services Assistant: ${servicesAssistant.name}`)
    console.log(`   ID: ${servicesAssistant.id}`)
    console.log(`3. Pricing Assistant:  ${pricingAssistant.name}`)
    console.log(`   ID: ${pricingAssistant.id}`)
    
    console.log("\n⚠️  IMPORTANT: Add this to your .env file:")
    console.log("=" .repeat(50))
    console.log(`VAPI_SQUAD_ID=${squad.id}`)
    
    console.log("\n📱 NEXT STEPS:")
    console.log("1. Copy the Squad ID above and add it to your .env file")
    console.log("2. Go to Vapi Dashboard → Phone Numbers")
    console.log("3. Select your phone number")
    console.log("4. Under 'Assistant', choose 'Squad'")
    console.log(`5. Select 'Keey Property Management Squad'`)
    console.log("6. Save")
    console.log("7. Test by calling your Vapi phone number!")
    
    console.log("\n✨ Your Keey Voice Assistant Squad is ready!")
    console.log("\nTransfer routes configured:")
    console.log("• Main → Services, Pricing")
    console.log("• Services → Main, Pricing")
    console.log("• Pricing → Main, Services")
    console.log("\nAll agents use the same voice (OpenAI Alloy) for seamless transitions!")
    
  } catch (error) {
    console.error("\n❌ Error creating squad:", error.message)
    if (error.response) {
      console.error("API Error Details:", JSON.stringify(error.response.data, null, 2))
    }
    process.exit(1)
  }
}

createSquadOnly()

