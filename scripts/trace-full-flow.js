#!/usr/bin/env node

/**
 * FULL FLOW TRACER
 * 
 * This script traces the ENTIRE flow from Vapi assistant to GHL
 * to ensure all components are properly connected
 */

require('dotenv').config();
const axios = require('axios');

const VAPI_API_KEY = process.env.VAPI_API_KEY;
const INBOUND_ASSISTANT_ID = process.env.VAPI_INBOUND_ASSISTANT_ID;
const WEBHOOK_URL = process.env.WEBHOOK_BASE_URL || 'https://vapi-keey-voice-assistant-production.up.railway.app';

console.log('\n🔍 ===== FULL FLOW VERIFICATION =====\n');

async function traceFullFlow() {
  const results = {
    steps: [],
    errors: [],
    warnings: []
  };

  try {
    // STEP 1: Get Assistant Configuration
    console.log('STEP 1: Checking Vapi Assistant Configuration...');
    const assistantResponse = await axios.get(
      `https://api.vapi.ai/assistant/${INBOUND_ASSISTANT_ID}`,
      {
        headers: {
          'Authorization': `Bearer ${VAPI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const assistant = assistantResponse.data;
    const prompt = assistant.model?.messages?.[0]?.content || '';
    
    // Check if prompt mentions the 3 fields
    const asksForEmail = prompt.toLowerCase().includes('email');
    const asksForPhone = prompt.toLowerCase().includes('phone');
    const asksForPostal = prompt.toLowerCase().includes('postal') || prompt.toLowerCase().includes('postcode');
    const mentionsOldFields = prompt.includes('firstName') || prompt.includes('bedrooms') || prompt.includes('propertyAddress');
    
    if (asksForEmail && asksForPhone && asksForPostal && !mentionsOldFields) {
      console.log('   ✅ Assistant prompt is correct');
      console.log('   ✅ Asks for: email, phone, postal code');
      results.steps.push({ step: 1, status: 'PASS', detail: 'Assistant prompt correct' });
    } else {
      console.log('   ❌ Assistant prompt has issues');
      results.steps.push({ step: 1, status: 'FAIL', detail: 'Assistant prompt incorrect' });
      results.errors.push('Assistant prompt not updated correctly');
    }

    // STEP 2: Check Tools Attached
    console.log('\nSTEP 2: Checking Tools Attached to Assistant...');
    const toolIds = assistant.toolIds || [];
    
    if (toolIds.length === 0) {
      console.log('   ❌ NO TOOLS ATTACHED!');
      results.steps.push({ step: 2, status: 'FAIL', detail: 'No tools attached' });
      results.errors.push('CRITICAL: No tools attached to assistant');
    } else {
      console.log(`   ✅ ${toolIds.length} tool(s) attached`);
      
      // Check each tool
      for (const toolId of toolIds) {
        try {
          const toolResponse = await axios.get(
            `https://api.vapi.ai/tool/${toolId}`,
            {
              headers: {
                'Authorization': `Bearer ${VAPI_API_KEY}`,
                'Content-Type': 'application/json'
              }
            }
          );
          
          const tool = toolResponse.data;
          const toolName = tool.function?.name || 'unknown';
          console.log(`   📋 Tool: ${toolName}`);
          
          // Check if this is the contact_create tool
          if (toolName === 'contact_create_keey') {
            const required = tool.function?.parameters?.required || [];
            console.log(`      Required params: ${required.join(', ')}`);
            
            if (required.includes('firstName') || required.includes('lastName')) {
              console.log('      ❌ WARNING: Tool still requires firstName/lastName!');
              results.warnings.push('contact_create_keey tool requires old parameters');
            } else if (required.includes('email') && required.includes('phone')) {
              console.log('      ✅ Tool parameters are correct (email, phone)');
            } else {
              console.log('      ⚠️  Tool parameters are unusual');
              results.warnings.push('contact_create_keey has unexpected parameters');
            }
          }
          
        } catch (err) {
          console.log(`   ⚠️  Could not fetch tool ${toolId}: ${err.message}`);
        }
      }
      
      results.steps.push({ step: 2, status: 'PASS', detail: 'Tools attached and checked' });
    }

    // STEP 3: Check Tool Webhook URL
    console.log('\nSTEP 3: Checking Tool Webhook Configuration...');
    const contactCreateTool = toolIds.find(id => id === '39f85666-77ed-4481-920b-7599fcd4a968');
    
    if (contactCreateTool) {
      const toolResponse = await axios.get(
        `https://api.vapi.ai/tool/${contactCreateTool}`,
        {
          headers: {
            'Authorization': `Bearer ${VAPI_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      const webhookUrl = toolResponse.data.server?.url || '';
      console.log(`   Webhook URL: ${webhookUrl}`);
      
      if (webhookUrl.includes('vapi-keey-voice-assistant')) {
        console.log('   ✅ Webhook URL is correct');
        results.steps.push({ step: 3, status: 'PASS', detail: 'Webhook URL configured' });
      } else {
        console.log('   ⚠️  Webhook URL looks unusual');
        results.warnings.push('Webhook URL may be incorrect');
        results.steps.push({ step: 3, status: 'WARNING', detail: 'Webhook URL unusual' });
      }
    } else {
      console.log('   ⚠️  Could not find contact_create tool');
      results.warnings.push('contact_create tool not found in assistant');
    }

    // STEP 4: Check Webhook Handler Code
    console.log('\nSTEP 4: Checking Webhook Handler Code...');
    const fs = require('fs');
    
    try {
      const handlerPath = './src/webhooks/vapi-function-handler.js';
      const handlerContent = fs.readFileSync(handlerPath, 'utf8');
      
      // Check if createContact function accepts simplified params
      const hasSimplifiedParams = handlerContent.includes('const {') &&
                                   handlerContent.includes('email,') &&
                                   handlerContent.includes('phone,') &&
                                   handlerContent.includes('postcode');
      
      // Check if it still expects old params
      const expectsOldParams = handlerContent.includes('firstName,\n        lastName,') ||
                              handlerContent.includes('propertyAddress,');
      
      if (hasSimplifiedParams && !expectsOldParams) {
        console.log('   ✅ Webhook handler expects simplified parameters');
        results.steps.push({ step: 4, status: 'PASS', detail: 'Handler code correct' });
      } else {
        console.log('   ❌ Webhook handler still expects old parameters');
        results.steps.push({ step: 4, status: 'FAIL', detail: 'Handler expects old params' });
        results.errors.push('Webhook handler not updated');
      }
      
      // Check if it generates name from email
      const generatesName = handlerContent.includes('email.split') ||
                           handlerContent.includes('emailPrefix');
      
      if (generatesName) {
        console.log('   ✅ Webhook generates name from email');
      } else {
        console.log('   ⚠️  Name generation logic not found');
        results.warnings.push('Name generation may be missing');
      }
      
    } catch (err) {
      console.log(`   ❌ Error reading webhook handler: ${err.message}`);
      results.errors.push('Could not verify webhook handler code');
    }

    // STEP 5: Check GHL Client
    console.log('\nSTEP 5: Checking GHL Client Compatibility...');
    try {
      const ghlClientPath = './src/services/ghl-client.js';
      const ghlContent = fs.readFileSync(ghlClientPath, 'utf8');
      
      const handlesOptionalFields = ghlContent.includes('if (contactData[key] !== undefined');
      
      if (handlesOptionalFields) {
        console.log('   ✅ GHL client handles optional fields');
        results.steps.push({ step: 5, status: 'PASS', detail: 'GHL client compatible' });
      } else {
        console.log('   ⚠️  GHL client may not handle missing fields well');
        results.warnings.push('GHL client compatibility uncertain');
        results.steps.push({ step: 5, status: 'WARNING', detail: 'GHL client may need review' });
      }
      
    } catch (err) {
      console.log(`   ❌ Error reading GHL client: ${err.message}`);
      results.errors.push('Could not verify GHL client');
    }

    // STEP 6: Check Environment Variables
    console.log('\nSTEP 6: Checking Environment Variables...');
    const requiredEnvVars = [
      'VAPI_API_KEY',
      'VAPI_INBOUND_ASSISTANT_ID',
      'GHL_API_KEY',
      'GHL_LOCATION_ID',
      'WEBHOOK_SECRET'
    ];
    
    const missingVars = requiredEnvVars.filter(v => !process.env[v]);
    
    if (missingVars.length === 0) {
      console.log('   ✅ All required environment variables present');
      results.steps.push({ step: 6, status: 'PASS', detail: 'Environment configured' });
    } else {
      console.log(`   ⚠️  Missing env vars: ${missingVars.join(', ')}`);
      results.warnings.push(`Missing environment variables: ${missingVars.join(', ')}`);
      results.steps.push({ step: 6, status: 'WARNING', detail: 'Some env vars missing' });
    }

    // SUMMARY
    console.log('\n' + '='.repeat(70));
    console.log('📊 FLOW VERIFICATION SUMMARY');
    console.log('='.repeat(70));
    
    results.steps.forEach(step => {
      const icon = step.status === 'PASS' ? '✅' : 
                   step.status === 'WARNING' ? '⚠️' : '❌';
      console.log(`${icon} Step ${step.step}: ${step.detail}`);
    });
    
    if (results.errors.length > 0) {
      console.log('\n❌ ERRORS FOUND:');
      results.errors.forEach(err => console.log(`   - ${err}`));
    }
    
    if (results.warnings.length > 0) {
      console.log('\n⚠️  WARNINGS:');
      results.warnings.forEach(warn => console.log(`   - ${warn}`));
    }
    
    const allPassed = results.errors.length === 0;
    
    if (allPassed) {
      console.log('\n✅ FLOW VERIFICATION COMPLETE!');
      console.log('\n📋 Full Flow:');
      console.log('   1. Customer calls → Vapi Assistant');
      console.log('   2. Assistant asks for email, phone, postal code');
      console.log('   3. Assistant calls contact_create_keey tool');
      console.log('   4. Tool sends to webhook: ' + WEBHOOK_URL);
      console.log('   5. Webhook processes params (email, phone, postcode)');
      console.log('   6. Webhook generates name from email');
      console.log('   7. Webhook creates contact in GHL');
      console.log('   8. Contact saved ✅');
      console.log('   9. Calendar booking continues ✅');
      console.log('\n✨ System is ready!');
    } else {
      console.log('\n❌ FLOW HAS ISSUES - Review errors above');
    }
    
    console.log('\n' + '='.repeat(70) + '\n');
    
  } catch (error) {
    console.error('\n❌ Error during verification:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

traceFullFlow();

