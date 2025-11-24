#!/usr/bin/env node

/**
 * 🔍 DETAILED VAPI ASSISTANT VERIFICATION
 * Checks all assistant configurations, tools, and prompt quality
 */

require('dotenv').config();
const axios = require('axios');

console.log('\n🔍 VAPI ASSISTANT DETAILED VERIFICATION\n');

(async () => {
  try {
    if (!process.env.VAPI_API_KEY || !process.env.VAPI_SQUAD_ID) {
      console.log('❌ Missing VAPI credentials in .env');
      process.exit(1);
    }

    const response = await axios.get(
      `https://api.vapi.ai/squad/${process.env.VAPI_SQUAD_ID}`,
      { headers: { 'Authorization': `Bearer ${process.env.VAPI_API_KEY}` } }
    );

    const squad = response.data;
    console.log('✅ Squad fetched successfully');
    console.log(`   Squad ID: ${squad.id}`);
    console.log(`   Squad Name: ${squad.name || 'Unnamed'}`);
    console.log(`   Members: ${squad.members ? squad.members.length : 0}\n`);

    // Check each member
    if (squad.members && squad.members.length > 0) {
      for (let i = 0; i < squad.members.length; i++) {
        const member = squad.members[i];
        console.log(`\n${'='.repeat(60)}`);
        console.log(`📋 MEMBER #${i + 1}${member.assistant ? ` (${member.assistant.name || 'Unnamed'})` : ''}`);
        console.log('='.repeat(60));

        const assistant = member.assistant || member;

        // Check if this member has assistantId (reference) or full assistant object
        if (member.assistantId && !member.assistant) {
          console.log(`   Type: Reference to assistant ${member.assistantId}`);
          console.log(`   ℹ️  Need to fetch full assistant to check tools`);
          
          try {
            const assistantResponse = await axios.get(
              `https://api.vapi.ai/assistant/${member.assistantId}`,
              { headers: { 'Authorization': `Bearer ${process.env.VAPI_API_KEY}` } }
            );
            
            const fullAssistant = assistantResponse.data;
            console.log(`   ✅ Fetched full assistant: ${fullAssistant.name}`);
            checkAssistant(fullAssistant, i + 1);
          } catch (error) {
            console.log(`   ❌ Failed to fetch assistant: ${error.message}`);
          }
        } else if (assistant) {
          checkAssistant(assistant, i + 1);
        } else {
          console.log(`   ❌ No assistant data available`);
        }
      }
    } else {
      console.log('❌ No members in squad!');
      process.exit(1);
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ VERIFICATION COMPLETE');
    console.log('='.repeat(60) + '\n');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
})();

function checkAssistant(assistant, memberNum) {
  console.log(`\n   📝 Assistant ID: ${assistant.id}`);
  console.log(`   📝 Name: ${assistant.name || 'Unnamed'}`);
  
  // Check model configuration
  if (assistant.model) {
    console.log(`\n   🤖 Model: ${assistant.model.model || 'Not specified'}`);
    console.log(`   🤖 Provider: ${assistant.model.provider || 'Not specified'}`);
    
    // Check system prompt
    if (assistant.model.messages && assistant.model.messages.length > 0) {
      const systemMsg = assistant.model.messages.find(m => m.role === 'system');
      if (systemMsg) {
        const content = systemMsg.content;
        console.log(`\n   📜 System Prompt: ${content.substring(0, 100)}...`);
        console.log(`   📏 Length: ${content.length} characters`);
        
        // Key checks
        console.log(`\n   ✅ Prompt Quality Checks:`);
        console.log(`      Pronunciation (KEE-ee): ${/KEE-ee/i.test(content) ? '✅' : '❌'}`);
        console.log(`      Variables {{...}}: ${/{{.*?}}/i.test(content) ? '✅' : '❌'}`);
        console.log(`      Tool parameters: ${/contactId|appointmentId/i.test(content) ? '✅' : '❌'}`);
        console.log(`      Metadata usage: ${/metadata|variableValues/i.test(content) ? '✅' : '❌'}`);
      } else {
        console.log(`   ⚠️  No system message found`);
      }
    } else {
      console.log(`   ⚠️  No messages configured`);
    }
    
    // Check tools
    if (assistant.model.tools && assistant.model.tools.length > 0) {
      console.log(`\n   🛠️  Tools: ${assistant.model.tools.length} configured`);
      
      const expectedTools = [
        'check_calendar_availability',
        'book_calendar_appointment_keey',
        'cancel_appointment_keey',
        'update_appointment_confirmation'
      ];
      
      for (const toolName of expectedTools) {
        const tool = assistant.model.tools.find(t => t.function && t.function.name === toolName);
        if (tool) {
          console.log(`      ✅ ${toolName}`);
          
          // Check required parameters
          if (tool.function.parameters && tool.function.parameters.properties) {
            const params = Object.keys(tool.function.parameters.properties);
            console.log(`         Parameters: ${params.join(', ')}`);
          }
        } else {
          console.log(`      ❌ ${toolName} - MISSING`);
        }
      }
      
      // List any unexpected tools
      const toolNames = assistant.model.tools.map(t => t.function ? t.function.name : 'unnamed');
      const unexpected = toolNames.filter(name => !expectedTools.includes(name));
      if (unexpected.length > 0) {
        console.log(`\n      ℹ️  Additional tools: ${unexpected.join(', ')}`);
      }
    } else {
      console.log(`\n   ❌ NO TOOLS CONFIGURED!`);
    }
    
    // Check function server
    if (assistant.model.toolIds && assistant.model.toolIds.length > 0) {
      console.log(`\n   🔗 Tool IDs: ${assistant.model.toolIds.join(', ')}`);
    }
  } else {
    console.log(`   ❌ No model configuration`);
  }
  
  // Check firstMessage
  if (assistant.firstMessage) {
    console.log(`\n   💬 First Message: "${assistant.firstMessage.substring(0, 80)}..."`);
  }
  
  // Check voice
  if (assistant.voice) {
    console.log(`\n   🎤 Voice:`);
    console.log(`      Provider: ${assistant.voice.provider || 'Not set'}`);
    console.log(`      Voice ID: ${assistant.voice.voiceId || 'Not set'}`);
  }
}

