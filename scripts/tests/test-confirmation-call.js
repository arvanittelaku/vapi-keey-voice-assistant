#!/usr/bin/env node

/**
 * Test Appointment Confirmation Call
 * 
 * This script simulates a GHL webhook call for appointment confirmation.
 * It sends a test payload to the webhook endpoint to verify the confirmation
 * assistant is correctly triggered.
 * 
 * Usage: npm run test-confirmation
 */

const axios = require('axios');
require('dotenv').config();

const WEBHOOK_URL = process.env.WEBHOOK_BASE_URL || 'http://localhost:3000';

async function testConfirmationCall() {
  console.log('\n🧪 Testing Appointment Confirmation Call...');
  console.log('='.repeat(60));
  
  // Mock appointment confirmation payload from GHL
  const confirmationPayload = {
    // Contact info
    phone: '+447700900999', // Test number
    firstName: 'Sarah',
    lastName: 'Johnson',
    email: 'sarah.johnson@example.com',
    contactId: 'test-contact-' + Date.now(),
    
    // Call type - THIS IS KEY!
    callType: 'confirmation', // or 'appointment_confirmation'
    
    // Appointment details
    appointmentTime: '14:00', // 2:00 PM
    appointmentDate: new Date(Date.now() + 60 * 60 * 1000).toISOString().split('T')[0], // Today
    appointmentId: 'appt-' + Date.now(),
    
    // Optional
    region: 'London'
  };

  console.log('📋 Confirmation Call Payload:');
  console.log(JSON.stringify(confirmationPayload, null, 2));
  console.log();
  console.log('🎯 Expected Behavior:');
  console.log('   - Webhook should detect callType = "confirmation"');
  console.log('   - Should use VAPI_CONFIRMATION_ASSISTANT_ID');
  console.log('   - Should pass appointment details to the assistant');
  console.log('='.repeat(60));
  console.log();

  try {
    console.log(`📤 Sending to: ${WEBHOOK_URL}/webhook/ghl-trigger-call`);
    
    const response = await axios.post(
      `${WEBHOOK_URL}/webhook/ghl-trigger-call`,
      confirmationPayload,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('\n✅ Response received!');
    console.log('📊 Status Code:', response.status);
    console.log('📥 Response Data:', JSON.stringify(response.data, null, 2));
    console.log();

    if (response.data.success) {
      console.log('🎉 SUCCESS! Confirmation call initiated!');
      console.log(`   Call ID: ${response.data.callId}`);
      console.log(`   Call Type: ${response.data.callType}`);
      console.log(`   Customer: ${response.data.customer.name}`);
      console.log();
      console.log('📋 What happened:');
      console.log('   1. Webhook received the confirmation payload');
      console.log('   2. Detected callType = "confirmation"');
      console.log('   3. Used Confirmation Assistant instead of Squad');
      console.log('   4. Passed appointment details to Vapi');
      console.log('   5. Vapi initiated outbound call with confirmation assistant');
      console.log();
      console.log('⚠️  NOTE: This used test credits! If you have no credits, you will see an error from Vapi API.');
    } else {
      console.log('❌ Call failed:', response.data.message);
    }

  } catch (error) {
    console.error('\n❌ Error testing confirmation call:');
    
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Message:', error.response.data.message || error.response.statusText);
      console.error('   Details:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.error('   No response received - is the server running?');
      console.error('   Run: npm start');
    } else {
      console.error('   Error:', error.message);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ Test complete!');
  console.log();
  console.log('💡 TIP: To test locally without using Vapi credits:');
  console.log('   1. Check server logs (where you ran "npm start")');
  console.log('   2. Look for "Confirmation call detected - Using Confirmation Assistant"');
  console.log('   3. Verify it uses VAPI_CONFIRMATION_ASSISTANT_ID, not VAPI_SQUAD_ID');
  console.log();
  console.log('📋 Next: Deploy to Render and create GHL workflow!');
  console.log('='.repeat(60));
}

// Run test
testConfirmationCall();

