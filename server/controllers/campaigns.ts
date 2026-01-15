import { Request, Response } from "express";
import { db } from "../../db/index";
import { sql } from "drizzle-orm";

// Get all email sequences/campaigns
export async function getAllCampaigns(req: Request, res: Response) {
  try {
    const result = await db.execute(sql`
      SELECT
        es.*,
        c.name as client_name,
        c.email as client_email,
        c.first_name,
        c.industry
      FROM email_sequences es
      JOIN clients c ON es.client_id = c.id
      ORDER BY
        CASE es.status
          WHEN 'active' THEN 1
          WHEN 'responded' THEN 2
          WHEN 'completed' THEN 3
          WHEN 'unactivated' THEN 4
        END,
        es.next_email_due_at ASC
    `);

    res.json({ success: true, campaigns: result.rows });
  } catch (error: any) {
    console.error("[Campaigns] Error fetching campaigns:", error);
    res.status(500).json({ success: false, message: error.message });
  }
}

// Get campaign stats
export async function getCampaignStats(req: Request, res: Response) {
  try {
    const statsResult = await db.execute(sql`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'active') as active,
        COUNT(*) FILTER (WHERE status = 'responded') as responded,
        COUNT(*) FILTER (WHERE status = 'completed') as completed,
        COUNT(*) FILTER (WHERE status = 'unactivated') as unactivated,
        COUNT(*) FILTER (WHERE current_step = 1) as at_step_1,
        COUNT(*) FILTER (WHERE current_step = 2) as at_step_2,
        COUNT(*) FILTER (WHERE current_step = 3) as at_step_3
      FROM email_sequences
    `);

    const stats = statsResult.rows[0] || {
      total: 0,
      active: 0,
      responded: 0,
      completed: 0,
      unactivated: 0,
      at_step_1: 0,
      at_step_2: 0,
      at_step_3: 0,
    };

    res.json({ success: true, stats });
  } catch (error: any) {
    console.error("[Campaigns] Error fetching stats:", error);
    res.status(500).json({ success: false, message: error.message });
  }
}

// Get a single campaign by ID
export async function getCampaignById(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const result = await db.execute(sql`
      SELECT
        es.*,
        c.name as client_name,
        c.email as client_email,
        c.first_name,
        c.industry,
        c.notes as client_notes
      FROM email_sequences es
      JOIN clients c ON es.client_id = c.id
      WHERE es.id = ${parseInt(id)}
    `);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Campaign not found" });
    }

    // Get email logs for this client
    const emailsResult = await db.execute(sql`
      SELECT * FROM email_logs
      WHERE related_client_id = ${(result.rows[0] as any).client_id}
        AND category = 'cold_outreach'
      ORDER BY sent_at DESC
    `);

    res.json({
      success: true,
      campaign: result.rows[0],
      emails: emailsResult.rows,
    });
  } catch (error: any) {
    console.error("[Campaigns] Error fetching campaign:", error);
    res.status(500).json({ success: false, message: error.message });
  }
}

// Add a client to a campaign (create new sequence)
export async function addClientToCampaign(req: Request, res: Response) {
  try {
    const { clientId, campaignName, productFocus, daysBetwenEmails } = req.body;

    if (!clientId) {
      return res.status(400).json({ success: false, message: "clientId is required" });
    }

    // Check if client exists
    const clientResult = await db.execute(sql`
      SELECT id, name, email FROM clients WHERE id = ${clientId}
    `);

    if (clientResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Client not found" });
    }

    // Check if already in a campaign
    const existingResult = await db.execute(sql`
      SELECT id FROM email_sequences
      WHERE client_id = ${clientId}
        AND campaign_name = ${campaignName || 'default'}
        AND status = 'active'
    `);

    if (existingResult.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Client is already in an active campaign with this name",
      });
    }

    // Create the sequence
    const result = await db.execute(sql`
      INSERT INTO email_sequences (
        client_id,
        campaign_name,
        product_focus,
        days_between_emails,
        next_email_due_at
      ) VALUES (
        ${clientId},
        ${campaignName || 'default'},
        ${productFocus || null},
        ${daysBetwenEmails || 1},
        NOW()
      )
      RETURNING *
    `);

    // Update client status to prospect
    await db.execute(sql`
      UPDATE clients
      SET status = 'prospect',
          source = COALESCE(source, 'cold_outreach'),
          notes = COALESCE(notes, '') || ${` | Added to campaign: ${new Date().toISOString().split('T')[0]}`}
      WHERE id = ${clientId}
    `);

    res.json({
      success: true,
      sequence: result.rows[0],
      message: `${(clientResult.rows[0] as any).name} added to campaign`,
    });
  } catch (error: any) {
    console.error("[Campaigns] Error adding client to campaign:", error);
    res.status(500).json({ success: false, message: error.message });
  }
}

// Update campaign status
export async function updateCampaign(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { status, current_step } = req.body;

    const updates: string[] = [];
    if (status) updates.push(`status = '${status}'`);
    if (current_step !== undefined) updates.push(`current_step = ${current_step}`);
    updates.push(`updated_at = NOW()`);

    await db.execute(sql.raw(`
      UPDATE email_sequences
      SET ${updates.join(', ')}
      WHERE id = ${parseInt(id)}
    `));

    res.json({ success: true, message: "Campaign updated" });
  } catch (error: any) {
    console.error("[Campaigns] Error updating campaign:", error);
    res.status(500).json({ success: false, message: error.message });
  }
}

// Remove client from campaign (delete sequence)
export async function removeCampaign(req: Request, res: Response) {
  try {
    const { id } = req.params;

    await db.execute(sql`
      DELETE FROM email_sequences WHERE id = ${parseInt(id)}
    `);

    res.json({ success: true, message: "Campaign removed" });
  } catch (error: any) {
    console.error("[Campaigns] Error removing campaign:", error);
    res.status(500).json({ success: false, message: error.message });
  }
}

// Bulk add clients to campaign
export async function bulkAddToCampaign(req: Request, res: Response) {
  try {
    const { clientIds, campaignName, productFocus, daysBetwenEmails } = req.body;

    if (!clientIds || !Array.isArray(clientIds) || clientIds.length === 0) {
      return res.status(400).json({ success: false, message: "clientIds array is required" });
    }

    let added = 0;
    let skipped = 0;

    for (const clientId of clientIds) {
      // Check if already in campaign
      const existingResult = await db.execute(sql`
        SELECT id FROM email_sequences
        WHERE client_id = ${clientId}
          AND campaign_name = ${campaignName || 'default'}
          AND status = 'active'
      `);

      if (existingResult.rows.length > 0) {
        skipped++;
        continue;
      }

      // Create sequence
      await db.execute(sql`
        INSERT INTO email_sequences (
          client_id,
          campaign_name,
          product_focus,
          days_between_emails,
          next_email_due_at
        ) VALUES (
          ${clientId},
          ${campaignName || 'default'},
          ${productFocus || null},
          ${daysBetwenEmails || 1},
          NOW()
        )
      `);

      // Update client
      await db.execute(sql`
        UPDATE clients
        SET status = 'prospect',
            source = COALESCE(source, 'cold_outreach')
        WHERE id = ${clientId}
      `);

      added++;
    }

    res.json({
      success: true,
      added,
      skipped,
      message: `Added ${added} clients to campaign (${skipped} already enrolled)`,
    });
  } catch (error: any) {
    console.error("[Campaigns] Error bulk adding to campaign:", error);
    res.status(500).json({ success: false, message: error.message });
  }
}
