#!/usr/bin/env node

/**
 * Update Contact Create Tool - Simplified Version
 * 
 * This script updates the contact_create_keey tool in Vapi
 * to only require email and phone (no firstName/lastName required)
 */

require('dotenv').config();
const axios = require('axios');

const VAPI_API_KEY = process.env.VAPI_API_KEY;
const CONTACT_CREATE_TOOL_ID = '39f85666-77ed-4481-920b-7599fcd4a968'; // From your setup

if (!VAPI_API_KEY) {
  console.error('❌ VAPI_API_KEY not found in .env file');
  process.exit(1);
}

const SIMPLIFIED_TOOL_DEFINITION = {
  function: {
    name: 'contact_create_keey',
    strict: true,
    description: 'Creates a new contact in GoHighLevel CRM. Use this after collecting email, phone, and postal code. Name will be auto-generated from email.',
    parameters: {
      type: 'object',
      properties: {
        email: {
          type: 'string',
          description: 'Contact email address (required)'
        },
        phone: {
          type: 'string',
          description: 'Contact phone number (required)'
        },
        postcode: {
          type: 'string',
          description: 'Postal code (optional)'
        }
      },
      required: ['email', 'phone']
    }
  }
};

async function updateTool() {
  try {
    console.log('\n🔧 Updating Contact Create Tool...\n');
    console.log('Tool ID:', CONTACT_CREATE_TOOL_ID);

    // Update the tool
    const response = await axios.patch(
      `https://api.vapi.ai/tool/${CONTACT_CREATE_TOOL_ID}`,
      SIMPLIFIED_TOOL_DEFINITION,
      {
        headers: {
          'Authorization': `Bearer ${VAPI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Tool updated successfully!\n');
    console.log('📋 New Tool Configuration:');
    console.log('   Name:', response.data.function.name);
    console.log('   Required fields:', response.data.function.parameters.required.join(', '));
    console.log('   Optional fields: postcode, postalCode');
    console.log('\n✨ Tool now accepts simplified parameters!\n');

  } catch (error) {
    console.error('❌ Error updating tool:', error.response?.data || error.message);
    process.exit(1);
  }
}

updateTool();

