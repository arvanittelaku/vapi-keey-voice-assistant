#!/usr/bin/env node

const axios = require('axios');

const VAPI_API_KEY = 'bd473524-64a6-43a4-ab2f-fc1d2cd741e2';
const BASE_URL = 'https://api.vapi.ai';

const ASSISTANTS = {
  outbound: { id: '0fd5652f-e68d-442f-8362-8f96f00c2b84', name: 'Keey Main (OUTBOUND)' },
  inbound: { id: '36728053-c5f8-48e6-a3fe-33d6c95348ce', name: 'Keey Inbound Lead' },
  confirmation: { id: '9ade430e-913f-468c-b9a9-e705f64646ab', name: 'Keey Appointment Confirmation' }
};

async function analyzePrompt(assistantId, name, expectedTools) {
  try {
    const response = await axios.get(`${BASE_URL}/assistant/${assistantId}`, {
      headers: { 'Authorization': `Bearer ${VAPI_API_KEY}`, 'Content-Type': 'application/json' }
    });

    const assistant = response.data;
    const systemMessage = assistant.model?.messages?.find(m => m.role === 'system');
    
    console.log('\n' + '='.repeat(80));
    console.log(`\n🤖 ${name}`);
    console.log(`   ID: ${assistantId}`);
    console.log('='.repeat(80));
    
    if (!systemMessage) {
      console.log('\n❌ NO SYSTEM PROMPT FOUND!');
      return;
    }

    const prompt = systemMessage.content;
    const promptLower = prompt.toLowerCase();
    
    console.log(`\n📝 PROMPT LENGTH: ${prompt.length} characters`);
    
    // Check for tool mentions
    console.log('\n🔍 TOOL MENTIONS:');
    expectedTools.forEach(tool => {
      const mentioned = promptLower.includes(tool.toLowerCase());
      console.log(`   ${mentioned ? '✅' : '❌'} ${tool}`);
    });
    
    // Check for key instructions
    console.log('\n📋 KEY INSTRUCTIONS:');
    const keyPhrases = [
      { phrase: 'check availability before booking', critical: true },
      { phrase: 'call the tool', critical: false },
      { phrase: 'natural language', critical: true },
      { phrase: 'timezone', critical: true },
      { phrase: 'step by step', critical: false },
      { phrase: 'booking flow', critical: true },
      { phrase: 'contactId', critical: false },
      { phrase: 'appointmentId', critical: false }
    ];
    
    keyPhrases.forEach(({ phrase, critical }) => {
      const found = promptLower.includes(phrase.toLowerCase());
      const icon = critical ? (found ? '✅' : '🚨') : (found ? '✅' : '⚠️');
      console.log(`   ${icon} ${critical ? '[CRITICAL]' : '[HELPFUL]'} "${phrase}"`);
    });
    
    // Show a snippet of tool-related sections
    console.log('\n📄 TOOL-RELATED SECTIONS:');
    const toolKeywords = ['tool', 'function', 'call', 'check_calendar', 'book_calendar', 'contact_create', 'update_appointment', 'cancel_appointment'];
    const lines = prompt.split('\n');
    const relevantLines = [];
    
    lines.forEach((line, idx) => {
      const lineLower = line.toLowerCase();
      if (toolKeywords.some(keyword => lineLower.includes(keyword))) {
        relevantLines.push({ idx: idx + 1, line: line.trim() });
      }
    });
    
    if (relevantLines.length > 0) {
      console.log(`   Found ${relevantLines.length} tool-related lines:`);
      relevantLines.slice(0, 10).forEach(({ idx, line }) => {
        console.log(`   Line ${idx}: ${line.substring(0, 80)}...`);
      });
      if (relevantLines.length > 10) {
        console.log(`   ... and ${relevantLines.length - 10} more`);
      }
    } else {
      console.log('   ⚠️  No tool-related instructions found!');
    }
    
  } catch (error) {
    console.error(`❌ Error fetching ${name}:`, error.message);
  }
}

async function checkAllPrompts() {
  console.log('\n🔍 ANALYZING ALL KEEY ASSISTANT PROMPTS');
  console.log('='.repeat(80));
  
  await analyzePrompt(
    ASSISTANTS.outbound.id,
    ASSISTANTS.outbound.name,
    ['check_calendar_availability_keey', 'book_calendar_appointment_keey']
  );
  
  await analyzePrompt(
    ASSISTANTS.inbound.id,
    ASSISTANTS.inbound.name,
    ['contact_create_keey', 'check_calendar_availability_keey', 'book_calendar_appointment_keey']
  );
  
  await analyzePrompt(
    ASSISTANTS.confirmation.id,
    ASSISTANTS.confirmation.name,
    ['update_appointment_confirmation', 'cancel_appointment_keey', 'check_calendar_availability_keey', 'book_calendar_appointment_keey']
  );
  
  console.log('\n' + '='.repeat(80));
  console.log('\n✅ ANALYSIS COMPLETE\n');
}

checkAllPrompts();

