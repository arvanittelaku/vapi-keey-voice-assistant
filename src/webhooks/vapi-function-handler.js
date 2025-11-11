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

    this.app.post("/webhook/vapi", async (req, res) => {
      try {
        console.log("\n🔔 VAPI FUNCTION CALL RECEIVED");
        console.log("📦 Payload:", JSON.stringify(req.body, null, 2));

        const { message, call } = req.body;

        if (!message || message.type !== "function-call") {
          console.log("⚠️  Not a function call, ignoring");
          return res.json({ success: true, message: "Not a function call" });
        }

        const { functionCall } = message;
        const { name: functionName, parameters } = functionCall;

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

          case "cancel_appointment":
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

        res.json({
          results: [
            {
              ...result,
              toolCallId: message.toolCallId,
            },
          ],
        });
      } catch (error) {
        console.error("\n❌ ERROR in function handler:", error.message);
        console.error("Stack:", error.stack);

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
      const { date, timezone } = params;

      console.log("\n📅 Checking calendar availability...");
      console.log(`   Date: ${date}`);
      console.log(`   Timezone: ${timezone}`);

      const calendarId = process.env.GHL_CALENDAR_ID;
      if (!calendarId) {
        throw new Error("GHL_CALENDAR_ID not configured");
      }

      // Parse date and get full day range
      const tz = timezone || "Europe/London";
      const dt = DateTime.fromISO(date, { zone: tz });
      const startOfDay = dt.startOf("day").toISO();
      const endOfDay = dt.endOf("day").toISO();

      console.log(`   Checking slots from ${startOfDay} to ${endOfDay}`);

      const availability = await this.ghlClient.checkCalendarAvailability(
        calendarId,
        startOfDay,
        endOfDay,
        tz
      );

      console.log(`✅ Found ${availability.slots?.length || 0} available slots`);

      if (!availability.slots || availability.slots.length === 0) {
        return {
          success: true,
          message: `I'm sorry, but we don't have any available slots on ${dt.toFormat(
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
        message: `Great! On ${dt.toFormat(
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
        contactId,
        appointmentTitle,
      } = params;

      console.log("\n📅 Booking calendar appointment...");
      console.log(`   Contact: ${fullName} (${email})`);
      console.log(`   Date: ${bookingDate}`);
      console.log(`   Time: ${bookingTime}`);

      const calendarId = process.env.GHL_CALENDAR_ID;
      if (!calendarId) {
        throw new Error("GHL_CALENDAR_ID not configured");
      }

      // Combine date and time
      const tz = timezone || "Europe/London";
      const dateTime = DateTime.fromISO(`${bookingDate}T${bookingTime}`, {
        zone: tz,
      });

      if (!dateTime.isValid) {
        throw new Error(`Invalid date/time: ${bookingDate}T${bookingTime}`);
      }

      const startTime = dateTime.toISO();
      console.log(`   Booking for: ${startTime}`);

      // Book the appointment
      const appointment = await this.ghlClient.bookAppointment({
        calendarId,
        contactId,
        startTime,
        timezone: tz,
        title: appointmentTitle || "Property Consultation",
        email,
        phone,
        fullName,
      });

      console.log("✅ Appointment booked successfully");
      console.log(`   Appointment ID: ${appointment.id}`);

      return {
        success: true,
        message: `Perfect! I've scheduled your appointment for ${dateTime.toFormat(
          "MMMM dd"
        )} at ${dateTime.toFormat(
          "h:mm a"
        )}. You'll receive a confirmation email shortly at ${email}. Is there anything else I can help you with?`,
        data: {
          appointmentId: appointment.id,
          startTime: dateTime.toFormat("yyyy-MM-dd HH:mm"),
          timezone: tz,
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
}

module.exports = VapiFunctionHandler;
