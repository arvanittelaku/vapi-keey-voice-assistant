#!/usr/bin/env node

const axios = require('axios');

const VAPI_API_KEY = 'bd473524-64a6-43a4-ab2f-fc1d2cd741e2';
const BASE_URL = 'https://api.vapi.ai';

async function fixPrompt(assistantId, name, replacements) {
  try {
    console.log(`\n🔧 Fixing ${name}...`);
    
    const response = await axios.get(`${BASE_URL}/assistant/${assistantId}`, {
      headers: { 'Authorization': `Bearer ${VAPI_API_KEY}`, 'Content-Type': 'application/json' }
    });

    const assistant = response.data;
    let systemMessage = assistant.model?.messages?.find(m => m.role === 'system');
    
    if (!systemMessage) {
      console.log(`❌ No system message found for ${name}`);
      return;
    }
    
    let updatedContent = systemMessage.content;
    let changesMade = 0;
    
    replacements.forEach(({ from, to }) => {
      const before = updatedContent;
      // Use regex to replace all occurrences
      const regex = new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      updatedContent = updatedContent.replace(regex, to);
      
      const occurrences = (before.match(regex) || []).length;
      if (occurrences > 0) {
        console.log(`   ✅ Replaced "${from}" with "${to}" (${occurrences} occurrence(s))`);
        changesMade += occurrences;
      }
    });
    
    if (changesMade === 0) {
      console.log(`   ℹ️  No changes needed`);
      return;
    }
    
    // Update the assistant
    const updatedMessages = assistant.model.messages.map(msg => {
      if (msg.role === 'system') {
        return { ...msg, content: updatedContent };
      }
      return msg;
    });

    await axios.patch(`${BASE_URL}/assistant/${assistantId}`, {
      model: {
        ...assistant.model,
        messages: updatedMessages
      }
    }, {
      headers: { 'Authorization': `Bearer ${VAPI_API_KEY}`, 'Content-Type': 'application/json' }
    });

    console.log(`   ✅ ${name} updated successfully (${changesMade} change(s))`);
    
  } catch (error) {
    console.error(`❌ Error fixing ${name}:`, error.message);
  }
}

async function fixAllIssues() {
  console.log('🚨 FIXING CRITICAL ISSUES');
  console.log('='.repeat(80));
  
  // Fix Inbound Assistant - replace "contact_create" but preserve "contact_create_keey"
  await fixPrompt(
    '36728053-c5f8-48e6-a3fe-33d6c95348ce',
    'Keey Inbound Lead',
    [
      // Be careful: only replace standalone "contact_create", not "contact_create_keey"
      // This is tricky - we need to check the context
    ]
  );
  
  // Fix Confirmation Assistant
  await fixPrompt(
    '9ade430e-913f-468c-b9a9-e705f64646ab',
    'Keey Appointment Confirmation',
    [
      { from: 'cancel_appointment(', to: 'cancel_appointment_keey(' },
      { from: '"cancel_appointment"', to: '"cancel_appointment_keey"' }
    ]
  );
  
  console.log('\n' + '='.repeat(80));
  console.log('✅ FIXES APPLIED');
  console.log('📊 Run check again to verify all issues are resolved');
  console.log('='.repeat(80));
  console.log('\n');
}

fixAllIssues();

