#!/usr/bin/env node

/**
 * Fetch Phone Number IDs from Vapi
 * Automatically gets and displays phone number IDs for .env file
 */

require('dotenv').config();
const VapiClient = require('../src/services/vapi-client');

async function fetchPhoneNumbers() {
  console.log('\n╔═══════════════════════════════════════════════════════════════╗');
  console.log('║     FETCHING PHONE NUMBER IDs FROM VAPI                      ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  if (!process.env.VAPI_API_KEY) {
    console.error('❌ VAPI_API_KEY not found in environment variables');
    console.error('   Please set it in your .env file');
    process.exit(1);
  }

  const vapiClient = new VapiClient();

  try {
    console.log('📞 Fetching phone numbers from Vapi...\n');
    
    const phoneNumbers = await vapiClient.getPhoneNumbers();
    
    if (!phoneNumbers || phoneNumbers.length === 0) {
      console.log('⚠️  No phone numbers found in your Vapi account');
      console.log('   You may need to purchase phone numbers first\n');
      return;
    }

    console.log(`✅ Found ${phoneNumbers.length} phone number(s):\n`);

    let inboundFound = false;
    let outboundFound = false;

    phoneNumbers.forEach((phone, index) => {
      console.log(`${index + 1}. Phone Number: ${phone.number || phone.phoneNumber || 'N/A'}`);
      console.log(`   ID: ${phone.id}`);
      console.log(`   Provider: ${phone.provider || 'N/A'}`);
      console.log(`   Status: ${phone.status || 'N/A'}`);
      
      // Try to determine if it's inbound or outbound based on current env vars
      const isInbound = process.env.VAPI_INBOUND_PHONE_NUMBER_ID === phone.id;
      const isOutbound = process.env.VAPI_OUTBOUND_PHONE_NUMBER_ID === phone.id;
      
      if (isInbound) {
        console.log(`   ✅ Currently set as INBOUND in .env`);
        inboundFound = true;
      } else if (isOutbound) {
        console.log(`   ✅ Currently set as OUTBOUND in .env`);
        outboundFound = true;
      } else {
        console.log(`   ⚠️  Not set in .env`);
      }
      console.log('');
    });

    console.log('\n📋 RECOMMENDED .env CONFIGURATION:\n');
    
    // Suggest first phone as inbound if not set
    if (!inboundFound && phoneNumbers.length > 0) {
      console.log(`VAPI_INBOUND_PHONE_NUMBER_ID=${phoneNumbers[0].id}`);
    }
    
    // Suggest second phone as outbound if available, otherwise same as inbound
    if (!outboundFound) {
      if (phoneNumbers.length > 1) {
        console.log(`VAPI_OUTBOUND_PHONE_NUMBER_ID=${phoneNumbers[1].id}`);
      } else if (phoneNumbers.length > 0) {
        console.log(`VAPI_OUTBOUND_PHONE_NUMBER_ID=${phoneNumbers[0].id}  # Using same phone for both`);
      }
    }

    console.log('\n💡 NOTE:');
    console.log('   - For SQUAD-based calls, phone numbers are configured in the Squad settings');
    console.log('   - These IDs are only needed for direct assistant calls (not through squad)');
    console.log('   - If you\'re using a Squad, these IDs are OPTIONAL\n');

    console.log('✅ Phone number fetch complete!\n');

  } catch (error) {
    console.error('\n❌ Error fetching phone numbers:');
    console.error(`   ${error.message}`);
    
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Data: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    
    process.exit(1);
  }
}

fetchPhoneNumbers();

