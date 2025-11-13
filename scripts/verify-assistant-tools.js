const axios = require('axios');
require('dotenv').config();

const VAPI_API_KEY = process.env.VAPI_API_KEY;

const ASSISTANTS = [
  { id: '0fd5652f-e68d-442f-8362-8f96f00c2b84', name: 'Main Assistant' },
  { id: '2d145a57-81a2-4315-8b29-1a046ad4c0a8', name: 'Services Assistant' },
  { id: 'decc7cb8-7b20-4384-942b-143fa1cc6d29', name: 'Pricing Assistant' },
];

async function verifyAssistantTools() {
  console.log('🔍 Verifying Assistant Tool Configuration...\n');
  
  for (const assistant of ASSISTANTS) {
    try {
      const response = await axios.get(`https://api.vapi.ai/assistant/${assistant.id}`, {
        headers: {
          'Authorization': `Bearer ${VAPI_API_KEY}`,
        },
      });
      
      const config = response.data;
      const toolIds = config.model?.toolIds || [];
      
      console.log(`📋 ${assistant.name} (${assistant.id})`);
      console.log(`   Tools: ${toolIds.length}`);
      
      if (toolIds.length > 0) {
        toolIds.forEach((toolId) => {
          console.log(`      ✅ ${toolId}`);
        });
      } else {
        console.log(`      ❌ NO TOOLS!`);
      }
      console.log('');
      
    } catch (error) {
      console.error(`❌ Error checking ${assistant.name}:`, error.response?.data || error.message);
    }
  }
}

verifyAssistantTools();

