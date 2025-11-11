const axios = require("axios");
require("dotenv").config();

const VAPI_API_KEY = process.env.VAPI_API_KEY;

const TOOL_IDS = {
  checkCalendar: "22eb8501-80fb-497f-87e8-6f0a88ac5eab",
  bookAppointment: "d25e90cd-e6dc-423f-9719-96ca8c6541cb"
};

async function checkToolParameters() {
  console.log("\n════════════════════════════════════════════════════════════");
  console.log("🔍 CHECKING VAPI TOOL PARAMETER DEFINITIONS");
  console.log("════════════════════════════════════════════════════════════\n");

  for (const [name, toolId] of Object.entries(TOOL_IDS)) {
    try {
      console.log(`\n📋 Fetching: ${name} (${toolId})`);
      
      const response = await axios.get(
        `https://api.vapi.ai/tool/${toolId}`,
        {
          headers: {
            Authorization: `Bearer ${VAPI_API_KEY}`
          }
        }
      );

      const tool = response.data;
      console.log(`   Name: ${tool.function?.name || tool.name}`);
      console.log(`   Description: ${tool.function?.description || tool.description}`);
      
      if (tool.function?.parameters) {
        console.log(`\n   📝 PARAMETERS:`);
        const params = tool.function.parameters;
        console.log(`   Required: ${JSON.stringify(params.required || [])}`);
        console.log(`\n   Properties:`);
        for (const [paramName, paramDef] of Object.entries(params.properties || {})) {
          console.log(`      - ${paramName}: ${paramDef.type}`);
          console.log(`        Description: ${paramDef.description || 'N/A'}`);
        }
      }

      console.log("\n" + "─".repeat(60));

    } catch (error) {
      console.error(`❌ Error fetching tool ${name}:`, error.response?.data || error.message);
    }
  }

  console.log("\n════════════════════════════════════════════════════════════");
  console.log("🔍 COMPARING WITH SERVER EXPECTATIONS");
  console.log("════════════════════════════════════════════════════════════\n");

  console.log("📋 check_calendar_availability_keey:");
  console.log("   Vapi expects: requestedDate, requestedTime, timezone");
  console.log("   Server expects: date, timezone");
  console.log("   ⚠️  MISMATCH! Need to update server or Vapi tool definition\n");

  console.log("📋 book_calendar_appointment_keey:");
  console.log("   Vapi expects: bookingDate, bookingTime, timezone, fullName, email, phone");
  console.log("   Server expects: bookingDate, bookingTime, timezone, fullName, email, phone OR startTime");
  console.log("   ✅ Should match (if Vapi uses bookingDate/bookingTime format)\n");

  console.log("\n💡 RECOMMENDATION:");
  console.log("   Update the server's checkCalendarAvailability function to accept");
  console.log("   'requestedDate' and 'requestedTime' instead of just 'date'\n");
}

checkToolParameters();

