#!/usr/bin/env node

/**
 * 🔍 VERIFY .env CONFIGURATION
 * Checks if all required environment variables are set correctly
 */

require('dotenv').config();

console.log('\n🔍 VERIFYING .env CONFIGURATION\n');
console.log('='.repeat(70));

const required = {
  // API Keys
  'VAPI_API_KEY': 'Vapi API key',
  'GHL_API_KEY': 'GoHighLevel API key',
  'GHL_LOCATION_ID': 'GoHighLevel location ID',
  'GHL_CALENDAR_ID': 'GoHighLevel calendar ID',
  
  // Phone Numbers
  'VAPI_PHONE_NUMBER_ID': 'Main phone number ID',
  'VAPI_CONFIRMATION_PHONE_NUMBER_ID': 'Confirmation phone number ID',
  'TWILIO_PHONE_NUMBER': 'Twilio phone number',
  
  // Assistants/Squads
  'VAPI_SQUAD_ID': 'Main Squad ID',
  'VAPI_CONFIRMATION_ASSISTANT_ID': 'Confirmation Assistant ID',
  'VAPI_INBOUND_ASSISTANT_ID': 'Inbound Assistant ID',
  
  // Transfer
  'TRANSFER_PHONE_NUMBER': 'Transfer phone number'
};

const optional = {
  'VAPI_SERVER_SECRET': 'Vapi server secret (Render only)',
  'VAPI_INBOUND_WEBHOOK_URL': 'Vapi inbound webhook URL (optional)',
  'PORT': 'Server port (defaults to 3000)'
};

let allGood = true;

console.log('\n✅ REQUIRED VARIABLES:\n');

for (const [key, description] of Object.entries(required)) {
  const value = process.env[key];
  if (value) {
    // Show first and last 4 chars for security
    const masked = value.length > 12 
      ? value.substring(0, 6) + '...' + value.substring(value.length - 6)
      : value.substring(0, 4) + '...' + value.substring(value.length - 4);
    console.log(`   ✅ ${key}`);
    console.log(`      ${description}: ${masked}`);
  } else {
    console.log(`   ❌ ${key} - MISSING!`);
    console.log(`      ${description}`);
    allGood = false;
  }
}

console.log('\n⚠️  OPTIONAL VARIABLES:\n');

for (const [key, description] of Object.entries(optional)) {
  const value = process.env[key];
  if (value) {
    const masked = value.length > 12 
      ? value.substring(0, 6) + '...' + value.substring(value.length - 6)
      : value;
    console.log(`   ✅ ${key}`);
    console.log(`      ${description}: ${masked}`);
  } else {
    console.log(`   ⚠️  ${key} - Not set`);
    console.log(`      ${description}`);
  }
}

console.log('\n' + '='.repeat(70));

if (allGood) {
  console.log('\n🎉 ALL REQUIRED VARIABLES ARE SET!\n');
  console.log('✅ Your .env file is correctly configured');
  console.log('✅ Ready for deployment!\n');
  
  // Verify phone number IDs match expected values
  console.log('📞 PHONE NUMBER VERIFICATION:\n');
  
  const mainPhone = process.env.VAPI_PHONE_NUMBER_ID;
  const confPhone = process.env.VAPI_CONFIRMATION_PHONE_NUMBER_ID;
  
  if (mainPhone === '03251648-7837-4e7f-a981-b2dfe4f88881') {
    console.log('   ✅ Main phone ID: CORRECT (+44 7402 769361)');
  } else {
    console.log('   ⚠️  Main phone ID: Different than expected');
    console.log('      Expected: 03251648-7837-4e7f-a981-b2dfe4f88881');
    console.log('      Got:', mainPhone);
  }
  
  if (confPhone === 'f9372426-fb13-43d5-9bd6-8a3545800ece') {
    console.log('   ✅ Confirmation phone ID: CORRECT (+44 7427 920136)');
  } else {
    console.log('   ⚠️  Confirmation phone ID: Different than expected');
    console.log('      Expected: f9372426-fb13-43d5-9bd6-8a3545800ece');
    console.log('      Got:', confPhone);
  }
  
  console.log('\n' + '='.repeat(70));
  console.log('🚀 READY TO DEPLOY!');
  console.log('='.repeat(70));
  
} else {
  console.log('\n⚠️  SOME REQUIRED VARIABLES ARE MISSING!\n');
  console.log('Please add the missing variables to your .env file.\n');
  console.log('Refer to: PHONE_NUMBER_FINAL_CONFIG.md for the correct values\n');
  process.exit(1);
}

