const GHLClient = require("../services/ghl-client");
const SMSClient = require("../services/sms-client");
const { parsePhoneNumber } = require("libphonenumber-js");
const { DateTime } = require("luxon");

class VapiFunctionHandler {
  constructor(app) {
    this.app = app;
    this.ghlClient = new GHLClient();
    this.smsClient = new SMSClient();
    this.setupRoutes();
  }

  setupRoutes() {
    console.log("📝 VapiFunctionHandler: Registering Vapi function webhook...");

    // 🔍 CRITICAL: Add logging middleware FIRST to catch ALL requests
    this.app.use("/webhook/vapi", (req, res, next) => {
      const timestamp = new Date().toISOString();
      console.log(`\n⏰ ${timestamp} - Incoming webhook request`);
      console.log(`📍 Method: ${req.method}`);
      console.log(`📍 Headers: ${JSON.stringify(req.headers, null, 2)}`);
      console.log(`📍 Body exists: ${!!req.body}`);
      console.log(`📍 Body type: ${typeof req.body}`);
      if (req.body) {
        console.log(`📍 Body keys: ${Object.keys(req.body).join(', ')}`);
        if (req.body.message) {
          console.log(`📍 Message type: ${req.body.message.type}`);
        }
      }
      next();
    });

    this.app.post("/webhook/vapi", async (req, res) => {
      const requestStartTime = Date.now();
      
      try {
        console.log("\n🔔 VAPI FUNCTION CALL RECEIVED");
        console.log("📦 Payload:", JSON.stringify(req.body, null, 2));

        const { message, call } = req.body;

        // Determine message type - Vapi uses "type" for some webhooks and "role" for others
        const messageType = message?.type || message?.role;

        // Handle end-of-call-report for SMS fallback
        if (messageType === "end-of-call-report") {
          console.log("📊 End-of-call report received");
          await this.handleEndOfCall(message);
          return res.json({ success: true, message: "End-of-call report processed" });
        }

        // Handle status updates (not actionable, just log)
        if (messageType === "status-update") {
          console.log("⚠️  Not a function call, ignoring");
          console.log(`   Message type/role: ${messageType}`);
          return res.json({ success: true, message: "Status update received" });
        }

        // Handle both "function-call" (old format) and "tool-calls"/"tool_calls" (new format)
        if (!message || (messageType !== "function-call" && messageType !== "tool-calls" && messageType !== "tool_calls")) {
          console.log("⚠️  Not a function call, ignoring");
          console.log(`   Message type/role: ${messageType}`);
          return res.json({ success: true, message: "Not a function call" });
        }

        // Extract function info based on message type
        let toolCalls = [];
        
        if (messageType === "tool-calls" || messageType === "tool_calls") {
          // New format: extract ALL tool calls from array
          toolCalls = message.toolCalls || message.toolCallList || [];
          if (toolCalls.length === 0) {
            console.log("⚠️  No tool calls found in tool-calls message");
            return res.json({ success: false, message: "No tool calls found" });
          }
          console.log(`📋 Processing ${toolCalls.length} tool call(s)`);
        } else {
          // Old format: single function call
          const { functionCall } = message;
          toolCalls = [{
            function: {
              name: functionCall.name,
              arguments: functionCall.parameters
            },
            id: message.toolCallId
          }];
        }

        // Process ALL tool calls and collect results
        const results = [];
        
        for (const toolCall of toolCalls) {
          if (!toolCall || !toolCall.function) {
            console.log("⚠️  Invalid tool call, skipping");
            continue;
          }
          
          const functionName = toolCall.function.name;
          const parameters = typeof toolCall.function.arguments === 'string' 
            ? JSON.parse(toolCall.function.arguments) 
            : toolCall.function.arguments;
          const toolCallId = toolCall.id;

          console.log(`\n🛠️  Function Called: ${functionName}`);
          console.log("📋 Parameters:", parameters);

          let result;

          try {
            switch (functionName) {
              case "contact_create_keey":
                result = await this.createContact(parameters);
                break;

              case "check_calendar_availability_keey":
                result = await this.checkCalendarAvailability(parameters);
                break;

              case "book_calendar_appointment_keey":
                // Pass the full message so we can extract contactId from variableValues
                result = await this.bookCalendarAppointment(parameters, message);
                break;

              case "update_appointment_confirmation":
                result = await this.updateAppointmentConfirmation(parameters);
                break;

              case "cancel_appointment_keey":
                result = await this.cancelAppointment(parameters);
                break;

              default:
                console.error(`❌ Unknown function: ${functionName}`);
                result = {
                  success: false,
                  message: `Unknown function: ${functionName}`,
                };
            }

            console.log("✅ Function executed successfully");
            console.log("📤 Result:", result);
            console.log("🔑 Tool Call ID:", toolCallId);

            // Add result to results array
            results.push({
              toolCallId: toolCallId,
              result: result.message || JSON.stringify(result), // Use message as the result string
            });
          } catch (error) {
            console.error(`❌ Error executing ${functionName}:`, error.message);
            results.push({
              toolCallId: toolCallId,
              result: `Error: ${error.message}`,
            });
          }
        }

        // Send response with proper Vapi format for ALL tool calls
        // Vapi expects: { results: [{ toolCallId, result }, ...] }
        const response = {
          results: results,
        };

        console.log("📨 Sending response to Vapi:", JSON.stringify(response, null, 2));
        
        const processingTime = Date.now() - requestStartTime;
        console.log(`⏱️  Total processing time: ${processingTime}ms`);
        
        if (processingTime > 5000) {
          console.log(`⚠️  WARNING: Processing took >5 seconds - Vapi may timeout!`);
        }
        
        res.status(200).json(response);
      } catch (error) {
        console.error("\n❌ ERROR in function handler:", error.message);
        console.error("Stack:", error.stack);
        
        const processingTime = Date.now() - requestStartTime;
        console.log(`⏱️  Error occurred after ${processingTime}ms`);

        res.status(500).json({
          success: false,
          error: error.message,
          message: "An error occurred while processing the function call",
        });
      }
    });

    // Test endpoint for SMS sending
    this.app.post("/webhook/test-sms", async (req, res) => {
      try {
        console.log("\n📱 TEST SMS REQUEST RECEIVED");
        console.log("📦 Payload:", JSON.stringify(req.body, null, 2));
        
        const { phone, customerName, appointmentTime, message } = req.body;
        
        if (!phone) {
          return res.status(400).json({
            success: false,
            error: 'Phone number is required'
          });
        }
        
        let result;
        
        if (message) {
          // Custom message test
          result = await this.smsClient.sendTestSMS(phone, message);
        } else if (customerName && appointmentTime) {
          // Confirmation reminder test
          result = await this.smsClient.sendConfirmationReminder(
            phone,
            customerName,
            appointmentTime
          );
        } else {
          // Default test message
          result = await this.smsClient.sendTestSMS(
            phone,
            'Test SMS from Keey Voice Assistant - Your system is working!'
          );
        }
        
        res.json(result);
        
      } catch (error) {
        console.error('❌ Error in test SMS endpoint:', error.message);
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });

    console.log("✅ Vapi function webhook registered at /webhook/vapi");
    console.log("✅ SMS test endpoint registered at /webhook/test-sms");
  }

  async createContact(params) {
    try {
      const {
        firstName,
        lastName,
        email,
        phone,
        propertyAddress,
        city,
        postcode,
        bedrooms,
        region,
      } = params;

      console.log("\n👤 Creating/updating contact...");
      console.log(`   Name: ${firstName} ${lastName}`);
      console.log(`   Email: ${email}`);
      console.log(`   Phone: ${phone}`);

      // Normalize phone number
      let normalizedPhone = phone;
      try {
        const phoneNumber = parsePhoneNumber(phone, "GB");
        if (phoneNumber) {
          normalizedPhone = phoneNumber.format("E.164");
          console.log(`   Normalized Phone: ${normalizedPhone}`);
        }
      } catch (e) {
        console.log("   ⚠️  Could not parse phone number, using as-is");
      }

      // Build contact payload
      const contactPayload = {
        firstName,
        lastName,
        email,
        phone: normalizedPhone,
        source: "Voice Assistant - Lead Qualification",
      };

      // Add optional fields
      if (propertyAddress) contactPayload.address1 = propertyAddress;
      if (city) contactPayload.city = city;
      if (postcode) contactPayload.postalCode = postcode;

      // Add custom fields as tags
      if (region || bedrooms) {
        contactPayload.tags = [
          region,
          bedrooms ? `${bedrooms} bedrooms` : null,
        ].filter(Boolean);
      }

      console.log("📝 Creating contact in GHL...");
      const contact = await this.ghlClient.createContact(contactPayload);

      console.log("✅ Contact created/updated successfully");
      console.log(`   Contact ID: ${contact.id}`);

      return {
        success: true,
        message: `Thank you for providing that information. I've saved your details. Your contact ID is ${contact.id}.`,
        data: {
          contactId: contact.id,
          firstName: contact.firstName,
          lastName: contact.lastName,
          email: contact.email,
          phone: contact.phone,
        },
      };
    } catch (error) {
      console.error("❌ Error creating contact:", error.message);
      return {
        success: false,
        message:
          "I apologize, but I had trouble saving your information. Could you please provide your email and phone number again?",
        error: error.message,
      };
    }
  }

  async checkCalendarAvailability(params) {
    try {
      const { requestedDate, requestedTime, timezone } = params;

      console.log("\n📅 Checking calendar availability...");
      console.log(`   Requested Date: ${requestedDate}`);
      console.log(`   Requested Time: ${requestedTime}`);
      console.log(`   Timezone: ${timezone}`);

      const calendarId = process.env.GHL_CALENDAR_ID;
      if (!calendarId) {
        throw new Error("GHL_CALENDAR_ID not configured");
      }

      // Parse the requested date and time
      const tz = timezone || "Europe/London";
      
      console.log("[DEBUG] Raw input:", { requestedDate, requestedTime, timezone });
      
      // Handle natural language dates (e.g., "tomorrow", "Monday", "November 15th")
      const parsedDate = this.parseNaturalDate(requestedDate, tz);
      console.log("[DEBUG] parsedDate:", parsedDate.toString(), "isValid:", parsedDate.isValid);
      
      // Parse the requested time (e.g., "6 PM", "14:00")
      const parsedTime = this.parseNaturalTime(requestedTime, tz);
      console.log("[DEBUG] parsedTime:", parsedTime.toString(), "isValid:", parsedTime.isValid);
      
      // 🔥 CRITICAL: Validate parsing results
      if (!parsedDate || !parsedDate.isValid) {
        throw new Error(`Failed to parse date: "${requestedDate}". Please use format like "today", "tomorrow", "Monday", or "November 15"`);
      }
      
      if (!parsedTime || !parsedTime.isValid) {
        throw new Error(`Failed to parse time: "${requestedTime}". Please use format like "2 PM", "14:00", or "3 o'clock"`);
      }
      
      // ⚡ OPTIMIZATION: Query only a 4-hour window around requested time
      // This makes GHL API respond 10x faster (~400ms instead of 2.6 seconds)
      const requestedDateTime = parsedDate.set({
        hour: parsedTime.hour,
        minute: parsedTime.minute,
        second: 0,
        millisecond: 0
      });
      
      console.log("[DEBUG] requestedDateTime:", requestedDateTime.toString(), "isValid:", requestedDateTime.isValid);
      
      if (!requestedDateTime.isValid) {
        throw new Error(`Failed to combine date and time. Date: "${requestedDate}", Time: "${requestedTime}"`);
      }
      
      // First, check the exact requested time slot
      const exactStartTime = requestedDateTime.toISO();
      const exactEndTime = requestedDateTime.plus({ minutes: 30 }).toISO();
      
      console.log(`   🎯 Checking exact requested time: ${requestedDateTime.toFormat('h:mm a')}`);
      
      const exactAvailability = await this.ghlClient.checkCalendarAvailability(
        calendarId,
        exactStartTime,
        exactEndTime,
        tz
      );
      
      // If the exact time is available, return it immediately
      if (exactAvailability.slots && exactAvailability.slots.length > 0) {
        console.log("✅ Exact requested time is available!");
        return {
          success: true,
          message: `Perfect! ${requestedDateTime.toFormat('h:mm a')} on ${parsedDate.toFormat('MMMM dd')} is available. Would you like me to book that for you?`,
          data: {
            exactMatch: true,
            availableSlots: exactAvailability.slots,
            requestedTime: requestedDateTime.toFormat('h:mm a'),
          },
        };
      }
      
      console.log("❌ Exact requested time is NOT available");
      console.log("🔍 Searching for alternative slots on the same day...");
      
      // If exact time not available, check the full day for alternatives
      const dayStart = parsedDate.startOf('day').toISO();
      const dayEnd = parsedDate.endOf('day').toISO();
      
      console.log(`   Checking full day from ${dayStart} to ${dayEnd}`);

      const fullDayAvailability = await this.ghlClient.checkCalendarAvailability(
        calendarId,
        dayStart,
        dayEnd,
        tz
      );

      console.log(`✅ Found ${fullDayAvailability.slots?.length || 0} available slots for the full day`);

      if (!fullDayAvailability.slots || fullDayAvailability.slots.length === 0) {
        return {
          success: true,
          message: `I'm sorry, but ${requestedDateTime.toFormat('h:mm a')} is already booked, and we don't have any other available slots on ${parsedDate.toFormat(
            "MMMM dd, yyyy"
          )}. Would you like to try a different date?`,
          data: { availableSlots: [], exactMatch: false },
        };
      }

      // Sort slots by proximity to requested time (closest first)
      const slotsWithDistance = fullDayAvailability.slots.map((slot) => {
        const slotTime = DateTime.fromISO(slot, { zone: tz });
        const distanceMinutes = Math.abs(slotTime.diff(requestedDateTime, 'minutes').minutes);
        return { slot, slotTime, distanceMinutes };
      });
      
      slotsWithDistance.sort((a, b) => a.distanceMinutes - b.distanceMinutes);
      
      // Get the 3 closest slots
      const closestSlots = slotsWithDistance.slice(0, 3);
      
      console.log("📋 Closest alternative slots:");
      closestSlots.forEach((s, i) => {
        console.log(`   ${i + 1}. ${s.slotTime.toFormat('h:mm a')} (${Math.round(s.distanceMinutes)} min away)`);
      });
      
      // Format slots for the AI to read naturally
      const formattedSlots = closestSlots
        .map((s) => s.slotTime.toFormat("h:mm a"))
        .join(", ");

      return {
        success: true,
        message: `I'm sorry, but ${requestedDateTime.toFormat('h:mm a')} on ${parsedDate.toFormat(
          "MMMM dd"
        )} is already booked. However, I have these nearby times available on the same day: ${formattedSlots}. Would any of these work for you?`,
        data: {
          exactMatch: false,
          requestedTime: requestedDateTime.toFormat('h:mm a'),
          availableSlots: closestSlots.map(s => s.slot),
          displaySlots: formattedSlots,
          closestSlot: closestSlots[0].slotTime.toFormat('h:mm a'),
        },
      };
    } catch (error) {
      console.error("❌ Error checking calendar availability:", error.message);
      return {
        success: false,
        message:
          "I apologize, but I'm having trouble checking our calendar right now. Could you please try again or call us directly at 0203 967 3687?",
        error: error.message,
      };
    }
  }

  async bookCalendarAppointment(params, message = null) {
    try {
      const {
        email,
        phone,
        fullName,
        timezone,
        bookingDate,
        bookingTime,
        startTime,
        contactId: paramsContactId,
        appointmentTitle,
        calendarId,
      } = params;

      console.log("\n📅 Booking calendar appointment...");
      
      // Use provided calendarId or fall back to environment variable
      const targetCalendarId = calendarId || process.env.GHL_CALENDAR_ID;
      if (!targetCalendarId) {
        throw new Error("GHL_CALENDAR_ID not configured");
      }

      // Extract contactId from message variableValues if not in params (for outbound calls)
      let contactId = paramsContactId;
      if (!contactId && message?.assistant?.variableValues?.contactId) {
        contactId = message.assistant.variableValues.contactId;
        console.log(`   📋 Using contactId from call metadata: ${contactId}`);
      }

      // Validate we have a contactId
      if (!contactId) {
        throw new Error("Invalid contact details - contactId is required but not provided");
      }

      const tz = timezone || "Europe/London";
      let dateTime;

      // Support three formats:
      // 1. Single startTime ISO timestamp (confirmation assistant format)
      // 2. Natural language bookingDate + bookingTime (Vapi format: "tomorrow", "2 PM")
      // 3. ISO bookingDate + bookingTime (legacy format: "2025-11-12", "13:00")
      if (startTime && startTime.trim()) {
        // Format: "2025-11-12T13:00:00.000Z" or "2025-11-12T13:00:00Z"
        console.log(`   Start Time (ISO): ${startTime}`);
        dateTime = DateTime.fromISO(startTime, { zone: tz });
      } else if (bookingDate && bookingDate.trim() && bookingTime && bookingTime.trim()) {
        console.log(`   Date: ${bookingDate}, Time: ${bookingTime}`);
        
        // Try to parse as natural language first (e.g., "tomorrow", "Monday")
        const parsedDate = this.parseNaturalDate(bookingDate, tz);
        const parsedTime = this.parseNaturalTime(bookingTime, tz);
        
        // 🔥 CRITICAL: Validate parsing results
        if (!parsedDate || !parsedDate.isValid) {
          throw new Error(`Failed to parse date: "${bookingDate}". Please use format like "today", "tomorrow", "Monday", or "November 15"`);
        }
        
        if (!parsedTime || !parsedTime.isValid) {
          throw new Error(`Failed to parse time: "${bookingTime}". Please use format like "2 PM", "14:00", or "3 o'clock"`);
        }
        
        // Combine the date and time
        dateTime = parsedDate.set({
          hour: parsedTime.hour,
          minute: parsedTime.minute,
          second: 0,
          millisecond: 0
        });
        
        console.log(`   Parsed to: ${dateTime.toISO()}`);
      } else {
        console.error("❌ Missing required booking parameters!");
        console.error(`   startTime: "${startTime || ''}"`);
        console.error(`   bookingDate: "${bookingDate || ''}"`);
        console.error(`   bookingTime: "${bookingTime || ''}"`);
        throw new Error(
          "I need the appointment date and time to book this for you. " +
          "Could you please tell me what day and time works best?"
        );
      }

      if (!dateTime.isValid) {
        throw new Error(`Invalid date/time. Reason: ${dateTime.invalidReason}`);
      }

      const appointmentStartTime = dateTime.toISO();
      console.log(`   Booking for: ${appointmentStartTime}`);

      // Book the appointment using createCalendarAppointment method
      const appointment = await this.ghlClient.createCalendarAppointment(
        targetCalendarId,
        contactId,
        appointmentStartTime,
        tz,
        appointmentTitle || "Keey Property Consultation"
      );

      console.log("✅ Appointment booked successfully");
      console.log(`   Appointment ID: ${appointment.id}`);

      // Build success message
      const dateFormatted = dateTime.toFormat("EEEE, MMMM dd"); // e.g., "Wednesday, November 12"
      const timeFormatted = dateTime.toFormat("h:mm a"); // e.g., "2:00 PM"
      
      let successMessage = `Perfect! I've scheduled your appointment for ${dateFormatted} at ${timeFormatted}.`;
      if (email) {
        successMessage += ` You'll receive a confirmation email shortly at ${email}.`;
      } else {
        successMessage += ` You'll receive a confirmation email shortly.`;
      }

      return {
        success: true,
        message: successMessage,
        data: {
          appointmentId: appointment.id,
          startTime: appointmentStartTime,
          timezone: tz,
          dateFormatted: dateFormatted,
          timeFormatted: timeFormatted,
        },
      };
    } catch (error) {
      console.error("❌ Error booking appointment:", error.message);
      return {
        success: false,
        message:
          "I apologize, but I'm having trouble booking your appointment right now. Could you please try again or call us directly at 0203 967 3687 to schedule?",
        error: error.message,
      };
    }
  }

  async updateAppointmentConfirmation(params) {
    try {
      const { contactId, appointmentId, status, notes } = params;

      console.log("\n✅ Updating appointment confirmation...");
      console.log(`   Contact ID: ${contactId}`);
      console.log(`   Appointment ID: ${appointmentId}`);
      console.log(`   Status: ${status}`);

      // Update contact with confirmation status using customFields array
      // Custom Field: "Confirmation" (ID: YLvP62hGzQMhfl2YMxTj)
      const updateData = {
        customFields: [
          {
            id: "YLvP62hGzQMhfl2YMxTj",
            value: status
          }
        ]
      };

      console.log(`   Update Data:`, JSON.stringify(updateData, null, 2));

      // Update contact in GHL
      await this.ghlClient.updateContact(contactId, updateData);

      console.log("✅ Confirmation status updated successfully");

      // Update appointment status in calendar if customer confirmed
      if (status.toLowerCase() === "confirmed" && appointmentId) {
        try {
          await this.ghlClient.confirmCalendarAppointment(appointmentId);
          console.log("✅ Appointment status updated to 'confirmed' in calendar");
        } catch (error) {
          console.error("⚠️  Could not update appointment status in calendar:", error.message);
          // Don't fail the whole operation if calendar update fails
        }
      }

      // Trigger appropriate workflow based on status
      await this.triggerWorkflowByStatus(status.toLowerCase(), contactId, {
        appointmentId,
        notes,
        timestamp: new Date().toISOString()
      });

      // Prepare response message based on status
      let responseMessage;
      switch (status.toLowerCase()) {
        case "confirmed":
          responseMessage =
            "Thank you for confirming! We look forward to speaking with you at your scheduled time.";
          break;
        case "cancelled":
          responseMessage =
            "I understand. I've cancelled your appointment. Feel free to call us back at 0203 967 3687 when you're ready to reschedule.";
          break;
        case "reschedule":
          responseMessage =
            "No problem! Someone from our team will reach out to you shortly to find a better time.";
          break;
        case "no_answer":
          responseMessage =
            "We'll try to reach you again closer to your appointment time.";
          break;
        default:
          responseMessage = "I've updated your appointment status.";
      }

      return {
        success: true,
        message: responseMessage,
        data: {
          contactId,
          appointmentId,
          status,
          updatedAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error("❌ Error updating confirmation:", error.message);
      return {
        success: false,
        message:
          "I've noted your response, but there was a technical issue updating our system. Our team will follow up with you.",
        error: error.message,
      };
    }
  }

  async cancelAppointment(params) {
    try {
      const { appointmentId, contactId, reason } = params;

      console.log("\n🗑️ Canceling appointment...");
      console.log(`   Appointment ID: ${appointmentId}`);
      console.log(`   Contact ID: ${contactId}`);
      if (reason) {
        console.log(`   Reason: ${reason}`);
      }

      // Cancel the appointment in GHL calendar
      await this.ghlClient.cancelCalendarAppointment(appointmentId);

      // Update contact's confirmation status to "cancelled"
      const updateData = {
        customFields: [
          {
            id: "YLvP62hGzQMhfl2YMxTj",
            value: "cancelled"
          }
        ]
      };

      await this.ghlClient.updateContact(contactId, updateData);

      console.log("✅ Appointment cancelled successfully");

      // Trigger cancellation workflow
      await this.triggerWorkflowByStatus("cancelled", contactId, {
        appointmentId,
        reason: reason || "Not specified",
        cancelledAt: new Date().toISOString()
      });

      return {
        success: true,
        message: "I've cancelled your appointment. Feel free to call us back at 0203 967 3687 when you're ready to reschedule.",
        data: {
          appointmentId,
          contactId,
          reason: reason || "Not specified",
          cancelledAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error("❌ Error canceling appointment:", error.message);
      return {
        success: false,
        message:
          "I've noted your cancellation, but there was a technical issue updating our calendar. Our team will follow up with you.",
        error: error.message,
      };
    }
  }

  // Helper function to trigger workflows based on confirmation status
  async triggerWorkflowByStatus(status, contactId, customData = {}) {
    try {
      // Map status to workflow environment variable
      const workflowMap = {
        confirmed: process.env.GHL_WORKFLOW_CONFIRMED,
        cancelled: process.env.GHL_WORKFLOW_CANCELLED,
        reschedule: process.env.GHL_WORKFLOW_RESCHEDULE,
        no_answer: process.env.GHL_WORKFLOW_NO_ANSWER,
      };

      const workflowId = workflowMap[status];

      if (!workflowId) {
        console.log(`⚠️  No workflow configured for status: ${status}`);
        console.log(`   Skipping workflow trigger (set GHL_WORKFLOW_${status.toUpperCase()} to enable)`);
        return { skipped: true, reason: "No workflow ID configured" };
      }

      console.log(`\n🔔 Triggering workflow for status: ${status}`);
      console.log(`   Workflow ID: ${workflowId}`);
      console.log(`   Contact ID: ${contactId}`);
      console.log(`   Custom Data:`, JSON.stringify(customData, null, 2));

      // Trigger the workflow
      const result = await this.ghlClient.triggerWorkflow(workflowId, contactId, customData);

      console.log(`✅ Workflow triggered successfully`);
      return { success: true, workflowId, result };
    } catch (error) {
      console.error(`⚠️  Error triggering workflow for status ${status}:`, error.message);
      // Don't fail the main operation if workflow triggering fails
      return { success: false, error: error.message };
    }
  }

  /**
   * Parse natural language date strings into DateTime objects
   * Handles: "today", "tomorrow", "Monday", "next Friday", "November 15th", ISO dates
   */
  parseNaturalDate(dateString, timezone = "Europe/London") {
    const now = DateTime.now().setZone(timezone);
    const lowerDate = dateString.toLowerCase().trim();

    // Handle "today"
    if (lowerDate === "today") {
      return now;
    }

    // Handle "tomorrow"
    if (lowerDate === "tomorrow") {
      return now.plus({ days: 1 });
    }

    // Handle day names (e.g., "Monday", "next Friday")
    const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    const dayMatch = dayNames.find(day => lowerDate.includes(day));
    
    if (dayMatch) {
      const targetDayIndex = dayNames.indexOf(dayMatch);
      let daysToAdd = (targetDayIndex - now.weekday + 7) % 7;
      
      // If "next" is mentioned, add 7 days
      if (lowerDate.includes("next")) {
        daysToAdd += 7;
      }
      
      // If the day is today or already passed this week, go to next week
      if (daysToAdd === 0 && !lowerDate.includes("today")) {
        daysToAdd = 7;
      }
      
      return now.plus({ days: daysToAdd });
    }

    // Try to parse as ISO date or standard date format
    try {
      const parsed = DateTime.fromISO(dateString, { zone: timezone });
      if (parsed.isValid) {
        return parsed;
      }
    } catch (e) {
      // Ignore and try other formats
    }

    // Try to parse as a more flexible date format (e.g., "November 15th", "Nov 15", "11/15")
    try {
      const parsed = DateTime.fromFormat(dateString, "MMMM d", { zone: timezone });
      if (parsed.isValid) {
        // If the parsed date is in the past, assume next year
        return parsed < now ? parsed.plus({ years: 1 }) : parsed;
      }
    } catch (e) {
      // Ignore
    }

    // Fallback: return tomorrow if we can't parse it
    console.warn(`⚠️  Could not parse date "${dateString}", defaulting to tomorrow`);
    return now.plus({ days: 1 });
  }

  /**
   * Parse natural language time strings
   * Handles: "2 PM", "14:00", "3:30 PM", "16 o'clock", "2pm", "14.00"
   */
  parseNaturalTime(timeString, timezone = "Europe/London") {
    const lowerTime = timeString.toLowerCase().trim();
    
    // Remove common words
    const cleanTime = lowerTime.replace(/o'clock/g, '').replace(/\s+/g, '');
    
    // Try parsing as standard time format
    const timeFormats = [
      'h:mm a',      // "2:30 PM"
      'ha',          // "2PM"
      'h a',         // "2 PM"
      'HH:mm',       // "14:30"
      'H:mm',        // "9:30"
      'HH.mm',       // "14.30"
      'H',           // "14"
    ];
    
    for (const format of timeFormats) {
      try {
        const parsed = DateTime.fromFormat(timeString, format, { zone: timezone });
        if (parsed.isValid) {
          return parsed;
        }
      } catch (e) {
        // Try next format
      }
    }
    
    // Try with cleaned string
    for (const format of timeFormats) {
      try {
        const parsed = DateTime.fromFormat(cleanTime, format, { zone: timezone });
        if (parsed.isValid) {
          return parsed;
        }
      } catch (e) {
        // Try next format
      }
    }
    
    // Fallback: default to 2 PM
    console.warn(`⚠️  Could not parse time "${timeString}", defaulting to 2 PM`);
    return DateTime.now().setZone(timezone).set({ hour: 14, minute: 0, second: 0 });
  }

  /**
   * Handle end-of-call report and send SMS fallback if needed
   */
  async handleEndOfCall(message) {
    try {
      const { endedReason, call, assistant } = message;
      
      console.log('\n📞 Call Ended Report:');
      console.log(`   Reason: ${endedReason}`);
      console.log(`   Call ID: ${call?.id}`);
      
      // Check if it's a confirmation call
      const variableValues = assistant?.variableValues;
      const isConfirmationCall = variableValues?.callType === 'confirmation';
      
      if (!isConfirmationCall) {
        console.log('   ℹ️  Not a confirmation call, skipping SMS fallback');
        return;
      }
      
      console.log('   ✅ Confirmation call detected');
      
      // Check if call was not answered
      const noAnswerReasons = [
        'voicemail',
        'no-answer', 
        'customer-did-not-answer',
        'customer-ended-call'  // Sometimes voicemail detection ends as customer-ended
      ];
      
      const wasNotAnswered = noAnswerReasons.includes(endedReason);
      
      if (!wasNotAnswered) {
        console.log(`   ℹ️  Call ended normally (${endedReason}), no SMS fallback needed`);
        return;
      }
      
      console.log(`   📱 Call not answered (${endedReason}) - Triggering SMS fallback`);
      
      // Extract data for SMS
      const { 
        firstName, 
        appointmentTimeOnly, 
        phone,
        contactId,
        appointmentId 
      } = variableValues;
      
      if (!phone || !firstName || !appointmentTimeOnly) {
        console.error('   ❌ Missing required data for SMS fallback');
        console.error(`      Phone: ${phone}, Name: ${firstName}, Time: ${appointmentTimeOnly}`);
        return;
      }
      
      // Send SMS fallback
      console.log(`\n📱 Sending SMS Fallback:`);
      console.log(`   To: ${phone}`);
      console.log(`   Customer: ${firstName}`);
      console.log(`   Appointment: ${appointmentTimeOnly}`);
      
      const smsResult = await this.smsClient.sendConfirmationReminder(
        phone,
        firstName,
        appointmentTimeOnly
      );
      
      if (smsResult.success) {
        console.log('✅ SMS fallback sent successfully!');
        console.log(`   Message SID: ${smsResult.messageSid}`);
        
        // Update confirmation status to "no_answer" with SMS tracking
        try {
          await this.updateAppointmentConfirmation({
            contactId,
            appointmentId,
            status: 'no_answer',
            notes: `Call not answered (${endedReason}). SMS sent at ${smsResult.sentAt} - Message SID: ${smsResult.messageSid}`
          });
          
          console.log('✅ Confirmation status updated to "no_answer" with SMS tracking');
        } catch (updateError) {
          console.error('⚠️  Error updating confirmation status:', updateError.message);
          // Don't fail if status update fails - SMS was sent successfully
        }
        
      } else {
        console.error('❌ SMS fallback failed:', smsResult.error);
        
        // Still try to update status even if SMS failed
        try {
          await this.updateAppointmentConfirmation({
            contactId,
            appointmentId,
            status: 'no_answer',
            notes: `Call not answered (${endedReason}). SMS send failed: ${smsResult.error}`
          });
        } catch (updateError) {
          console.error('⚠️  Error updating confirmation status:', updateError.message);
        }
      }
      
    } catch (error) {
      console.error('❌ Error in handleEndOfCall:', error.message);
      console.error(error.stack);
    }
  }
}

module.exports = VapiFunctionHandler;
