require('dotenv').config();
const axios = require('axios');

const VAPI_API_KEY = process.env.VAPI_PRIVATE_KEY || 'bd473524-64a6-43a4-ab2f-fc1d2cd741e2';
const INBOUND_ASSISTANT_ID = '36728053-c5f8-48e6-a3fe-33d6c95348ce'; // From previous check

async function checkInboundAssistant() {
  console.log('\n📋 Checking Keey Inbound Lead Assistant Configuration...\n');

  try {
    const response = await axios.get(`https://api.vapi.ai/assistant/${INBOUND_ASSISTANT_ID}`, {
      headers: {
        'Authorization': `Bearer ${VAPI_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    const assistant = response.data;

    console.log(`✅ Assistant: "${assistant.name}"`);
    console.log(`   ID: ${assistant.id}`);
    console.log(`   Model: ${assistant.model?.provider || 'Unknown'} - ${assistant.model?.model || 'Unknown'}`);
    console.log(`   Voice: ${assistant.voice?.provider || 'Unknown'}`);
    
    console.log(`\n🛠️  Tools Configured:`);
    
    if (!assistant.toolIds || assistant.toolIds.length === 0) {
      console.log('   ❌ NO TOOLS ASSIGNED!');
      console.log('   ⚠️  This is likely why the assistant cannot answer calls properly!\n');
      
      console.log('📝 Required tools for Inbound Assistant:');
      console.log('   - contact_create_keey (to save lead info)');
      console.log('   - check_calendar_availability_keey (to check available slots)');
      console.log('   - book_calendar_appointment_keey (to book appointments)');
      
      return false;
    }

    console.log(`   ✅ ${assistant.toolIds.length} tool(s) assigned:`);
    
    // Fetch tool details
    for (const toolId of assistant.toolIds) {
      try {
        const toolResponse = await axios.get(`https://api.vapi.ai/tool/${toolId}`, {
          headers: {
            'Authorization': `Bearer ${VAPI_API_KEY}`,
            'Content-Type': 'application/json',
          },
        });
        
        const toolName = toolResponse.data.function?.name || toolResponse.data.name || 'Unknown';
        console.log(`      - ${toolName}`);
      } catch (err) {
        console.log(`      - Tool ID: ${toolId} (could not fetch details)`);
      }
    }

    console.log(`\n✅ First Message:`);
    if (assistant.firstMessage) {
      console.log(`   "${assistant.firstMessage}"`);
    } else {
      console.log(`   ⚠️  No first message configured`);
    }

    console.log(`\n✅ System Prompt Preview:`);
    const promptPreview = assistant.messages?.[0]?.content?.substring(0, 200) || 'No prompt found';
    console.log(`   ${promptPreview}...`);

    return true;

  } catch (error) {
    console.error('❌ Error fetching assistant:', error.response?.data || error.message);
    return false;
  }
}

checkInboundAssistant();

