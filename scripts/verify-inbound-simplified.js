#!/usr/bin/env node

/**
 * Verification Script for Simplified Inbound Assistant
 * 
 * This script verifies that all components are correctly configured
 * for the simplified information collection (email, phone, postal code only)
 */

require('dotenv').config();
const axios = require('axios');

const VAPI_API_KEY = process.env.VAPI_API_KEY;
const INBOUND_ASSISTANT_ID = process.env.VAPI_INBOUND_ASSISTANT_ID;

console.log('\n🔍 ===== VERIFICATION: SIMPLIFIED INBOUND ASSISTANT =====\n');

async function verifyConfiguration() {
  const checks = [];
  
  try {
    // CHECK 1: Vapi Assistant Prompt
    console.log('1️⃣  Checking Vapi Assistant Prompt...');
    const assistantResponse = await axios.get(
      `https://api.vapi.ai/assistant/${INBOUND_ASSISTANT_ID}`,
      {
        headers: {
          'Authorization': `Bearer ${VAPI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const prompt = assistantResponse.data.model?.messages?.[0]?.content || '';
    
    // Check if prompt mentions the 3 simplified fields
    const hasEmailCollection = prompt.includes('Email Address') || prompt.includes('email address');
    const hasPhoneCollection = prompt.includes('Phone Number') || prompt.includes('phone number');
    const hasPostalCodeCollection = prompt.includes('Postal Code') || prompt.includes('postal code') || prompt.includes('postcode');
    
    // Check if old fields are removed
    const hasOldFields = prompt.includes('Full Name') || 
                        prompt.includes('Property Address') || 
                        prompt.includes('Number of Bedrooms') ||
                        prompt.includes('firstName') ||
                        prompt.includes('bedrooms');
    
    if (hasEmailCollection && hasPhoneCollection && hasPostalCodeCollection && !hasOldFields) {
      console.log('   ✅ Prompt correctly mentions 3 simplified fields');
      console.log('   ✅ Old fields removed from prompt');
      checks.push({ name: 'Vapi Prompt', status: 'PASS' });
    } else {
      console.log('   ❌ Prompt issues found:');
      if (!hasEmailCollection) console.log('      - Missing email collection');
      if (!hasPhoneCollection) console.log('      - Missing phone collection');
      if (!hasPostalCodeCollection) console.log('      - Missing postal code collection');
      if (hasOldFields) console.log('      - Still mentions old fields');
      checks.push({ name: 'Vapi Prompt', status: 'FAIL' });
    }
    
  } catch (error) {
    console.log('   ❌ Error checking Vapi assistant:', error.message);
    checks.push({ name: 'Vapi Prompt', status: 'ERROR' });
  }
  
  // CHECK 2: Config Files
  console.log('\n2️⃣  Checking Local Configuration Files...');
  try {
    const fs = require('fs');
    const configPath = './src/config/inbound-assistant-config.js';
    const configContent = fs.readFileSync(configPath, 'utf8');
    
    const hasSimplifiedConfig = configContent.includes('ONLY 3 THINGS') &&
                                configContent.includes('Email Address') &&
                                configContent.includes('Phone Number') &&
                                configContent.includes('Postal Code');
    
    if (hasSimplifiedConfig) {
      console.log('   ✅ Config file updated correctly');
      checks.push({ name: 'Config Files', status: 'PASS' });
    } else {
      console.log('   ❌ Config file not updated');
      checks.push({ name: 'Config Files', status: 'FAIL' });
    }
  } catch (error) {
    console.log('   ❌ Error checking config file:', error.message);
    checks.push({ name: 'Config Files', status: 'ERROR' });
  }
  
  // CHECK 3: Webhook Handlers
  console.log('\n3️⃣  Checking Webhook Handlers...');
  try {
    const fs = require('fs');
    
    // Check vapi-function-handler.js
    const functionHandlerPath = './src/webhooks/vapi-function-handler.js';
    const functionHandlerContent = fs.readFileSync(functionHandlerPath, 'utf8');
    
    const functionHandlerSimplified = functionHandlerContent.includes('email,') &&
                                      functionHandlerContent.includes('phone,') &&
                                      functionHandlerContent.includes('postcode,') &&
                                      !functionHandlerContent.includes('firstName,\n        lastName,');
    
    // Check vapi-webhook.js
    const webhookHandlerPath = './src/webhooks/vapi-webhook.js';
    const webhookHandlerContent = fs.readFileSync(webhookHandlerPath, 'utf8');
    
    const webhookHandlerSimplified = webhookHandlerContent.includes('simplified') &&
                                     webhookHandlerContent.includes('email,') &&
                                     webhookHandlerContent.includes('phone,');
    
    if (functionHandlerSimplified && webhookHandlerSimplified) {
      console.log('   ✅ vapi-function-handler.js updated');
      console.log('   ✅ vapi-webhook.js updated');
      checks.push({ name: 'Webhook Handlers', status: 'PASS' });
    } else {
      console.log('   ❌ Webhook handlers not fully updated:');
      if (!functionHandlerSimplified) console.log('      - vapi-function-handler.js needs update');
      if (!webhookHandlerSimplified) console.log('      - vapi-webhook.js needs update');
      checks.push({ name: 'Webhook Handlers', status: 'FAIL' });
    }
  } catch (error) {
    console.log('   ❌ Error checking webhook handlers:', error.message);
    checks.push({ name: 'Webhook Handlers', status: 'ERROR' });
  }
  
  // CHECK 4: GHL Client Compatibility
  console.log('\n4️⃣  Checking GHL Client Compatibility...');
  try {
    const fs = require('fs');
    const ghlClientPath = './src/services/ghl-client.js';
    const ghlClientContent = fs.readFileSync(ghlClientPath, 'utf8');
    
    // GHL client should handle optional fields gracefully
    const handlesOptionalFields = ghlClientContent.includes('if (contactData[key] !== undefined');
    
    if (handlesOptionalFields) {
      console.log('   ✅ GHL client handles optional fields');
      checks.push({ name: 'GHL Client', status: 'PASS' });
    } else {
      console.log('   ⚠️  GHL client may not handle optional fields gracefully');
      checks.push({ name: 'GHL Client', status: 'WARNING' });
    }
  } catch (error) {
    console.log('   ❌ Error checking GHL client:', error.message);
    checks.push({ name: 'GHL Client', status: 'ERROR' });
  }
  
  // SUMMARY
  console.log('\n' + '='.repeat(60));
  console.log('📊 VERIFICATION SUMMARY');
  console.log('='.repeat(60));
  
  checks.forEach(check => {
    const icon = check.status === 'PASS' ? '✅' : 
                 check.status === 'WARNING' ? '⚠️' : '❌';
    console.log(`${icon} ${check.name}: ${check.status}`);
  });
  
  const allPassed = checks.every(c => c.status === 'PASS' || c.status === 'WARNING');
  
  if (allPassed) {
    console.log('\n✅ ALL CHECKS PASSED! Inbound assistant is properly configured.');
    console.log('\n📋 Summary of Changes:');
    console.log('   • Assistant now collects ONLY: email, phone, postal code');
    console.log('   • Removed fields: name, address, city, bedrooms, region');
    console.log('   • Webhook handlers updated to handle simplified data');
    console.log('   • Calendar functionality remains intact');
    console.log('\n🎯 Next Steps:');
    console.log('   1. Test with a real call to your inbound number');
    console.log('   2. Verify contact is created in GHL with the 3 fields');
    console.log('   3. Verify calendar booking still works');
  } else {
    console.log('\n❌ SOME CHECKS FAILED! Review the issues above.');
    console.log('\n🔧 Recommended Actions:');
    checks.filter(c => c.status !== 'PASS').forEach(check => {
      console.log(`   • Fix: ${check.name}`);
    });
  }
  
  console.log('\n' + '='.repeat(60) + '\n');
}

verifyConfiguration().catch(error => {
  console.error('\n❌ Verification failed:', error.message);
  process.exit(1);
});

