import { Request, Response } from 'express';
import { db } from '../../db/index';
import { projectUpdates, projects, clients, insertProjectUpdateSchema, activityLog } from '../../db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { AuthenticatedRequest } from '../middleware/auth';
import { sendProjectUpdateEmail } from '../services/email';

// Get all updates for a project
export const getProjectUpdates = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { internal } = req.query;

    const conditions = [eq(projectUpdates.projectId, parseInt(projectId))];

    // Filter internal notes if requested
    if (internal === 'false') {
      conditions.push(eq(projectUpdates.isInternal, false));
    }

    const updates = await db.select()
      .from(projectUpdates)
      .where(and(...conditions))
      .orderBy(desc(projectUpdates.createdAt));

    res.json({
      success: true,
      updates
    });
  } catch (error) {
    console.error('Error fetching project updates:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch project updates'
    });
  }
};

// Create new project update
export const createProjectUpdate = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { projectId } = req.params;
    const updateData = { ...req.body, projectId: parseInt(projectId) };

    // Validate project exists
    const project = await db.select({
      project: projects,
      clientEmail: clients.email,
      clientName: clients.name
    })
    .from(projects)
    .leftJoin(clients, eq(projects.clientId, clients.id))
    .where(eq(projects.id, parseInt(projectId)))
    .limit(1);

    if (project.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    const parsed = insertProjectUpdateSchema.safeParse({
      ...updateData,
      createdBy: req.user?.id
    });

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid update data',
        errors: parsed.error.errors
      });
    }

    const newUpdate = await db.insert(projectUpdates)
      .values(parsed.data)
      .returning();

    // Log activity
    if (req.user) {
      await db.insert(activityLog).values({
        entityType: 'update',
        entityId: newUpdate[0].id,
        action: 'created',
        userId: req.user.id,
        details: { projectId: parseInt(projectId), title: newUpdate[0].title }
      });
    }

    res.status(201).json({
      success: true,
      message: 'Update created successfully',
      update: newUpdate[0]
    });
  } catch (error) {
    console.error('Error creating project update:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create project update',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Send update to client via email
export const sendUpdateToClient = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { updateId } = req.params;

    // Get the update with project and client info
    const update = await db.select({
      update: projectUpdates,
      projectName: projects.name,
      clientEmail: clients.email,
      clientName: clients.contactName
    })
    .from(projectUpdates)
    .leftJoin(projects, eq(projectUpdates.projectId, projects.id))
    .leftJoin(clients, eq(projects.clientId, clients.id))
    .where(eq(projectUpdates.id, parseInt(updateId)))
    .limit(1);

    if (update.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Update not found'
      });
    }

    const updateRecord = update[0];

    if (updateRecord.update.isInternal) {
      return res.status(400).json({
        success: false,
        message: 'Cannot send internal notes to clients'
      });
    }

    if (!updateRecord.clientEmail) {
      return res.status(400).json({
        success: false,
        message: 'Client email not found'
      });
    }

    // Send email
    const emailResult = await sendProjectUpdateEmail({
      to: updateRecord.clientEmail,
      clientName: updateRecord.clientName || 'Client',
      projectName: updateRecord.projectName || 'Your Project',
      updateTitle: updateRecord.update.title,
      updateContent: updateRecord.update.content,
      updateType: updateRecord.update.updateType
    });

    if (!emailResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send email',
        error: emailResult.error
      });
    }

    // Update the record to mark as sent
    await db.update(projectUpdates)
      .set({
        sentToClient: true,
        sentAt: new Date(),
        sentVia: 'email',
        updatedAt: new Date()
      })
      .where(eq(projectUpdates.id, parseInt(updateId)));

    // Log activity
    if (req.user) {
      await db.insert(activityLog).values({
        entityType: 'update',
        entityId: parseInt(updateId),
        action: 'email_sent',
        userId: req.user.id,
        details: { to: updateRecord.clientEmail }
      });
    }

    res.json({
      success: true,
      message: 'Update sent to client successfully'
    });
  } catch (error) {
    console.error('Error sending update to client:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send update to client',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Update a project update
export const updateProjectUpdate = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { updateId } = req.params;
    const updateData = req.body;

    const existing = await db.select()
      .from(projectUpdates)
      .where(eq(projectUpdates.id, parseInt(updateId)))
      .limit(1);

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Update not found'
      });
    }

    // Don't allow editing sent updates
    if (existing[0].sentToClient) {
      return res.status(400).json({
        success: false,
        message: 'Cannot edit updates that have already been sent to the client'
      });
    }

    const updated = await db.update(projectUpdates)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(projectUpdates.id, parseInt(updateId)))
      .returning();

    res.json({
      success: true,
      message: 'Update modified successfully',
      update: updated[0]
    });
  } catch (error) {
    console.error('Error updating project update:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update project update'
    });
  }
};

// Delete a project update
export const deleteProjectUpdate = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { updateId } = req.params;

    const existing = await db.select()
      .from(projectUpdates)
      .where(eq(projectUpdates.id, parseInt(updateId)))
      .limit(1);

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Update not found'
      });
    }

    // Don't allow deleting sent updates
    if (existing[0].sentToClient) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete updates that have already been sent to the client'
      });
    }

    await db.delete(projectUpdates).where(eq(projectUpdates.id, parseInt(updateId)));

    // Log activity
    if (req.user) {
      await db.insert(activityLog).values({
        entityType: 'update',
        entityId: parseInt(updateId),
        action: 'deleted',
        userId: req.user.id,
        details: { title: existing[0].title }
      });
    }

    res.json({
      success: true,
      message: 'Update deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting project update:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete project update'
    });
  }
};
