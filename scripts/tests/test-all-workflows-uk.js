#!/usr/bin/env node
/**
 * Test Script: Test All 4 Workflows with UK Contact
 * 
 * Creates a UK contact and tests all confirmation workflows
 */

require('dotenv').config();
const GHLClient = require('../src/services/ghl-client');

const ghlClient = new GHLClient();

async function testAllWorkflows() {
  console.log('\n🧪 TESTING ALL 4 WORKFLOWS WITH UK CONTACT\n');
  console.log('==================================================\n');

  try {
    // Step 1: Create a UK contact with UK phone number
    console.log('📝 Step 1: Creating UK test contact...\n');
    
    const ukContact = {
      firstName: 'Test',
      lastName: 'UK Workflow',
      email: `test-uk-${Date.now()}@example.com`,
      phone: '+447700900456', // UK test number
      source: 'Workflow Test - UK',
      tags: ['workflow-test-uk']
    };

    console.log('   Creating contact:');
    console.log(`   Name: ${ukContact.firstName} ${ukContact.lastName}`);
    console.log(`   Email: ${ukContact.email}`);
    console.log(`   Phone: ${ukContact.phone} (UK)`);
    console.log('');

    const contact = await ghlClient.createContact(ukContact);
    console.log(`✅ UK Contact created!`);
    console.log(`   Contact ID: ${contact.id}`);
    console.log('');

    // Wait for contact to sync
    console.log('⏳ Waiting 2 seconds for contact to sync...\n');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test all 4 workflows
    const workflows = [
      {
        name: 'Appointment Confirmed',
        envVar: 'GHL_WORKFLOW_CONFIRMED',
        url: process.env.GHL_WORKFLOW_CONFIRMED,
        status: 'confirmed'
      },
      {
        name: 'Appointment Cancelled',
        envVar: 'GHL_WORKFLOW_CANCELLED',
        url: process.env.GHL_WORKFLOW_CANCELLED,
        status: 'cancelled'
      },
      {
        name: 'Reschedule Request',
        envVar: 'GHL_WORKFLOW_RESCHEDULE',
        url: process.env.GHL_WORKFLOW_RESCHEDULE,
        status: 'reschedule'
      },
      {
        name: 'No Answer',
        envVar: 'GHL_WORKFLOW_NO_ANSWER',
        url: process.env.GHL_WORKFLOW_NO_ANSWER,
        status: 'no_answer'
      }
    ];

    console.log('🔔 Testing All 4 Workflows:\n');
    const results = [];

    for (const workflow of workflows) {
      console.log(`\n📋 Testing: ${workflow.name}`);
      console.log(`   Status: ${workflow.status}`);
      console.log(`   Workflow URL: ${workflow.url ? '✓ Configured' : '✗ Missing'}`);

      if (!workflow.url) {
        console.log(`   ⚠️  Skipped (${workflow.envVar} not configured)\n`);
        results.push({ workflow: workflow.name, status: 'SKIPPED', reason: 'Not configured' });
        continue;
      }

      try {
        const customData = {
          contactId: contact.id,
          appointmentId: `test-appt-${Date.now()}`,
          status: workflow.status,
          appointmentTime: '2:00 PM',
          appointmentDate: 'Thursday, November 28th',
          testMode: true,
          timestamp: new Date().toISOString()
        };

        const result = await ghlClient.triggerWorkflow(
          workflow.url,
          contact.id,
          customData
        );

        console.log(`   ✅ SUCCESS! Execution ID: ${result.id}\n`);
        results.push({ workflow: workflow.name, status: 'PASSED', executionId: result.id });
        
        // Wait 1 second between workflows
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.log(`   ❌ FAILED: ${error.message}\n`);
        results.push({ workflow: workflow.name, status: 'FAILED', error: error.message });
      }
    }

    // Summary
    console.log('\n==================================================');
    console.log('📊 TEST SUMMARY\n');
    console.log('Test Contact (UK):');
    console.log(`   ID: ${contact.id}`);
    console.log(`   Phone: ${ukContact.phone} (UK - SMS should work!)`);
    console.log(`   Email: ${ukContact.email}`);
    console.log('');
    console.log('Workflow Results:');
    results.forEach((r, i) => {
      const icon = r.status === 'PASSED' ? '✅' : r.status === 'FAILED' ? '❌' : '⚠️';
      console.log(`   ${i + 1}. ${icon} ${r.workflow}: ${r.status}`);
      if (r.executionId) console.log(`      Execution ID: ${r.executionId}`);
    });
    console.log('');
    console.log('Next Steps:');
    console.log('1. Check GHL Execution Logs for each workflow');
    console.log('2. This time SMS should show "Executed" (UK number!)');
    console.log('3. Check if SMS messages were actually sent');
    console.log('4. If all pass, workflows are ready for production!');
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
testAllWorkflows();

