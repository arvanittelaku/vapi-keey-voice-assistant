#!/usr/bin/env node

const axios = require('axios');

const VAPI_API_KEY = 'bd473524-64a6-43a4-ab2f-fc1d2cd741e2';
const BASE_URL = 'https://api.vapi.ai';

async function findInboundAssistant() {
  try {
    console.log('🔍 Searching for inbound assistant...\n');
    
    const response = await axios.get(`${BASE_URL}/assistant`, {
      headers: {
        'Authorization': `Bearer ${VAPI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const assistants = response.data;
    
    console.log(`Total assistants found: ${assistants.length}\n`);
    console.log('='.repeat(80));
    
    for (const assistant of assistants) {
      console.log(`\n🤖 ${assistant.name || 'Unnamed'}`);
      console.log(`   ID: ${assistant.id}`);
      
      // Check first message or system prompt for clues
      if (assistant.firstMessage) {
        console.log(`   First Message: ${assistant.firstMessage.substring(0, 100)}...`);
      }
      
      // Check if it's part of a squad
      const isInSquad = assistant.squadMembers ? 'Yes' : 'No';
      console.log(`   Part of Squad: ${isInSquad}`);
      
      // Check tools
      const toolCount = assistant.model?.tools?.length || 0;
      console.log(`   Tools: ${toolCount}`);
      
      if (toolCount > 0) {
        assistant.model.tools.forEach(tool => {
          if (tool.function?.name) {
            console.log(`      - ${tool.function.name}`);
          }
        });
      }
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('\n💡 Look for an assistant with "inbound" in the name or one that handles incoming calls.');
    console.log('   It might also be called something like "Reception", "Main Line", or "Phone Handler".');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

findInboundAssistant();

