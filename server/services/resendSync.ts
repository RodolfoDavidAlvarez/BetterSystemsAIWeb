import { Resend } from "resend";
import { db } from "@db/index";
import { emailLogs } from "@db/schema";
import { eq } from "drizzle-orm";

// Initialize Resend with API key
const resendApiKey = process.env.RESEND_API_KEY;

if (!resendApiKey) {
  console.error("[Resend Sync] ERROR: RESEND_API_KEY is not set in environment variables");
  throw new Error("RESEND_API_KEY is required for Resend sync service");
}

const resend = new Resend(resendApiKey);
console.log("[Resend Sync] Initialized with Resend API");

// Domain to filter emails for (Better Systems AI domain)
const DOMAIN_FILTER = "bettersystemsai.com";

/**
 * Extract email address from "Name <email@domain.com>" format
 */
function extractEmailAddress(emailString: string): string {
  const match = emailString.match(/<(.+)>/);
  return match ? match[1] : emailString;
}

/**
 * Check if email belongs to Better Systems AI domain
 */
function isDomainEmail(email: string): boolean {
  const emailAddr = extractEmailAddress(email);
  return emailAddr.toLowerCase().includes(DOMAIN_FILTER);
}

/**
 * Sync sent emails from Resend
 */
export async function syncSentEmails(limit: number = 100) {
  try {
    console.log(`[Resend Sync] Fetching up to ${limit} sent emails from Resend...`);

    const result = await resend.emails.list({ limit });

    if (!result.data) {
      console.log("[Resend Sync] No emails found");
      return { success: true, synced: 0, skipped: 0 };
    }

    let synced = 0;
    let skipped = 0;

    for (const email of result.data) {
      try {
        // Check if email is from or to Better Systems AI domain
        const fromEmail = email.from || "";
        const toEmails = Array.isArray(email.to) ? email.to : [email.to];
        const isFromDomain = isDomainEmail(fromEmail);
        const isToDomain = toEmails.some((to) => isDomainEmail(to));

        if (!isFromDomain && !isToDomain) {
          skipped++;
          continue;
        }

        // Check if email already exists
        let existing: any[] = [];
        try {
          existing = await db.select().from(emailLogs).where(eq(emailLogs.resendId, email.id)).limit(1);
        } catch (dbError) {
          console.error(`[Resend Sync] Database error checking email ${email.id}:`, dbError);
          // Continue to insert if check fails
        }

        if (existing.length > 0) {
          // Update existing record
          try {
            await db
              .update(emailLogs)
              .set({
                from: fromEmail,
                to: toEmails,
                cc: email.cc || null,
                bcc: email.bcc || null,
                replyTo: email.reply_to || null,
                subject: email.subject || "",
                status: email.last_event || "sent",
                lastEvent: email.last_event || null,
                sentAt: email.created_at ? new Date(email.created_at) : null,
                updatedAt: new Date(),
              })
              .where(eq(emailLogs.resendId, email.id));
            synced++;
          } catch (dbError) {
            console.error(`[Resend Sync] Database error updating email ${email.id}:`, dbError);
            skipped++;
          }
        } else {
          // Insert new record
          try {
            await db.insert(emailLogs).values({
              resendId: email.id,
              from: fromEmail,
              to: toEmails,
              cc: email.cc || null,
              bcc: email.bcc || null,
              replyTo: email.reply_to || null,
              subject: email.subject || "",
              status: email.last_event || "sent",
              lastEvent: email.last_event || null,
              sentAt: email.created_at ? new Date(email.created_at) : null,
              category: isFromDomain ? "outbound" : "inbound",
              syncedAt: new Date(),
            });
            synced++;
          } catch (dbError) {
            console.error(`[Resend Sync] Database error inserting email ${email.id}:`, dbError);
            skipped++;
          }
        }
      } catch (error) {
        console.error(`[Resend Sync] Error syncing email ${email.id}:`, error);
        skipped++;
      }
    }

    console.log(`[Resend Sync] Synced ${synced} emails, skipped ${skipped} emails`);
    return { success: true, synced, skipped };
  } catch (error) {
    console.error("[Resend Sync] Error fetching sent emails:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

/**
 * Sync received emails from Resend
 */
export async function syncReceivedEmails(limit: number = 100) {
  try {
    console.log(`[Resend Sync] Fetching up to ${limit} received emails from Resend...`);

    const result = await resend.emails.receiving.list({ limit });

    if (!result.data) {
      console.log("[Resend Sync] No received emails found");
      return { success: true, synced: 0, skipped: 0 };
    }

    let synced = 0;
    let skipped = 0;

    for (const email of result.data) {
      try {
        // Check if email is to Better Systems AI domain
        const toEmails = Array.isArray(email.to) ? email.to : [email.to];
        const isToDomain = toEmails.some((to) => isDomainEmail(to));

        if (!isToDomain) {
          skipped++;
          continue;
        }

        // Use message_id as unique identifier for received emails
        const messageId = email.message_id || email.id;

        // Check if email already exists
        let existing: any[] = [];
        try {
          existing = await db.select().from(emailLogs).where(eq(emailLogs.resendId, messageId)).limit(1);
        } catch (dbError) {
          console.error(`[Resend Sync] Database error checking received email ${messageId}:`, dbError);
          // Continue to insert if check fails
        }

        if (existing.length > 0) {
          // Update existing record
          try {
            await db
              .update(emailLogs)
              .set({
                from: email.from || "",
                to: toEmails,
                cc: email.cc || null,
                bcc: email.bcc || null,
                replyTo: email.reply_to || null,
                subject: email.subject || "",
                status: "received",
                lastEvent: "received",
                sentAt: email.created_at ? new Date(email.created_at) : null,
                updatedAt: new Date(),
              })
              .where(eq(emailLogs.resendId, messageId));
            synced++;
          } catch (dbError) {
            console.error(`[Resend Sync] Database error updating received email ${messageId}:`, dbError);
            skipped++;
          }
        } else {
          // Insert new record
          try {
            await db.insert(emailLogs).values({
              resendId: messageId,
              from: email.from || "",
              to: toEmails,
              cc: email.cc || null,
              bcc: email.bcc || null,
              replyTo: email.reply_to || null,
              subject: email.subject || "",
              status: "received",
              lastEvent: "received",
              category: "inbound",
              sentAt: email.created_at ? new Date(email.created_at) : null,
              syncedAt: new Date(),
            });
            synced++;
          } catch (dbError) {
            console.error(`[Resend Sync] Database error inserting received email ${messageId}:`, dbError);
            skipped++;
          }
        }
      } catch (error) {
        console.error(`[Resend Sync] Error syncing received email ${email.id}:`, error);
        skipped++;
      }
    }

    console.log(`[Resend Sync] Synced ${synced} received emails, skipped ${skipped} emails`);
    return { success: true, synced, skipped };
  } catch (error) {
    console.error("[Resend Sync] Error fetching received emails:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

/**
 * Sync all emails (both sent and received)
 */
export async function syncAllEmails(limit: number = 100) {
  const sentResult = await syncSentEmails(limit);
  const receivedResult = await syncReceivedEmails(limit);

  return {
    success: sentResult.success && receivedResult.success,
    sent: {
      synced: sentResult.synced || 0,
      skipped: sentResult.skipped || 0,
    },
    received: {
      synced: receivedResult.synced || 0,
      skipped: receivedResult.skipped || 0,
    },
    totalSynced: (sentResult.synced || 0) + (receivedResult.synced || 0),
    totalSkipped: (sentResult.skipped || 0) + (receivedResult.skipped || 0),
  };
}
