const { DateTime } = require("luxon");

class TwilioRouter {
  constructor(app) {
    this.app = app;
    this.setupRoutes();
  }

  setupRoutes() {
    console.log("📝 TwilioRouter: Registering Twilio routing webhook...");

    // Setup dial status handler
    this.setupDialStatusHandler();

    // Twilio Voice Webhook - Routes calls based on business hours
    this.app.post("/twilio/voice", (req, res) => {
      try {
        console.log("\n📞 TWILIO INCOMING CALL");
        console.log("📦 From:", req.body.From);
        console.log("📦 To:", req.body.To);

        const isBusinessHours = this.checkBusinessHours();
        
        console.log(`⏰ Business Hours Check: ${isBusinessHours ? 'OPEN' : 'CLOSED'}`);

        // Generate TwiML response
        const twiml = this.generateTwiMLResponse(isBusinessHours);
        
        res.type('text/xml');
        res.send(twiml);

      } catch (error) {
        console.error("❌ Error in Twilio router:", error);
        
        // Fallback: Route to Vapi in case of error
        const fallbackTwiml = this.generateVapiTwiML();
        res.type('text/xml');
        res.send(fallbackTwiml);
      }
    });

    // Health check for Twilio webhook
    this.app.get("/twilio/voice", (req, res) => {
      res.json({
        status: "Twilio Voice Router Ready",
        message: "Use POST method for incoming calls"
      });
    });
  }

  /**
   * Check if current time is within business hours
   * Business Hours: Mon-Fri 10:00-18:30 UK time
   * Off Hours: Mon-Fri 18:30-10:00 + All Weekend
   */
  checkBusinessHours() {
    const now = DateTime.now().setZone('Europe/London');
    
    const dayOfWeek = now.weekday; // 1 = Monday, 7 = Sunday
    const hour = now.hour;
    const minute = now.minute;
    const timeInMinutes = hour * 60 + minute;

    // Weekend check (Saturday = 6, Sunday = 7)
    if (dayOfWeek === 6 || dayOfWeek === 7) {
      console.log(`   📅 Weekend (${now.toFormat('cccc')}) - CLOSED`);
      return false;
    }

    // Weekday time check (Mon-Fri)
    const businessStart = 10 * 60; // 10:00 = 600 minutes
    const businessEnd = 18 * 60 + 30; // 18:30 = 1110 minutes

    const isOpen = timeInMinutes >= businessStart && timeInMinutes < businessEnd;
    
    console.log(`   📅 ${now.toFormat('cccc, HH:mm')} - ${isOpen ? 'OPEN' : 'CLOSED'}`);
    console.log(`   ⏰ Business hours: 10:00-18:30 UK time`);

    return isOpen;
  }

  /**
   * Generate TwiML response based on business hours
   */
  generateTwiMLResponse(isBusinessHours) {
    if (isBusinessHours) {
      // During business hours: Forward to team number
      console.log(`   ➡️  Forwarding to team: +447426923358`);
      
      return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="Polly.Emma">Thank you for calling Keey. Please hold while we connect you to our team.</Say>
    <Dial timeout="30" action="/twilio/dial-status">
        <Number>+447426923358</Number>
    </Dial>
    <Say voice="Polly.Emma">Sorry, our team is currently unavailable. Please try again later or call us during business hours.</Say>
</Response>`;
    } else {
      // Outside business hours: Forward to Vapi assistant
      console.log(`   ➡️  Forwarding to Vapi assistant`);
      return this.generateVapiTwiML();
    }
  }

  /**
   * Generate TwiML to forward to Vapi
   */
  generateVapiTwiML() {
    // Get Vapi webhook URL from environment
    const vapiWebhookUrl = process.env.VAPI_INBOUND_WEBHOOK_URL || 
                           'https://api.vapi.ai/call/incoming';
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Connect>
        <Stream url="${vapiWebhookUrl}">
            <Parameter name="assistant_id" value="${process.env.VAPI_INBOUND_ASSISTANT_ID || ''}" />
        </Stream>
    </Connect>
</Response>`;
  }

  /**
   * Handle dial status callback
   */
  setupDialStatusHandler() {
    this.app.post("/twilio/dial-status", (req, res) => {
      const dialCallStatus = req.body.DialCallStatus;
      
      console.log(`📞 Dial Status: ${dialCallStatus}`);
      
      if (dialCallStatus === 'no-answer' || dialCallStatus === 'busy' || dialCallStatus === 'failed') {
        // If team doesn't answer, provide fallback message
        const fallbackTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="Polly.Emma">Sorry, our team is currently unavailable. Please call us back during business hours: Monday to Friday, 10 AM to 6:30 PM UK time. Thank you for your interest in Keey.</Say>
    <Hangup/>
</Response>`;
        
        res.type('text/xml');
        res.send(fallbackTwiml);
      } else {
        res.type('text/xml');
        res.send('<Response></Response>');
      }
    });
  }
}

module.exports = TwilioRouter;

