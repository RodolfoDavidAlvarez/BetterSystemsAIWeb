import { Request, Response } from 'express';
import { db } from '../../db/index';
import { activityLog, users, clients, projects, insertActivityLogSchema } from '../../db/schema';
import { eq, desc, and, inArray, sql } from 'drizzle-orm';
import { AuthenticatedRequest } from '../middleware/auth';

/**
 * Get recent activity log with optional filters
 * Query params:
 *  - limit: number of activities to return (default: 20)
 *  - entityType: filter by entity type (client, project, update, onboarding)
 *  - entityId: filter by specific entity ID
 *  - userId: filter by user who performed the action
 */
export const getActivityLog = async (req: Request, res: Response) => {
  try {
    const {
      limit = '20',
      entityType,
      entityId,
      userId
    } = req.query;

    // Build WHERE conditions
    const conditions = [];
    if (entityType) {
      conditions.push(eq(activityLog.entityType, entityType as string));
    }
    if (entityId) {
      conditions.push(eq(activityLog.entityId, parseInt(entityId as string)));
    }
    if (userId) {
      conditions.push(eq(activityLog.userId, parseInt(userId as string)));
    }

    // Fetch activities with user data
    const activities = await db
      .select({
        id: activityLog.id,
        entityType: activityLog.entityType,
        entityId: activityLog.entityId,
        action: activityLog.action,
        details: activityLog.details,
        userId: activityLog.userId,
        createdAt: activityLog.createdAt,
        userName: users.name,
        userEmail: users.email,
      })
      .from(activityLog)
      .leftJoin(users, eq(activityLog.userId, users.id))
      .where(
        conditions.length > 0
          ? sql`${conditions.reduce((acc: any, cond: any) => (acc ? sql`${acc} AND ${cond}` : cond), null)}`
          : undefined
      )
      .orderBy(desc(activityLog.createdAt))
      .limit(parseInt(limit as string));

    // Fetch entity names for context
    const enrichedActivities = await Promise.all(
      activities.map(async (activity) => {
        let entityName = null;

        if (activity.entityType === 'client') {
          const client = await db
            .select({ name: clients.name })
            .from(clients)
            .where(eq(clients.id, activity.entityId))
            .limit(1);
          entityName = client[0]?.name || null;
        } else if (activity.entityType === 'project') {
          const project = await db
            .select({ name: projects.name })
            .from(projects)
            .where(eq(projects.id, activity.entityId))
            .limit(1);
          entityName = project[0]?.name || null;
        }

        return {
          ...activity,
          entityName,
        };
      })
    );

    res.json({
      success: true,
      activities: enrichedActivities,
      count: enrichedActivities.length,
    });
  } catch (error) {
    console.error('Error fetching activity log:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch activity log',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Log a new activity
 * Body params:
 *  - entityType: string (client, project, update, onboarding)
 *  - entityId: number
 *  - action: string (created, updated, deleted, status_changed, email_sent, etc.)
 *  - details: object (optional additional context)
 *  - userId: number (optional, from authenticated request)
 */
export const logActivity = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const activityData = req.body;

    // Add userId from authenticated request if not provided
    if (!activityData.userId && req.user) {
      activityData.userId = req.user.id;
    }

    // Validate input
    const parsed = insertActivityLogSchema.safeParse(activityData);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid activity data',
        errors: parsed.error.errors,
      });
    }

    const newActivity = await db
      .insert(activityLog)
      .values(parsed.data)
      .returning();

    res.status(201).json({
      success: true,
      message: 'Activity logged successfully',
      activity: newActivity[0],
    });
  } catch (error) {
    console.error('Error logging activity:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to log activity',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Get activity statistics for dashboard
 * Returns counts by entity type and action for the last 30 days
 */
export const getActivityStats = async (_req: Request, res: Response) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const stats = await db
      .select({
        entityType: activityLog.entityType,
        action: activityLog.action,
        count: sql<number>`count(*)::int`,
      })
      .from(activityLog)
      .where(sql`${activityLog.createdAt} >= ${thirtyDaysAgo}`)
      .groupBy(activityLog.entityType, activityLog.action);

    res.json({
      success: true,
      stats,
      period: '30 days',
    });
  } catch (error) {
    console.error('Error fetching activity stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch activity stats',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
