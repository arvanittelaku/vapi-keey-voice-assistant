const twilio = require('twilio');
require('dotenv').config();

class SMSClient {
  constructor() {
    this.accountSid = process.env.TWILIO_ACCOUNT_SID;
    this.authToken = process.env.TWILIO_AUTH_TOKEN;
    this.fromNumber = process.env.TWILIO_PHONE_NUMBER;
    
    if (!this.accountSid || !this.authToken || !this.fromNumber) {
      console.warn('⚠️  Twilio SMS credentials not configured');
      console.warn('   Required: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER');
      this.client = null;
    } else {
      this.client = twilio(this.accountSid, this.authToken);
      console.log('✅ Twilio SMS client initialized');
      console.log(`   📱 From Number: ${this.fromNumber}`);
    }
  }

  /**
   * Send SMS reminder when confirmation call is not answered
   */
  async sendConfirmationReminder(toNumber, customerName, appointmentTime) {
    if (!this.client) {
      console.error('❌ Twilio SMS not configured');
      return { success: false, error: 'SMS service not configured' };
    }

    try {
      const message = `Hi ${customerName}, we tried calling about your Keey consultation at ${appointmentTime}. Reply YES to confirm or call us at 0203 967 3687 to reschedule.`;

      console.log(`\n📤 Sending SMS Confirmation Reminder:`);
      console.log(`   To: ${toNumber}`);
      console.log(`   Message: ${message}`);
      
      const result = await this.client.messages.create({
        body: message,
        from: this.fromNumber,
        to: toNumber
      });

      console.log(`✅ SMS sent successfully!`);
      console.log(`   Message SID: ${result.sid}`);
      console.log(`   Status: ${result.status}`);
      
      return {
        success: true,
        messageSid: result.sid,
        status: result.status,
        sentAt: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Error sending SMS:', error.message);
      
      // Provide helpful error messages
      if (error.code === 21211) {
        console.error('   Invalid phone number format');
      } else if (error.code === 21614) {
        console.error('   "To" number is not a valid mobile number');
      } else if (error.code === 21608) {
        console.error('   "From" number is not SMS-capable');
      }
      
      return {
        success: false,
        error: error.message,
        errorCode: error.code
      };
    }
  }

  /**
   * Send SMS confirmation after customer confirms via call
   */
  async sendConfirmationSuccess(toNumber, customerName, appointmentTime) {
    if (!this.client) {
      console.error('❌ Twilio SMS not configured');
      return { success: false, error: 'SMS service not configured' };
    }

    try {
      const message = `Thanks ${customerName}! Your Keey consultation at ${appointmentTime} is confirmed. We're looking forward to speaking with you!`;

      console.log(`\n📤 Sending SMS Confirmation:`);
      console.log(`   To: ${toNumber}`);
      
      const result = await this.client.messages.create({
        body: message,
        from: this.fromNumber,
        to: toNumber
      });

      console.log(`✅ Confirmation SMS sent! SID: ${result.sid}`);
      
      return {
        success: true,
        messageSid: result.sid,
        status: result.status
      };

    } catch (error) {
      console.error('❌ Error sending confirmation SMS:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Send SMS after appointment cancellation
   */
  async sendCancellationConfirmation(toNumber, customerName) {
    if (!this.client) {
      console.error('❌ Twilio SMS not configured');
      return { success: false, error: 'SMS service not configured' };
    }

    try {
      const message = `Hi ${customerName}, your Keey appointment has been cancelled. Call us at 0203 967 3687 anytime to rebook. We're here to help!`;

      console.log(`\n📤 Sending Cancellation SMS:`);
      console.log(`   To: ${toNumber}`);
      
      const result = await this.client.messages.create({
        body: message,
        from: this.fromNumber,
        to: toNumber
      });

      console.log(`✅ Cancellation SMS sent! SID: ${result.sid}`);
      
      return {
        success: true,
        messageSid: result.sid
      };

    } catch (error) {
      console.error('❌ Error sending cancellation SMS:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Test SMS sending (for debugging)
   */
  async sendTestSMS(toNumber, message) {
    if (!this.client) {
      console.error('❌ Twilio SMS not configured');
      return { success: false, error: 'SMS service not configured' };
    }

    try {
      console.log(`\n📤 Sending Test SMS:`);
      console.log(`   To: ${toNumber}`);
      console.log(`   Message: ${message}`);
      
      const result = await this.client.messages.create({
        body: message,
        from: this.fromNumber,
        to: toNumber
      });

      console.log(`✅ Test SMS sent! SID: ${result.sid}`);
      
      return {
        success: true,
        messageSid: result.sid,
        status: result.status
      };

    } catch (error) {
      console.error('❌ Error sending test SMS:', error.message);
      return {
        success: false,
        error: error.message,
        errorCode: error.code
      };
    }
  }
}

module.exports = SMSClient;

