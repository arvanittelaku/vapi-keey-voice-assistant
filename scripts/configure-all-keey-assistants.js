#!/usr/bin/env node

/**
 * Configure all Keey assistants with the correct tools
 */

const axios = require('axios');

const VAPI_API_KEY = 'bd473524-64a6-43a4-ab2f-fc1d2cd741e2';
const BASE_URL = 'https://api.vapi.ai';

const ASSISTANTS = {
  outbound: '0fd5652f-e68d-442f-8362-8f96f00c2b84', // Keey Main Assistant
  inbound: '36728053-c5f8-48e6-a3fe-33d6c95348ce',  // Keey Inbound Lead Assistant
  confirmation: '9ade430e-913f-468c-b9a9-e705f64646ab' // Keey Appointment Confirmation
};

const TOOLS = {
  checkAvailability: {
    type: 'function',
    function: {
      name: 'check_calendar_availability_keey',
      description: 'Check available appointment times in the calendar. Use this BEFORE booking to prevent double-bookings. Ask for: 1) preferred date (e.g., "Monday", "tomorrow", "November 15"), 2) preferred time (e.g., "2 PM", "14:00"), and 3) timezone.',
      parameters: {
        type: 'object',
        properties: {
          requestedDate: {
            type: 'string',
            description: 'Preferred date in natural language (e.g., "Monday", "tomorrow", "November 15")'
          },
          requestedTime: {
            type: 'string',
            description: 'Preferred time (e.g., "2 PM", "14:00", "3 o\'clock")'
          },
          timezone: {
            type: 'string',
            description: 'User\'s timezone (e.g., "Europe/London", "Asia/Dubai", "EST")'
          }
        },
        required: ['requestedDate', 'requestedTime', 'timezone']
      }
    },
    server: { url: 'https://vapi-keey-voice-assistant.onrender.com/webhook/vapi' }
  },
  
  bookAppointment: {
    type: 'function',
    function: {
      name: 'book_calendar_appointment_keey',
      description: 'Book an appointment AFTER confirming availability. Required: date/time, full name, email, and phone.',
      parameters: {
        type: 'object',
        properties: {
          bookingDate: {
            type: 'string',
            description: 'Date in natural language (same format as checked: "tomorrow", "Monday", "November 15")'
          },
          bookingTime: {
            type: 'string',
            description: 'Time in natural language (same format as checked: "2 PM", "14:00")'
          },
          timezone: {
            type: 'string',
            description: 'Timezone (same as what was checked)'
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
            description: 'Customer\'s phone number'
          }
        },
        required: ['bookingDate', 'bookingTime', 'timezone', 'fullName', 'email', 'phone']
      }
    },
    server: { url: 'https://vapi-keey-voice-assistant.onrender.com/webhook/vapi' }
  },
  
  createContact: {
    type: 'function',
    function: {
      name: 'contact_create_keey',
      description: 'Create a new contact in GHL CRM. Use this for NEW inbound leads to save their information.',
      parameters: {
        type: 'object',
        properties: {
          firstName: { type: 'string', description: 'First name' },
          lastName: { type: 'string', description: 'Last name' },
          email: { type: 'string', description: 'Email address' },
          phone: { type: 'string', description: 'Phone number' },
          propertyAddress: { type: 'string', description: 'Property address' },
          city: { type: 'string', description: 'City' },
          postcode: { type: 'string', description: 'Postcode' },
          bedrooms: { type: 'string', description: 'Number of bedrooms (as string)' },
          region: { type: 'string', description: 'London or Dubai', enum: ['London', 'Dubai'] }
        },
        required: ['firstName', 'lastName', 'email', 'phone']
      }
    },
    server: { url: 'https://vapi-keey-voice-assistant.onrender.com/webhook/vapi' }
  },
  
  updateConfirmation: {
    type: 'function',
    function: {
      name: 'update_appointment_confirmation',
      description: 'Update appointment confirmation status after speaking with customer.',
      parameters: {
        type: 'object',
        properties: {
          contactId: { type: 'string', description: 'GHL contact ID (from call metadata)' },
          appointmentId: { type: 'string', description: 'GHL appointment ID (from call metadata)' },
          status: { 
            type: 'string', 
            enum: ['confirmed', 'cancelled', 'reschedule', 'no_answer'],
            description: 'Confirmation status'
          },
          notes: { type: 'string', description: 'Optional notes' }
        },
        required: ['contactId', 'appointmentId', 'status']
      }
    },
    server: { url: 'https://vapi-keey-voice-assistant.onrender.com/webhook/vapi' }
  },
  
  cancelAppointment: {
    type: 'function',
    function: {
      name: 'cancel_appointment_keey',
      description: 'Cancel an appointment when customer can\'t attend.',
      parameters: {
        type: 'object',
        properties: {
          appointmentId: { type: 'string', description: 'Appointment ID (from call metadata)' },
          contactId: { type: 'string', description: 'Contact ID (from call metadata)' },
          reason: { type: 'string', description: 'Cancellation reason (optional)' }
        },
        required: ['appointmentId', 'contactId']
      }
    },
    server: { url: 'https://vapi-keey-voice-assistant.onrender.com/webhook/vapi' }
  }
};

async function configureAssistant(assistantId, toolsArray, name) {
  try {
    console.log(`\n🔧 Configuring ${name}...`);
    
    const currentResponse = await axios.get(`${BASE_URL}/assistant/${assistantId}`, {
      headers: { 'Authorization': `Bearer ${VAPI_API_KEY}`, 'Content-Type': 'application/json' }
    });

    const updatePayload = {
      model: {
        ...currentResponse.data.model,
        tools: toolsArray
      }
    };

    await axios.patch(`${BASE_URL}/assistant/${assistantId}`, updatePayload, {
      headers: { 'Authorization': `Bearer ${VAPI_API_KEY}`, 'Content-Type': 'application/json' }
    });

    console.log(`✅ ${name} configured with ${toolsArray.length} tool(s):`);
    toolsArray.forEach(tool => console.log(`   - ${tool.function.name}`));
    
  } catch (error) {
    console.error(`❌ Error configuring ${name}:`, error.message);
  }
}

async function configureAllAssistants() {
  console.log('🚀 Configuring all Keey assistants with correct tools...');
  console.log('='.repeat(80));

  // 1. OUTBOUND Assistant - Only booking tools (no contact_create)
  await configureAssistant(
    ASSISTANTS.outbound,
    [TOOLS.checkAvailability, TOOLS.bookAppointment],
    'Keey Main Assistant (OUTBOUND)'
  );

  // 2. INBOUND Assistant - All 3 tools
  await configureAssistant(
    ASSISTANTS.inbound,
    [TOOLS.createContact, TOOLS.checkAvailability, TOOLS.bookAppointment],
    'Keey Inbound Lead Assistant'
  );

  // 3. CONFIRMATION Assistant - Confirmation + cancel + reschedule tools
  await configureAssistant(
    ASSISTANTS.confirmation,
    [TOOLS.updateConfirmation, TOOLS.cancelAppointment, TOOLS.checkAvailability, TOOLS.bookAppointment],
    'Keey Appointment Confirmation Assistant'
  );

  console.log('\n' + '='.repeat(80));
  console.log('\n✅ ALL ASSISTANTS CONFIGURED!');
  console.log('\n📋 Summary:');
  console.log('   🔹 OUTBOUND (Keey Main): 2 tools (check + book)');
  console.log('   🔹 INBOUND (Lead Assistant): 3 tools (create + check + book)');
  console.log('   🔹 CONFIRMATION: 4 tools (update + cancel + check + book)');
  console.log('\n');
}

configureAllAssistants();

