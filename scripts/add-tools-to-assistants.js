require("dotenv").config()
const VapiClient = require("../src/services/vapi-client")

// REPLACE THESE WITH YOUR TOOL IDs FROM VAPI DASHBOARD
const TOOL_IDS = {
  checkCalendar: "YOUR_CHECK_CALENDAR_TOOL_ID",  // e.g., "22eb8501-80fb-497f-87e8-6f0a88ac5eab"
  bookAppointment: "YOUR_BOOK_APPOINTMENT_TOOL_ID"  // e.g., "d25e90cd-e6dc-423f-9719-96ca8c6541cb"
}

async function addToolsToAssistants() {
  const client = new VapiClient()
  
  const mainAssistantId = process.env.VAPI_MAIN_ASSISTANT_ID
  const servicesAssistantId = process.env.VAPI_SERVICES_ASSISTANT_ID  
  const pricingAssistantId = process.env.VAPI_PRICING_ASSISTANT_ID

  console.log("\n🔧 Adding Tools to Assistants")
  console.log("=".repeat(50))

  // Validate tool IDs
  if (TOOL_IDS.checkCalendar === "YOUR_CHECK_CALENDAR_TOOL_ID") {
    console.error("\n❌ ERROR: Please update TOOL_IDS with your actual tool IDs from Vapi dashboard!")
    console.log("\n📝 How to get tool IDs:")
    console.log("   1. Go to https://dashboard.vapi.ai/tools")
    console.log("   2. Click on each tool")
    console.log("   3. Copy the ID from the URL or tool details")
    console.log("   4. Update TOOL_IDS in this script")
    process.exit(1)
  }

  try {
    // Update Main Assistant
    console.log("\n📝 Updating Main Assistant...")
    await client.updateAssistant(mainAssistantId, {
      toolIds: [TOOL_IDS.checkCalendar, TOOL_IDS.bookAppointment]
    })
    console.log("✅ Main Assistant updated with tools")

    // Update Services Assistant
    console.log("\n📝 Updating Services Assistant...")
    await client.updateAssistant(servicesAssistantId, {
      toolIds: [TOOL_IDS.checkCalendar, TOOL_IDS.bookAppointment]
    })
    console.log("✅ Services Assistant updated with tools")

    // Update Pricing Assistant
    console.log("\n📝 Updating Pricing Assistant...")
    await client.updateAssistant(pricingAssistantId, {
      toolIds: [TOOL_IDS.checkCalendar, TOOL_IDS.bookAppointment]
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

