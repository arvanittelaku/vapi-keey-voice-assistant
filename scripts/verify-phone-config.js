#!/usr/bin/env node

/**
 * 🔍 VERIFY PHONE NUMBER CONFIGURATION
 * Quick check to ensure phone numbers are properly assigned
 */

require('dotenv').config();
const axios = require('axios');

const VAPI_API_KEY = process.env.VAPI_API_KEY;

const EXPECTED_CONFIG = {
  '03251648-7837-4e7f-a981-b2dfe4f88881': {
    number: '+44 (7402) 769361',
    name: 'Main Business Number',
    inboundAssistant: '36728053-c5f8-48e6-a3fe-33d6c95348ce',
    outboundSquad: '7cc6e04f-116c-491c-a5b0-00b430bb24db'
  },
  'f9372426-fb13-43d5-9bd6-8a3545800ece': {
    number: '+44 (7427) 920136',
    name: 'Confirmation Number',
    inboundAssistant: null,
    outboundAssistant: '9ade430e-913f-468c-b9a9-e705f64646ab'
  }
};

(async () => {
  try {
    console.log('\n🔍 VERIFYING PHONE NUMBER CONFIGURATION\n');
    console.log('='.repeat(70));
    
    let allCorrect = true;
    
    for (const [phoneId, expected] of Object.entries(EXPECTED_CONFIG)) {
      console.log(`\n📞 ${expected.number} (${expected.name})`);
      
      const response = await axios.get(
        `https://api.vapi.ai/phone-number/${phoneId}`,
        { headers: { 'Authorization': `Bearer ${VAPI_API_KEY}` } }
      );
      
      const actual = response.data;
      
      // Check inbound
      if (expected.inboundAssistant) {
        if (actual.assistantId === expected.inboundAssistant) {
          console.log('   ✅ Inbound: Keey Inbound Lead Assistant');
        } else {
          console.log(`   ❌ Inbound: INCORRECT (${actual.assistantId || 'None'})`);
          allCorrect = false;
        }
      } else {
        if (!actual.assistantId || actual.assistantId === expected.outboundAssistant) {
          console.log('   ✅ Inbound: None (as expected)');
        } else {
          console.log(`   ⚠️  Inbound: ${actual.assistantId} (should be none)`);
        }
      }
      
      // Check outbound squad
      if (expected.outboundSquad) {
        if (actual.squadId === expected.outboundSquad) {
          console.log('   ✅ Outbound: Main Squad');
        } else {
          console.log(`   ❌ Outbound: INCORRECT (${actual.squadId || 'None'})`);
          allCorrect = false;
        }
      }
      
      // Check outbound assistant
      if (expected.outboundAssistant && !expected.inboundAssistant) {
        if (actual.assistantId === expected.outboundAssistant) {
          console.log('   ✅ Outbound: Confirmation Assistant');
        } else {
          console.log(`   ❌ Outbound: INCORRECT (${actual.assistantId || 'None'})`);
          allCorrect = false;
        }
      }
    }
    
    console.log('\n' + '='.repeat(70));
    
    if (allCorrect) {
      console.log('🎉 ALL PHONE NUMBERS CONFIGURED CORRECTLY!\n');
      console.log('✅ Main Business Number: Ready');
      console.log('   - Inbound calls → Keey Inbound Lead Assistant');
      console.log('   - Outbound lead calls → Main Squad\n');
      console.log('✅ Confirmation Number: Ready');
      console.log('   - Outbound confirmation calls → Confirmation Assistant\n');
    } else {
      console.log('⚠️  SOME CONFIGURATIONS ARE INCORRECT!');
      console.log('   Run: node scripts/configure-phone-numbers.js\n');
    }
    
    console.log('='.repeat(70));
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    process.exit(1);
  }
})();

