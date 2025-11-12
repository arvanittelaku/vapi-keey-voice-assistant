/**
 * Real-time monitor for Vapi requests
 * Run this in a separate terminal to watch for incoming tool calls
 */

const https = require("https");

const RENDER_URL = process.env.RENDER_URL || "https://vapi-keey-voice-assistant.onrender.com";

console.log(`
════════════════════════════════════════════════════════════
🔍 VAPI REQUEST MONITOR
════════════════════════════════════════════════════════════

Monitoring: ${RENDER_URL}
Checking every 3 seconds for new logs...

Keep this running while you make your test call!
Press Ctrl+C to stop.

════════════════════════════════════════════════════════════
`);

let lastLogTime = Date.now();

async function checkLogs() {
  // Just keep the terminal alive and remind user to check Render dashboard
  const now = new Date().toLocaleTimeString();
  console.log(`[${now}] ✓ Monitoring... (Check Render dashboard for live logs)`);
}

// Check every 3 seconds
setInterval(checkLogs, 3000);

// Also provide a health check
async function healthCheck() {
  return new Promise((resolve) => {
    const url = `${RENDER_URL}/health`;
    https.get(url, (res) => {
      let data = "";
      res.on("data", (chunk) => data += chunk);
      res.on("end", () => {
        console.log(`\n✅ Server Health Check: ${res.statusCode} - ${data}\n`);
        resolve();
      });
    }).on("error", (err) => {
      console.log(`\n❌ Server Health Check Failed: ${err.message}\n`);
      resolve();
    });
  });
}

// Initial health check
healthCheck();

// Health check every 30 seconds
setInterval(healthCheck, 30000);

