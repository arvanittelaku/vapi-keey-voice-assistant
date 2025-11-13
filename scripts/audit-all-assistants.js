const axios = require('axios');
require('dotenv').config();

const VAPI_API_KEY = process.env.VAPI_API_KEY;
const SQUAD_ID = '7cc6e04f-116c-491c-a5b0-00b430bb24db';
const PHONE_NUMBER_ID = '03251648-7837-4e7f-a981-b2dfe4f88881';

const REQUIRED_TOOLS = [
  'check_calendar_availability_keey',
  'book_calendar_appointment_keey',
  'transfer_call_keey'
];

async function auditAllAssistants() {
  console.log('🔍 COMPLETE ASSISTANT AUDIT\n');
  console.log('═══════════════════════════════════════════════════════════\n');

  try {
    // Get phone number config
    const phoneResponse = await axios.get(
      `https://api.vapi.ai/phone-number/${PHONE_NUMBER_ID}`,
      {
        headers: {
          'Authorization': `Bearer ${VAPI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('📞 PHONE NUMBER CONFIGURATION:');
    console.log(`   Active Assistant: ${phoneResponse.data.assistantId}`);
    console.log(`   Squad: ${phoneResponse.data.squadId || 'None'}`);
    console.log('');

    // Get squad config
    const squadResponse = await axios.get(
      `https://api.vapi.ai/squad/${SQUAD_ID}`,
      {
        headers: {
          'Authorization': `Bearer ${VAPI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const members = squadResponse.data.members || [];
    console.log(`👥 SQUAD HAS ${members.length} ASSISTANTS\n`);
    console.log('═══════════════════════════════════════════════════════════\n');

    const issues = [];
    const assistantIds = members.map(m => m.assistantId);

    // Check each assistant
    for (let i = 0; i < assistantIds.length; i++) {
      const assistantId = assistantIds[i];
      
      const assistantResponse = await axios.get(
        `https://api.vapi.ai/assistant/${assistantId}`,
        {
          headers: {
            'Authorization': `Bearer ${VAPI_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const assistant = assistantResponse.data;
      const voice = assistant.voice;
      const tools = assistant.model?.tools || [];
      const serverMessages = assistant.serverMessages || [];

      console.log(`${i + 1}. ${assistant.name}`);
      console.log(`   ID: ${assistant.id}`);
      console.log(`   Voice: ${voice.provider} (${voice.voiceId || voice.model})`);
      console.log(`   Tools: ${tools.length} configured`);
      console.log(`   Server Messages: ${serverMessages.join(', ') || 'NONE'}`);

      // Check for issues
      if (voice.provider === 'openai') {
        issues.push({
          assistant: assistant.name,
          id: assistantId,
          issue: 'WRONG_VOICE',
          details: `Using OpenAI TTS (${voice.voiceId || voice.model}) - will crash calls`
        });
        console.log(`   ❌ ISSUE: Using OpenAI TTS - will crash`);
      } else {
        console.log(`   ✅ Voice OK`);
      }

      // Check tools
      const toolNames = tools.map(t => t.function?.name || t.type).filter(Boolean);
      const missingTools = REQUIRED_TOOLS.filter(req => !toolNames.includes(req));
      
      if (missingTools.length > 0) {
        issues.push({
          assistant: assistant.name,
          id: assistantId,
          issue: 'MISSING_TOOLS',
          details: `Missing: ${missingTools.join(', ')}`
        });
        console.log(`   ❌ ISSUE: Missing tools: ${missingTools.join(', ')}`);
      } else {
        console.log(`   ✅ All required tools present`);
      }

      // Check serverMessages
      if (!serverMessages.includes('tool-calls')) {
        issues.push({
          assistant: assistant.name,
          id: assistantId,
          issue: 'MISSING_SERVER_MESSAGES',
          details: 'Missing "tool-calls" in serverMessages'
        });
        console.log(`   ❌ ISSUE: Missing "tool-calls" in serverMessages`);
      } else {
        console.log(`   ✅ serverMessages OK`);
      }

      console.log('');
    }

    console.log('═══════════════════════════════════════════════════════════\n');
    
    if (issues.length === 0) {
      console.log('✅ NO ISSUES FOUND - ALL ASSISTANTS CONFIGURED CORRECTLY!\n');
    } else {
      console.log(`❌ FOUND ${issues.length} ISSUES:\n`);
      
      const voiceIssues = issues.filter(i => i.issue === 'WRONG_VOICE');
      const toolIssues = issues.filter(i => i.issue === 'MISSING_TOOLS');
      const serverMessageIssues = issues.filter(i => i.issue === 'MISSING_SERVER_MESSAGES');

      if (voiceIssues.length > 0) {
        console.log(`🎤 VOICE PROVIDER ISSUES (${voiceIssues.length}):`);
        voiceIssues.forEach(issue => {
          console.log(`   - ${issue.assistant}: ${issue.details}`);
        });
        console.log('');
      }

      if (toolIssues.length > 0) {
        console.log(`🔧 MISSING TOOLS (${toolIssues.length}):`);
        toolIssues.forEach(issue => {
          console.log(`   - ${issue.assistant}: ${issue.details}`);
        });
        console.log('');
      }

      if (serverMessageIssues.length > 0) {
        console.log(`📡 SERVER MESSAGES ISSUES (${serverMessageIssues.length}):`);
        serverMessageIssues.forEach(issue => {
          console.log(`   - ${issue.assistant}: ${issue.details}`);
        });
        console.log('');
      }

      console.log('💡 SOLUTION:');
      console.log('   Run: npm run fix-all-assistants');
      console.log('');
    }

    console.log('═══════════════════════════════════════════════════════════');

    // Save issues for the fix script
    require('fs').writeFileSync(
      'temp-assistant-issues.json',
      JSON.stringify({ assistantIds, issues }, null, 2)
    );

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

auditAllAssistants();

