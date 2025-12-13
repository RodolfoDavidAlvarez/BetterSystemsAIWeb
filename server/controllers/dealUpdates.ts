import { Request, Response } from 'express';
import { db } from '../../db/index';
import { deals, dealInteractions, documents, clients } from '../../db/schema';
import { eq, and } from 'drizzle-orm';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// Send email update to client with attachments
export async function sendDealUpdate(req: Request, res: Response) {
  try {
    const dealId = parseInt(req.params.id);
    const { subject, content, includeDocuments, documentIds } = req.body;

    // Get deal and client information
    const [deal] = await db
      .select({
        deal: deals,
        client: clients,
      })
      .from(deals)
      .leftJoin(clients, eq(deals.clientId, clients.id))
      .where(eq(deals.id, dealId));

    if (!deal || !deal.client) {
      return res.status(404).json({ success: false, message: 'Deal or client not found' });
    }

    // Get documents if requested
    let attachments: any[] = [];
    if (includeDocuments && documentIds && documentIds.length > 0) {
      const dealDocuments = await db
        .select()
        .from(documents)
        .where(
          and(
            eq(documents.entityType, 'deal'),
            eq(documents.entityId, dealId),
            eq(documents.status, 'active')
          )
        );

      // Filter by requested document IDs
      const selectedDocs = dealDocuments.filter((doc) =>
        documentIds.includes(doc.id)
      );

      // Note: In production, you'd need to convert file paths to actual file content
      // For now, we'll just include the URLs
      attachments = selectedDocs.map((doc) => ({
        filename: doc.fileName,
        path: doc.fileUrl, // In production, convert this to actual file content
      }));
    }

    // Send email using Resend
    const emailData = {
      from: 'Better Systems AI <noreply@bettersystems.ai>',
      to: [deal.client.email],
      subject: subject || `Update on ${deal.deal.name}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">${subject || 'Project Update'}</h1>
          <div style="margin: 20px 0;">
            ${content}
          </div>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;" />
          <p style="color: #666; font-size: 14px;">
            This is an automated update regarding your project: <strong>${deal.deal.name}</strong>
          </p>
          <p style="color: #666; font-size: 14px;">
            If you have any questions, please don't hesitate to reach out.
          </p>
        </div>
      `,
      // attachments, // Uncomment when file handling is implemented
    };

    const emailResult = await resend.emails.send(emailData);

    if (!emailResult.data) {
      throw new Error('Failed to send email');
    }

    // Log the interaction
    const [interaction] = await db
      .insert(dealInteractions)
      .values({
        dealId,
        type: 'email',
        subject: subject || `Update on ${deal.deal.name}`,
        content,
        contactPerson: deal.client.contactName || deal.client.name,
        ownerId: req.user?.id,
        status: 'completed',
        emailSent: true,
        completedAt: new Date(),
      })
      .returning();

    res.json({
      success: true,
      message: 'Email sent successfully',
      data: {
        interaction,
        emailId: emailResult.data.id,
      },
    });
  } catch (error: any) {
    console.error('Error sending deal update:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}

// Get email templates
export async function getEmailTemplates(req: Request, res: Response) {
  try {
    // For now, return some default templates
    // In production, fetch from emailTemplates table
    const templates = [
      {
        id: 1,
        name: 'Project Progress Update',
        subject: 'Progress Update on {{deal_name}}',
        body: `
          <p>Hi {{client_name}},</p>
          <p>I wanted to share an update on {{deal_name}}:</p>
          <p>{{update_content}}</p>
          <p>Next steps: {{next_steps}}</p>
          <p>Best regards,<br>Better Systems AI Team</p>
        `,
        category: 'update',
      },
      {
        id: 2,
        name: 'Invoice Ready',
        subject: 'Invoice Ready for {{deal_name}}',
        body: `
          <p>Hi {{client_name}},</p>
          <p>Your invoice for {{deal_name}} is ready.</p>
          <p>Amount due: {{amount}}</p>
          <p>Please find the invoice attached.</p>
          <p>Best regards,<br>Better Systems AI Team</p>
        `,
        category: 'invoice',
      },
      {
        id: 3,
        name: 'Milestone Completed',
        subject: 'Milestone Completed: {{milestone_name}}',
        body: `
          <p>Hi {{client_name}},</p>
          <p>Great news! We've completed the milestone: {{milestone_name}}</p>
          <p>{{milestone_description}}</p>
          <p>Attached are the deliverables and documentation.</p>
          <p>Best regards,<br>Better Systems AI Team</p>
        `,
        category: 'update',
      },
    ];

    res.json({ success: true, data: templates });
  } catch (error: any) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}

// Preview email before sending
export async function previewEmail(req: Request, res: Response) {
  try {
    const { dealId, templateId, customContent } = req.body;

    // Get deal and client information
    const [deal] = await db
      .select({
        deal: deals,
        client: clients,
      })
      .from(deals)
      .leftJoin(clients, eq(deals.clientId, clients.id))
      .where(eq(deals.id, parseInt(dealId)));

    if (!deal || !deal.client) {
      return res.status(404).json({ success: false, message: 'Deal or client not found' });
    }

    // Replace template variables
    let previewContent = customContent || '';
    previewContent = previewContent.replace(/{{deal_name}}/g, deal.deal.name);
    previewContent = previewContent.replace(/{{client_name}}/g, deal.client.name);

    res.json({
      success: true,
      data: {
        to: deal.client.email,
        clientName: deal.client.name,
        dealName: deal.deal.name,
        preview: previewContent,
      },
    });
  } catch (error: any) {
    console.error('Error previewing email:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}
