#!/usr/bin/env node

/**
 * COMPREHENSIVE FINAL CHECK
 * Verify EVERYTHING before wasting credits on test calls
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

async function checkAssistant(assistantId, name, expectedTools, checks) {
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
    const promptLower = prompt.toLowerCase();
    
    // Check 1: Tools configured
    console.log('\n1️⃣ TOOLS CONFIGURATION:');
    const configuredTools = assistant.model?.tools || [];
    console.log(`   Found ${configuredTools.length} tool(s)`);
    
    expectedTools.forEach(toolName => {
      const found = configuredTools.some(t => t.function?.name === toolName);
      if (found) {
        console.log(`   ✅ ${toolName}`);
      } else {
        console.log(`   ❌ ${toolName} - MISSING!`);
        ISSUES.push(`${name}: Tool "${toolName}" not configured`);
      }
    });
    
    // Check 2: Tool names in prompt
    console.log('\n2️⃣ TOOL NAMES IN PROMPT:');
    expectedTools.forEach(toolName => {
      const mentioned = promptLower.includes(toolName.toLowerCase());
      if (mentioned) {
        console.log(`   ✅ ${toolName} mentioned`);
      } else {
        console.log(`   ⚠️  ${toolName} NOT mentioned in prompt`);
        WARNINGS.push(`${name}: Tool "${toolName}" not mentioned in prompt`);
      }
    });
    
    // Check 3: Wrong tool names (common mistakes)
    console.log('\n3️⃣ CHECKING FOR WRONG TOOL NAMES:');
    const wrongNames = [
      'cancel_appointment',  // Should be cancel_appointment_keey
      'create_contact',      // Should be contact_create_keey
      'contact_create',      // Should be contact_create_keey
      'Calendar Create Event',
      'Calendar Check Availability',
      'Contact Create'
    ];
    
    let foundWrongNames = false;
    wrongNames.forEach(wrongName => {
      if (prompt.includes(wrongName) && !wrongName.includes('_keey')) {
        console.log(`   ❌ Found "${wrongName}" - should use correct tool name!`);
        ISSUES.push(`${name}: Using wrong name "${wrongName}" in prompt`);
        foundWrongNames = true;
      }
    });
    if (!foundWrongNames) {
      console.log('   ✅ No wrong tool names found');
    }
    
    // Check 4: Server URLs
    console.log('\n4️⃣ SERVER URLs:');
    const expectedUrl = 'https://vapi-keey-voice-assistant.onrender.com/webhook/vapi';
    configuredTools.forEach(tool => {
      const url = tool.server?.url;
      if (url === expectedUrl) {
        console.log(`   ✅ ${tool.function.name}: ${url}`);
      } else {
        console.log(`   ❌ ${tool.function.name}: ${url || 'NO URL'}`);
        ISSUES.push(`${name}: Wrong server URL for ${tool.function.name}`);
      }
    });
    
    // Check 5: Custom checks per assistant
    if (checks) {
      console.log('\n5️⃣ SPECIFIC CHECKS:');
      checks(prompt, promptLower, assistant);
    }
    
  } catch (error) {
    console.error(`❌ Error checking ${name}:`, error.message);
    ISSUES.push(`${name}: Failed to fetch - ${error.message}`);
  }
}

// Specific checks for outbound assistant
function checkOutbound(prompt, promptLower, assistant) {
  // Should NOT have contact_create_keey
  if (promptLower.includes('contact_create_keey')) {
    console.log('   ⚠️  Mentions contact_create_keey (not needed for outbound)');
    WARNINGS.push('OUTBOUND: Mentions contact_create_keey but should not need it');
  }
  
  // Should have instructions about using existing contact data
  if (promptLower.includes('{{firstname}}') || promptLower.includes('{{email}}')) {
    console.log('   ✅ References metadata variables like {{firstName}}, {{email}}');
  } else {
    console.log('   ⚠️  Does not reference metadata variables');
    WARNINGS.push('OUTBOUND: Should reference {{firstName}}, {{email}}, etc. for existing contacts');
  }
  
  // Check for OUTBOUND-specific instructions
  if (promptLower.includes('outbound')) {
    console.log('   ✅ Has OUTBOUND-specific instructions');
  } else {
    console.log('   ⚠️  Missing OUTBOUND-specific instructions');
    WARNINGS.push('OUTBOUND: Should have specific instructions for outbound calls');
  }
}

// Specific checks for inbound assistant
function checkInbound(prompt, promptLower, assistant) {
  // Must have contact_create_keey instructions
  if (promptLower.includes('contact_create_keey')) {
    console.log('   ✅ Has contact_create_keey instructions');
  } else {
    console.log('   ❌ Missing contact_create_keey instructions');
    ISSUES.push('INBOUND: Must have contact_create_keey usage instructions');
  }
  
  // Should collect all required fields
  const requiredFields = ['firstName', 'lastName', 'email', 'phone'];
  requiredFields.forEach(field => {
    if (promptLower.includes(field.toLowerCase())) {
      console.log(`   ✅ Mentions ${field}`);
    } else {
      console.log(`   ⚠️  Does not mention ${field}`);
      WARNINGS.push(`INBOUND: Should mention collecting ${field}`);
    }
  });
  
  // Should have "INBOUND" label
  if (promptLower.includes('inbound')) {
    console.log('   ✅ Has INBOUND-specific instructions');
  } else {
    console.log('   ⚠️  Missing INBOUND label');
    WARNINGS.push('INBOUND: Should have specific instructions for inbound calls');
  }
}

// Specific checks for confirmation assistant
function checkConfirmation(prompt, promptLower, assistant) {
  // Must have contactId and appointmentId references
  if (promptLower.includes('contactid') && promptLower.includes('appointmentid')) {
    console.log('   ✅ References contactId and appointmentId');
  } else {
    console.log('   ❌ Missing contactId or appointmentId references');
    ISSUES.push('CONFIRMATION: Must reference contactId and appointmentId from metadata');
  }
  
  // Should have confirmation statuses
  const statuses = ['confirmed', 'cancelled', 'reschedule', 'no_answer'];
  let hasStatuses = true;
  statuses.forEach(status => {
    if (!promptLower.includes(status)) {
      hasStatuses = false;
      console.log(`   ⚠️  Missing status: ${status}`);
    }
  });
  if (hasStatuses) {
    console.log('   ✅ Has all confirmation statuses');
  }
  
  // Check for metadata variables
  if (prompt.includes('{{contactId}}') || prompt.includes('{{appointmentId}}')) {
    console.log('   ✅ Uses metadata variables correctly');
  } else {
    console.log('   ⚠️  Should use {{contactId}} and {{appointmentId}} from metadata');
    WARNINGS.push('CONFIRMATION: Should use metadata variables like {{contactId}}');
  }
}

async function runComprehensiveCheck() {
  console.log('\n🚀 COMPREHENSIVE FINAL CHECK BEFORE TESTING');
  console.log('💰 This check will save you Vapi credits by catching issues NOW');
  console.log('='.repeat(80));
  
  await checkAssistant(
    ASSISTANTS.outbound.id,
    ASSISTANTS.outbound.name,
    ['check_calendar_availability_keey', 'book_calendar_appointment_keey'],
    checkOutbound
  );
  
  await checkAssistant(
    ASSISTANTS.inbound.id,
    ASSISTANTS.inbound.name,
    ['contact_create_keey', 'check_calendar_availability_keey', 'book_calendar_appointment_keey'],
    checkInbound
  );
  
  await checkAssistant(
    ASSISTANTS.confirmation.id,
    ASSISTANTS.confirmation.name,
    ['update_appointment_confirmation', 'cancel_appointment_keey', 'check_calendar_availability_keey', 'book_calendar_appointment_keey'],
    checkConfirmation
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
    console.log('   ✅ No critical issues found!');
  }
  
  console.log(`\n⚠️  WARNINGS: ${WARNINGS.length}`);
  if (WARNINGS.length > 0) {
    WARNINGS.forEach((warning, i) => {
      console.log(`   ${i + 1}. ${warning}`);
    });
  } else {
    console.log('   ✅ No warnings!');
  }
  
  console.log('\n' + '='.repeat(80));
  if (ISSUES.length === 0 && WARNINGS.length === 0) {
    console.log('✅ SYSTEM IS READY FOR TESTING!');
    console.log('🎯 All checks passed - safe to make test calls');
  } else if (ISSUES.length > 0) {
    console.log('❌ CRITICAL ISSUES FOUND - DO NOT TEST YET!');
    console.log('🔧 Fix the issues above before making any calls');
  } else {
    console.log('⚠️  WARNINGS FOUND - Review before testing');
    console.log('💡 Warnings won\'t break functionality but may affect quality');
  }
  console.log('='.repeat(80));
  console.log('\n');
}

runComprehensiveCheck();

