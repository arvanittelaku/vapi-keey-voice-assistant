const axios = require('axios');
const fs = require('fs');
require('dotenv').config();

const VAPI_API_KEY = process.env.VAPI_API_KEY;

async function fixAllAssistants() {
  console.log('🔧 FIXING ALL ASSISTANTS\n');
  console.log('═══════════════════════════════════════════════════════════\n');

  try {
    // Load issues from audit
    if (!fs.existsSync('temp-assistant-issues.json')) {
      console.log('❌ No audit data found. Run: npm run audit-all');
      return;
    }

    const data = JSON.parse(fs.readFileSync('temp-assistant-issues.json', 'utf8'));
    const { assistantIds, issues } = data;

    console.log(`🎯 Fixing ${assistantIds.length} assistants...\n`);

    let fixed = 0;

    for (const assistantId of assistantIds) {
      // Get current assistant config
      const getResponse = await axios.get(
        `https://api.vapi.ai/assistant/${assistantId}`,
        {
          headers: {
            'Authorization': `Bearer ${VAPI_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const assistant = getResponse.data;
      const assistantIssues = issues.filter(i => i.id === assistantId);

      if (assistantIssues.length === 0) {
        console.log(`✅ ${assistant.name} - No issues, skipping`);
        continue;
      }

      console.log(`🔄 Fixing ${assistant.name}...`);

      const updates = {};

      // Fix voice if needed
      if (assistantIssues.some(i => i.issue === 'WRONG_VOICE')) {
        updates.voice = {
          provider: 'deepgram',
          voiceId: 'asteria'
        };
        console.log('   - Updating voice to Deepgram');
      }

      // Fix serverMessages if needed
      if (assistantIssues.some(i => i.issue === 'MISSING_SERVER_MESSAGES')) {
        const currentServerMessages = assistant.serverMessages || [];
        const newServerMessages = [...new Set([...currentServerMessages, 'tool-calls', 'function-call'])];
        updates.serverMessages = newServerMessages;
        console.log('   - Adding tool-calls to serverMessages');
      }

      // Apply updates
      if (Object.keys(updates).length > 0) {
        await axios.patch(
          `https://api.vapi.ai/assistant/${assistantId}`,
          updates,
          {
            headers: {
              'Authorization': `Bearer ${VAPI_API_KEY}`,
              'Content-Type': 'application/json'
            }
          }
        );
        fixed++;
        console.log(`   ✅ Fixed!\n`);
      }
    }

    console.log('═══════════════════════════════════════════════════════════');
    console.log(`🎉 FIXED ${fixed} ASSISTANTS!\n`);
    console.log('🧪 NEXT STEP: Make a test call');
    console.log('   All assistants now use Deepgram voice');
    console.log('   All assistants have correct serverMessages');
    console.log('═══════════════════════════════════════════════════════════');

    // Clean up temp file
    fs.unlinkSync('temp-assistant-issues.json');

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

fixAllAssistants();

