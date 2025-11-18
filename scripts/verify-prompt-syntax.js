require('dotenv').config();
const axios = require('axios');

const VAPI_API_KEY = process.env.VAPI_PRIVATE_KEY || 'bd473524-64a6-43a4-ab2f-fc1d2cd741e2';
const CONFIRMATION_ASSISTANT_ID = '9ade430e-913f-468c-b9a9-e705f64646ab';

async function verifyPromptSyntax() {
  console.log('\n🔍 VERIFYING PROMPT SYNTAX\n');
  console.log('═'.repeat(80));

  try {
    const response = await axios.get(
      `https://api.vapi.ai/assistant/${CONFIRMATION_ASSISTANT_ID}`,
      {
        headers: {
          'Authorization': `Bearer ${VAPI_API_KEY}`,
        },
      }
    );

    const assistant = response.data;
    const systemMessage = assistant.model.messages.find(m => m.role === 'system');
    const content = systemMessage?.content || '';

    console.log('\n📋 CHECKING CRITICAL SECTIONS:\n');

    // Check 1: Template variable syntax
    console.log('1️⃣  TEMPLATE VARIABLES:');
    if (content.includes('{{firstName}}')) {
      console.log('   ✅ CORRECT: Uses {{firstName}} template syntax');
    } else if (content.includes('use Test when')) {
      console.log('   ❌ WRONG: Still uses literal "Test"');
    } else {
      console.log('   ⚠️  UNKNOWN: Cannot find firstName reference');
    }

    if (content.includes('{{appointmentTimeOnly}}')) {
      console.log('   ✅ CORRECT: Uses {{appointmentTimeOnly}} template syntax');
    } else if (content.includes('use 2:00 PM when')) {
      console.log('   ❌ WRONG: Still uses literal "2:00 PM"');
    } else {
      console.log('   ⚠️  UNKNOWN: Cannot find appointmentTimeOnly reference');
    }

    // Check 2: Critical instructions
    console.log('\n2️⃣  CRITICAL INSTRUCTIONS:');
    
    const checks = [
      { text: 'CRITICAL DATE CLARIFICATION', label: 'Date clarification section' },
      { text: 'COMPLETE FINAL CONFIRMATION', label: 'Complete confirmation section' },
      { text: 'CRITICAL - SEQUENTIAL EXECUTION', label: 'Sequential execution section' },
      { text: 'NEVER say "Calling tool"', label: 'No tool verbalization' },
    ];

    checks.forEach(check => {
      if (content.includes(check.text)) {
        console.log(`   ✅ FOUND: ${check.label}`);
      } else {
        console.log(`   ❌ MISSING: ${check.label}`);
      }
    });

    // Check 3: Company name
    console.log('\n3️⃣  COMPANY NAME:');
    const keeyCount = (content.match(/Keey/g) || []).length;
    const keyCount = (content.match(/\bKey\b/g) || []).length; // Word boundary to avoid "Keey"
    console.log(`   📊 "Keey" appears ${keeyCount} times`);
    if (keyCount > 0) {
      console.log(`   ⚠️  "Key" (wrong) appears ${keyCount} times`);
    } else {
      console.log(`   ✅ No instances of "Key" (wrong spelling)`);
    }

    // Check 4: Show relevant excerpts
    console.log('\n4️⃣  KEY EXCERPTS:\n');
    
    // Extract greeting section
    const greetingMatch = content.match(/GREETING.*?\n.*?".*?"/s);
    if (greetingMatch) {
      console.log('   📝 GREETING:');
      console.log('   ' + greetingMatch[0].substring(0, 150) + '...\n');
    }

    // Extract variable section
    const variableMatch = content.match(/CRITICAL - USE VARIABLES:[\s\S]{0,300}/);
    if (variableMatch) {
      console.log('   📝 VARIABLE INSTRUCTIONS:');
      const lines = variableMatch[0].split('\n').slice(0, 8);
      lines.forEach(line => console.log('   ' + line));
      console.log('');
    }

    // Check 5: Assistant settings
    console.log('\n5️⃣  ASSISTANT SETTINGS:');
    console.log(`   📞 First Message: "${assistant.firstMessage?.substring(0, 60) || 'N/A'}..."`);
    console.log(`   ⏱️  Max Duration: ${assistant.maxDurationSeconds}s`);
    console.log(`   🔇 Silence Timeout: ${assistant.silenceTimeoutSeconds}s`);
    console.log(`   🗣️  Interruption Words: ${assistant.numWordsToInterruptAssistant}`);
    console.log(`   🔊 End Call Message: "${assistant.endCallMessage || '(empty - AI handles closing)'}"`);

    // Check 6: Tools
    console.log('\n6️⃣  TOOLS ASSIGNED:');
    const toolIds = assistant.model.toolIds || [];
    console.log(`   📊 Total tools: ${toolIds.length}`);
    if (toolIds.length >= 4) {
      console.log('   ✅ Has all 4 required tools');
    } else {
      console.log('   ❌ Missing tools (need 4)');
    }

    // Summary
    console.log('\n═'.repeat(80));
    console.log('\n📊 SUMMARY:\n');
    
    const hasTemplateVars = content.includes('{{firstName}}') && content.includes('{{appointmentTimeOnly}}');
    const hasInstructions = content.includes('CRITICAL DATE CLARIFICATION') && 
                           content.includes('COMPLETE FINAL CONFIRMATION');
    const hasCorrectCompany = keeyCount > 0 && keyCount === 0;
    const hasTools = toolIds.length >= 4;

    if (hasTemplateVars && hasInstructions && hasCorrectCompany && hasTools) {
      console.log('   ✅ CONFIGURATION LOOKS GOOD!');
      console.log('   ✅ Template variables are correct');
      console.log('   ✅ All critical sections present');
      console.log('   ✅ Company name is correct');
      console.log('   ✅ All tools assigned');
      console.log('\n   🎯 CONFIDENCE: 95% - Ready for test call\n');
    } else {
      console.log('   ⚠️  POTENTIAL ISSUES FOUND:');
      if (!hasTemplateVars) console.log('   ❌ Template variables not correct');
      if (!hasInstructions) console.log('   ❌ Missing critical instructions');
      if (!hasCorrectCompany) console.log('   ❌ Company name issues');
      if (!hasTools) console.log('   ❌ Missing tools');
      console.log('\n   🎯 CONFIDENCE: <80% - Issues need fixing\n');
    }

  } catch (error) {
    console.error('\n❌ ERROR:\n');
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Error:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('   Error:', error.message);
    }
  }
}

verifyPromptSyntax();

