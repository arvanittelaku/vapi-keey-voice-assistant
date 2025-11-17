require('dotenv').config();
const axios = require('axios');

const VAPI_API_KEY = process.env.VAPI_PRIVATE_KEY || 'bd473524-64a6-43a4-ab2f-fc1d2cd741e2';
const INBOUND_ASSISTANT_ID = '36728053-c5f8-48e6-a3fe-33d6c95348ce';

// Tool IDs needed for Inbound Assistant
const TOOL_IDS = [
  '39f85666-77ed-4481-920b-7599fcd4a968', // contact_create_keey
  '22eb8501-80fb-497f-87e8-6f0a88ac5eab', // check_calendar_availability_keey
  'd2e07bdb-ead7-4df6-a2d5-00efb1b5e87a'  // book_calendar_appointment_keey
];

async function assignTools() {
  console.log('\n🔧 Assigning tools to Keey Inbound Lead Assistant...\n');

  try {
    // Fetch current configuration
    console.log('📡 Fetching current assistant configuration...');
    const response = await axios.get(`https://api.vapi.ai/assistant/${INBOUND_ASSISTANT_ID}`, {
      headers: {
        'Authorization': `Bearer ${VAPI_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    const assistant = response.data;
    console.log(`✅ Current assistant: "${assistant.name}"`);
    console.log(`   Current tools: ${assistant.toolIds?.length || 0}`);

    // Update with tools
    console.log('\n🔄 Updating assistant with required tools...');
    
    const updatePayload = {
      toolIds: TOOL_IDS
    };

    const updateResponse = await axios.patch(
      `https://api.vapi.ai/assistant/${INBOUND_ASSISTANT_ID}`,
      updatePayload,
      {
        headers: {
          'Authorization': `Bearer ${VAPI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('✅ Tools assigned successfully!');
    console.log(`   New tool count: ${updateResponse.data.toolIds?.length || 0}`);
    
    console.log('\n📋 Assigned Tools:');
    console.log('   - contact_create_keey (save lead information)');
    console.log('   - check_calendar_availability_keey (check available slots)');
    console.log('   - book_calendar_appointment_keey (book appointments)');

    console.log('\n✅ Inbound Assistant is now ready to handle calls!');
    console.log('\n🎯 Next Step: Try calling +447402769361 again');

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    process.exit(1);
  }
}

assignTools();

