#!/usr/bin/env node
/**
 * Test Script: Workflow Trigger - Appointment Cancelled
 * 
 * This script tests if the "cancelled" workflow trigger works correctly.
 */

require('dotenv').config();
const GHLClient = require('../src/services/ghl-client');

const ghlClient = new GHLClient();

// Use the same real contact we tested before
const CONTACT_ID = 'teRvT86xUyZ316UtjmWu'; // Arvanit Telaku

async function testCancelledWorkflow() {
  console.log('\n🧪 TESTING WORKFLOW TRIGGER: Appointment Cancelled\n');
  console.log('==================================================\n');

  const WORKFLOW_URL = process.env.GHL_WORKFLOW_CANCELLED;

  console.log('📋 Test Configuration:');
  console.log(`   Contact ID: ${CONTACT_ID}`);
  console.log(`   Workflow URL: ${WORKFLOW_URL}`);
  console.log('');

  if (!WORKFLOW_URL) {
    console.error('❌ ERROR: GHL_WORKFLOW_CANCELLED not configured in .env');
    process.exit(1);
  }

  try {
    // Get contact details
    const contact = await ghlClient.getContact(CONTACT_ID);
    console.log('✅ Contact found!');
    console.log(`   Name: ${contact.firstName} ${contact.lastName}`);
    console.log(`   Phone: ${contact.phone}`);
    console.log('');

    console.log('🔔 Triggering "Appointment Cancelled" workflow...\n');

    // Prepare custom data matching what the voice assistant sends
    const customData = {
      contactId: CONTACT_ID,
      appointmentId: 'test-appt-' + Date.now(),
      status: 'cancelled',
      reason: 'customer cannot attend',
      cancelledAt: new Date().toISOString(),
      appointmentTime: '2:00 PM',
      appointmentDate: 'Thursday, November 28th',
      testMode: true
    };

    console.log('📤 Sending data to workflow:');
    console.log(JSON.stringify(customData, null, 2));
    console.log('');

    // Trigger the workflow
    const result = await ghlClient.triggerWorkflow(
      WORKFLOW_URL,
      CONTACT_ID,
      customData
    );

    console.log('✅ SUCCESS! Workflow triggered successfully!\n');
    console.log('📊 Response from GHL:');
    console.log(JSON.stringify(result, null, 2));
    console.log('');
    
    console.log('==================================================');
    console.log('🎉 TEST PASSED!\n');
    console.log('What to check:');
    console.log('1. Go to GHL → Workflows → "10.Confirmation - Appointment Cancelled"');
    console.log('2. Click "Execution Logs"');
    console.log('3. Check if the latest execution shows SMS as "Executed"');
    console.log('4. The SMS message should be about cancellation/rebooking');
    console.log('');
    console.log('📋 Expected SMS message:');
    console.log('   Should offer rebooking options to the customer');
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
testCancelledWorkflow();

