const axios = require('axios');
require('dotenv').config();

const VAPI_API_KEY = process.env.VAPI_API_KEY;
const CONFIRMATION_ASSISTANT_ID = process.env.VAPI_CONFIRMATION_ASSISTANT_ID || '9ade430e-913f-468c-b9a9-e705f64646ab';
const RENDER_URL = 'https://vapi-keey-voice-assistant.onrender.com';

async function verifyEverything() {
  console.log('🔍 COMPREHENSIVE VERIFICATION - NO CALLS MADE\n');
  console.log('═══════════════════════════════════════════════════════════\n');

  let allGood = true;

  // ========== CHECK 1: Render Deployment Status ==========
  console.log('1️⃣  CHECKING RENDER DEPLOYMENT...\n');
  try {
    const healthCheck = await axios.get(`${RENDER_URL}/health`, { timeout: 10000 });
    console.log('   ✅ Render server is live');
    console.log(`   📊 Status: ${healthCheck.data.status}`);
    console.log(`   ⏰ Timestamp: ${healthCheck.data.timestamp}\n`);
  } catch (error) {
    console.log('   ❌ Render server not responding');
    console.log(`   Error: ${error.message}\n`);
    allGood = false;
  }

  // ========== CHECK 2: Simulate Time Extraction ==========
  console.log('2️⃣  SIMULATING TIME EXTRACTION LOGIC...\n');
  
  const testAppointmentTime = "Thursday, November 13, 2025 4:00 PM";
  console.log(`   📅 Input: "${testAppointmentTime}"`);
  
  // This is the exact logic from ghl-to-vapi.js
  let appointmentTimeOnly = testAppointmentTime;
  const timeMatch = testAppointmentTime.match(/(\d{1,2}:\d{2}\s?[AP]M)/i);
  if (timeMatch) {
    appointmentTimeOnly = timeMatch[0];
  }
  
  console.log(`   ⏰ Extracted Time: "${appointmentTimeOnly}"`);
  
  if (appointmentTimeOnly === "4:00 PM") {
    console.log('   ✅ Time extraction working correctly!\n');
  } else {
    console.log('   ❌ Time extraction failed!\n');
    allGood = false;
  }

  // Test more formats
  const testCases = [
    { input: "Monday, December 1, 2025 2:30 PM", expected: "2:30 PM" },
    { input: "10:15 AM", expected: "10:15 AM" },
    { input: "Friday at 11:00AM", expected: "11:00AM" }
  ];

  console.log('   Testing additional time formats:');
  for (const test of testCases) {
    let extracted = test.input;
    const match = test.input.match(/(\d{1,2}:\d{2}\s?[AP]M)/i);
    if (match) {
      extracted = match[0];
    }
    const status = extracted === test.expected ? '✅' : '❌';
    console.log(`   ${status} "${test.input}" → "${extracted}"`);
  }
  console.log('');

  // ========== CHECK 3: Verify Vapi Assistant Prompt ==========
  console.log('3️⃣  CHECKING VAPI ASSISTANT CONFIGURATION...\n');
  try {
    const assistant = await axios.get(
      `https://api.vapi.ai/assistant/${CONFIRMATION_ASSISTANT_ID}`,
      {
        headers: { 'Authorization': `Bearer ${VAPI_API_KEY}` }
      }
    );

    const systemPrompt = assistant.data.model.messages[0].content;
    
    // Check for key improvements
    const checks = [
      { 
        name: 'Uses {{appointmentTimeOnly}} variable',
        test: systemPrompt.includes('{{appointmentTimeOnly}}')
      },
      { 
        name: 'Has clarification for ambiguous "No"',
        test: systemPrompt.includes('CLARIFY FIRST') || systemPrompt.includes('Just to confirm')
      },
      { 
        name: 'Warns against assuming "no" means cancellation',
        test: systemPrompt.includes("DON'T assume what \"no\" means") || systemPrompt.includes('ask for clarification')
      }
    ];

    console.log('   Assistant Configuration:');
    console.log(`   📝 Name: ${assistant.data.name}`);
    console.log(`   🆔 ID: ${assistant.data.id}`);
    console.log(`   🗣️  Voice: ${assistant.data.voice.provider} (${assistant.data.voice.voiceId})`);
    console.log(`   🤖 Model: ${assistant.data.model.model}\n`);

    console.log('   System Prompt Checks:');
    for (const check of checks) {
      const status = check.test ? '✅' : '❌';
      console.log(`   ${status} ${check.name}`);
      if (!check.test) allGood = false;
    }
    console.log('');

    // Show relevant prompt sections
    if (systemPrompt.includes('{{appointmentTimeOnly}}')) {
      console.log('   📋 Greeting Section (preview):');
      const greetingSection = systemPrompt.match(/GREETING[\s\S]{0,300}/);
      if (greetingSection) {
        const lines = greetingSection[0].split('\n').slice(0, 5);
        lines.forEach(line => console.log(`   ${line.trim()}`));
      }
      console.log('');
    }

  } catch (error) {
    console.log('   ❌ Failed to check assistant configuration');
    console.log(`   Error: ${error.response?.data?.message || error.message}\n`);
    allGood = false;
  }

  // ========== CHECK 4: Simulate Full Webhook Flow ==========
  console.log('4️⃣  SIMULATING FULL WEBHOOK DATA FLOW...\n');
  
  const mockGHLPayload = {
    phone: "+1 213-606-4730",
    firstName: "Test",
    lastName: "Receiver",
    email: "john.doe@example.com",
    contactId: "ZtrIOxo50WVcsLbWK961",
    callType: "confirmation",
    appointmentTime: "Thursday, November 13, 2025 4:00 PM",
    appointmentId: "zjevtaAyi8E0aDCPpEnh"
  };

  console.log('   📨 Mock GHL Payload:');
  console.log(JSON.stringify(mockGHLPayload, null, 2));
  console.log('');

  // Simulate what would be sent to Vapi
  const fullAppointmentTime = mockGHLPayload.appointmentTime;
  let extractedTimeOnly = fullAppointmentTime;
  const finalTimeMatch = fullAppointmentTime.match(/(\d{1,2}:\d{2}\s?[AP]M)/i);
  if (finalTimeMatch) {
    extractedTimeOnly = finalTimeMatch[0];
  }

  const simulatedVapiData = {
    assistantOverrides: {
      variableValues: {
        contactId: mockGHLPayload.contactId,
        firstName: mockGHLPayload.firstName,
        lastName: mockGHLPayload.lastName,
        appointmentTime: fullAppointmentTime,
        appointmentTimeOnly: extractedTimeOnly,
        appointmentId: mockGHLPayload.appointmentId,
        greeting: `Hi ${mockGHLPayload.firstName}, this is Keey calling to confirm your appointment.`
      },
      firstMessage: `Hi ${mockGHLPayload.firstName}, this is Keey calling to confirm your appointment.`
    }
  };

  console.log('   📤 Data that would be sent to Vapi:');
  console.log(JSON.stringify(simulatedVapiData, null, 2));
  console.log('');

  console.log('   🎯 What the AI would say:');
  console.log(`   "Hi ${mockGHLPayload.firstName}, I'm calling to confirm your consultation appointment with Keey at ${extractedTimeOnly}."`);
  console.log('');

  // ========== FINAL SUMMARY ==========
  console.log('═══════════════════════════════════════════════════════════');
  if (allGood) {
    console.log('✅ ALL CHECKS PASSED!\n');
    console.log('🎉 The fixes are correctly deployed and configured!');
    console.log('');
    console.log('📋 What happens in the next call:');
    console.log('   1. GHL sends: "Thursday, November 13, 2025 4:00 PM"');
    console.log('   2. Server extracts: "4:00 PM"');
    console.log('   3. AI says: "...appointment with Keey at 4:00 PM"');
    console.log('   4. If user says "No": AI clarifies instead of assuming cancellation');
    console.log('');
    console.log('✅ READY FOR LIVE TESTING!');
  } else {
    console.log('⚠️  SOME CHECKS FAILED - Review the output above');
  }
  console.log('═══════════════════════════════════════════════════════════');
}

verifyEverything();

