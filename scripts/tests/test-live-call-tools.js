/**
 * Test the calendar tools that failed during the live call
 * This simulates exactly what Vapi sent during the failed call
 */

const https = require("https");

const SERVER_URL =
  process.env.RENDER_URL || "https://vapi-keey-voice-assistant.onrender.com";
const AUTH_TOKEN = process.env.GHL_ACCESS_TOKEN;

console.log(`
════════════════════════════════════════════════════════════
🧪 TESTING LIVE CALL SCENARIO
════════════════════════════════════════════════════════════

Testing the EXACT parameters that failed during the live call:
- User said: "Tomorrow 9 9 AM eastern"  
- AI sent: requestedDate: "tomorrow", requestedTime: "9 AM", timezone: "Europe/London"

Server: ${SERVER_URL}
`);

async function testTool(toolName, params, testId) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    // Use the NEW format that Vapi actually sends during live calls
    const payload = JSON.stringify({
      message: {
        type: "tool-calls",  // NEW: plural "tool-calls" instead of "function-call"
        toolCalls: [         // NEW: array of tool calls
          {
            id: testId || `call_test_${Date.now()}`,
            type: "function",
            function: {
              name: toolName,
              arguments: JSON.stringify(params),  // NEW: arguments as JSON string
            },
          },
        ],
        call: {
          id: `test-live-call-${Date.now()}`,
        },
      },
    });

    const url = new URL(`${SERVER_URL}/webhook/vapi`);

    const options = {
      method: "POST",
      hostname: url.hostname,
      path: url.pathname,
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(payload),
        Authorization: `Bearer ${AUTH_TOKEN}`,
      },
    };

    console.log(`\n📞 TESTING: ${toolName}`);
    console.log(`📦 Parameters:`, JSON.stringify(params, null, 2));
    console.log(`⏱️  Starting request...`);

    const req = https.request(options, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        const duration = Date.now() - startTime;
        console.log(`\n✅ Response received in ${duration}ms`);
        console.log(`📊 Status Code: ${res.statusCode}`);
        console.log(`📤 Response:`, data.substring(0, 500));

        try {
          const parsed = JSON.parse(data);
          if (parsed.results && parsed.results[0]) {
            console.log(
              `\n${parsed.results[0].success ? "✅ SUCCESS" : "❌ FAILED"}`
            );
            console.log(`Message: ${parsed.results[0].message}`);
          }
          resolve({ success: true, response: parsed, duration });
        } catch (e) {
          console.log(`⚠️  Could not parse response`);
          resolve({ success: false, error: data, duration });
        }
      });
    });

    req.on("error", (error) => {
      const duration = Date.now() - startTime;
      console.error(`\n❌ Request failed after ${duration}ms`);
      console.error(`Error:`, error.message);
      reject({ success: false, error: error.message, duration });
    });

    req.on("timeout", () => {
      const duration = Date.now() - startTime;
      console.error(
        `\n⏱️  Request timed out after ${duration}ms (>20 seconds)`
      );
      req.destroy();
      reject({
        success: false,
        error: "Timeout - request took longer than 20 seconds",
        duration,
      });
    });

    req.setTimeout(25000); // 25 second timeout (slightly more than Vapi's 20s)

    req.write(payload);
    req.end();
  });
}

async function runTests() {
  try {
    // Test 1: Exact scenario from failed live call
    console.log(
      "\n════════════════════════════════════════════════════════════"
    );
    console.log("TEST 1: LIVE CALL SCENARIO");
    console.log("User said: 'Tomorrow 9 9 AM eastern'");
    console.log(
      "════════════════════════════════════════════════════════════"
    );

    const test1 = await testTool(
      "check_calendar_availability_keey",
      {
        requestedDate: "tomorrow",
        requestedTime: "9 AM",
        timezone: "Europe/London",
      },
      "test-live-scenario-001"
    );

    // Test 2: Try with different time formats
    console.log(
      "\n════════════════════════════════════════════════════════════"
    );
    console.log("TEST 2: ALTERNATIVE TIME FORMAT");
    console.log(
      "════════════════════════════════════════════════════════════"
    );

    const test2 = await testTool(
      "check_calendar_availability_keey",
      {
        requestedDate: "tomorrow",
        requestedTime: "2 PM",
        timezone: "Europe/London",
      },
      "test-live-scenario-002"
    );

    // Test 3: Try with specific date
    console.log(
      "\n════════════════════════════════════════════════════════════"
    );
    console.log("TEST 3: SPECIFIC DATE");
    console.log(
      "════════════════════════════════════════════════════════════"
    );

    const test3 = await testTool(
      "check_calendar_availability_keey",
      {
        requestedDate: "November 12",
        requestedTime: "14:00",
        timezone: "Europe/London",
      },
      "test-live-scenario-003"
    );

    console.log(
      "\n════════════════════════════════════════════════════════════"
    );
    console.log("📊 TEST SUMMARY");
    console.log(
      "════════════════════════════════════════════════════════════\n"
    );

    const tests = [test1, test2, test3];
    const passed = tests.filter((t) => t.success).length;
    const failed = tests.filter((t) => !t.success).length;
    const avgDuration =
      tests.reduce((sum, t) => sum + (t.duration || 0), 0) / tests.length;

    console.log(`Total Tests: ${tests.length}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⏱️  Average Response Time: ${avgDuration.toFixed(0)}ms`);

    if (failed > 0) {
      console.log(
        `\n⚠️  ${failed} test(s) failed - check the errors above`
      );
      console.log(
        `\nMost likely causes:`
      );
      console.log(`1. Server is down or not reachable`);
      console.log(`2. GHL_ACCESS_TOKEN is invalid`);
      console.log(`3. GHL_CALENDAR_ID is not configured`);
      console.log(`4. Network/firewall blocking requests`);
    } else {
      console.log(`\n✅ All tests passed!`);
      console.log(
        `\nIf Vapi calls are still failing, the issue is likely:`
      );
      console.log(`1. Vapi can't reach the server (network/DNS issue)`);
      console.log(
        `2. Vapi is using wrong headers (check Authorization header)`
      );
      console.log(
        `3. Vapi is timing out (response time >20s, currently ${avgDuration.toFixed(0)}ms)`
      );
      console.log(`4. Response format mismatch (unlikely - format is correct)`);
    }

    console.log(
      `\n════════════════════════════════════════════════════════════\n`
    );

    process.exit(failed > 0 ? 1 : 0);
  } catch (error) {
    console.error("\n❌ Test suite failed:", error);
    process.exit(1);
  }
}

runTests();

