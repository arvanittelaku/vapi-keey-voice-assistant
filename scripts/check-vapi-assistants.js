#!/usr/bin/env node

/**
 * Script to check all Vapi assistants and their system prompts
 * This will help verify that assistants know how to use the tools correctly
 */

const axios = require('axios');

// You need to provide your Vapi Private API Key here
// Get it from: https://dashboard.vapi.ai/account
const VAPI_API_KEY = process.env.VAPI_API_KEY || 'YOUR_VAPI_PRIVATE_KEY_HERE';

const BASE_URL = 'https://api.vapi.ai';

async function fetchAllAssistants() {
  try {
    console.log('📡 Fetching all assistants from Vapi...\n');

    const response = await axios.get(`${BASE_URL}/assistant`, {
      headers: {
        'Authorization': `Bearer ${VAPI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const assistants = response.data;
    console.log(`✅ Found ${assistants.length} assistant(s)\n`);
    console.log('='.repeat(80));

    for (const assistant of assistants) {
      console.log(`\n🤖 ASSISTANT: ${assistant.name || 'Unnamed'}`);
      console.log(`   ID: ${assistant.id}`);
      console.log(`   Type: ${assistant.model?.provider || 'Unknown'} - ${assistant.model?.model || 'Unknown'}`);
      
      // Check if it's a squad
      if (assistant.squadMembers && assistant.squadMembers.length > 0) {
        console.log(`   🏢 SQUAD with ${assistant.squadMembers.length} members:`);
        
        for (let i = 0; i < assistant.squadMembers.length; i++) {
          const member = assistant.squadMembers[i];
          console.log(`\n      👤 Member ${i + 1}: ${member.assistant?.name || member.assistantId || 'Unknown'}`);
          if (member.assistantDestinations) {
            console.log(`         Destinations: ${JSON.stringify(member.assistantDestinations, null, 2)}`);
          }
        }
      }

      // Check system prompt
      console.log(`\n   📝 SYSTEM PROMPT:`);
      console.log('   ' + '-'.repeat(76));
      if (assistant.model?.messages && assistant.model.messages.length > 0) {
        const systemMessage = assistant.model.messages.find(m => m.role === 'system');
        if (systemMessage) {
          console.log(`   ${systemMessage.content}`);
        } else {
          console.log('   ⚠️  No system message found');
        }
      } else {
        console.log('   ⚠️  No messages configured');
      }
      console.log('   ' + '-'.repeat(76));

      // Check tools
      console.log(`\n   🛠️  TOOLS:`);
      if (assistant.model?.tools && assistant.model.tools.length > 0) {
        for (const tool of assistant.model.tools) {
          if (tool.type === 'function') {
            console.log(`      ✅ ${tool.function?.name || 'Unknown function'}`);
            console.log(`         Description: ${tool.function?.description || 'No description'}`);
            console.log(`         Parameters: ${Object.keys(tool.function?.parameters?.properties || {}).join(', ')}`);
          }
        }
      } else {
        console.log('      ⚠️  No tools configured');
      }

      console.log('\n' + '='.repeat(80));
    }

    // Fetch squads separately if needed
    console.log('\n\n📡 Fetching squads...\n');
    try {
      const squadsResponse = await axios.get(`${BASE_URL}/squad`, {
        headers: {
          'Authorization': `Bearer ${VAPI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      const squads = squadsResponse.data;
      console.log(`✅ Found ${squads.length} squad(s)\n`);

      for (const squad of squads) {
        console.log(`\n🏢 SQUAD: ${squad.name || 'Unnamed'}`);
        console.log(`   ID: ${squad.id}`);
        console.log(`   Members: ${squad.members?.length || 0}`);
        
        if (squad.members && squad.members.length > 0) {
          for (const member of squad.members) {
            console.log(`\n   👤 ${member.assistant?.name || member.assistantId}`);
            if (member.assistant) {
              console.log(`      System Prompt: ${member.assistant.model?.messages?.[0]?.content?.substring(0, 100) || 'N/A'}...`);
            }
          }
        }
      }
    } catch (squadError) {
      console.log('⚠️  Could not fetch squads:', squadError.message);
    }

  } catch (error) {
    console.error('❌ Error fetching assistants:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', JSON.stringify(error.response.data, null, 2));
    }
    
    if (error.message.includes('401') || error.message.includes('403')) {
      console.error('\n💡 TIP: Make sure you set your VAPI_API_KEY correctly');
      console.error('   Get it from: https://dashboard.vapi.ai/account');
      console.error('   Run: VAPI_API_KEY=your_key_here node scripts/check-vapi-assistants.js');
    }
  }
}

// Tool usage analysis
function analyzeToolUsage(systemPrompt, toolNames) {
  console.log('\n\n🔍 TOOL USAGE ANALYSIS:');
  console.log('='.repeat(80));
  
  const expectedTools = [
    'check_calendar_availability_keey',
    'book_calendar_appointment_keey',
    'contact_create_keey',
    'update_appointment_confirmation',
    'cancel_appointment_keey'
  ];

  for (const tool of expectedTools) {
    const mentioned = systemPrompt.toLowerCase().includes(tool.toLowerCase());
    console.log(`   ${mentioned ? '✅' : '❌'} ${tool} ${mentioned ? '(mentioned)' : '(NOT mentioned)'}`);
  }

  // Check for key instructions
  const keyPhrases = [
    { phrase: 'check availability before booking', importance: 'CRITICAL' },
    { phrase: 'natural language', importance: 'IMPORTANT' },
    { phrase: 'contactId', importance: 'IMPORTANT' },
    { phrase: 'appointmentId', importance: 'IMPORTANT' },
    { phrase: 'metadata', importance: 'IMPORTANT' }
  ];

  console.log('\n   Key Instructions:');
  for (const { phrase, importance } of keyPhrases) {
    const found = systemPrompt.toLowerCase().includes(phrase.toLowerCase());
    console.log(`      ${found ? '✅' : '⚠️'} [${importance}] ${phrase}`);
  }
}

// Run the script
if (VAPI_API_KEY === 'YOUR_VAPI_PRIVATE_KEY_HERE') {
  console.error('❌ Please set your VAPI_API_KEY environment variable');
  console.error('\nUsage:');
  console.error('  VAPI_API_KEY=your_key_here node scripts/check-vapi-assistants.js');
  console.error('\nOr add to your .env file:');
  console.error('  VAPI_API_KEY=your_key_here');
  process.exit(1);
}

fetchAllAssistants();

