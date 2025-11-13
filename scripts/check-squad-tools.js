const axios = require('axios');
require('dotenv').config();

const VAPI_API_KEY = process.env.VAPI_API_KEY;
const SQUAD_ID = '7cc6e04f-116c-491c-a5b0-00b430bb24db';

async function checkSquadTools() {
  console.log('🔍 Checking Squad Tool Configuration...\n');
  
  try {
    const response = await axios.get(`https://api.vapi.ai/squad/${SQUAD_ID}`, {
      headers: {
        'Authorization': `Bearer ${VAPI_API_KEY}`,
      },
    });
    
    const squad = response.data;
    
    console.log('📋 Squad Configuration:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log(`Squad ID: ${squad.id}`);
    console.log(`Squad Name: ${squad.name || 'N/A'}\n`);
    
    console.log('👥 Squad Members:');
    if (squad.members && squad.members.length > 0) {
      squad.members.forEach((member, index) => {
        console.log(`\n   ${index + 1}. ${member.assistant?.name || member.assistantId}`);
        console.log(`      Assistant ID: ${member.assistantId}`);
        
        if (member.assistant && member.assistant.model && member.assistant.model.toolIds) {
          console.log(`      Tools: ${member.assistant.model.toolIds.length} tool(s)`);
          member.assistant.model.toolIds.forEach((toolId) => {
            console.log(`         - ${toolId}`);
          });
        } else {
          console.log(`      ❌ NO TOOLS CONFIGURED!`);
        }
      });
    } else {
      console.log('   ❌ No members found in squad!');
    }
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // Check if check_calendar_availability_keey tool is in ANY squad member
    const checkToolId = '22eb8501-80fb-497f-87e8-6f0a88ac5eab';
    const bookToolId = 'd25e90cd-e6dc-423f-9719-96ca8c6541cb';
    
    let hasCheckTool = false;
    let hasBookTool = false;
    
    if (squad.members) {
      squad.members.forEach((member) => {
        const toolIds = member.assistant?.model?.toolIds || [];
        if (toolIds.includes(checkToolId)) hasCheckTool = true;
        if (toolIds.includes(bookToolId)) hasBookTool = true;
      });
    }
    
    console.log('🔧 Tool Status:');
    if (hasCheckTool) {
      console.log('✅ check_calendar_availability_keey is configured in squad');
    } else {
      console.log('❌ check_calendar_availability_keey is MISSING from squad!');
      console.log('   This is why the tool calls fail during live calls!');
    }
    
    if (hasBookTool) {
      console.log('✅ book_calendar_appointment_keey is configured in squad');
    } else {
      console.log('❌ book_calendar_appointment_keey is MISSING from squad!');
    }
    
    if (!hasCheckTool || !hasBookTool) {
      console.log('\n🔧 TO FIX: You need to add the tools to the squad members!');
      console.log('   Run: npm run add-tools-proper');
    }
    
  } catch (error) {
    console.error('❌ Error checking squad configuration:', error.response?.data || error.message);
  }
}

checkSquadTools();

