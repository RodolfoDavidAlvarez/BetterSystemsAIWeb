import { Request, Response } from "express";
import { db } from "@db/index";
import { emailLogs } from "@db/schema";
import { eq, desc, and, or, like, sql } from "drizzle-orm";
import { syncAllEmails, syncSentEmails, syncReceivedEmails } from "../services/resendSync";

/**
 * Get all email logs with pagination and filters
 */
export async function getAllEmailLogs(req: Request, res: Response) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = (page - 1) * limit;

    // Filters
    const category = req.query.category as string | undefined;
    const status = req.query.status as string | undefined;
    const search = req.query.search as string | undefined;
    const direction = req.query.direction as string | undefined; // 'inbound' or 'outbound'

    // Build where conditions
    const conditions = [];

    if (category) {
      conditions.push(eq(emailLogs.category, category));
    }

    if (status) {
      conditions.push(eq(emailLogs.status, status));
    }

    if (direction === "inbound") {
      conditions.push(eq(emailLogs.category, "inbound"));
    } else if (direction === "outbound") {
      conditions.push(eq(emailLogs.category, "outbound"));
    }

    if (search) {
      conditions.push(
        or(like(emailLogs.subject, `%${search}%`), like(emailLogs.from, `%${search}%`), sql`${emailLogs.to}::text LIKE ${`%${search}%`}`)!
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(emailLogs)
      .where(whereClause);

    const total = Number(countResult[0]?.count || 0);

    // Get emails
    const emails = await db.select().from(emailLogs).where(whereClause).orderBy(desc(emailLogs.sentAt)).limit(limit).offset(offset);

    res.json({
      success: true,
      data: emails,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching email logs:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch email logs",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

/**
 * Get email log by ID
 */
export async function getEmailLogById(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id);

    const email = await db.select().from(emailLogs).where(eq(emailLogs.id, id)).limit(1);

    if (email.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Email log not found",
      });
    }

    res.json({
      success: true,
      data: email[0],
    });
  } catch (error) {
    console.error("Error fetching email log:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch email log",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

/**
 * Get email statistics
 */
export async function getEmailStats(req: Request, res: Response) {
  try {
    // Get total counts by category
    const categoryStats = await db
      .select({
        category: emailLogs.category,
        count: sql<number>`count(*)`,
      })
      .from(emailLogs)
      .groupBy(emailLogs.category);

    // Get total counts by status
    const statusStats = await db
      .select({
        status: emailLogs.status,
        count: sql<number>`count(*)`,
      })
      .from(emailLogs)
      .groupBy(emailLogs.status);

    // Get total count
    const totalResult = await db.select({ count: sql<number>`count(*)` }).from(emailLogs);
    const total = Number(totalResult[0]?.count || 0);

    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(emailLogs)
      .where(sql`${emailLogs.sentAt} >= ${sevenDaysAgo}`);

    const recent = Number(recentResult[0]?.count || 0);

    res.json({
      success: true,
      data: {
        total,
        recent,
        byCategory: categoryStats.reduce(
          (acc, stat) => {
            acc[stat.category || "unknown"] = Number(stat.count);
            return acc;
          },
          {} as Record<string, number>
        ),
        byStatus: statusStats.reduce(
          (acc, stat) => {
            acc[stat.status || "unknown"] = Number(stat.count);
            return acc;
          },
          {} as Record<string, number>
        ),
      },
    });
  } catch (error) {
    console.error("Error fetching email stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch email statistics",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

/**
 * Sync emails from Resend
 */
export async function syncEmailsFromResend(req: Request, res: Response) {
  try {
    const type = req.query.type as string | undefined; // 'sent', 'received', or 'all'
    const limit = parseInt(req.query.limit as string) || 100;

    let result;

    if (type === "sent") {
      result = await syncSentEmails(limit);
    } else if (type === "received") {
      result = await syncReceivedEmails(limit);
    } else {
      result = await syncAllEmails(limit);
    }

    if (result.success) {
      res.json({
        success: true,
        message: "Emails synced successfully",
        data: result,
      });
    } else {
      res.status(500).json({
        success: false,
        message: "Failed to sync emails",
        error: result.error,
      });
    }
  } catch (error) {
    console.error("Error syncing emails:", error);
    res.status(500).json({
      success: false,
      message: "Failed to sync emails",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

/**
 * Handle Resend webhook events
 */
export async function handleResendWebhook(req: Request, res: Response) {
  try {
    const event = req.body;

    // Verify webhook signature if configured
    // For now, we'll trust the webhook (in production, verify signature)

    const emailId = event.data?.email_id || event.data?.id;
    if (!emailId) {
      return res.status(400).json({
        success: false,
        message: "Missing email ID in webhook payload",
      });
    }

    // Find email in database
    const existing = await db.select().from(emailLogs).where(eq(emailLogs.resendId, emailId)).limit(1);

    if (existing.length > 0) {
      // Update email status based on event type
      const eventType = event.type; // 'email.sent', 'email.delivered', 'email.bounced', etc.
      const status = eventType.replace("email.", "");

      await db
        .update(emailLogs)
        .set({
          status,
          lastEvent: eventType,
          updatedAt: new Date(),
          ...(status === "delivered" && { deliveredAt: new Date() }),
          ...(status === "bounced" && { bouncedAt: new Date() }),
        })
        .where(eq(emailLogs.resendId, emailId));

      console.log(`[Resend Webhook] Updated email ${emailId} with status ${status}`);
    } else {
      console.log(`[Resend Webhook] Email ${emailId} not found in database, skipping update`);
    }

    res.json({
      success: true,
      message: "Webhook processed",
    });
  } catch (error) {
    console.error("Error processing Resend webhook:", error);
    res.status(500).json({
      success: false,
      message: "Failed to process webhook",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
