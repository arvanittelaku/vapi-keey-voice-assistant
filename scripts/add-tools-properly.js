const axios = require("axios");
require("dotenv").config();

/**
 * ADD TOOLS TO ASSISTANTS (Proper Method)
 * Fetches full assistant config, adds tools to model.toolIds, updates assistant
 */

const VAPI_API_KEY = process.env.VAPI_API_KEY;

// KEEY-SPECIFIC TOOL IDs
const TOOL_IDS = [
  "22eb8501-80fb-497f-87e8-6f0a88ac5eab",  // check_calendar_availability_keey
  "d25e90cd-e6dc-423f-9719-96ca8c6541cb"   // book_calendar_appointment_keey
];

const ASSISTANT_IDS = {
  main: process.env.VAPI_MAIN_ASSISTANT_ID,
  services: process.env.VAPI_SERVICES_ASSISTANT_ID,
  pricing: process.env.VAPI_PRICING_ASSISTANT_ID
};

async function addToolsToAssistant(assistantId, assistantName) {
  try {
    console.log(`\n📝 Processing ${assistantName}...`);
    console.log(`   Assistant ID: ${assistantId}`);
    
    // Step 1: Fetch current assistant config
    console.log(`   Fetching current configuration...`);
    const getResponse = await axios.get(
      `https://api.vapi.ai/assistant/${assistantId}`,
      {
        headers: {
          "Authorization": `Bearer ${VAPI_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const currentConfig = getResponse.data;
    console.log(`   ✓ Current config fetched`);
    console.log(`   Current tools: ${currentConfig.model?.toolIds?.length || 0}`);

    // Step 2: Add tool IDs to model config (merge with existing if any)
    const existingToolIds = currentConfig.model?.toolIds || [];
    const newToolIds = [...new Set([...existingToolIds, ...TOOL_IDS])]; // Remove duplicates

    const updatedModel = {
      ...currentConfig.model,
      toolIds: newToolIds
    };

    // Step 3: Update assistant with new tool IDs
    console.log(`   Adding ${newToolIds.length} tools...`);
    const updateResponse = await axios.patch(
      `https://api.vapi.ai/assistant/${assistantId}`,
      {
        model: updatedModel
      },
      {
        headers: {
          "Authorization": `Bearer ${VAPI_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    console.log(`✅ ${assistantName} updated successfully!`);
    console.log(`   Tools attached: ${updateResponse.data.model?.toolIds?.length || 0}`);
    return true;

  } catch (error) {
    console.error(`❌ Error updating ${assistantName}:`);
    console.error(`   ${error.response?.data?.message || error.message}`);
    if (error.response?.data) {
      console.error(`   Details:`, JSON.stringify(error.response.data, null, 2));
    }
    return false;
  }
}

async function main() {
  console.log("\n" + "═".repeat(60));
  console.log("🔧 ADDING TOOLS TO SQUAD ASSISTANTS");
  console.log("═".repeat(60));
  console.log("\n📋 Tools to add:");
  console.log(`   - check_calendar_availability_keey (${TOOL_IDS[0]})`);
  console.log(`   - book_calendar_appointment_keey (${TOOL_IDS[1]})`);
  console.log("\n📋 Assistants to update:");
  console.log(`   1. Main Assistant (${ASSISTANT_IDS.main})`);
  console.log(`   2. Services Assistant (${ASSISTANT_IDS.services})`);
  console.log(`   3. Pricing Assistant (${ASSISTANT_IDS.pricing})`);
  console.log("\n" + "═".repeat(60));

  let successCount = 0;

  // Update each assistant
  if (await addToolsToAssistant(ASSISTANT_IDS.main, "Keey Main Assistant")) {
    successCount++;
  }

  if (await addToolsToAssistant(ASSISTANT_IDS.services, "Keey Services Specialist")) {
    successCount++;
  }

  if (await addToolsToAssistant(ASSISTANT_IDS.pricing, "Keey Pricing Specialist")) {
    successCount++;
  }

  // Summary
  console.log("\n" + "═".repeat(60));
  if (successCount === 3) {
    console.log("✅ ALL ASSISTANTS UPDATED SUCCESSFULLY!");
    console.log("\n📋 NEXT STEPS:");
    console.log("   1. Run: npm run verify-squad-config");
    console.log("   2. If all checks pass, run: npm run test-lead-call");
    console.log("   3. Answer the call in GHL Dialer");
    console.log("   4. Test the booking flow");
  } else {
    console.log(`⚠️  ${successCount}/3 assistants updated successfully`);
    console.log("\n💡 You may need to add tools manually in Vapi dashboard");
  }
  console.log("═".repeat(60));
}

main();

