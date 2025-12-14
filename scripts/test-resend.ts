import { Resend } from "resend";
import * as dotenv from "dotenv";

dotenv.config();

const resendApiKey = process.env.RESEND_API_KEY;

if (!resendApiKey) {
  console.error("ERROR: RESEND_API_KEY is not set");
  process.exit(1);
}

console.log("Testing Resend API connection...");
console.log("API Key:", resendApiKey.substring(0, 10) + "...");

const resend = new Resend(resendApiKey);

async function testResend() {
  try {
    console.log("\n1. Testing sent emails list...");
    const sentResult = await resend.emails.list({ limit: 5 });
    console.log("Sent emails result:", JSON.stringify(sentResult, null, 2));

    console.log("\n2. Testing received emails list...");
    const receivedResult = await resend.emails.receiving.list({ limit: 5 });
    console.log("Received emails result:", JSON.stringify(receivedResult, null, 2));
  } catch (error) {
    console.error("Error testing Resend API:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
  }
}

testResend();
