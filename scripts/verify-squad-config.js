const axios = require("axios");
require("dotenv").config();

/**
 * PRE-FLIGHT VERIFICATION SCRIPT
 * Verifies Lead Qualification Squad configuration before making test calls
 * This ensures we don't waste credits on misconfigured calls
 */

const VAPI_API_KEY = process.env.VAPI_API_KEY;
const VAPI_SQUAD_ID = process.env.VAPI_SQUAD_ID;
const VAPI_PHONE_NUMBER_ID = process.env.VAPI_PHONE_NUMBER_ID;
const GHL_CALENDAR_ID = process.env.GHL_CALENDAR_ID;
const SERVER_URL = process.env.RENDER_URL || "https://vapi-keey-voice-assistant.onrender.com";

const REQUIRED_TOOLS = [
  "check_calendar_availability_keey",
  "book_calendar_appointment_keey"
];

// Color codes for terminal output
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  gray: "\x1b[90m"
};

function log(type, message) {
  const icons = {
    success: "✅",
    error: "❌",
    warning: "⚠️ ",
    info: "ℹ️ ",
    section: "═══"
  };
  console.log(`${icons[type] || ""} ${message}`);
}

function section(title) {
  console.log(`\n${"═".repeat(60)}`);
  console.log(`${colors.cyan}${title}${colors.reset}`);
  console.log("═".repeat(60));
}

async function checkEnvironmentVariables() {
  section("1. ENVIRONMENT VARIABLES CHECK");
  
  const required = {
    "VAPI_API_KEY": VAPI_API_KEY,
    "VAPI_SQUAD_ID": VAPI_SQUAD_ID,
    "VAPI_PHONE_NUMBER_ID": VAPI_PHONE_NUMBER_ID,
    "GHL_CALENDAR_ID": GHL_CALENDAR_ID
  };

  let allPresent = true;
  
  for (const [key, value] of Object.entries(required)) {
    if (value) {
      log("success", `${key}: ${colors.gray}${value.substring(0, 20)}...${colors.reset}`);
    } else {
      log("error", `${key}: MISSING`);
      allPresent = false;
    }
  }

  if (!allPresent) {
    log("error", "Some required environment variables are missing!");
    return false;
  }

  log("success", "All required environment variables are present\n");
  return true;
}

async function checkSquadExists() {
  section("2. VAPI SQUAD VERIFICATION");
  
  try {
    log("info", `Checking squad: ${VAPI_SQUAD_ID}`);
    
    const response = await axios.get(
      `https://api.vapi.ai/squad/${VAPI_SQUAD_ID}`,
      {
        headers: {
          "Authorization": `Bearer ${VAPI_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const squad = response.data;
    log("success", `Squad found: ${squad.name || "Unnamed Squad"}`);
    console.log(`   Members: ${squad.members?.length || 0}`);
    
    if (!squad.members || squad.members.length === 0) {
      log("error", "Squad has no members! Add assistants to the squad.");
      return null;
    }

    log("success", "Squad configuration looks good\n");
    return squad;
  } catch (error) {
    log("error", `Squad not found: ${error.response?.data?.message || error.message}`);
    console.log(`\n${colors.yellow}TROUBLESHOOTING:${colors.reset}`);
    console.log("1. Go to https://vapi.ai/dashboard");
    console.log("2. Navigate to 'Squads'");
    console.log("3. Copy the correct Squad ID");
    console.log("4. Update VAPI_SQUAD_ID in your .env file\n");
    return null;
  }
}

async function checkSquadMembers(squad) {
  section("3. SQUAD MEMBERS & TOOLS CHECK");
  
  if (!squad || !squad.members) {
    log("error", "No squad data to check members");
    return false;
  }

  log("info", `Checking ${squad.members.length} squad member(s)...\n`);

  let allMembersValid = true;

  for (let i = 0; i < squad.members.length; i++) {
    const member = squad.members[i];
    const assistantId = member.assistantId || member.assistant?.id;
    
    console.log(`\n   ${colors.cyan}Member ${i + 1}:${colors.reset}`);
    console.log(`   Assistant ID: ${assistantId}`);

    try {
      // Fetch assistant details
      const assistantResponse = await axios.get(
        `https://api.vapi.ai/assistant/${assistantId}`,
        {
          headers: {
            "Authorization": `Bearer ${VAPI_API_KEY}`,
            "Content-Type": "application/json"
          }
        }
      );

      const assistant = assistantResponse.data;
      console.log(`   Name: ${assistant.name || "Unnamed Assistant"}`);
      
      // Check for tool IDs
      const toolIds = assistant.model?.toolIds || [];
      console.log(`   Tools attached: ${toolIds.length}`);

      // The booking tool IDs we're looking for
      const REQUIRED_TOOL_IDS = [
        "22eb8501-80fb-497f-87e8-6f0a88ac5eab",  // check_calendar_availability_keey
        "d25e90cd-e6dc-423f-9719-96ca8c6541cb"   // book_calendar_appointment_keey
      ];

      const hasAvailabilityTool = toolIds.includes(REQUIRED_TOOL_IDS[0]);
      const hasBookingTool = toolIds.includes(REQUIRED_TOOL_IDS[1]);

      if (hasAvailabilityTool && hasBookingTool) {
        log("success", "   Has both booking tools ✓");
      } else {
        log("warning", "   Missing booking tools:");
        if (!hasAvailabilityTool) console.log("      - check_calendar_availability_keey");
        if (!hasBookingTool) console.log("      - book_calendar_appointment_keey");
        allMembersValid = false;
      }

      // Tools are now referenced by IDs, no need to check server URL here

    } catch (error) {
      log("error", `   Failed to fetch assistant: ${error.response?.data?.message || error.message}`);
      allMembersValid = false;
    }
  }

  if (allMembersValid) {
    log("success", "\nAll squad members have required tools\n");
  } else {
    log("error", "\nSome squad members are missing tools!\n");
  }

  return allMembersValid;
}

async function checkPhoneNumber() {
  section("4. PHONE NUMBER VERIFICATION");
  
  try {
    log("info", `Checking phone number: ${VAPI_PHONE_NUMBER_ID}`);
    
    const response = await axios.get(
      `https://api.vapi.ai/phone-number/${VAPI_PHONE_NUMBER_ID}`,
      {
        headers: {
          "Authorization": `Bearer ${VAPI_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const phone = response.data;
    log("success", `Phone number found: ${phone.number}`);
    console.log(`   Provider: ${phone.twilioPhoneNumber ? "Twilio" : phone.vonagePhoneNumber ? "Vonage" : "Unknown"}`);
    console.log(`   Name: ${phone.name || "Unnamed"}`);
    
    log("success", "Phone number is configured correctly\n");
    return true;
  } catch (error) {
    log("error", `Phone number not found: ${error.response?.data?.message || error.message}`);
    console.log(`\n${colors.yellow}TROUBLESHOOTING:${colors.reset}`);
    console.log("1. Go to https://vapi.ai/dashboard");
    console.log("2. Navigate to 'Phone Numbers'");
    console.log("3. Copy the correct Phone Number ID");
    console.log("4. Update VAPI_PHONE_NUMBER_ID in your .env file\n");
    return false;
  }
}

async function checkServerHealth() {
  section("5. SERVER HEALTH CHECK");
  
  try {
    log("info", `Checking server: ${SERVER_URL}`);
    
    const response = await axios.get(`${SERVER_URL}/health`, {
      timeout: 10000
    });

    if (response.data.status === "healthy") {
      log("success", "Server is healthy and responding");
      console.log(`   Service: ${response.data.service}`);
      console.log(`   Timestamp: ${response.data.timestamp}`);
      log("success", "Server is ready to handle tool calls\n");
      return true;
    } else {
      log("warning", "Server responded but status is not 'healthy'");
      return false;
    }
  } catch (error) {
    log("error", `Server health check failed: ${error.message}`);
    console.log(`\n${colors.yellow}TROUBLESHOOTING:${colors.reset}`);
    console.log("1. Check if server is deployed on Render");
    console.log("2. Verify RENDER_URL in .env matches your deployment");
    console.log("3. Check Render logs for errors\n");
    return false;
  }
}

async function checkToolEndpoints() {
  section("6. TOOL ENDPOINTS CHECK");
  
  const webhookUrl = `${SERVER_URL}/webhook/vapi`;
  
  log("info", `Verifying Vapi webhook endpoint: ${webhookUrl}`);
  log("info", "This endpoint should handle all tool calls\n");
  
  // We can't test POST without actual call data, so just verify URL format
  if (webhookUrl.startsWith("https://") && webhookUrl.includes("/webhook/vapi")) {
    log("success", "Webhook URL format is correct");
    log("info", "Endpoint will be tested when first call is made\n");
    return true;
  } else {
    log("error", "Webhook URL format is invalid");
    return false;
  }
}

async function displayTestingInstructions(squad) {
  section("7. NEXT STEPS - READY TO TEST");
  
  console.log(`${colors.green}✅ All pre-flight checks passed!${colors.reset}\n`);
  console.log("Your Lead Qualification Squad is configured correctly.\n");
  
  console.log(`${colors.cyan}TESTING INSTRUCTIONS:${colors.reset}\n`);
  
  console.log("Option 1: Test via GHL Workflow");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("1. Go to GHL → Automations → Workflows");
  console.log("2. Find your 'New Contact Call' workflow");
  console.log("3. Click 'Test Contact' and select your test contact");
  console.log("4. The squad will call the contact's number");
  console.log("5. Answer in GHL Dialer and interact with the AI\n");
  
  console.log("Option 2: Test via Script");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("1. Update scripts/trigger-lead-call.js with test contact details");
  console.log("2. Run: npm run test-lead-call");
  console.log("3. Answer in GHL Dialer when phone rings\n");
  
  console.log(`${colors.cyan}WHAT TO TEST:${colors.reset}\n`);
  console.log("1. ✓ AI introduces Keey and asks about property");
  console.log("2. ✓ AI offers to book a consultation");
  console.log("3. ✓ AI checks calendar availability");
  console.log("4. ✓ AI presents time slot options");
  console.log("5. ✓ AI books the appointment successfully");
  console.log("6. ✓ Appointment appears in GHL calendar\n");
  
  console.log(`${colors.yellow}IMPORTANT REMINDERS:${colors.reset}\n`);
  console.log("• Call will be answered in GHL Dialer, not your personal phone");
  console.log("• Test contact number: +12136064730 (not attached to any Vapi assistant)");
  console.log("• Max call duration: 2 minutes (safety limit)");
  console.log("• If call fails, check Render logs for debugging\n");
  
  console.log("═".repeat(60));
  console.log(`${colors.green}Ready to proceed with testing? (y/n)${colors.reset}`);
  console.log("═".repeat(60));
}

async function runVerification() {
  console.log("\n");
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║                                                            ║");
  console.log("║       🚀 LEAD QUALIFICATION SQUAD PRE-FLIGHT CHECK 🚀      ║");
  console.log("║                                                            ║");
  console.log("║     Verifying configuration before making test calls       ║");
  console.log("║                                                            ║");
  console.log("╚════════════════════════════════════════════════════════════╝");
  console.log("\n");

  const results = {
    envVars: false,
    squad: null,
    squadMembers: false,
    phoneNumber: false,
    server: false,
    endpoints: false
  };

  // Run all checks
  results.envVars = await checkEnvironmentVariables();
  if (!results.envVars) {
    log("error", "\n❌ Cannot proceed without required environment variables");
    process.exit(1);
  }

  results.squad = await checkSquadExists();
  if (!results.squad) {
    log("error", "\n❌ Cannot proceed without valid squad");
    process.exit(1);
  }

  results.squadMembers = await checkSquadMembers(results.squad);
  results.phoneNumber = await checkPhoneNumber();
  results.server = await checkServerHealth();
  results.endpoints = await checkToolEndpoints();

  // Final summary
  section("VERIFICATION SUMMARY");
  
  const checks = [
    { name: "Environment Variables", status: results.envVars },
    { name: "Squad Configuration", status: !!results.squad },
    { name: "Squad Members & Tools", status: results.squadMembers },
    { name: "Phone Number", status: results.phoneNumber },
    { name: "Server Health", status: results.server },
    { name: "Tool Endpoints", status: results.endpoints }
  ];

  console.log("");
  checks.forEach(check => {
    const status = check.status ? `${colors.green}✓ PASS${colors.reset}` : `${colors.red}✗ FAIL${colors.reset}`;
    console.log(`   ${check.name.padEnd(30)} ${status}`);
  });
  console.log("");

  const allPassed = checks.every(c => c.status);

  if (allPassed) {
    await displayTestingInstructions(results.squad);
    process.exit(0);
  } else {
    log("error", "Some checks failed. Please fix the issues above before testing.");
    console.log("\n");
    process.exit(1);
  }
}

// Run the verification
runVerification().catch(error => {
  console.error("\n❌ Verification failed:", error.message);
  process.exit(1);
});

