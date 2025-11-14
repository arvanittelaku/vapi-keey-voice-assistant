#!/usr/bin/env node

/**
 * IMPROVED COMPREHENSIVE CHECK
 * More precise matching to avoid false positives
 */

const axios = require('axios');

const VAPI_API_KEY = 'bd473524-64a6-43a4-ab2f-fc1d2cd741e2';
const BASE_URL = 'https://api.vapi.ai';

const ASSISTANTS = {
  outbound: { id: '0fd5652f-e68d-442f-8362-8f96f00c2b84', name: 'Keey Main (OUTBOUND)' },
  inbound: { id: '36728053-c5f8-48e6-a3fe-33d6c95348ce', name: 'Keey Inbound Lead' },
  confirmation: { id: '9ade430e-913f-468c-b9a9-e705f64646ab', name: 'Keey Appointment Confirmation' }
};

const ISSUES = [];
const WARNINGS = [];

function checkForWrongToolNames(prompt, name) {
  console.log('\n3️⃣ CHECKING FOR WRONG TOOL NAMES:');
  
  // Use regex with word boundaries to match exact patterns
  const wrongPatterns = [
    { pattern: /\bcancel_appointment\(/g, wrong: 'cancel_appointment(', correct: 'cancel_appointment_keey(' },
    { pattern: /\bcancel_appointment\b(?!_keey)/g, wrong: 'cancel_appointment', correct: 'cancel_appointment_keey' },
    { pattern: /"cancel_appointment"/g, wrong: '"cancel_appointment"', correct: '"cancel_appointment_keey"' },
  ];
  
  let foundIssues = false;
  
  wrongPatterns.forEach(({ pattern, wrong, correct }) => {
    const matches = prompt.match(pattern);
    if (matches && matches.length > 0) {
      console.log(`   ❌ Found ${matches.length}x "${wrong}" - should be "${correct}"`);
      ISSUES.push(`${name}: Found "${wrong}" ${matches.length} time(s) - should be "${correct}"`);
      foundIssues = true;
    }
  });
  
  if (!foundIssues) {
    console.log('   ✅ No wrong tool names found');
  }
}

async function checkAssistant(assistantId, name, expectedTools) {
  console.log('\n' + '='.repeat(80));
  console.log(`\n🔍 CHECKING: ${name}`);
  console.log('='.repeat(80));
  
  try {
    const response = await axios.get(`${BASE_URL}/assistant/${assistantId}`, {
      headers: { 'Authorization': `Bearer ${VAPI_API_KEY}`, 'Content-Type': 'application/json' }
    });

    const assistant = response.data;
    const systemMessage = assistant.model?.messages?.find(m => m.role === 'system');
    const prompt = systemMessage?.content || '';
    
    // Check 1: Tools configured
    console.log('\n1️⃣ TOOLS CONFIGURATION:');
    const configuredTools = assistant.model?.tools || [];
    console.log(`   Found ${configuredTools.length} tool(s)`);
    
    expectedTools.forEach(toolName => {
      const found = configuredTools.some(t => t.function?.name === toolName);
      console.log(`   ${found ? '✅' : '❌'} ${toolName}`);
      if (!found) {
        ISSUES.push(`${name}: Tool "${toolName}" not configured`);
      }
    });
    
    // Check 2: Tool names mentioned
    console.log('\n2️⃣ TOOL NAMES IN PROMPT:');
    expectedTools.forEach(toolName => {
      const mentioned = prompt.includes(toolName);
      console.log(`   ${mentioned ? '✅' : '⚠️'} ${toolName}${mentioned ? '' : ' (not mentioned)'}`);
      if (!mentioned) {
        WARNINGS.push(`${name}: Tool "${toolName}" not mentioned in prompt (AI might not know to use it)`);
      }
    });
    
    // Check 3: Wrong tool names
    checkForWrongToolNames(prompt, name);
    
    // Check 4: Server URLs
    console.log('\n4️⃣ SERVER URLs:');
    const expectedUrl = 'https://vapi-keey-voice-assistant.onrender.com/webhook/vapi';
    let urlIssues = 0;
    configuredTools.forEach(tool => {
      const url = tool.server?.url;
      if (url === expectedUrl) {
        console.log(`   ✅ ${tool.function.name}`);
      } else {
        console.log(`   ❌ ${tool.function.name}: ${url || 'NO URL'}`);
        ISSUES.push(`${name}: Wrong server URL for ${tool.function.name}`);
        urlIssues++;
      }
    });
    if (urlIssues === 0) {
      console.log('   ✅ All server URLs correct');
    }
    
  } catch (error) {
    console.error(`❌ Error checking ${name}:`, error.message);
    ISSUES.push(`${name}: Failed to fetch - ${error.message}`);
  }
}

async function runFinalCheck() {
  console.log('\n🚀 FINAL COMPREHENSIVE CHECK v2');
  console.log('💰 Saving your Vapi credits by catching ALL issues');
  console.log('='.repeat(80));
  
  await checkAssistant(
    ASSISTANTS.outbound.id,
    ASSISTANTS.outbound.name,
    ['check_calendar_availability_keey', 'book_calendar_appointment_keey']
  );
  
  await checkAssistant(
    ASSISTANTS.inbound.id,
    ASSISTANTS.inbound.name,
    ['contact_create_keey', 'check_calendar_availability_keey', 'book_calendar_appointment_keey']
  );
  
  await checkAssistant(
    ASSISTANTS.confirmation.id,
    ASSISTANTS.confirmation.name,
    ['update_appointment_confirmation', 'cancel_appointment_keey', 'check_calendar_availability_keey', 'book_calendar_appointment_keey']
  );
  
  // Final report
  console.log('\n\n' + '='.repeat(80));
  console.log('📊 FINAL REPORT');
  console.log('='.repeat(80));
  
  console.log(`\n🚨 CRITICAL ISSUES: ${ISSUES.length}`);
  if (ISSUES.length > 0) {
    ISSUES.forEach((issue, i) => {
      console.log(`   ${i + 1}. ${issue}`);
    });
  } else {
    console.log('   ✅ NO CRITICAL ISSUES!');
  }
  
  console.log(`\n⚠️  WARNINGS: ${WARNINGS.length}`);
  if (WARNINGS.length > 0) {
    WARNINGS.forEach((warning, i) => {
      console.log(`   ${i + 1}. ${warning}`);
    });
  } else {
    console.log('   ✅ NO WARNINGS!');
  }
  
  console.log('\n' + '='.repeat(80));
  if (ISSUES.length === 0) {
    console.log('✅ ✅ ✅ SYSTEM IS PRODUCTION-READY! ✅ ✅ ✅');
    console.log('🎯 All critical checks passed');
    console.log('💰 Safe to make test calls without wasting credits');
  } else {
    console.log('❌ STOP! Fix issues above before testing');
  }
  console.log('='.repeat(80));
  console.log('\n');
}

runFinalCheck();

