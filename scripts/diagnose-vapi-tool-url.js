const axios = require('axios');
require('dotenv').config();

const VAPI_API_KEY = process.env.VAPI_API_KEY;
const SQUAD_ID = process.env.VAPI_SQUAD_ID;

async function diagnoseToolConfiguration() {
  console.log('🔍 Diagnosing Tool URL Configuration\n');
  console.log('═══════════════════════════════════════════════════════════\n');

  try {
    // 1. Get Squad configuration
    console.log('📋 Fetching Squad Configuration...');
    const squadResponse = await axios.get(
      `https://api.vapi.ai/squad/${SQUAD_ID}`,
      {
        headers: {
          'Authorization': `Bearer ${VAPI_API_KEY}`,
        },
      }
    );

    const squad = squadResponse.data;
    console.log(`✅ Squad: ${squad.name || 'Unnamed Squad'}`);
    console.log(`   Members: ${squad.members?.length || 0}\n`);

    // 2. For each member, check their tools
    for (const member of squad.members || []) {
      const assistantId = member.assistantId;
      
      console.log(`\n📋 Checking Assistant: ${assistantId}`);
      
      // Get assistant details
      const assistantResponse = await axios.get(
        `https://api.vapi.ai/assistant/${assistantId}`,
        {
          headers: {
            'Authorization': `Bearer ${VAPI_API_KEY}`,
          },
        }
      );

      const assistant = assistantResponse.data;
      console.log(`   Name: ${assistant.name || 'Unnamed'}`);
      
      const toolIds = assistant.model?.toolIds || [];
      console.log(`   Tool IDs: ${toolIds.length}`);

      if (toolIds.length === 0) {
        console.log('   ⚠️  NO TOOLS ATTACHED!\n');
        continue;
      }

      // Check each tool's configuration
      for (const toolId of toolIds) {
        const toolResponse = await axios.get(
          `https://api.vapi.ai/tool/${toolId}`,
          {
            headers: {
              'Authorization': `Bearer ${VAPI_API_KEY}`,
            },
          }
        );

        const tool = toolResponse.data;
        const toolName = tool.function?.name || tool.type;
        
        console.log(`\n   🔧 Tool: ${toolName}`);
        console.log(`      ID: ${toolId}`);
        console.log(`      Type: ${tool.type}`);

        if (tool.type === 'function' && tool.server) {
          console.log(`      Server URL: ${tool.server.url}`);
          console.log(`      Timeout: ${tool.server.timeoutSeconds}s`);
          
          // Check if URL is correct
          const expectedURL = 'https://vapi-keey-voice-assistant.onrender.com/webhook/vapi';
          if (tool.server.url !== expectedURL) {
            console.log(`      ❌ WRONG URL! Expected: ${expectedURL}`);
          } else {
            console.log(`      ✅ URL is correct`);
          }

          // Check if server is reachable
          try {
            console.log(`      Testing server reachability...`);
            const startTime = Date.now();
            await axios.get(`${tool.server.url.replace('/webhook/vapi', '/health')}`, {
              timeout: 5000
            });
            const endTime = Date.now();
            console.log(`      ✅ Server responded in ${endTime - startTime}ms`);
          } catch (error) {
            console.log(`      ❌ Server unreachable: ${error.message}`);
          }
        }
      }
    }

    console.log('\n\n═══════════════════════════════════════════════════════════');
    console.log('🔍 DIAGNOSIS COMPLETE');
    console.log('═══════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

diagnoseToolConfiguration();

