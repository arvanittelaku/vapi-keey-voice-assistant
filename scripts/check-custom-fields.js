#!/usr/bin/env node
/**
 * Check existing GHL custom fields
 * This helps us see what fields already exist before creating new ones
 */

require('dotenv').config();
const axios = require('axios');

const GHL_API_KEY = process.env.GHL_API_KEY;
const GHL_LOCATION_ID = process.env.GHL_LOCATION_ID;

async function checkCustomFields() {
  console.log('\n🔍 Checking GHL Custom Fields\n');
  console.log('==================================================\n');

  try {
    // Get custom fields
    const response = await axios.get(
      `https://services.leadconnectorhq.com/locations/${GHL_LOCATION_ID}/customFields`,
      {
        headers: {
          'Authorization': `Bearer ${GHL_API_KEY}`,
          'Version': '2021-07-28'
        }
      }
    );

    const customFields = response.data.customFields || [];
    
    console.log(`✅ Found ${customFields.length} custom fields\n`);
    
    // Fields we need for call tracking
    const neededFields = [
      'call_attempts',
      'last_call_time', 
      'call_result',
      'call_status',
      'next_call_schedule',
      'ended_reason'
    ];
    
    console.log('📋 Fields Needed for Call Tracking:\n');
    
    neededFields.forEach(fieldName => {
      const exists = customFields.find(f => 
        f.name.toLowerCase() === fieldName.toLowerCase() ||
        f.fieldKey === fieldName
      );
      
      if (exists) {
        console.log(`✅ ${fieldName}`);
        console.log(`   ID: ${exists.id}`);
        console.log(`   Type: ${exists.dataType}`);
        console.log('');
      } else {
        console.log(`❌ ${fieldName} - NOT FOUND`);
        console.log(`   Needs to be created`);
        console.log('');
      }
    });
    
    console.log('==================================================\n');
    console.log('📝 All Custom Fields:\n');
    
    customFields.forEach(field => {
      console.log(`• ${field.name}`);
      console.log(`  ID: ${field.id}`);
      console.log(`  Key: ${field.fieldKey}`);
      console.log(`  Type: ${field.dataType}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error fetching custom fields:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

checkCustomFields();

