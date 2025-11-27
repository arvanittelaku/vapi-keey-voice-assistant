/**
 * Attach Tools to Inbound Assistant
 * 
 * This script attaches the 3 required tools to the inbound assistant:
 * 1. contact_create_keey
 * 2. check_calendar_availability_keey
 * 3. book_calendar_appointment_keey
 */

require('dotenv').config();
const VapiClient = require('../src/services/vapi-client');

const INBOUND_ASSISTANT_ID = '36728053-c5f8-48e6-a3fe-33d6c95348ce';

// Tool IDs (these should already exist in your Vapi account)
const TOOL_IDS = {
  contact_create: null,       // Will be found by name
  check_availability: null,   // Will be found by name
  book_appointment: null      // Will be found by name
};

async function attachTools() {
  console.log('\n╔═══════════════════════════════════════════════════════════════╗');
  console.log('║        ATTACH TOOLS TO INBOUND ASSISTANT                       ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  const vapi = new VapiClient();

  try {
    // Step 1: Get current assistant configuration
    console.log('📋 Step 1: Fetching inbound assistant...');
    const assistant = await vapi.getAssistant(INBOUND_ASSISTANT_ID);
    console.log(`✅ Found: ${assistant.name}`);
    console.log(`   Model: ${assistant.model?.model}`);
    console.log(`   Current tools: ${assistant.model?.tools?.length || 0}`);

    // Step 2: Find the tool IDs by listing all tools
    console.log('\n🔍 Step 2: Finding tool IDs...');
    
    // Note: Vapi doesn't have a direct "list tools" endpoint
    // We'll need to manually provide the tool IDs
    // These should be from your Vapi dashboard
    
    console.log('\n⚠️  MANUAL ACTION REQUIRED:');
    console.log('\nTo find your tool IDs, go to:');
    console.log('https://dashboard.vapi.ai → Tools');
    console.log('\nLook for these 3 tools:');
    console.log('1. contact_create_keey (or similar name)');
    console.log('2. check_calendar_availability_keey');
    console.log('3. book_calendar_appointment_keey');
    console.log('\nCopy their IDs and paste them here:');
    console.log('\n--- TOOL IDs NEEDED ---');
    console.log('const TOOL_IDS = {');
    console.log('  contact_create: "PASTE_ID_HERE",');
    console.log('  check_availability: "PASTE_ID_HERE",');
    console.log('  book_appointment: "PASTE_ID_HERE"');
    console.log('};');
    console.log('\nOnce you have the IDs, update this script and run again.');
    console.log('\n--- OR USE VAPI DASHBOARD ---');
    console.log('\nAlternatively, you can manually attach tools in Vapi Dashboard:');
    console.log('1. Go to: https://dashboard.vapi.ai/assistants');
    console.log('2. Click on: "Keey Inbound Lead Assistant"');
    console.log('3. Scroll to "Tools" section');
    console.log('4. Click "Add Tool"');
    console.log('5. Select these 3 tools:');
    console.log('   - contact_create_keey');
    console.log('   - check_calendar_availability_keey');
    console.log('   - book_calendar_appointment_keey');
    console.log('6. Save the assistant');
    console.log('\n✅ That\'s the easiest way!');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.response?.data) {
      console.error('   Details:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

attachTools();

