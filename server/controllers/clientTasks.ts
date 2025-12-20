import type { Request, Response } from "express";
import { db } from "../../db/index";
import { clientTasks } from "../../db/schema";
import { eq, and, asc, desc } from "drizzle-orm";
import { AuthenticatedRequest } from "../middleware/auth";

/**
 * Get all tasks for all clients, grouped by client name
 */
export async function getAllClientTasks(req: Request, res: Response) {
  try {
    // Check if table exists by attempting to query it
    // If table doesn't exist, return empty result instead of error
    let allTasks;
    try {
      allTasks = await db.select().from(clientTasks).orderBy(asc(clientTasks.clientName), asc(clientTasks.createdAt));
    } catch (dbError: any) {
      // If table doesn't exist (relation does not exist error), return empty
      if (dbError.message?.includes('does not exist') || dbError.message?.includes('relation')) {
        console.log("Client tasks table does not exist yet, returning empty result");
        return res.json({
          success: true,
          tasksByClient: {},
          tasks: [],
        });
      }
      throw dbError; // Re-throw if it's a different error
    }

    // Group by client name
    const tasksByClient: Record<string, typeof allTasks> = {};
    for (const task of allTasks) {
      if (!tasksByClient[task.clientName]) {
        tasksByClient[task.clientName] = [];
      }
      tasksByClient[task.clientName].push(task);
    }

    res.json({
      success: true,
      tasksByClient,
      tasks: allTasks,
    });
  } catch (error: any) {
    console.error("Error fetching client tasks:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch client tasks",
      error: error.message,
    });
  }
}

/**
 * Get tasks for a specific client
 */
export async function getClientTasks(req: Request, res: Response) {
  try {
    const { clientName } = req.params;

    const tasks = await db.select().from(clientTasks).where(eq(clientTasks.clientName, clientName)).orderBy(asc(clientTasks.createdAt));

    res.json({
      success: true,
      tasks,
    });
  } catch (error: any) {
    console.error("Error fetching client tasks:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch client tasks",
      error: error.message,
    });
  }
}

/**
 * Create a new task for a client
 */
export async function createClientTask(req: AuthenticatedRequest, res: Response) {
  try {
    const { clientName, task, priority, status, clientId } = req.body;

    if (!clientName || !task || !priority) {
      return res.status(400).json({
        success: false,
        message: "clientName, task, and priority are required",
      });
    }

    try {
      const newTask = await db
        .insert(clientTasks)
        .values({
          clientName,
          task,
          priority,
          status: status || "NOT DONE",
          clientId: clientId || null,
          updatedAt: new Date(),
        })
        .returning();

      res.json({
        success: true,
        task: newTask[0],
      });
    } catch (dbError: any) {
      // If table doesn't exist, return error with helpful message
      if (dbError.message?.includes('does not exist') || dbError.message?.includes('relation')) {
        return res.status(503).json({
          success: false,
          message: "Database table not found. Please complete the database migration by running 'npm run db:push'",
          error: "Table does not exist",
        });
      }
      throw dbError;
    }
  } catch (error: any) {
    console.error("Error creating client task:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create client task",
      error: error.message,
    });
  }
}

/**
 * Update a task (especially status)
 */
export async function updateClientTask(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { task, status, priority, clientName } = req.body;

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (task !== undefined) updateData.task = task;
    if (status !== undefined) updateData.status = status;
    if (priority !== undefined) updateData.priority = priority;
    if (clientName !== undefined) updateData.clientName = clientName;

    const updated = await db.update(clientTasks).set(updateData).where(eq(clientTasks.id, parseInt(id))).returning();

    if (updated.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    res.json({
      success: true,
      task: updated[0],
    });
  } catch (error: any) {
    console.error("Error updating client task:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update client task",
      error: error.message,
    });
  }
}

/**
 * Delete a task
 */
export async function deleteClientTask(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;

    const deleted = await db.delete(clientTasks).where(eq(clientTasks.id, parseInt(id))).returning();

    if (deleted.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    res.json({
      success: true,
      message: "Task deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting client task:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete client task",
      error: error.message,
    });
  }
}

