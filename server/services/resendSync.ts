import "dotenv/config";
import { Resend } from "resend";
import { db } from "@db/index";
import { emailLogs } from "@db/schema";
import { eq } from "drizzle-orm";

type Direction = "inbound" | "outbound";

type ResendListEmail = {
  id: string;
  from?: string;
  to?: string | string[];
  cc?: string[] | null;
  bcc?: string[] | null;
  reply_to?: string[] | null;
  subject?: string | null;
  html?: string | null;
  text?: string | null;
  last_event?: string | null;
  created_at?: string | null;
  direction?: Direction | string | null;
  tags?: unknown;
};

const RESEND_API_URL = "https://api.resend.com/emails";
const INTERNAL_DOMAINS = ["@bettersystems.ai", "@soilseedandwater.com"];

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

const normalizeRecipients = (value?: string | string[] | null): string[] => {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  return [value].filter(Boolean);
};

const parseDate = (value?: string | null): Date | null => {
  if (!value) return null;
  const date = new Date(value);
  return isNaN(date.getTime()) ? null : date;
};

const sanitizeTags = (tags: unknown): string[] | null => {
  if (!tags) return null;
  if (Array.isArray(tags)) {
    const parsed = tags
      .map((tag) => {
        if (typeof tag === "string") return tag;
        if (tag && typeof tag === "object") {
          // Resend Tag type can include name/key/value; store the name/key if present
          const maybeKey = (tag as Record<string, unknown>).key;
          const maybeName = (tag as Record<string, unknown>).name;
          if (typeof maybeName === "string") return maybeName;
          if (typeof maybeKey === "string") return maybeKey;
        }
        return null;
      })
      .filter(Boolean) as string[];

    return parsed.length ? parsed : null;
  }

  return null;
};

const deriveDirection = (email: ResendListEmail, recipients: string[]): Direction => {
  if (email.direction === "inbound" || email.direction === "outbound") {
    return email.direction;
  }

  const lowerRecipients = recipients.map((addr) => addr.toLowerCase());
  const isInbound = lowerRecipients.some((addr) => INTERNAL_DOMAINS.some((domain) => addr.includes(domain)));

  return isInbound ? "inbound" : "outbound";
};

async function fetchEmailList(limit: number, direction?: Direction) {
  const url = new URL(RESEND_API_URL);
  if (limit) url.searchParams.set("limit", limit.toString());
  if (direction) url.searchParams.set("direction", direction);

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Resend list failed (${response.status}): ${message}`);
  }

  const result = (await response.json()) as { data?: ResendListEmail[] };
  return result.data || [];
}

async function fetchEmailDetails(id: string) {
  if (!resend) return null;
  try {
    const result = await resend.emails.get(id);
    return result.data;
  } catch (error) {
    console.error(`[Resend Sync] Failed to fetch email details for ${id}:`, error);
    return null;
  }
}

async function upsertEmail(listEmail: ResendListEmail, detail: Awaited<ReturnType<typeof fetchEmailDetails>>, directionHint?: Direction) {
  const to = normalizeRecipients(detail?.to ?? listEmail.to);
  const cc = normalizeRecipients(detail?.cc ?? listEmail.cc ?? null);
  const bcc = normalizeRecipients(detail?.bcc ?? listEmail.bcc ?? null);
  const replyToList = normalizeRecipients(detail?.reply_to ?? listEmail.reply_to ?? null);

  const direction = deriveDirection({ ...listEmail, direction: directionHint ?? listEmail.direction }, to);
  const status = (detail?.last_event ?? listEmail.last_event ?? detail?.status ?? "sent") as string;
  const sentAt = parseDate(detail?.created_at ?? listEmail.created_at);

  const insertData = {
    resendId: listEmail.id,
    from: (detail?.from ?? listEmail.from ?? "Unknown sender").toString(),
    to: to.length ? to : ["unknown"],
    cc: cc.length ? cc : null,
    bcc: bcc.length ? bcc : null,
    replyTo: replyToList.length ? replyToList[0] : null,
    subject: detail?.subject ?? listEmail.subject ?? "(no subject)",
    htmlBody: detail?.html ?? listEmail.html ?? null,
    textBody: detail?.text ?? listEmail.text ?? null,
    status,
    lastEvent: detail?.last_event ?? listEmail.last_event ?? null,
    category: direction,
    tags: sanitizeTags(detail?.tags ?? listEmail.tags),
    sentAt,
    syncedAt: new Date(),
    updatedAt: new Date(),
  };

  // Track whether this is a create vs update for reporting
  const existing = await db.select({ id: emailLogs.id }).from(emailLogs).where(eq(emailLogs.resendId, listEmail.id)).limit(1);

  const updateData: any = {
    ...insertData,
  };

  // Only overwrite content fields when we actually received them from Resend
  if (!insertData.htmlBody) {
    delete updateData.htmlBody;
  }

  if (!insertData.textBody) {
    delete updateData.textBody;
  }

  await db
    .insert(emailLogs)
    .values(insertData)
    .onConflictDoUpdate({
      target: emailLogs.resendId,
      set: updateData,
    });

  return existing.length ? "updated" : "created";
}

async function syncEmails(type: "all" | "sent" | "received", limit: number) {
  if (!resendApiKey) {
    return {
      success: false,
      unsupported: false,
      error: "RESEND_API_KEY is not configured",
      totalSynced: 0,
      created: 0,
      updated: 0,
      fetched: 0,
      limit,
    };
  }

  try {
    // Fetch list from Resend (API returns newest first)
    const directionFilter: Direction | undefined = type === "sent" ? "outbound" : type === "received" ? "inbound" : undefined;
    let emails = await fetchEmailList(limit, directionFilter);

    // Apply local filter for inbound/outbound if API didn't filter
    if (type === "sent") {
      emails = emails.filter((email) => deriveDirection(email, normalizeRecipients(email.to)) === "outbound");
    } else if (type === "received") {
      emails = emails.filter((email) => deriveDirection(email, normalizeRecipients(email.to)) === "inbound");
    }

    let created = 0;
    let updated = 0;
    let failed = 0;

    // Fetch details in small batches to reduce rate-limit risk
    const BATCH_SIZE = 5;
    for (let i = 0; i < emails.length; i += BATCH_SIZE) {
      const batch = emails.slice(i, i + BATCH_SIZE);
      const results = await Promise.all(
        batch.map(async (email) => {
          try {
            const detail = await fetchEmailDetails(email.id);
            const outcome = await upsertEmail(email, detail, directionFilter);
            return outcome;
          } catch (error) {
            console.error(`[Resend Sync] Failed to save email ${email.id}:`, error);
            return "failed";
          }
        })
      );

      results.forEach((result) => {
        if (result === "created") created += 1;
        else if (result === "updated") updated += 1;
        else failed += 1;
      });
    }

    return {
      success: true,
      unsupported: false,
      totalSynced: created + updated,
      created,
      updated,
      failed,
      fetched: emails.length,
      limit,
    };
  } catch (error) {
    console.error("[Resend Sync] Error syncing emails:", error);
    return {
      success: false,
      unsupported: false,
      error: error instanceof Error ? error.message : "Unknown error",
      totalSynced: 0,
      created: 0,
      updated: 0,
      fetched: 0,
      limit,
    };
  }
}

export async function syncAllEmails(limit: number = 100) {
  return syncEmails("all", limit);
}

export async function syncSentEmails(limit: number = 100) {
  return syncEmails("sent", limit);
}

export async function syncReceivedEmails(limit: number = 100) {
  return syncEmails("received", limit);
}
