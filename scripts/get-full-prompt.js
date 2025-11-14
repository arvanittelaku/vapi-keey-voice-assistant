#!/usr/bin/env node

const axios = require('axios');

const VAPI_API_KEY = 'bd473524-64a6-43a4-ab2f-fc1d2cd741e2';
const BASE_URL = 'https://api.vapi.ai';
const KEEY_MAIN_ASSISTANT_ID = '0fd5652f-e68d-442f-8362-8f96f00c2b84';

async function getFullPrompt() {
  try {
    const response = await axios.get(`${BASE_URL}/assistant/${KEEY_MAIN_ASSISTANT_ID}`, {
      headers: {
        'Authorization': `Bearer ${VAPI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const assistant = response.data;
    const systemMessage = assistant.model?.messages?.find(m => m.role === 'system');
    
    if (systemMessage) {
      console.log('📝 FULL SYSTEM PROMPT FOR KEEY MAIN ASSISTANT:');
      console.log('='.repeat(80));
      console.log(systemMessage.content);
      console.log('='.repeat(80));
      
      // Check for tool mentions
      console.log('\n\n🔍 TOOL USAGE ANALYSIS:');
      console.log('='.repeat(80));
      
      const prompt = systemMessage.content.toLowerCase();
      const tools = [
        'check_calendar_availability_keey',
        'book_calendar_appointment_keey',
        'contact_create_keey'
      ];
      
      console.log('\nTool Mentions:');
      tools.forEach(tool => {
        const mentioned = prompt.includes(tool.toLowerCase());
        console.log(`   ${mentioned ? '✅' : '❌'} ${tool} ${mentioned ? '(mentioned)' : '(NOT mentioned)'}`);
      });
      
      console.log('\nKey Instructions:');
      const keyPhrases = [
        'check availability before booking',
        'call the tool',
        'use the function',
        'natural language',
        'timezone'
      ];
      
      keyPhrases.forEach(phrase => {
        const found = prompt.includes(phrase.toLowerCase());
        console.log(`   ${found ? '✅' : '⚠️'} "${phrase}" ${found ? '(found)' : '(NOT found)'}`);
      });
      
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

getFullPrompt();

