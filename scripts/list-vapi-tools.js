const axios = require("axios");
require("dotenv").config();

/**
 * LIST ALL VAPI TOOLS
 * Fetches all tools from Vapi to find the booking tool IDs
 */

const VAPI_API_KEY = process.env.VAPI_API_KEY;

async function listTools() {
  console.log("\n" + "═".repeat(60));
  console.log("🔧 VAPI TOOLS");
  console.log("═".repeat(60));
  
  try {
    console.log("\n🔍 Fetching tools from Vapi...\n");
    
    const response = await axios.get(
      "https://api.vapi.ai/tool",
      {
        headers: {
          "Authorization": `Bearer ${VAPI_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const tools = response.data;
    
    if (!tools || tools.length === 0) {
      console.log("❌ No tools found in your Vapi account");
      console.log("\n💡 You need to create tools in Vapi:");
      console.log("   1. Go to https://vapi.ai/dashboard/tools");
      console.log("   2. Import tools from your tool definition files");
      console.log("   3. Or create them manually\n");
      return;
    }

    console.log(`✅ Found ${tools.length} tool(s):\n`);
    console.log("═".repeat(60));

    let checkCalendarTool = null;
    let bookAppointmentTool = null;

    tools.forEach((tool, index) => {
      console.log(`\n🔧 Tool ${index + 1}:`);
      
      // Handle different tool types (function, async, etc.)
      const toolName = tool.function?.name || tool.async?.url?.split('/').pop() || tool.name || "Unnamed";
      const toolDescription = tool.function?.description || tool.async?.description || tool.description || "No description";
      
      console.log(`   Name: ${toolName}`);
      console.log(`   ID: ${tool.id}`);
      console.log(`   Type: ${tool.type || "unknown"}`);
      console.log(`   Description: ${toolDescription.substring(0, 80)}${toolDescription.length > 80 ? "..." : ""}`);
      
      // Check if this is one of our booking tools
      if (toolName.includes("check_calendar_availability") || toolName.includes("availability")) {
        checkCalendarTool = tool;
        console.log(`   👉 THIS IS THE AVAILABILITY CHECK TOOL!`);
      }
      
      if (toolName.includes("book_calendar_appointment") || toolName.includes("book_appointment")) {
        bookAppointmentTool = tool;
        console.log(`   👉 THIS IS THE BOOKING TOOL!`);
      }
    });

    console.log("\n" + "═".repeat(60));
    
    if (checkCalendarTool && bookAppointmentTool) {
      console.log("\n✅ FOUND BOTH REQUIRED TOOLS!");
      console.log("\n📋 Copy these IDs to add-tools-to-assistants.js:");
      console.log("═".repeat(60));
      console.log(`\nconst TOOL_IDS = {`);
      console.log(`  checkCalendar: "${checkCalendarTool.id}",`);
      console.log(`  bookAppointment: "${bookAppointmentTool.id}"`);
      console.log(`}\n`);
      console.log("═".repeat(60));
      console.log("\n📋 NEXT STEPS:");
      console.log("   1. Copy the TOOL_IDS object above");
      console.log("   2. Update scripts/add-tools-to-assistants.js");
      console.log("   3. Run: npm run add-tools");
      console.log("   4. Run: npm run verify-squad-config");
      console.log("   5. If all checks pass, test the call!\n");
    } else {
      console.log("\n⚠️  WARNING: Could not find both booking tools!");
      if (!checkCalendarTool) {
        console.log("   Missing: check_calendar_availability_keey");
      }
      if (!bookAppointmentTool) {
        console.log("   Missing: book_calendar_appointment_keey");
      }
      console.log("\n💡 You may need to create these tools in Vapi:");
      console.log("   1. Go to https://vapi.ai/dashboard/tools");
      console.log("   2. Create new tool → Custom Function");
      console.log("   3. Use the definitions from tool-definitions/ folder\n");
    }
    
  } catch (error) {
    console.error("\n❌ Error fetching tools:", error.response?.data?.message || error.message);
    
    if (error.response?.status === 401) {
      console.error("\n💡 Authentication failed:");
      console.error("   - Check if VAPI_API_KEY is correct in .env");
      console.error("   - Verify your Vapi API key hasn't expired");
    }
  }
}

listTools();

