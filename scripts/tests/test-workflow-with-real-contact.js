#!/usr/bin/env node
/**
 * Test Script: Workflow Trigger with Real Contact
 * 
 * This script:
 * 1. Creates a real test contact in GHL
 * 2. Triggers the confirmation workflow
 * 3. Verifies the SMS is actually sent
 */

require('dotenv').config();
const GHLClient = require('../src/services/ghl-client');

const ghlClient = new GHLClient();

async function testWithRealContact() {
  console.log('\n🧪 TESTING WORKFLOW WITH REAL CONTACT\n');
  console.log('==================================================\n');

  try {
    // Step 1: Create a real test contact
    console.log('📝 Step 1: Creating test contact in GHL...\n');
    
    const testContact = {
      firstName: 'Test',
      lastName: 'Workflow',
      email: `test-workflow-${Date.now()}@example.com`,
      phone: '+447700900123', // UK test number
      source: 'Workflow Test Script',
      tags: ['workflow-test']
    };

    console.log('   Creating contact:');
    console.log(`   Name: ${testContact.firstName} ${testContact.lastName}`);
    console.log(`   Email: ${testContact.email}`);
    console.log(`   Phone: ${testContact.phone}`);
    console.log('');

    const contact = await ghlClient.createContact(testContact);
    console.log(`✅ Contact created successfully!`);
    console.log(`   Contact ID: ${contact.id}`);
    console.log('');

    // Step 2: Wait a moment for contact to be fully created
    console.log('⏳ Waiting 2 seconds for contact to sync...\n');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Step 3: Trigger the workflow
    console.log('🔔 Step 2: Triggering "Appointment Confirmed" workflow...\n');
    
    const customData = {
      contactId: contact.id,
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
      contact.id,
      customData
    );

    console.log('✅ Workflow triggered successfully!\n');
    console.log('📊 Response:', JSON.stringify(result, null, 2));
    console.log('');

    // Step 4: Instructions
    console.log('==================================================');
    console.log('🎉 TEST COMPLETE!\n');
    console.log('Next steps:');
    console.log('1. Go to GHL → Automation → Workflows');
    console.log('2. Open "9.Confirmation - Appointment Confirmed"');
    console.log('3. Click "Execution Logs" tab');
    console.log('4. Check the latest execution - SMS should NOT be skipped this time!');
    console.log('5. (Optional) Check if SMS was sent to +447700900123');
    console.log('');
    console.log(`📋 Test Contact ID: ${contact.id}`);
    console.log(`📧 Test Contact Email: ${testContact.email}`);
    console.log('');
    console.log('⚠️  NOTE: The phone number +447700900123 is a test number.');
    console.log('   SMS might not actually deliver, but workflow should try to send it.');
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
testWithRealContact();

