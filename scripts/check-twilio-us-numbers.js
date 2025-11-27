#!/usr/bin/env node

/**
 * Check Twilio Account for US Phone Numbers
 * This script helps identify which numbers need A2P registration
 */

require('dotenv').config();
const twilio = require('twilio');

async function checkUSNumbers() {
  console.log('🔍 Checking Twilio Account for US Phone Numbers...\n');

  // Check if Twilio credentials are configured
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    console.error('❌ Twilio credentials not found in .env file');
    console.log('\nRequired environment variables:');
    console.log('  - TWILIO_ACCOUNT_SID');
    console.log('  - TWILIO_AUTH_TOKEN\n');
    process.exit(1);
  }

  const client = twilio(accountSid, authToken);

  try {
    // Fetch all phone numbers
    console.log('📱 Fetching phone numbers from Twilio...\n');
    const numbers = await client.incomingPhoneNumbers.list();

    if (numbers.length === 0) {
      console.log('⚠️  No phone numbers found in this Twilio account\n');
      return;
    }

    // Separate US and non-US numbers
    const usNumbers = numbers.filter(num => num.phoneNumber.startsWith('+1'));
    const nonUSNumbers = numbers.filter(num => !num.phoneNumber.startsWith('+1'));

    console.log('📊 Summary:');
    console.log(`   Total Numbers: ${numbers.length}`);
    console.log(`   US Numbers: ${usNumbers.length}`);
    console.log(`   Non-US Numbers: ${nonUSNumbers.length}\n`);

    // Display US numbers that need A2P registration
    if (usNumbers.length > 0) {
      console.log('🇺🇸 US NUMBERS (Require A2P Registration):');
      console.log('─'.repeat(80));
      
      for (const number of usNumbers) {
        console.log(`\n📞 ${number.phoneNumber}`);
        console.log(`   Friendly Name: ${number.friendlyName || 'N/A'}`);
        console.log(`   Capabilities: ${getCapabilities(number)}`);
        console.log(`   Status: ${number.status}`);
        
        // Check if SMS-capable
        if (number.capabilities.sms) {
          console.log('   ⚠️  NEEDS A2P REGISTRATION for SMS');
        } else {
          console.log('   ℹ️  Voice only - A2P not required');
        }
      }
      console.log('\n' + '─'.repeat(80));
      
      // Count SMS-capable US numbers
      const smsCapableUSNumbers = usNumbers.filter(num => num.capabilities.sms);
      
      console.log('\n📋 A2P Registration Required for:');
      console.log(`   ${smsCapableUSNumbers.length} SMS-capable US number(s)\n`);
      
      if (smsCapableUSNumbers.length > 0) {
        console.log('✅ Next Steps:');
        console.log('   1. Fill out: A2P_INFORMATION_TEMPLATE.md');
        console.log('   2. Follow guide: A2P_REGISTRATION_GUIDE.md');
        console.log('   3. Register at: Twilio Console → Messaging → A2P 10DLC');
        console.log('   4. Timeline: 2-4 weeks for full approval\n');
      }
      
    } else {
      console.log('✅ No US numbers found - A2P registration not required\n');
    }

    // Display non-US numbers
    if (nonUSNumbers.length > 0) {
      console.log('🌍 NON-US NUMBERS (No A2P Registration Needed):');
      console.log('─'.repeat(80));
      
      for (const number of nonUSNumbers) {
        const country = getCountryFromCode(number.phoneNumber);
        console.log(`\n📞 ${number.phoneNumber} (${country})`);
        console.log(`   Friendly Name: ${number.friendlyName || 'N/A'}`);
        console.log(`   Capabilities: ${getCapabilities(number)}`);
      }
      console.log('\n' + '─'.repeat(80) + '\n');
    }

    // Check for subaccounts
    console.log('🔍 Checking for Subaccounts...\n');
    const subaccounts = await client.api.accounts.list();
    
    if (subaccounts.length > 1) {
      console.log(`📂 Found ${subaccounts.length - 1} subaccount(s):`);
      console.log('   (Main account + subaccounts)\n');
      
      for (const subaccount of subaccounts) {
        if (subaccount.sid !== accountSid) {
          console.log(`   📁 ${subaccount.friendlyName || 'Unnamed'}`);
          console.log(`      SID: ${subaccount.sid}`);
          console.log(`      Status: ${subaccount.status}\n`);
        }
      }
      
      console.log('⚠️  IMPORTANT: Each subaccount may need separate A2P registration!');
      console.log('   You\'ll need to check each subaccount individually.\n');
    } else {
      console.log('✅ No subaccounts found - only main account to register\n');
    }

  } catch (error) {
    console.error('❌ Error fetching Twilio data:', error.message);
    
    if (error.code === 20003) {
      console.error('\n   Authentication failed - check your TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN\n');
    }
    
    process.exit(1);
  }
}

/**
 * Get capabilities string for display
 */
function getCapabilities(number) {
  const caps = [];
  if (number.capabilities.voice) caps.push('Voice');
  if (number.capabilities.sms) caps.push('SMS');
  if (number.capabilities.mms) caps.push('MMS');
  if (number.capabilities.fax) caps.push('Fax');
  return caps.join(', ') || 'None';
}

/**
 * Get country name from phone number
 */
function getCountryFromCode(phoneNumber) {
  const countryMap = {
    '+1': 'US/Canada',
    '+44': 'UK',
    '+33': 'France',
    '+49': 'Germany',
    '+34': 'Spain',
    '+39': 'Italy',
    '+61': 'Australia',
    '+91': 'India',
    '+86': 'China',
    '+81': 'Japan',
  };
  
  for (const [code, name] of Object.entries(countryMap)) {
    if (phoneNumber.startsWith(code)) {
      return name;
    }
  }
  
  return 'Unknown';
}

// Run the check
checkUSNumbers().catch(error => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});

