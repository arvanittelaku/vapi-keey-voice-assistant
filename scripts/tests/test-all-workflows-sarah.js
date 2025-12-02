#!/usr/bin/env node
/**
 * Test Script: Test All 4 Workflows with Sarah Johnson (UK Contact)
 */

require('dotenv').config();
const GHLClient = require('../src/services/ghl-client');

const ghlClient = new GHLClient();

// Sarah Johnson - existing UK contact
const CONTACT_ID = '4JEXHRcxYveqqhLpCKEz';

async function testAllWorkflows() {
  console.log('\n🧪 TESTING ALL 4 WORKFLOWS WITH UK CONTACT\n');
  console.log('==================================================\n');

  try {
    // Get contact details
    console.log('📝 Fetching UK contact details...\n');
    const contact = await ghlClient.getContact(CONTACT_ID);
    console.log('✅ Contact found!');
    console.log(`   Name: ${contact.firstName} ${contact.lastName}`);
    console.log(`   Phone: ${contact.phone} (UK)`);
    console.log(`   Email: ${contact.email}`);
    console.log('');

    // Test all 4 workflows
    const workflows = [
      { name: '1. Appointment Confirmed ✅', url: process.env.GHL_WORKFLOW_CONFIRMED, status: 'confirmed' },
      { name: '2. Appointment Cancelled ❌', url: process.env.GHL_WORKFLOW_CANCELLED, status: 'cancelled' },
      { name: '3. Reschedule Request 🔄', url: process.env.GHL_WORKFLOW_RESCHEDULE, status: 'reschedule' },
      { name: '4. No Answer 📞', url: process.env.GHL_WORKFLOW_NO_ANSWER, status: 'no_answer' }
    ];

    console.log('🔔 Testing All 4 Workflows:\n');
    const results = [];

    for (const workflow of workflows) {
      console.log(`📋 ${workflow.name}`);

      if (!workflow.url) {
        console.log(`   ⚠️  Skipped (not configured)\n`);
        results.push({ name: workflow.name, status: 'SKIPPED' });
        continue;
      }

      try {
        const customData = {
          contactId: CONTACT_ID,
          appointmentId: `test-appt-${Date.now()}`,
          status: workflow.status,
          appointmentTime: '2:00 PM',
          appointmentDate: 'Thursday, November 28th',
          testMode: true
        };

        const result = await ghlClient.triggerWorkflow(workflow.url, CONTACT_ID, customData);
        console.log(`   ✅ Triggered! Execution ID: ${result.id}\n`);
        results.push({ name: workflow.name, status: 'PASSED', id: result.id });
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.log(`   ❌ Failed: ${error.message}\n`);
        results.push({ name: workflow.name, status: 'FAILED' });
      }
    }

    // Summary
    console.log('==================================================');
    console.log('📊 RESULTS\n');
    results.forEach(r => {
      const icon = r.status === 'PASSED' ? '✅' : r.status === 'FAILED' ? '❌' : '⚠️';
      console.log(`${icon} ${r.name}`);
      if (r.id) console.log(`   Execution: ${r.id}`);
    });
    console.log('\n🎉 All workflows tested with UK contact!');
    console.log('   SMS should actually be sent this time (UK → UK)\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

testAllWorkflows();

