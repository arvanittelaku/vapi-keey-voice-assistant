#!/usr/bin/env node

/**
 * 🔧 CONFIGURE PHONE NUMBERS VIA VAPI API
 * Assigns correct assistants/squads to each phone number
 */

require('dotenv').config();
const axios = require('axios');

const VAPI_API_KEY = process.env.VAPI_API_KEY;

// Phone Number 1: Main Business Line
const PHONE_1 = {
  id: '03251648-7837-4e7f-a981-b2dfe4f88881',
  number: '+44 (7402) 769361',
  name: 'Keey Main Business Number',
  inboundAssistantId: '36728053-c5f8-48e6-a3fe-33d6c95348ce', // Inbound Lead Assistant
  outboundSquadId: '7cc6e04f-116c-491c-a5b0-00b430bb24db' // Main Squad
};

// Phone Number 2: Confirmation Line
const PHONE_2 = {
  id: 'f9372426-fb13-43d5-9bd6-8a3545800ece',
  number: '+44 (7427) 920136',
  name: 'Keey Appointment Confirmation Number',
  inboundAssistantId: null, // No inbound
  outboundAssistantId: '9ade430e-913f-468c-b9a9-e705f64646ab' // Confirmation Assistant
};

console.log('\n🔧 CONFIGURING PHONE NUMBERS VIA VAPI API\n');
console.log('='.repeat(70));

async function configurePhoneNumber(phone) {
  try {
    console.log(`\n📞 Configuring: ${phone.number}`);
    console.log(`   ID: ${phone.id}`);
    
    // Build the update payload
    const payload = {
      name: phone.name
    };
    
    // Add inbound settings
    if (phone.inboundAssistantId) {
      payload.assistantId = phone.inboundAssistantId;
      console.log(`   Inbound: Assistant ${phone.inboundAssistantId}`);
    } else {
      console.log(`   Inbound: None (not used)`);
    }
    
    // Add outbound settings
    if (phone.outboundSquadId) {
      payload.squadId = phone.outboundSquadId;
      console.log(`   Outbound: Squad ${phone.outboundSquadId}`);
    } else if (phone.outboundAssistantId) {
      payload.assistantId = phone.outboundAssistantId;
      console.log(`   Outbound: Assistant ${phone.outboundAssistantId}`);
    }
    
    console.log('\n   📤 Updating via API...');
    
    const response = await axios.patch(
      `https://api.vapi.ai/phone-number/${phone.id}`,
      payload,
      {
        headers: {
          'Authorization': `Bearer ${VAPI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('   ✅ Successfully configured!');
    
    return response.data;
    
  } catch (error) {
    console.error(`   ❌ Error configuring ${phone.number}:`, error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', JSON.stringify(error.response.data, null, 2));
    }
    throw error;
  }
}

async function verifyPhoneNumber(phone) {
  try {
    console.log(`\n🔍 Verifying: ${phone.number}`);
    
    const response = await axios.get(
      `https://api.vapi.ai/phone-number/${phone.id}`,
      {
        headers: {
          'Authorization': `Bearer ${VAPI_API_KEY}`
        }
      }
    );
    
    const data = response.data;
    
    console.log('   📋 Current Configuration:');
    console.log('      Name:', data.name || 'Not set');
    console.log('      Inbound Assistant:', data.assistantId || 'None');
    console.log('      Outbound Squad:', data.squadId || 'None');
    
    // Verify it matches expected
    let allCorrect = true;
    
    if (phone.inboundAssistantId && data.assistantId !== phone.inboundAssistantId) {
      console.log('   ⚠️  Inbound assistant mismatch!');
      allCorrect = false;
    }
    
    if (phone.outboundSquadId && data.squadId !== phone.outboundSquadId) {
      console.log('   ⚠️  Outbound squad mismatch!');
      allCorrect = false;
    }
    
    if (phone.outboundAssistantId && data.assistantId !== phone.outboundAssistantId) {
      console.log('   ⚠️  Outbound assistant mismatch!');
      allCorrect = false;
    }
    
    if (allCorrect) {
      console.log('   ✅ Configuration verified correct!');
    }
    
    return allCorrect;
    
  } catch (error) {
    console.error(`   ❌ Error verifying ${phone.number}:`, error.message);
    return false;
  }
}

(async () => {
  try {
    console.log('\n📋 PHONE NUMBERS TO CONFIGURE:\n');
    console.log('1. Main Business Number: +44 (7402) 769361');
    console.log('   Inbound: Keey Inbound Lead Assistant');
    console.log('   Outbound: Main Squad\n');
    
    console.log('2. Confirmation Number: +44 (7427) 920136');
    console.log('   Inbound: None');
    console.log('   Outbound: Keey Appointment Confirmation Assistant\n');
    
    console.log('='.repeat(70));
    
    // Configure both numbers
    await configurePhoneNumber(PHONE_1);
    await configurePhoneNumber(PHONE_2);
    
    console.log('\n' + '='.repeat(70));
    console.log('⏳ Waiting 2 seconds for changes to propagate...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Verify both numbers
    console.log('='.repeat(70));
    const phone1Valid = await verifyPhoneNumber(PHONE_1);
    const phone2Valid = await verifyPhoneNumber(PHONE_2);
    
    console.log('\n' + '='.repeat(70));
    console.log('📊 FINAL VERIFICATION RESULTS:');
    console.log('='.repeat(70));
    
    if (phone1Valid && phone2Valid) {
      console.log('\n🎉 SUCCESS! Both phone numbers configured correctly!\n');
      console.log('✅ Main Business Number: CONFIGURED');
      console.log('✅ Confirmation Number: CONFIGURED\n');
      console.log('You can now refresh the Vapi dashboard and see the assignments!\n');
    } else {
      console.log('\n⚠️  Some configurations may not have applied correctly.');
      console.log('   Check the details above and try again.\n');
    }
    
    console.log('='.repeat(70));
    
  } catch (error) {
    console.error('\n❌ FATAL ERROR:', error.message);
    process.exit(1);
  }
})();

