const axios = require('axios');
require('dotenv').config();

const VAPI_API_KEY = process.env.VAPI_API_KEY;
const SQUAD_ID = process.env.VAPI_SQUAD_ID;

async function updateSquad() {
  console.log('🔧 Attempting to refresh Squad configuration...\n');
  
  try {
    // 1. Get current Squad
    console.log('📋 Fetching current Squad configuration...');
    const getResponse = await axios.get(
      `https://api.vapi.ai/squad/${SQUAD_ID}`,
      {
        headers: {
          'Authorization': `Bearer ${VAPI_API_KEY}`,
        },
      }
    );

    const currentSquad = getResponse.data;
    console.log('✅ Current Squad:', currentSquad.name);
    console.log('   Members:', currentSquad.members?.length || 0);

    // 2. Update Squad (even with same data to force cache refresh)
    console.log('\n🔄 Updating Squad to refresh cache...');
    
    const updateResponse = await axios.patch(
      `https://api.vapi.ai/squad/${SQUAD_ID}`,
      {
        name: currentSquad.name,
        members: currentSquad.members,
      },
      {
        headers: {
          'Authorization': `Bearer ${VAPI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('✅ Squad updated successfully');
    console.log('\n📋 Updated Squad members:');
    
    for (const member of updateResponse.data.members || []) {
      console.log(`   - ${member.assistantId}`);
    }

    console.log('\n✅ Squad cache should now be refreshed');
    console.log('🔄 Try making a call now to test if tools work');

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    
    if (error.response?.status === 404) {
      console.error('\n⚠️  Squad not found. Check your VAPI_SQUAD_ID in .env');
    }
  }
}

updateSquad();


