import { Request, Response } from "express";
import { db } from "../../db/index";
import { sql } from "drizzle-orm";

// Pipeline stages for cold outreach
export const PIPELINE_STAGES = {
  cold: { label: "Cold Lead", color: "slate" },
  verified: { label: "Verified", color: "blue" },
  contacted: { label: "Contacted", color: "violet" },
  warm: { label: "Warm Lead", color: "amber" },
  interested: { label: "Interested", color: "emerald" },
  booked: { label: "Booked Call", color: "green" },
  converted: { label: "Converted", color: "teal" },
  not_interested: { label: "Not Interested", color: "rose" },
  bounced: { label: "Bounced", color: "red" },
};

// Get all cold outreach leads with metrics
export async function getColdOutreachLeads(req: Request, res: Response) {
  try {
    const result = await db.execute(sql`
      SELECT
        id,
        name,
        first_name,
        last_name,
        email,
        phone,
        industry,
        company_size,
        status,
        source,
        notes,
        email_verified,
        email_verification_result,
        email_sequence_step,
        last_email_sent,
        next_followup_date,
        ai_handling,
        last_reply_at,
        created_at,
        updated_at
      FROM clients
      WHERE source = 'cold_outreach'
      ORDER BY
        CASE
          WHEN last_reply_at IS NOT NULL THEN 1
          WHEN email_verified = true AND email_sequence_step = 0 THEN 2
          WHEN email_verified = true THEN 3
          ELSE 4
        END,
        created_at DESC
    `);

    res.json({ success: true, leads: result.rows });
  } catch (error: any) {
    console.error("[Cold Outreach] Error fetching leads:", error);
    res.status(500).json({ success: false, message: error.message });
  }
}

// Cost rates (estimated)
const COSTS = {
  zerobounce_per_verification: 0.008, // $0.008 per verification (after free tier)
  zerobounce_free_monthly: 100, // 100 free credits per month
  claude_haiku_per_1k_tokens: 0.00025, // Haiku input tokens
  claude_sonnet_per_1k_tokens: 0.003, // Sonnet input tokens
  avg_tokens_per_classification: 500, // Estimated tokens per classification
  avg_tokens_per_response: 1500, // Estimated tokens per AI response
};

// Get cold outreach health metrics
export async function getColdOutreachMetrics(req: Request, res: Response) {
  try {
    const metricsResult = await db.execute(sql`
      SELECT
        COUNT(*) as total_leads,
        COUNT(*) FILTER (WHERE email_verified = true) as verified,
        COUNT(*) FILTER (WHERE email_verified = false OR email_verified IS NULL) as unverified,
        COUNT(*) FILTER (WHERE email_verification_result = 'ok') as valid_emails,
        COUNT(*) FILTER (WHERE email_verification_result = 'catch_all') as catch_all,
        COUNT(*) FILTER (WHERE email_verification_result = 'invalid') as invalid_emails,
        COUNT(*) FILTER (WHERE email_verification_result = 'do_not_mail') as do_not_mail,
        COUNT(*) FILTER (WHERE email_sequence_step > 0) as emails_sent_count,
        COUNT(*) FILTER (WHERE email_sequence_step = 1) as at_step_1,
        COUNT(*) FILTER (WHERE email_sequence_step = 2) as at_step_2,
        COUNT(*) FILTER (WHERE email_sequence_step >= 3) as at_step_3,
        COUNT(*) FILTER (WHERE last_reply_at IS NOT NULL) as responded,
        COUNT(*) FILTER (WHERE status = 'booked') as booked_calls,
        COUNT(*) FILTER (WHERE status = 'converted') as converted
      FROM clients
      WHERE source = 'cold_outreach'
    `);

    const metrics = metricsResult.rows[0] as any;

    // Calculate bounce rate
    const totalSent = Number(metrics.emails_sent_count) || 0;
    const bounced = Number(metrics.invalid_emails) || 0;
    const bounceRate = totalSent > 0 ? (bounced / totalSent * 100).toFixed(1) : "0.0";

    // Calculate response rate
    const responded = Number(metrics.responded) || 0;
    const responseRate = totalSent > 0 ? (responded / totalSent * 100).toFixed(1) : "0.0";

    // Health status
    let healthStatus = "healthy";
    let healthMessage = "All systems operational";

    if (parseFloat(bounceRate) > 5) {
      healthStatus = "critical";
      healthMessage = "Bounce rate critical - pause sends immediately";
    } else if (parseFloat(bounceRate) > 2) {
      healthStatus = "warning";
      healthMessage = "Bounce rate elevated - consider pausing sends";
    }

    // Cost estimation
    const totalVerified = Number(metrics.verified) || 0;
    const paidVerifications = Math.max(0, totalVerified - COSTS.zerobounce_free_monthly);
    const verificationCost = paidVerifications * COSTS.zerobounce_per_verification;

    // Estimate AI costs (classification for each response + AI reply generation)
    const aiClassifications = responded;
    const aiResponses = Math.floor(responded * 0.3); // Assume 30% need AI follow-up
    const classificationCost = (aiClassifications * COSTS.avg_tokens_per_classification / 1000) * COSTS.claude_haiku_per_1k_tokens;
    const responseCost = (aiResponses * COSTS.avg_tokens_per_response / 1000) * COSTS.claude_sonnet_per_1k_tokens;

    const totalCost = verificationCost + classificationCost + responseCost;

    res.json({
      success: true,
      metrics: {
        ...metrics,
        bounce_rate: bounceRate,
        response_rate: responseRate,
        health_status: healthStatus,
        health_message: healthMessage,
        costs: {
          zerobounce: {
            verifications_used: totalVerified,
            free_remaining: Math.max(0, COSTS.zerobounce_free_monthly - totalVerified),
            paid_verifications: paidVerifications,
            cost: verificationCost.toFixed(2),
          },
          claude_ai: {
            classifications: aiClassifications,
            responses_generated: aiResponses,
            cost: (classificationCost + responseCost).toFixed(2),
          },
          total_cost: totalCost.toFixed(2),
          currency: "USD",
        },
      },
    });
  } catch (error: any) {
    console.error("[Cold Outreach] Error fetching metrics:", error);
    res.status(500).json({ success: false, message: error.message });
  }
}

// Update lead pipeline status
export async function updateLeadStatus(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { status, notes, ai_handling } = req.body;

    const updates: string[] = [];
    if (status) updates.push(`status = '${status}'`);
    if (notes !== undefined) updates.push(`notes = '${notes.replace(/'/g, "''")}'`);
    if (ai_handling !== undefined) updates.push(`ai_handling = ${ai_handling}`);
    updates.push(`updated_at = NOW()`);

    await db.execute(sql.raw(`
      UPDATE clients
      SET ${updates.join(', ')}
      WHERE id = ${parseInt(id)}
    `));

    res.json({ success: true, message: "Lead updated" });
  } catch (error: any) {
    console.error("[Cold Outreach] Error updating lead:", error);
    res.status(500).json({ success: false, message: error.message });
  }
}

// Pause/resume automation for a lead
export async function toggleAutomation(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { pause } = req.body;

    await db.execute(sql`
      UPDATE clients
      SET ai_handling = ${!pause},
          updated_at = NOW()
      WHERE id = ${parseInt(id)}
    `);

    res.json({
      success: true,
      message: pause ? "Automation paused" : "Automation resumed"
    });
  } catch (error: any) {
    console.error("[Cold Outreach] Error toggling automation:", error);
    res.status(500).json({ success: false, message: error.message });
  }
}

// Bulk update leads
export async function bulkUpdateLeads(req: Request, res: Response) {
  try {
    const { leadIds, status, ai_handling } = req.body;

    if (!leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
      return res.status(400).json({ success: false, message: "leadIds array required" });
    }

    const updates: string[] = [];
    if (status) updates.push(`status = '${status}'`);
    if (ai_handling !== undefined) updates.push(`ai_handling = ${ai_handling}`);
    updates.push(`updated_at = NOW()`);

    await db.execute(sql.raw(`
      UPDATE clients
      SET ${updates.join(', ')}
      WHERE id IN (${leadIds.join(',')})
    `));

    res.json({
      success: true,
      message: `Updated ${leadIds.length} leads`
    });
  } catch (error: any) {
    console.error("[Cold Outreach] Error bulk updating leads:", error);
    res.status(500).json({ success: false, message: error.message });
  }
}

// Get daily report data (last 7 days activity)
export async function getDailyReport(req: Request, res: Response) {
  try {
    // Get emails sent in last 7 days
    const activityResult = await db.execute(sql`
      SELECT
        DATE(last_email_sent) as date,
        COUNT(*) as emails_sent
      FROM clients
      WHERE source = 'cold_outreach'
        AND last_email_sent IS NOT NULL
        AND last_email_sent >= NOW() - INTERVAL '7 days'
      GROUP BY DATE(last_email_sent)
      ORDER BY date DESC
    `);

    // Get current queue status
    const queueResult = await db.execute(sql`
      SELECT
        COUNT(*) FILTER (WHERE email_verified = true AND email_sequence_step = 0) as ready_to_send,
        COUNT(*) FILTER (WHERE email_verified IS NULL OR email_verified = false) as pending_verification,
        COUNT(*) FILTER (WHERE next_followup_date <= CURRENT_DATE AND email_sequence_step > 0 AND email_sequence_step < 3) as followups_due
      FROM clients
      WHERE source = 'cold_outreach'
    `);

    res.json({
      success: true,
      report: {
        daily_activity: activityResult.rows,
        queue: queueResult.rows[0],
        generated_at: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error("[Cold Outreach] Error generating report:", error);
    res.status(500).json({ success: false, message: error.message });
  }
}
