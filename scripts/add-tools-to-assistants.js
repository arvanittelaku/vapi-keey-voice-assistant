require("dotenv").config()
const VapiClient = require("../src/services/vapi-client")

// KEEY-SPECIFIC TOOL IDs (from Vapi dashboard)
const TOOL_IDS = {
  checkCalendar: "22eb8501-80fb-497f-87e8-6f0a88ac5eab",  // check_calendar_availability_keey
  bookAppointment: "d25e90cd-e6dc-423f-9719-96ca8c6541cb"  // book_calendar_appointment_keey
}

async function addToolsToAssistants() {
  const client = new VapiClient()
  
  const mainAssistantId = process.env.VAPI_MAIN_ASSISTANT_ID
  const servicesAssistantId = process.env.VAPI_SERVICES_ASSISTANT_ID  
  const pricingAssistantId = process.env.VAPI_PRICING_ASSISTANT_ID

  console.log("\n🔧 Adding Tools to Assistants")
  console.log("=".repeat(50))
  console.log("\n📋 Tool IDs:")
  console.log(`   Check Calendar: ${TOOL_IDS.checkCalendar}`)
  console.log(`   Book Appointment: ${TOOL_IDS.bookAppointment}`)
  console.log("")

  try {
    // Update Main Assistant
    console.log("\n📝 Updating Main Assistant...")
    await client.updateAssistant(mainAssistantId, {
      model: {
        toolIds: [TOOL_IDS.checkCalendar, TOOL_IDS.bookAppointment]
      }
    })
    console.log("✅ Main Assistant updated with tools")

    // Update Services Assistant
    console.log("\n📝 Updating Services Assistant...")
    await client.updateAssistant(servicesAssistantId, {
      model: {
        toolIds: [TOOL_IDS.checkCalendar, TOOL_IDS.bookAppointment]
      }
    })
    console.log("✅ Services Assistant updated with tools")

    // Update Pricing Assistant
    console.log("\n📝 Updating Pricing Assistant...")
    await client.updateAssistant(pricingAssistantId, {
      model: {
        toolIds: [TOOL_IDS.checkCalendar, TOOL_IDS.bookAppointment]
      }
    })
    console.log("✅ Pricing Assistant updated with tools")

    console.log("\n" + "=".repeat(50))
    console.log("✅ All assistants updated successfully!")
    console.log("\n💡 Next steps:")
    console.log("   1. Test a call to verify tools work")
    console.log("   2. Check Vapi dashboard for tool execution logs")

  } catch (error) {
    console.error("\n❌ Error updating assistants:", error.response?.data || error.message)
    process.exit(1)
  }
}

addToolsToAssistants()

