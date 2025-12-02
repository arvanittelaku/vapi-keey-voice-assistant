#!/usr/bin/env node
/**
 * Test Script: Trigger Workflow for Specific Contact
 * 
 * Tests the "Appointment Confirmed" workflow with a real contact
 */

require('dotenv').config();
const GHLClient = require('../src/services/ghl-client');

const ghlClient = new GHLClient();

// Contact ID from the URL provided
const CONTACT_ID = 'teRvT86xUyZ316UtjmWu';

async function testWithSpecificContact() {
  console.log('\n🧪 TESTING WORKFLOW WITH SPECIFIC CONTACT\n');
  console.log('==================================================\n');

  try {
    // Step 1: Get contact details
    console.log('📝 Step 1: Fetching contact details...\n');
    console.log(`   Contact ID: ${CONTACT_ID}`);
    
    const contact = await ghlClient.getContact(CONTACT_ID);
    
    console.log('✅ Contact found!');
    console.log(`   Name: ${contact.firstName} ${contact.lastName}`);
    console.log(`   Email: ${contact.email}`);
    console.log(`   Phone: ${contact.phone}`);
    console.log('');

    // Step 2: Trigger the workflow
    console.log('🔔 Step 2: Triggering "Appointment Confirmed" workflow...\n');
    
    const customData = {
      contactId: CONTACT_ID,
      appointmentId: 'test-appt-' + Date.now(),
      status: 'confirmed',
      appointmentTime: '2:00 PM',
      appointmentDate: 'Thursday, November 28th',
      confirmedAt: new Date().toISOString(),
      testMode: true
    };

    console.log('📤 Triggering workflow with data:');
    console.log(JSON.stringify(customData, null, 2));
    console.log('');

    const result = await ghlClient.triggerWorkflow(
      process.env.GHL_WORKFLOW_CONFIRMED,
      CONTACT_ID,
      customData
    );

    console.log('✅ Workflow triggered successfully!\n');
    console.log('📊 Response:', JSON.stringify(result, null, 2));
    console.log('');

    // Step 3: Instructions
    console.log('==================================================');
    console.log('🎉 TEST COMPLETE!\n');
    console.log('Next steps:');
    console.log('1. Check GHL Execution Logs for this workflow');
    console.log('2. Check if SMS was sent (look for "Completed" instead of "Skipped")');
    console.log('3. Check Conversations → find this contact');
    console.log('4. Verify SMS appears in the conversation thread');
    console.log('');
    console.log(`📋 Contact ID: ${CONTACT_ID}`);
    console.log(`📧 Contact Email: ${contact.email}`);
    console.log(`📱 Contact Phone: ${contact.phone}`);
    console.log('');

  } catch (error) {
    console.error('\n❌ TEST FAILED!\n');
    console.error('Error:', error.message);
    
    if (error.response) {
      console.error('\nAPI Response:');
      console.error(JSON.stringify(error.response.data, null, 2));
    }
    
    process.exit(1);
  }
}

// Run the test
testWithSpecificContact();

