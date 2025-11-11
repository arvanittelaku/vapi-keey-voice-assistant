const GHLClient = require("../services/ghl-client");

class GHLSmsHandler {
  constructor(app) {
    this.app = app;
    this.ghlClient = new GHLClient();
    this.setupRoutes();
  }

  setupRoutes() {
    console.log("📝 GHLSmsHandler: Registering SMS reply webhook...");

    this.app.post("/webhook/ghl-sms-reply", async (req, res) => {
      try {
        console.log("\n📱 SMS REPLY RECEIVED");
        console.log("📦 Payload:", JSON.stringify(req.body, null, 2));

        // Extract SMS data from GHL webhook payload
        const smsData = this.extractSmsData(req.body);
        
        if (!smsData) {
          console.log("⚠️  Could not extract SMS data from payload");
          return res.status(200).json({ 
            success: false, 
            message: "Invalid SMS payload" 
          });
        }

        console.log("\n📋 SMS Details:");
        console.log(`   From: ${smsData.from}`);
        console.log(`   Message: "${smsData.message}"`);
        console.log(`   Contact ID: ${smsData.contactId}`);

        // Parse the SMS message to determine intent
        const intent = this.parseIntent(smsData.message);
        console.log(`   Detected Intent: ${intent}`);

        // Handle the intent
        const result = await this.handleIntent(intent, smsData);

        console.log("✅ SMS processed successfully");
        return res.status(200).json({
          success: true,
          intent: intent,
          result: result,
        });

      } catch (error) {
        console.error("\n❌ ERROR processing SMS:", error.message);
        console.error("Stack:", error.stack);

        // Always return 200 to GHL to avoid retries
        return res.status(200).json({
          success: false,
          error: error.message,
        });
      }
    });

    console.log("✅ SMS reply webhook registered at /webhook/ghl-sms-reply");
  }

  // Extract SMS data from GHL webhook payload
  extractSmsData(payload) {
    try {
      // GHL SMS webhook formats can vary, handle multiple formats
      // Format 1: Direct SMS data
      if (payload.type === "SMS" && payload.message) {
        return {
          from: payload.phone || payload.from,
          message: payload.message || payload.body,
          contactId: payload.contactId || payload.contact_id,
          messageId: payload.id || payload.messageId,
        };
      }

      // Format 2: Nested in data object
      if (payload.data) {
        return {
          from: payload.data.phone || payload.data.from,
          message: payload.data.message || payload.data.body,
          contactId: payload.data.contactId || payload.data.contact_id,
          messageId: payload.data.id || payload.data.messageId,
        };
      }

      // Format 3: Direct fields
      return {
        from: payload.phone || payload.from,
        message: payload.message || payload.body || payload.text,
        contactId: payload.contactId || payload.contact_id,
        messageId: payload.id || payload.messageId,
      };
    } catch (error) {
      console.error("Error extracting SMS data:", error.message);
      return null;
    }
  }

  // Parse SMS message to determine customer intent
  parseIntent(message) {
    if (!message || typeof message !== "string") {
      return "unknown";
    }

    const normalized = message.toLowerCase().trim();

    // Check for confirmation intent
    const confirmKeywords = ["yes", "y", "confirm", "confirmed", "ok", "okay", "sure", "correct", "affirmative"];
    if (confirmKeywords.some(keyword => normalized === keyword || normalized.startsWith(keyword))) {
      return "confirm";
    }

    // Check for cancellation intent
    const cancelKeywords = ["no", "n", "cancel", "cancelled", "cant", "can't", "cannot", "unable", "wont", "won't"];
    if (cancelKeywords.some(keyword => normalized === keyword || normalized.startsWith(keyword))) {
      return "cancel";
    }

    // Check for reschedule intent
    const rescheduleKeywords = ["reschedule", "rescheduled", "change", "different time", "another time", "later", "move"];
    if (rescheduleKeywords.some(keyword => normalized.includes(keyword))) {
      return "reschedule";
    }

    // Default to unknown
    return "unknown";
  }

  // Handle the detected intent
  async handleIntent(intent, smsData) {
    try {
      switch (intent) {
        case "confirm":
          return await this.handleConfirm(smsData);
        
        case "cancel":
          return await this.handleCancel(smsData);
        
        case "reschedule":
          return await this.handleReschedule(smsData);
        
        case "unknown":
          return await this.handleUnknown(smsData);
        
        default:
          return { success: false, message: "Unknown intent" };
      }
    } catch (error) {
      console.error(`Error handling intent ${intent}:`, error.message);
      return { success: false, error: error.message };
    }
  }

  // Handle confirmation response (YES)
  async handleConfirm(smsData) {
    console.log("\n✅ Handling CONFIRMATION...");
    
    try {
      // Update contact custom field to "confirmed"
      const updateData = {
        customFields: [
          {
            id: "YLvP62hGzQMhfl2YMxTj", // Confirmation custom field
            value: "confirmed"
          }
        ]
      };

      await this.ghlClient.updateContact(smsData.contactId, updateData);
      console.log("✅ Contact status updated to 'confirmed'");

      // Send confirmation SMS
      // Note: SMS sending will be handled by GHL workflow trigger
      // We just trigger the "confirmed" workflow
      
      console.log("✅ Confirmation processed successfully");
      return {
        success: true,
        action: "confirmed",
        message: "Appointment confirmed via SMS"
      };
    } catch (error) {
      console.error("❌ Error handling confirmation:", error.message);
      throw error;
    }
  }

  // Handle cancellation response (NO)
  async handleCancel(smsData) {
    console.log("\n❌ Handling CANCELLATION...");
    
    try {
      // Update contact custom field to "cancelled"
      const updateData = {
        customFields: [
          {
            id: "YLvP62hGzQMhfl2YMxTj", // Confirmation custom field
            value: "cancelled"
          }
        ]
      };

      await this.ghlClient.updateContact(smsData.contactId, updateData);
      console.log("✅ Contact status updated to 'cancelled'");

      // Note: We could also cancel the appointment in calendar here
      // But we'll let the workflow handle follow-up actions

      console.log("✅ Cancellation processed successfully");
      return {
        success: true,
        action: "cancelled",
        message: "Appointment cancelled via SMS"
      };
    } catch (error) {
      console.error("❌ Error handling cancellation:", error.message);
      throw error;
    }
  }

  // Handle reschedule request
  async handleReschedule(smsData) {
    console.log("\n🔄 Handling RESCHEDULE REQUEST...");
    
    try {
      // Update contact custom field to "reschedule"
      const updateData = {
        customFields: [
          {
            id: "YLvP62hGzQMhfl2YMxTj", // Confirmation custom field
            value: "reschedule"
          }
        ]
      };

      await this.ghlClient.updateContact(smsData.contactId, updateData);
      console.log("✅ Contact status updated to 'reschedule'");

      // Workflow will send calendar booking link

      console.log("✅ Reschedule request processed successfully");
      return {
        success: true,
        action: "reschedule",
        message: "Reschedule request received via SMS"
      };
    } catch (error) {
      console.error("❌ Error handling reschedule:", error.message);
      throw error;
    }
  }

  // Handle unknown/unclear response
  async handleUnknown(smsData) {
    console.log("\n❓ Handling UNKNOWN response...");
    
    console.log("⚠️  Could not determine customer intent from message");
    console.log(`   Message: "${smsData.message}"`);
    
    // Could send a clarification SMS here via workflow
    
    return {
      success: true,
      action: "unknown",
      message: "Could not determine intent from SMS"
    };
  }
}

module.exports = GHLSmsHandler;

