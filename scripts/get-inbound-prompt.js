#!/usr/bin/env node

const axios = require('axios');

const VAPI_API_KEY = 'bd473524-64a6-43a4-ab2f-fc1d2cd741e2';
const BASE_URL = 'https://api.vapi.ai';
const INBOUND_ID = '36728053-c5f8-48e6-a3fe-33d6c95348ce';

async function getPrompt() {
  try {
    const response = await axios.get(`${BASE_URL}/assistant/${INBOUND_ID}`, {
      headers: { 'Authorization': `Bearer ${VAPI_API_KEY}`, 'Content-Type': 'application/json' }
    });

    const systemMessage = response.data.model?.messages?.find(m => m.role === 'system');
    
    if (systemMessage) {
      console.log('📝 CURRENT INBOUND ASSISTANT PROMPT:');
      console.log('='.repeat(80));
      console.log(systemMessage.content);
      console.log('='.repeat(80));
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

getPrompt();

