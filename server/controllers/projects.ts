import { Request, Response } from 'express';
import { db } from '../../db/index';
import { projects, clients, projectUpdates, insertProjectSchema, activityLog } from '../../db/schema';
import { eq, desc, and, sql, count } from 'drizzle-orm';
import { AuthenticatedRequest } from '../middleware/auth';

// Get all projects with client info
export const getAllProjects = async (req: Request, res: Response) => {
  try {
    const { status, clientId, page = '1', limit = '20' } = req.query;
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

    const conditions = [];
    if (status && status !== 'all') {
      conditions.push(eq(projects.status, status as string));
    }
    if (clientId) {
      conditions.push(eq(projects.clientId, parseInt(clientId as string)));
    }

    const allProjects = await db.select({
      project: projects,
      clientName: clients.name,
      clientEmail: clients.email
    })
    .from(projects)
    .leftJoin(clients, eq(projects.clientId, clients.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(projects.createdAt))
    .limit(parseInt(limit as string))
    .offset(offset);

    // Get total count
    const totalResult = await db.select({ count: count() }).from(projects);
    const total = totalResult[0]?.count || 0;

    res.json({
      success: true,
      projects: allProjects.map(p => ({
        ...p.project,
        client: { name: p.clientName, email: p.clientEmail }
      })),
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        totalPages: Math.ceil(total / parseInt(limit as string))
      }
    });
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch projects',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get single project by ID with updates
export const getProjectById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const project = await db.select({
      project: projects,
      clientName: clients.name,
      clientEmail: clients.email,
      clientPhone: clients.phone
    })
    .from(projects)
    .leftJoin(clients, eq(projects.clientId, clients.id))
    .where(eq(projects.id, parseInt(id)))
    .limit(1);

    if (project.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Get project updates
    const updates = await db.select()
      .from(projectUpdates)
      .where(eq(projectUpdates.projectId, parseInt(id)))
      .orderBy(desc(projectUpdates.createdAt));

    res.json({
      success: true,
      project: {
        ...project[0].project,
        client: {
          name: project[0].clientName,
          email: project[0].clientEmail,
          phone: project[0].clientPhone
        }
      },
      updates
    });
  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch project',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Create new project
export const createProject = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const projectData = req.body;

    // Validate client exists
    const client = await db.select()
      .from(clients)
      .where(eq(clients.id, projectData.clientId))
      .limit(1);

    if (client.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Client not found'
      });
    }

    const parsed = insertProjectSchema.safeParse(projectData);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid project data',
        errors: parsed.error.errors
      });
    }

    const newProject = await db.insert(projects)
      .values(parsed.data)
      .returning();

    // Update client status to active if they were a lead/prospect
    if (['lead', 'prospect'].includes(client[0].status)) {
      await db.update(clients)
        .set({ status: 'active', updatedAt: new Date() })
        .where(eq(clients.id, projectData.clientId));
    }

    // Log activity
    if (req.user) {
      await db.insert(activityLog).values({
        entityType: 'project',
        entityId: newProject[0].id,
        action: 'created',
        userId: req.user.id,
        details: { name: newProject[0].name, clientId: projectData.clientId }
      });
    }

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      project: newProject[0]
    });
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create project',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Update project
export const updateProject = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const existing = await db.select()
      .from(projects)
      .where(eq(projects.id, parseInt(id)))
      .limit(1);

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    const updatedProject = await db.update(projects)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(projects.id, parseInt(id)))
      .returning();

    // Log activity
    if (req.user) {
      await db.insert(activityLog).values({
        entityType: 'project',
        entityId: parseInt(id),
        action: 'updated',
        userId: req.user.id,
        details: { changes: Object.keys(updateData) }
      });
    }

    res.json({
      success: true,
      message: 'Project updated successfully',
      project: updatedProject[0]
    });
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update project',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Delete project
export const deleteProject = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const existing = await db.select()
      .from(projects)
      .where(eq(projects.id, parseInt(id)))
      .limit(1);

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Delete associated updates first
    await db.delete(projectUpdates).where(eq(projectUpdates.projectId, parseInt(id)));

    // Delete project
    await db.delete(projects).where(eq(projects.id, parseInt(id)));

    // Log activity
    if (req.user) {
      await db.insert(activityLog).values({
        entityType: 'project',
        entityId: parseInt(id),
        action: 'deleted',
        userId: req.user.id,
        details: { name: existing[0].name }
      });
    }

    res.json({
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete project',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get project stats for dashboard
export const getProjectStats = async (req: Request, res: Response) => {
  try {
    const stats = await db.select({
      status: projects.status,
      count: count()
    })
    .from(projects)
    .groupBy(projects.status);

    const typeStats = await db.select({
      type: projects.type,
      count: count()
    })
    .from(projects)
    .groupBy(projects.type);

    const total = stats.reduce((acc, s) => acc + s.count, 0);

    res.json({
      success: true,
      stats: {
        total,
        byStatus: stats.reduce((acc, s) => {
          acc[s.status] = s.count;
          return acc;
        }, {} as Record<string, number>),
        byType: typeStats.reduce((acc, s) => {
          acc[s.type] = s.count;
          return acc;
        }, {} as Record<string, number>)
      }
    });
  } catch (error) {
    console.error('Error fetching project stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch project stats'
    });
  }
};
