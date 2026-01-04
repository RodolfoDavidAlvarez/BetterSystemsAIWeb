import { google } from "googleapis";
import * as fs from "fs";
import * as path from "path";
import { db } from "@db/index";
import { emailLogs, clients } from "@db/schema";
import { eq, sql } from "drizzle-orm";

// Gmail credentials path
const CREDENTIALS_PATH = path.join(process.env.HOME || "", ".gmail-mcp", "credentials.json");
const OAUTH_KEYS_PATH = path.join(process.env.HOME || "", ".gmail-mcp", "gcp-oauth.keys.json");

// Internal domains for direction detection
const INTERNAL_DOMAINS = ["@bettersystems.ai", "@soilseedandwater.com"];

// Excluded sender domains (marketing, newsletters, notifications)
const EXCLUDED_SENDERS = [
  "noreply@",
  "no-reply@",
  "notifications@",
  "newsletter@",
  "marketing@",
  "@google.com",
  "@stripe.com",
  "@x.ai",
  "@claude.com",
  "@email.claude.com",
  "@resend.dev",
  "mailer-daemon@",
  "@amazonses.com",
  "@linkedin.com",
  "@facebook.com",
  "@facebookmail.com",
];

// Patterns for auto-categorizing contacts as "hidden" (system/automated emails)
const HIDDEN_EMAIL_PATTERNS = [
  "noreply", "no-reply", "no_reply", "do-not-reply", "donotreply",
  "notifications@", "notification@", "notify@",
  "newsletter@", "marketing@", "promo@", "promotions@",
  "support@", "security@", "team@", "hello@",
  "onboarding@", "billing@", "accounts@", "info@",
  "mailer-daemon", "postmaster@", "bounce@",
  "@google.com", "@stripe.com", "@twilio.com",
  "@vercel.com", "@resend.dev", "@anthropic.com",
  "@apollo.io", "@intuit.com", "@gitguardian.com",
  "@amazonses.com", "@linkedin.com", "@facebook.com",
  "@hubspot.com", "@mailchimp.com", "@sendgrid.com",
];

/**
 * Determine the label for a contact based on email patterns
 */
function getContactLabel(email: string): string {
  const lowerEmail = email.toLowerCase();

  if (HIDDEN_EMAIL_PATTERNS.some(pattern => lowerEmail.includes(pattern))) {
    return "hidden";
  }

  return "contact";
}

interface GmailCredentials {
  access_token: string;
  refresh_token: string;
  scope: string;
  token_type: string;
  expiry_date: number;
}

interface OAuthKeys {
  installed: {
    client_id: string;
    client_secret: string;
    redirect_uris: string[];
  };
}

let oauth2Client: any = null;
let gmail: any = null;

/**
 * Initialize Gmail API client with stored credentials
 */
export async function initializeGmail(): Promise<boolean> {
  try {
    // Check if credentials exist
    if (!fs.existsSync(CREDENTIALS_PATH) || !fs.existsSync(OAUTH_KEYS_PATH)) {
      console.log("[Gmail Service] Credentials not found at ~/.gmail-mcp/");
      return false;
    }

    // Load OAuth keys
    const oauthKeys: OAuthKeys = JSON.parse(fs.readFileSync(OAUTH_KEYS_PATH, "utf-8"));
    const credentials: GmailCredentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, "utf-8"));

    // Create OAuth2 client
    oauth2Client = new google.auth.OAuth2(
      oauthKeys.installed.client_id,
      oauthKeys.installed.client_secret,
      oauthKeys.installed.redirect_uris[0]
    );

    // Set credentials
    oauth2Client.setCredentials({
      access_token: credentials.access_token,
      refresh_token: credentials.refresh_token,
      expiry_date: credentials.expiry_date,
    });

    // Handle token refresh
    oauth2Client.on("tokens", (tokens: any) => {
      if (tokens.access_token) {
        const updatedCredentials = {
          ...credentials,
          access_token: tokens.access_token,
          expiry_date: tokens.expiry_date || credentials.expiry_date,
        };
        fs.writeFileSync(CREDENTIALS_PATH, JSON.stringify(updatedCredentials));
        console.log("[Gmail Service] Token refreshed and saved");
      }
    });

    // Initialize Gmail API
    gmail = google.gmail({ version: "v1", auth: oauth2Client });

    console.log("[Gmail Service] Initialized successfully");
    return true;
  } catch (error) {
    console.error("[Gmail Service] Failed to initialize:", error);
    return false;
  }
}

/**
 * Get direction (inbound/outbound) based on from address
 */
function getDirection(from: string): "inbound" | "outbound" {
  const lowerFrom = from.toLowerCase();
  return INTERNAL_DOMAINS.some((domain) => lowerFrom.includes(domain)) ? "outbound" : "inbound";
}

/**
 * Check if email should be excluded (marketing, newsletters, etc.)
 */
function shouldExcludeEmail(from: string, to: string[]): boolean {
  const lowerFrom = from.toLowerCase();

  // Exclude if from is in excluded list
  if (EXCLUDED_SENDERS.some((pattern) => lowerFrom.includes(pattern.toLowerCase()))) {
    return true;
  }

  return false;
}

/**
 * Check if email is business-relevant (involves internal domains)
 */
function isBusinessRelevant(from: string, to: string[]): boolean {
  const lowerFrom = from.toLowerCase();
  const allAddresses = [lowerFrom, ...to.map((t) => t.toLowerCase())];

  // Must involve at least one internal domain
  return allAddresses.some((addr) =>
    INTERNAL_DOMAINS.some((domain) => addr.includes(domain))
  );
}

/**
 * Parse email address from Gmail format
 */
function parseEmailAddress(header: string): { name: string; email: string; firstName: string; lastName: string } {
  const match = header.match(/^(.+?)\s*<(.+?)>$/);
  let name = "";
  let email = header.trim();

  if (match) {
    name = match[1].trim().replace(/^"|"$/g, "");
    email = match[2].trim();
  }

  // Extract first and last name
  const nameParts = name.split(/\s+/).filter(Boolean);
  let firstName = "";
  let lastName = "";

  if (nameParts.length >= 2) {
    firstName = nameParts[0];
    lastName = nameParts.slice(1).join(" ");
  } else if (nameParts.length === 1) {
    firstName = nameParts[0];
  } else {
    // Use email prefix as name if no name provided
    firstName = email.split("@")[0];
  }

  return { name: name || firstName, email, firstName, lastName };
}

/**
 * Extract header value from Gmail message
 */
function getHeader(headers: any[], name: string): string {
  const header = headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase());
  return header?.value || "";
}

/**
 * Decode base64url encoded content
 */
function decodeBase64Url(data: string): string {
  const base64 = data.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(base64, "base64").toString("utf-8");
}

/**
 * Extract email body from Gmail message parts
 */
function extractBody(payload: any): { html: string | null; text: string | null } {
  let html: string | null = null;
  let text: string | null = null;

  function processPayload(part: any) {
    if (part.body?.data) {
      const content = decodeBase64Url(part.body.data);
      if (part.mimeType === "text/html") {
        html = content;
      } else if (part.mimeType === "text/plain") {
        text = content;
      }
    }
    if (part.parts) {
      part.parts.forEach(processPayload);
    }
  }

  processPayload(payload);
  return { html, text };
}

/**
 * Fetch and sync emails from Gmail
 */
export async function syncEmailsFromGmail(options: {
  maxResults?: number;
  query?: string;
  type?: "all" | "sent" | "received";
  filterBusinessOnly?: boolean;
}): Promise<{
  success: boolean;
  totalSynced: number;
  created: number;
  updated: number;
  failed: number;
  contacts: number;
  error?: string;
}> {
  if (!gmail) {
    const initialized = await initializeGmail();
    if (!initialized) {
      return {
        success: false,
        totalSynced: 0,
        created: 0,
        updated: 0,
        failed: 0,
        contacts: 0,
        error: "Gmail not initialized. Check credentials at ~/.gmail-mcp/",
      };
    }
  }

  try {
    const { maxResults = 50, query, type = "all", filterBusinessOnly = true } = options;

    // Build Gmail query
    let gmailQuery = query || "";
    if (type === "sent") {
      gmailQuery = `from:me ${gmailQuery}`.trim();
    } else if (type === "received") {
      gmailQuery = `to:me ${gmailQuery}`.trim();
    }

    // Fetch message list
    const listResponse = await gmail.users.messages.list({
      userId: "me",
      maxResults,
      q: gmailQuery || undefined,
    });

    const messages = listResponse.data.messages || [];
    console.log(`[Gmail Sync] Found ${messages.length} messages`);

    let created = 0;
    let updated = 0;
    let failed = 0;
    const contactsToCreate: Map<string, { name: string; email: string; firstName: string; lastName: string }> = new Map();

    // Process each message
    for (const msg of messages) {
      try {
        // Fetch full message details
        const msgResponse = await gmail.users.messages.get({
          userId: "me",
          id: msg.id,
          format: "full",
        });

        const message = msgResponse.data;
        const headers = message.payload?.headers || [];

        const from = getHeader(headers, "From");
        const toHeader = getHeader(headers, "To");
        const ccHeader = getHeader(headers, "Cc");
        const bccHeader = getHeader(headers, "Bcc");
        const subject = getHeader(headers, "Subject");
        const date = getHeader(headers, "Date");
        const messageId = getHeader(headers, "Message-ID");

        // Parse recipients
        const to = toHeader.split(",").map((e) => e.trim()).filter(Boolean);
        const cc = ccHeader ? ccHeader.split(",").map((e) => e.trim()).filter(Boolean) : [];
        const bcc = bccHeader ? bccHeader.split(",").map((e) => e.trim()).filter(Boolean) : [];

        // Apply business-only filter
        if (filterBusinessOnly) {
          // Skip excluded senders (marketing, newsletters)
          if (shouldExcludeEmail(from, to)) {
            console.log(`[Gmail Sync] Skipping excluded sender: ${from}`);
            continue;
          }

          // Skip if not business-relevant (doesn't involve internal domains)
          if (!isBusinessRelevant(from, to)) {
            console.log(`[Gmail Sync] Skipping non-business email: ${subject}`);
            continue;
          }
        }

        // Extract body
        const { html, text } = extractBody(message.payload);

        // Determine direction
        const direction = getDirection(from);

        // Parse date
        const sentAt = date ? new Date(date) : new Date(parseInt(message.internalDate));

        // Prepare email data
        const emailData = {
          gmailId: msg.id,
          from,
          to,
          cc: cc.length ? cc : null,
          bcc: bcc.length ? bcc : null,
          subject: subject || "(no subject)",
          htmlBody: html,
          textBody: text,
          status: "delivered",
          lastEvent: "email.synced",
          category: direction,
          sentAt,
          syncedAt: new Date(),
          updatedAt: new Date(),
        };

        // Check if email already exists (by gmailId or by matching subject+from+date)
        const existing = await db
          .select({ id: emailLogs.id })
          .from(emailLogs)
          .where(
            sql`${emailLogs.from} = ${from} AND ${emailLogs.subject} = ${subject} AND DATE(${emailLogs.sentAt}) = DATE(${sentAt})`
          )
          .limit(1);

        if (existing.length > 0) {
          // Update existing
          await db
            .update(emailLogs)
            .set(emailData)
            .where(eq(emailLogs.id, existing[0].id));
          updated++;
        } else {
          // Insert new
          await db.insert(emailLogs).values(emailData);
          created++;
        }

        // Extract contacts for inbound emails (potential clients)
        if (direction === "inbound") {
          const { name, email: senderEmail, firstName, lastName } = parseEmailAddress(from);
          if (senderEmail && !INTERNAL_DOMAINS.some((d) => senderEmail.toLowerCase().includes(d))) {
            contactsToCreate.set(senderEmail.toLowerCase(), {
              name: name || senderEmail.split("@")[0],
              email: senderEmail,
              firstName,
              lastName,
            });
          }
        }
      } catch (msgError) {
        console.error(`[Gmail Sync] Failed to process message ${msg.id}:`, msgError);
        failed++;
      }
    }

    // Create/update contacts and associate emails
    let contactsCreated = 0;
    const contactIdMap: Map<string, number> = new Map();

    for (const [email, contact] of contactsToCreate) {
      try {
        // Check if client exists
        const existingClient = await db
          .select({ id: clients.id })
          .from(clients)
          .where(eq(clients.email, email))
          .limit(1);

        if (existingClient.length === 0) {
          // Create new client from email contact with auto-categorization
          const label = getContactLabel(contact.email);
          const [newClient] = await db.insert(clients).values({
            name: contact.name,
            firstName: contact.firstName || null,
            lastName: contact.lastName || null,
            email: contact.email,
            status: "lead",
            source: "email",
            label,
            createdAt: new Date(),
            updatedAt: new Date(),
          }).returning({ id: clients.id });

          if (newClient) {
            contactIdMap.set(email.toLowerCase(), newClient.id);
            contactsCreated++;
            console.log(`[Gmail Sync] Created contact: ${contact.firstName} ${contact.lastName} <${contact.email}>`);
          }
        } else {
          contactIdMap.set(email.toLowerCase(), existingClient[0].id);
        }
      } catch (contactError) {
        console.error(`[Gmail Sync] Failed to create contact ${email}:`, contactError);
      }
    }

    // Associate emails with contacts (update relatedClientId)
    for (const [email, clientId] of contactIdMap) {
      try {
        await db
          .update(emailLogs)
          .set({ relatedClientId: clientId, updatedAt: new Date() })
          .where(
            sql`(${emailLogs.from} ILIKE ${"%" + email + "%"} OR ${emailLogs.to}::text ILIKE ${"%" + email + "%"}) AND ${emailLogs.relatedClientId} IS NULL`
          );
      } catch (assocError) {
        console.error(`[Gmail Sync] Failed to associate emails for ${email}:`, assocError);
      }
    }

    console.log(`[Gmail Sync] Complete: ${created} created, ${updated} updated, ${failed} failed, ${contactsCreated} contacts`);

    return {
      success: true,
      totalSynced: created + updated,
      created,
      updated,
      failed,
      contacts: contactsCreated,
    };
  } catch (error) {
    console.error("[Gmail Sync] Error:", error);
    return {
      success: false,
      totalSynced: 0,
      created: 0,
      updated: 0,
      failed: 0,
      contacts: 0,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Send email via Gmail
 */
export async function sendEmailViaGmail(options: {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  cc?: string[];
  bcc?: string[];
  replyTo?: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!gmail) {
    const initialized = await initializeGmail();
    if (!initialized) {
      return { success: false, error: "Gmail not initialized" };
    }
  }

  try {
    const { to, subject, html, text, cc, bcc, replyTo } = options;

    // Build recipients
    const toList = Array.isArray(to) ? to : [to];

    // Build raw email
    const boundary = "boundary_" + Date.now();
    let email = [
      `From: rodolfo@bettersystems.ai`,
      `To: ${toList.join(", ")}`,
      cc?.length ? `Cc: ${cc.join(", ")}` : "",
      bcc?.length ? `Bcc: ${bcc.join(", ")}` : "",
      replyTo ? `Reply-To: ${replyTo}` : "",
      `Subject: ${subject}`,
      `MIME-Version: 1.0`,
      `Content-Type: multipart/alternative; boundary="${boundary}"`,
      "",
    ]
      .filter(Boolean)
      .join("\r\n");

    // Add text part
    if (text) {
      email += `\r\n--${boundary}\r\n`;
      email += `Content-Type: text/plain; charset="UTF-8"\r\n\r\n`;
      email += text;
    }

    // Add HTML part
    if (html) {
      email += `\r\n--${boundary}\r\n`;
      email += `Content-Type: text/html; charset="UTF-8"\r\n\r\n`;
      email += html;
    }

    email += `\r\n--${boundary}--`;

    // Encode to base64url
    const encodedEmail = Buffer.from(email)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    // Send email
    const response = await gmail.users.messages.send({
      userId: "me",
      requestBody: {
        raw: encodedEmail,
      },
    });

    const messageId = response.data.id;

    // Log to database
    await db.insert(emailLogs).values({
      gmailId: messageId,
      from: "rodolfo@bettersystems.ai",
      to: toList,
      cc: cc?.length ? cc : null,
      bcc: bcc?.length ? bcc : null,
      subject,
      htmlBody: html || null,
      textBody: text || null,
      status: "sent",
      lastEvent: "email.sent",
      category: "outbound",
      sentAt: new Date(),
      syncedAt: new Date(),
    });

    console.log(`[Gmail] Email sent: ${messageId}`);
    return { success: true, messageId };
  } catch (error) {
    console.error("[Gmail] Send error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

/**
 * Search emails in Gmail
 */
export async function searchGmailEmails(query: string, maxResults: number = 20): Promise<any[]> {
  if (!gmail) {
    const initialized = await initializeGmail();
    if (!initialized) {
      return [];
    }
  }

  try {
    const response = await gmail.users.messages.list({
      userId: "me",
      maxResults,
      q: query,
    });

    const messages = response.data.messages || [];
    const results = [];

    for (const msg of messages.slice(0, 10)) {
      // Limit details fetch
      const msgResponse = await gmail.users.messages.get({
        userId: "me",
        id: msg.id,
        format: "metadata",
        metadataHeaders: ["From", "To", "Subject", "Date"],
      });

      const headers = msgResponse.data.payload?.headers || [];
      results.push({
        id: msg.id,
        from: getHeader(headers, "From"),
        to: getHeader(headers, "To"),
        subject: getHeader(headers, "Subject"),
        date: getHeader(headers, "Date"),
      });
    }

    return results;
  } catch (error) {
    console.error("[Gmail Search] Error:", error);
    return [];
  }
}

// Initialize on module load
initializeGmail();
