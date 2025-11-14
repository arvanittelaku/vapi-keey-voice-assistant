const GHLClient = require("../services/ghl-client");
const { parsePhoneNumber } = require("libphonenumber-js");
const { DateTime } = require("luxon");

class VapiFunctionHandler {
  constructor(app) {
    this.app = app;
    this.ghlClient = new GHLClient();
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

        // Handle both "function-call" (old format) and "tool-calls"/"tool_calls" (new format)
        if (!message || (messageType !== "function-call" && messageType !== "tool-calls" && messageType !== "tool_calls")) {
          console.log("⚠️  Not a function call, ignoring");
          console.log(`   Message type/role: ${messageType}`);
          return res.json({ success: true, message: "Not a function call" });
        }

        // Extract function info based on message type
        let functionName, parameters, toolCallId;
        
        if (messageType === "tool-calls" || messageType === "tool_calls") {
          // New format: extract from toolCalls array
          const toolCall = message.toolCalls?.[0] || message.toolCallList?.[0];
          if (!toolCall || !toolCall.function) {
            console.log("⚠️  No tool call found in tool-calls message");
            return res.json({ success: false, message: "No tool call found" });
          }
          functionName = toolCall.function.name;
          parameters = typeof toolCall.function.arguments === 'string' 
            ? JSON.parse(toolCall.function.arguments) 
            : toolCall.function.arguments;
          toolCallId = toolCall.id; // Extract the correct toolCallId
        } else {
          // Old format: extract from functionCall
          const { functionCall } = message;
          functionName = functionCall.name;
          parameters = functionCall.parameters;
          toolCallId = message.toolCallId; // Old format uses message.toolCallId
        }

        console.log(`🛠️  Function Called: ${functionName}`);
        console.log("📋 Parameters:", parameters);

        let result;

        switch (functionName) {
          case "create_contact":
            result = await this.createContact(parameters);
            break;

          case "check_calendar_availability_keey":
            result = await this.checkCalendarAvailability(parameters);
            break;

          case "book_calendar_appointment_keey":
            result = await this.bookCalendarAppointment(parameters);
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

        // Send response with proper Vapi format
        // Vapi expects: { results: [{ toolCallId, result }] }
        // NOT: { results: [{ toolCallId, success, message, data }] }
        const response = {
          results: [
            {
              toolCallId: toolCallId,
              result: result.message || JSON.stringify(result), // Use message as the result string
            },
          ],
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

    console.log("✅ Vapi function webhook registered at /webhook/vapi");
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
      
      // Handle natural language dates (e.g., "tomorrow", "Monday", "November 15th")
      const parsedDate = this.parseNaturalDate(requestedDate, tz);
      
      // Parse the requested time (e.g., "6 PM", "14:00")
      const parsedTime = this.parseNaturalTime(requestedTime, tz);
      
      // ⚡ OPTIMIZATION: Query only a 4-hour window around requested time
      // This makes GHL API respond 10x faster (~400ms instead of 2.6 seconds)
      const requestedDateTime = parsedDate.set({
        hour: parsedTime.hour,
        minute: parsedTime.minute,
        second: 0,
        millisecond: 0
      });
      
      // Create window: 2 hours before to 2 hours after requested time
      const startTime = requestedDateTime.minus({ hours: 2 }).toISO();
      const endTime = requestedDateTime.plus({ hours: 2 }).toISO();

      console.log(`   Requested time: ${requestedDateTime.toFormat('h:mm a')}`)
      console.log(`   Checking slots from ${startTime} to ${endTime}`);

      const availability = await this.ghlClient.checkCalendarAvailability(
        calendarId,
        startTime,
        endTime,
        tz
      );

      console.log(`✅ Found ${availability.slots?.length || 0} available slots`);

      if (!availability.slots || availability.slots.length === 0) {
        return {
          success: true,
          message: `I'm sorry, but we don't have any available slots on ${parsedDate.toFormat(
            "MMMM dd, yyyy"
          )}. Would you like to try a different date?`,
          data: { availableSlots: [] },
        };
      }

      // Format slots for the AI to read naturally
      const formattedSlots = availability.slots
        .slice(0, 5)
        .map((slot) => {
          const time = DateTime.fromISO(slot, { zone: tz });
          return time.toFormat("h:mm a");
        })
        .join(", ");

      return {
        success: true,
        message: `Great! On ${parsedDate.toFormat(
          "MMMM dd"
        )}, we have availability at: ${formattedSlots}. Which time works best for you?`,
        data: {
          availableSlots: availability.slots,
          displaySlots: formattedSlots,
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

  async bookCalendarAppointment(params) {
    try {
      const {
        email,
        phone,
        fullName,
        timezone,
        bookingDate,
        bookingTime,
        startTime,
        contactId,
        appointmentTitle,
        calendarId,
      } = params;

      console.log("\n📅 Booking calendar appointment...");
      
      // Use provided calendarId or fall back to environment variable
      const targetCalendarId = calendarId || process.env.GHL_CALENDAR_ID;
      if (!targetCalendarId) {
        throw new Error("GHL_CALENDAR_ID not configured");
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
      
      let message = `Perfect! I've scheduled your appointment for ${dateFormatted} at ${timeFormatted}.`;
      if (email) {
        message += ` You'll receive a confirmation email shortly at ${email}.`;
      } else {
        message += ` You'll receive a confirmation email shortly.`;
      }

      return {
        success: true,
        message: message,
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
}

module.exports = VapiFunctionHandler;
