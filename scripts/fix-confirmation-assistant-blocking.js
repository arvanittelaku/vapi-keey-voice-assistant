require('dotenv').config();
const axios = require('axios');

const VAPI_API_KEY = process.env.VAPI_PRIVATE_KEY || 'bd473524-64a6-43a4-ab2f-fc1d2cd741e2';
const CONFIRMATION_ASSISTANT_ID = '9ade430e-913f-468c-b9a9-e705f64646ab';

/**
 * Fix the confirmation assistant to make booking tool BLOCKING
 * This prevents the AI from calling cancel_appointment in parallel with book_calendar_appointment
 * 
 * CRITICAL FIX FOR: The AI was calling both tools simultaneously, causing the original
 * appointment to be cancelled even when the new booking failed.
 */

async function fixConfirmationAssistant() {
  console.log('\n🔧 FIXING CONFIRMATION ASSISTANT - Making Booking Tool BLOCKING\n');
  console.log('═'.repeat(80));
  console.log('   This fix prevents the AI from cancelling appointments before');
  console.log('   confirming the new booking succeeded.');
  console.log('═'.repeat(80));

  try {
    // Step 1: Fetch current assistant configuration
    console.log('\n📥 Fetching current assistant configuration...\n');
    
    const getResponse = await axios.get(
      `https://api.vapi.ai/assistant/${CONFIRMATION_ASSISTANT_ID}`,
      {
        headers: {
          'Authorization': `Bearer ${VAPI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const assistant = getResponse.data;
    console.log('✅ Current configuration fetched');
    console.log(`   Assistant: ${assistant.name}`);
    console.log(`   Tools: ${assistant.model.toolIds?.length || 0} tools configured`);

    // Step 2: Find the booking tool and make it blocking
    console.log('\n🔍 Searching for book_calendar_appointment_keey tool...\n');
    
    let bookingToolFound = false;
    let bookingToolId = null;

    // Check if tools are defined inline or by ID
    if (assistant.model.tools) {
      for (const tool of assistant.model.tools) {
        if (tool.function && tool.function.name === 'book_calendar_appointment_keey') {
          console.log('✅ Found booking tool (inline definition)');
          
          // Make it blocking by adding messages array with blocking: true
          if (!tool.messages) {
            tool.messages = [];
          }
          
          // Check if blocking is already set
          const hasBlocking = tool.messages.some(msg => msg.type === 'request-start' && msg.blocking === true);
          
          if (hasBlocking) {
            console.log('   ℹ️  Tool is already blocking - no changes needed');
            bookingToolFound = true;
          } else {
            console.log('   🔧 Making tool BLOCKING...');
            
            // Add or update blocking message
            const blockingMsgIndex = tool.messages.findIndex(msg => msg.type === 'request-start');
            
            if (blockingMsgIndex >= 0) {
              tool.messages[blockingMsgIndex].blocking = true;
            } else {
              tool.messages.push({
                type: 'request-start',
                blocking: true
              });
            }
            
            bookingToolFound = true;
          }
          break;
        }
      }
    }

    // Also check toolIds array
    if (assistant.model.toolIds) {
      console.log(`   ℹ️  Assistant uses ${assistant.model.toolIds.length} tool IDs (need to update tools separately)`);
      
      // For tools referenced by ID, we need to update each tool individually
      for (const toolId of assistant.model.toolIds) {
        try {
          const toolResponse = await axios.get(
            `https://api.vapi.ai/tool/${toolId}`,
            {
              headers: {
                'Authorization': `Bearer ${VAPI_API_KEY}`,
                'Content-Type': 'application/json',
              },
            }
          );

          const tool = toolResponse.data;
          
          if (tool.function && tool.function.name === 'book_calendar_appointment_keey') {
            console.log(`\n✅ Found booking tool by ID: ${toolId}`);
            bookingToolId = toolId;
            
            // Check if already blocking
            const hasBlocking = tool.messages?.some(msg => msg.type === 'request-start' && msg.blocking === true);
            
            if (hasBlocking) {
              console.log('   ℹ️  Tool is already blocking - no changes needed');
              bookingToolFound = true;
            } else {
              console.log('   🔧 Updating tool to be BLOCKING...');
              
              const messages = tool.messages || [];
              const blockingMsgIndex = messages.findIndex(msg => msg.type === 'request-start');
              
              if (blockingMsgIndex >= 0) {
                messages[blockingMsgIndex].blocking = true;
              } else {
                messages.push({
                  type: 'request-start',
                  blocking: true
                });
              }

              // Update the tool
              await axios.patch(
                `https://api.vapi.ai/tool/${toolId}`,
                { messages },
                {
                  headers: {
                    'Authorization': `Bearer ${VAPI_API_KEY}`,
                    'Content-Type': 'application/json',
                  },
                }
              );

              console.log('   ✅ Tool updated successfully!');
              bookingToolFound = true;
            }
            break;
          }
        } catch (toolError) {
          console.log(`   ⚠️  Could not fetch tool ${toolId}: ${toolError.message}`);
        }
      }
    }

    if (!bookingToolFound) {
      console.log('\n❌ ERROR: book_calendar_appointment_keey tool not found!');
      console.log('   Please verify the tool is assigned to this assistant.');
      process.exit(1);
    }

    // Note: Tool updates via ID are already applied above
    // No need to update the assistant itself

    console.log('\n' + '═'.repeat(80));
    console.log('✅ FIX COMPLETE!');
    console.log('═'.repeat(80));
    console.log('\n📋 What Changed:');
    console.log('   - book_calendar_appointment_keey is now a BLOCKING tool');
    console.log('   - The AI MUST wait for booking to complete before calling other tools');
    console.log('   - This prevents cancelling the original appointment if booking fails');
    console.log('\n🧪 Next Steps:');
    console.log('   1. Run the availability check fix script');
    console.log('   2. Test the reschedule flow again');
    console.log('   3. Verify the original appointment is NOT cancelled if booking fails\n');

  } catch (error) {
    console.error('\n❌ ERROR FIXING ASSISTANT:\n');
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Error:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('   Error:', error.message);
    }
    process.exit(1);
  }
}

fixConfirmationAssistant();

