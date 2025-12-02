#!/usr/bin/env node
/**
 * Test Script: Workflow Trigger - Appointment Confirmed
 * 
 * This script tests if the "confirmed" workflow trigger works correctly.
 * It simulates what happens when a customer confirms their appointment.
 */

require('dotenv').config();
const GHLClient = require('../src/services/ghl-client');

const ghlClient = new GHLClient();

async function testWorkflowTrigger() {
  console.log('\n🧪 TESTING WORKFLOW TRIGGER: Appointment Confirmed\n');
  console.log('==================================================\n');

  // Test configuration
  const TEST_CONTACT_ID = 'test-contact-' + Date.now();
  const TEST_APPOINTMENT_ID = 'test-appt-' + Date.now();
  const WORKFLOW_URL = process.env.GHL_WORKFLOW_CONFIRMED;

  console.log('📋 Test Configuration:');
  console.log(`   Contact ID: ${TEST_CONTACT_ID}`);
  console.log(`   Appointment ID: ${TEST_APPOINTMENT_ID}`);
  console.log(`   Workflow URL: ${WORKFLOW_URL}`);
  console.log('');

  if (!WORKFLOW_URL) {
    console.error('❌ ERROR: GHL_WORKFLOW_CONFIRMED not configured in .env');
    console.error('   Please add it to your .env file and try again.');
    process.exit(1);
  }

  try {
    console.log('🔔 Triggering "Appointment Confirmed" workflow...\n');

    // Prepare custom data to send to the workflow
    const customData = {
      contactId: TEST_CONTACT_ID,
      appointmentId: TEST_APPOINTMENT_ID,
      status: 'confirmed',
      appointmentTime: '2:00 PM',
      appointmentDate: 'Thursday, November 28th',
      confirmedAt: new Date().toISOString(),
      testMode: true
    };

    console.log('📤 Sending data to workflow:');
    console.log(JSON.stringify(customData, null, 2));
    console.log('');

    // Trigger the workflow
    const result = await ghlClient.triggerWorkflow(
      WORKFLOW_URL,
      TEST_CONTACT_ID,
      customData
    );

    console.log('✅ SUCCESS! Workflow triggered successfully!\n');
    console.log('📊 Response from GHL:');
    console.log(JSON.stringify(result, null, 2));
    console.log('');
    
    console.log('==================================================');
    console.log('🎉 TEST PASSED!\n');
    console.log('What this means:');
    console.log('✅ Your code can successfully trigger the GHL workflow');
    console.log('✅ The webhook URL is correct');
    console.log('✅ The GHL workflow should have received the trigger');
    console.log('');
    console.log('Next steps:');
    console.log('1. Check your GHL workflow "Execution Logs" to see if it ran');
    console.log('2. Check if any SMS was sent (if configured in the workflow)');
    console.log('3. If everything looks good, we can move to the next workflow!');
    console.log('');

  } catch (error) {
    console.error('\n❌ TEST FAILED!\n');
    console.error('Error:', error.message);
    
    if (error.response) {
      console.error('\nAPI Response:');
      console.error(JSON.stringify(error.response.data, null, 2));
    }
    
    console.error('\n==================================================');
    console.error('🔧 Troubleshooting:');
    console.error('1. Verify the webhook URL is correct in .env');
    console.error('2. Check if the workflow is "Published" in GHL (not Draft)');
    console.error('3. Verify your GHL_API_KEY has permission to trigger workflows');
    console.error('');
    
    process.exit(1);
  }
}

// Run the test
testWorkflowTrigger();

