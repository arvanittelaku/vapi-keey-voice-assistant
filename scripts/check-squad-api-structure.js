const axios = require('axios');
require('dotenv').config();

const VAPI_API_KEY = process.env.VAPI_API_KEY;
const SQUAD_ID = process.env.VAPI_SQUAD_ID;

async function checkSquadStructure() {
  console.log('🔍 DEEP SQUAD STRUCTURE ANALYSIS\n');
  
  try {
    const response = await axios.get(
      `https://api.vapi.ai/squad/${SQUAD_ID}`,
      {
        headers: { 'Authorization': `Bearer ${VAPI_API_KEY}` }
      }
    );

    const squad = response.data;
    
    console.log('📋 FULL SQUAD CONFIGURATION:');
    console.log('═══════════════════════════════════════════════════════════\n');
    console.log(JSON.stringify(squad, null, 2));
    console.log('\n═══════════════════════════════════════════════════════════\n');
    
    // Analyze what's in the Squad
    console.log('📊 SQUAD ANALYSIS:');
    console.log(`Name: ${squad.name}`);
    console.log(`ID: ${squad.id}`);
    console.log(`Members: ${squad.members?.length || 0}\n`);
    
    // Check if Squad has its own tool configuration
    if (squad.tools || squad.toolIds) {
      console.log('⚠️  FOUND: Squad has its own tool configuration!');
      console.log('   This might override member assistant tools!\n');
      console.log('   Squad tools:', squad.tools || squad.toolIds);
    } else {
      console.log('✅ Squad does NOT have separate tool configuration');
      console.log('   Should inherit from member assistants\n');
    }
    
    // Check member configuration
    console.log('👥 MEMBER CONFIGURATION:');
    squad.members?.forEach((member, idx) => {
      console.log(`\n   Member ${idx + 1}:`);
      console.log(`   - Assistant ID: ${member.assistantId}`);
      console.log(`   - Has overrides: ${Object.keys(member.assistantOverrides || {}).length > 0 ? 'YES' : 'NO'}`);
      
      if (member.assistantOverrides) {
        console.log(`   - Override keys:`, Object.keys(member.assistantOverrides));
      }
    });

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

checkSquadStructure();


