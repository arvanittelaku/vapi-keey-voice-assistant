require('dotenv').config();
const axios = require('axios');

/**
 * TEST ASSISTANT VIA VAPI API
 * 
 * This script simulates what happens during a call without actually making a phone call.
 * It's cheaper than a full phone call but may not catch all issues.
 */

const VAPI_API_KEY = process.env.VAPI_API_KEY || 'dda5dde571940cb474e842d0ebc122a9eabf33f4cf407ea08bbaf1232ea24cf0';
const ASSISTANT_ID = '9ade430e-913f-468c-b9a9-e705f64646ab';

async function testAssistantPrompt() {
  console.log('\n🧪 TESTING ASSISTANT PROMPT VIA API\n');
  console.log('════════════════════════════════════════════════════════════════\n');

  try {
    // Step 1: Get the assistant configuration
    console.log('📋 Step 1: Fetching assistant configuration...');
    const assistantResponse = await axios.get(
      `https://api.vapi.ai/assistant/${ASSISTANT_ID}`,
      {
        headers: {
          'Authorization': `Bearer ${VAPI_API_KEY}`
        }
      }
    );

    const assistant = assistantResponse.data;
    console.log('✅ Assistant fetched successfully\n');

    // Step 2: Check if the prompt includes the fixes
    console.log('🔍 Step 2: Analyzing system prompt...\n');
    
    const systemMessage = assistant.model?.messages?.[0]?.content || '';
    
    console.log('Checking for critical fixes:');
    
    // Check 1: Pronunciation guide
    const hasPhoneticGuide = systemMessage.includes('KEE-ee') || systemMessage.includes('(pronounced');
    console.log(`   ${hasPhoneticGuide ? '✅' : '❌'} Phonetic pronunciation guide: ${hasPhoneticGuide ? 'FOUND' : 'MISSING'}`);
    
    // Check 2: Variable usage instructions
    const hasVariableInstructions = systemMessage.includes('{{contactId}}') || systemMessage.includes('variableValues');
    console.log(`   ${hasVariableInstructions ? '✅' : '❌'} Variable usage instructions: ${hasVariableInstructions ? 'FOUND' : 'MISSING'}`);
    
    // Check 3: Tool parameter examples
    const hasToolExamples = systemMessage.includes('contactId:') && systemMessage.includes('appointmentId:');
    console.log(`   ${hasToolExamples ? '✅' : '❌'} Tool parameter examples: ${hasToolExamples ? 'FOUND' : 'MISSING'}`);
    
    // Check 4: Sequential execution instructions
    const hasSequentialInstructions = systemMessage.includes('WAIT for booking') || systemMessage.includes('sequential');
    console.log(`   ${hasSequentialInstructions ? '✅' : '❌'} Sequential execution guidance: ${hasSequentialInstructions ? 'FOUND' : 'MISSING'}`);

    console.log('\n📊 Summary:');
    
    if (hasPhoneticGuide && hasVariableInstructions && hasToolExamples && hasSequentialInstructions) {
      console.log('   ✅ All critical fixes are present in the prompt!');
      console.log('   🎯 Confidence level: HIGH');
      console.log('   💡 The assistant SHOULD work correctly now.');
    } else {
      console.log('   ⚠️  Some fixes may be missing from the prompt.');
      console.log('   🎯 Confidence level: MEDIUM-LOW');
      console.log('   💡 May need to re-deploy the updated prompt.');
    }

    // Step 3: Show relevant prompt sections
    console.log('\n\n📝 Relevant Prompt Sections:\n');
    console.log('─────────────────────────────────────────────────────────────────\n');
    
    // Extract pronunciation section
    const pronunciationMatch = systemMessage.match(/PRONUNCIATION[\s\S]{0,300}/i);
    if (pronunciationMatch) {
      console.log('🗣️  PRONUNCIATION SECTION:');
      console.log(pronunciationMatch[0].substring(0, 200) + '...\n');
    }
    
    // Extract tool call section
    const toolCallMatch = systemMessage.match(/CALL TOOL:[\s\S]{0,300}/);
    if (toolCallMatch) {
      console.log('🛠️  TOOL CALL SECTION:');
      console.log(toolCallMatch[0].substring(0, 200) + '...\n');
    }

    console.log('\n════════════════════════════════════════════════════════════════\n');
    console.log('✅ Analysis complete!\n');

  } catch (error) {
    console.error('\n❌ Error testing assistant:', error.message);
    
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Message:', error.response.data?.message || 'Unknown error');
    }
    
    console.log('\n💡 Possible reasons:');
    console.log('   - Vapi API is down (as you mentioned)');
    console.log('   - API key expired or invalid');
    console.log('   - Assistant ID changed\n');
  }
}

// Run the test
testAssistantPrompt();

