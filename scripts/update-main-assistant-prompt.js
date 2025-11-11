const VapiClient = require("../src/services/vapi-client");
const mainConfig = require("../src/config/main-assistant-config");
require("dotenv").config();

async function updateMainAssistant() {
  const client = new VapiClient();
  const assistantId = process.env.VAPI_MAIN_ASSISTANT_ID;

  if (!assistantId) {
    console.error("❌ VAPI_MAIN_ASSISTANT_ID not found in .env");
    process.exit(1);
  }

  console.log("\n════════════════════════════════════════════════════════════");
  console.log("🔄 UPDATING MAIN ASSISTANT SYSTEM PROMPT");
  console.log("════════════════════════════════════════════════════════════\n");

  console.log(`📋 Assistant ID: ${assistantId}`);
  console.log(`📝 Updating with new booking instructions...`);

  try {
    // Fetch current config
    const currentAssistant = await client.getAssistant(assistantId);
    console.log(`   Current name: ${currentAssistant.name}`);

    // Update only the system prompt
    const updatedAssistant = await client.updateAssistant(assistantId, {
      model: {
        ...currentAssistant.model,
        messages: mainConfig.model.messages
      }
    });

    console.log("\n✅ MAIN ASSISTANT UPDATED SUCCESSFULLY!");
    console.log("════════════════════════════════════════════════════════════\n");
    console.log("📋 KEY CHANGES:");
    console.log("   ✓ AI will NOT ask for name/email/phone on outbound calls");
    console.log("   ✓ AI will ONLY ask for preferred date/time");
    console.log("   ✓ AI will use existing contact data from GHL webhook");
    console.log("   ✓ Booking flow streamlined for outbound calls");
    console.log("\n🧪 NEXT STEP: Test with a new outbound call!");
    console.log("   The AI should now go straight to asking for appointment time.\n");

  } catch (error) {
    console.error("\n❌ Error updating assistant:", error.response?.data || error.message);
    process.exit(1);
  }
}

updateMainAssistant();

