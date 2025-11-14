#!/usr/bin/env node

const axios = require('axios');
const fs = require('fs');

const VAPI_API_KEY = 'bd473524-64a6-43a4-ab2f-fc1d2cd741e2';
const BASE_URL = 'https://api.vapi.ai';
const CONFIRMATION_ID = '9ade430e-913f-468c-b9a9-e705f64646ab';

async function fixConfirmationPrompt() {
  try {
    console.log('🔧 Fixing Confirmation Assistant prompt...\n');
    
    const response = await axios.get(`${BASE_URL}/assistant/${CONFIRMATION_ID}`, {
      headers: { 'Authorization': `Bearer ${VAPI_API_KEY}`, 'Content-Type': 'application/json' }
    });

    const assistant = response.data;
    let systemMessage = assistant.model?.messages?.find(m => m.role === 'system');
    
    if (!systemMessage) {
      console.log('❌ No system message found');
      return;
    }
    
    const originalContent = systemMessage.content;
    
    // Save original for reference
    fs.writeFileSync('confirmation-prompt-original.txt', originalContent);
    console.log('📄 Original prompt saved to confirmation-prompt-original.txt');
    
    // Replace all instances of cancel_appointment (without _keey) with cancel_appointment_keey
    let updatedContent = originalContent;
    
    // Count occurrences first
    const wrongPattern = /cancel_appointment(?!_keey)/g;
    const matches = originalContent.match(wrongPattern) || [];
    console.log(`\n🔍 Found ${matches.length} instance(s) of "cancel_appointment" without "_keey"`);
    
    if (matches.length > 0) {
      // Show context for each match
      matches.forEach((match, i) => {
        const index = originalContent.indexOf('cancel_appointment');
        const context = originalContent.substring(Math.max(0, index - 50), Math.min(originalContent.length, index + 100));
        console.log(`\n   Instance ${i + 1}:`);
        console.log(`   Context: ...${context}...`);
      });
      
      // Replace them
      updatedContent = originalContent.replace(wrongPattern, 'cancel_appointment_keey');
      
      // Update the assistant
      const updatedMessages = assistant.model.messages.map(msg => {
        if (msg.role === 'system') {
          return { ...msg, content: updatedContent };
        }
        return msg;
      });

      await axios.patch(`${BASE_URL}/assistant/${CONFIRMATION_ID}`, {
        model: {
          ...assistant.model,
          messages: updatedMessages
        }
      }, {
        headers: { 'Authorization': `Bearer ${VAPI_API_KEY}`, 'Content-Type': 'application/json' }
      });

      console.log(`\n✅ Fixed ${matches.length} occurrence(s)`);
      
      // Save updated for reference
      fs.writeFileSync('confirmation-prompt-updated.txt', updatedContent);
      console.log('📄 Updated prompt saved to confirmation-prompt-updated.txt');
    } else {
      console.log('✅ No issues found - prompt already correct');
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

fixConfirmationPrompt();
