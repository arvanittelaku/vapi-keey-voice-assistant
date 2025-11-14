#!/usr/bin/env node

/**
 * Script to add the necessary tools to Keey Main Assistant
 */

const axios = require('axios');

const VAPI_API_KEY = process.env.VAPI_API_KEY || 'bd473524-64a6-43a4-ab2f-fc1d2cd741e2';
const BASE_URL = 'https://api.vapi.ai';
const KEEY_MAIN_ASSISTANT_ID = '0fd5652f-e68d-442f-8362-8f96f00c2b84';

// Tool IDs from your Vapi dashboard
const TOOL_IDS = {
  check_availability: '22eb8501-80fb-497f-87e8-6f0a88ac5eab',
  book_appointment: 'd2e07bdb-ead7-4df6-a2d5-00efb1b5e87a', // You may have 2, use the correct one
  create_contact: '39f85666-77ed-4481-920b-7599fcd4a968',
  update_confirmation: '63b9a1ec-138c-4e64-8402-c3370554ea81',
  cancel_appointment: '45580452-1407-40b0-b714-df7914d05604'
};

async function addToolsToKeeyAssistant() {
  try {
    console.log('🔧 Adding tools to Keey Main Assistant...\n');
    console.log('='.repeat(80));

    // First, fetch the current assistant configuration
    console.log('📡 Fetching current assistant configuration...');
    const currentResponse = await axios.get(`${BASE_URL}/assistant/${KEEY_MAIN_ASSISTANT_ID}`, {
      headers: {
        'Authorization': `Bearer ${VAPI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const currentAssistant = currentResponse.data;
    console.log(`✅ Current assistant: ${currentAssistant.name}`);
    console.log(`   Current tools: ${currentAssistant.model?.tools?.length || 0}`);

    // Prepare the tools array
    const toolsToAdd = [
      {
        type: 'function',
        function: {
          name: 'check_calendar_availability_keey',
          description: 'Check available appointment times in the calendar. Use this BEFORE booking to prevent double-bookings. The AI should ask for: 1) preferred date (e.g., "Monday", "tomorrow", "November 3rd"), 2) preferred time (e.g., "2 PM", "14:00", "3 o\'clock"), and 3) timezone (e.g., "Central Europe", "EST", "PST").',
          parameters: {
            type: 'object',
            properties: {
              requestedDate: {
                type: 'string',
                description: 'The preferred date in natural language (e.g., "Monday", "tomorrow", "next Friday", "November 3rd")'
              },
              requestedTime: {
                type: 'string',
                description: 'The preferred time (e.g., "2 PM", "14:00", "16 o\'clock", "3:30 PM")'
              },
              timezone: {
                type: 'string',
                description: 'User\'s timezone (e.g., "Central Europe", "America/New_York", "EST", "PST", "Europe/London")'
              }
            },
            required: ['requestedDate', 'requestedTime', 'timezone']
          }
        },
        server: {
          url: 'https://vapi-keey-voice-assistant.onrender.com/webhook/vapi'
        }
      },
      {
        type: 'function',
        function: {
          name: 'book_calendar_appointment_keey',
          description: 'Book an appointment after confirming availability. ONLY use this after successfully checking availability first. Required: booking date/time (same format checked), full name, email, and phone number.',
          parameters: {
            type: 'object',
            properties: {
              bookingDate: {
                type: 'string',
                description: 'Date in natural language (e.g., "tomorrow", "Monday", "November 15")'
              },
              bookingTime: {
                type: 'string',
                description: 'Time in natural language (e.g., "2 PM", "14:00", "afternoon")'
              },
              timezone: {
                type: 'string',
                description: 'The timezone for the appointment (same as what was provided earlier)'
              },
              fullName: {
                type: 'string',
                description: 'Customer\'s full name (first and last)'
              },
              email: {
                type: 'string',
                description: 'Customer\'s email address'
              },
              phone: {
                type: 'string',
                description: 'Customer\'s phone number (UK format preferred)'
              }
            },
            required: ['bookingDate', 'bookingTime', 'timezone', 'fullName', 'email', 'phone']
          }
        },
        server: {
          url: 'https://vapi-keey-voice-assistant.onrender.com/webhook/vapi'
        }
      },
      {
        type: 'function',
        function: {
          name: 'contact_create_keey',
          description: 'Creates a new contact in GoHighLevel CRM with lead qualification information. Use this after collecting: firstName, lastName, email, phone, property address, city, postcode, and number of bedrooms.',
          parameters: {
            type: 'object',
            properties: {
              firstName: {
                type: 'string',
                description: 'Contact\'s first name'
              },
              lastName: {
                type: 'string',
                description: 'Contact\'s last name'
              },
              email: {
                type: 'string',
                description: 'Contact\'s email address'
              },
              phone: {
                type: 'string',
                description: 'Contact\'s phone number'
              },
              propertyAddress: {
                type: 'string',
                description: 'Property street address and number'
              },
              city: {
                type: 'string',
                description: 'City where property is located'
              },
              postcode: {
                type: 'string',
                description: 'Property postcode'
              },
              bedrooms: {
                type: 'string',
                description: 'Number of bedrooms in the property'
              },
              region: {
                type: 'string',
                description: 'Region - London or Dubai',
                enum: ['London', 'Dubai']
              }
            },
            required: ['firstName', 'lastName', 'email', 'phone']
          }
        },
        server: {
          url: 'https://vapi-keey-voice-assistant.onrender.com/webhook/vapi'
        }
      }
    ];

    // Update the assistant with the tools
    console.log('\n📝 Updating assistant with tools...');
    
    const updatePayload = {
      model: {
        ...currentAssistant.model,
        tools: toolsToAdd
      }
    };

    const updateResponse = await axios.patch(
      `${BASE_URL}/assistant/${KEEY_MAIN_ASSISTANT_ID}`,
      updatePayload,
      {
        headers: {
          'Authorization': `Bearer ${VAPI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Tools successfully added to Keey Main Assistant!');
    console.log(`\n🛠️  Added ${toolsToAdd.length} tools:`);
    toolsToAdd.forEach((tool, i) => {
      console.log(`   ${i + 1}. ${tool.function.name}`);
    });

    console.log('\n' + '='.repeat(80));
    console.log('\n✅ DONE! Your Keey Main Assistant is now fully configured.');
    console.log('\n📋 Next Steps:');
    console.log('   1. Update the system prompt to instruct the AI how to use these tools');
    console.log('   2. Test with a real call');
    console.log('\n');

  } catch (error) {
    console.error('❌ Error updating assistant:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

addToolsToKeeyAssistant();

