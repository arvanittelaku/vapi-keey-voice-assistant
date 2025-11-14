#!/usr/bin/env node

/**
 * Script to check the Keey Property Management Squad and its members
 */

const axios = require('axios');

const VAPI_API_KEY = process.env.VAPI_API_KEY || 'bd473524-64a6-43a4-ab2f-fc1d2cd741e2';
const BASE_URL = 'https://api.vapi.ai';
const KEEY_SQUAD_ID = '7cc6e04f-116c-491c-a5b0-00b430bb24db';

async function checkKeeySquad() {
  try {
    console.log('🔍 Fetching Keey Property Management Squad details...\n');
    console.log('='.repeat(80));

    // Fetch the squad
    const squadResponse = await axios.get(`${BASE_URL}/squad/${KEEY_SQUAD_ID}`, {
      headers: {
        'Authorization': `Bearer ${VAPI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const squad = squadResponse.data;
    console.log(`\n🏢 SQUAD: ${squad.name}`);
    console.log(`   ID: ${squad.id}`);
    console.log(`   Members: ${squad.members?.length || 0}`);
    console.log('\n' + '='.repeat(80));

    // Fetch each member's details
    if (squad.members && squad.members.length > 0) {
      for (let i = 0; i < squad.members.length; i++) {
        const member = squad.members[i];
        const assistantId = member.assistantId || member.assistant?.id;
        
        console.log(`\n\n👤 MEMBER ${i + 1}/${squad.members.length}`);
        console.log('-'.repeat(80));

        if (assistantId) {
          try {
            const assistantResponse = await axios.get(`${BASE_URL}/assistant/${assistantId}`, {
              headers: {
                'Authorization': `Bearer ${VAPI_API_KEY}`,
                'Content-Type': 'application/json'
              }
            });

            const assistant = assistantResponse.data;
            console.log(`\n🤖 ASSISTANT: ${assistant.name || 'Unnamed'}`);
            console.log(`   ID: ${assistant.id}`);
            console.log(`   Model: ${assistant.model?.provider || 'Unknown'} - ${assistant.model?.model || 'Unknown'}`);

            // System Prompt
            console.log(`\n📝 SYSTEM PROMPT:`);
            console.log('   ' + '-'.repeat(76));
            if (assistant.model?.messages && assistant.model.messages.length > 0) {
              const systemMessage = assistant.model.messages.find(m => m.role === 'system');
              if (systemMessage) {
                const prompt = systemMessage.content;
                console.log(`   ${prompt.substring(0, 500)}...`);
                console.log(`   [Full length: ${prompt.length} characters]`);
              } else {
                console.log('   ⚠️  No system message found');
              }
            } else {
              console.log('   ⚠️  No messages configured');
            }

            // Tools
            console.log(`\n🛠️  TOOLS CONFIGURED:`);
            if (assistant.model?.tools && assistant.model.tools.length > 0) {
              console.log(`   ✅ ${assistant.model.tools.length} tool(s) configured:\n`);
              for (const tool of assistant.model.tools) {
                if (tool.type === 'function') {
                  console.log(`      📌 ${tool.function?.name || 'Unknown function'}`);
                  console.log(`         Description: ${tool.function?.description || 'No description'}`);
                  const params = Object.keys(tool.function?.parameters?.properties || {});
                  console.log(`         Parameters: ${params.join(', ') || 'None'}`);
                  console.log(`         Server URL: ${tool.server?.url || 'Not specified'}`);
                  console.log('');
                }
              }
            } else {
              console.log('   ❌ NO TOOLS CONFIGURED');
            }

            // First Message
            if (assistant.firstMessage) {
              console.log(`\n💬 FIRST MESSAGE:`);
              console.log(`   "${assistant.firstMessage}"`);
            }

          } catch (error) {
            console.error(`   ❌ Could not fetch assistant ${assistantId}:`, error.message);
          }
        } else {
          console.log('   ⚠️  No assistant ID found for this member');
        }

        console.log('\n' + '='.repeat(80));
      }
    }

    // Analysis
    console.log('\n\n🔍 ANALYSIS:');
    console.log('='.repeat(80));
    console.log('\n✅ Expected Tools for Keey Property Management:');
    console.log('   1. check_calendar_availability_keey - Check available appointment times');
    console.log('   2. book_calendar_appointment_keey - Book appointments');
    console.log('   3. contact_create_keey - Create leads/contacts');
    console.log('   4. update_appointment_confirmation - Update confirmation status');
    console.log('   5. cancel_appointment_keey - Cancel appointments');
    console.log('\n');

  } catch (error) {
    console.error('❌ Error fetching squad:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

checkKeeySquad();

