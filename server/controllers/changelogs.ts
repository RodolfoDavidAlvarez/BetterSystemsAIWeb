import { Response } from "express";
import { db } from "../../db/index";
import { changelogs, projects } from "../../db/schema";
import { eq, desc, and, or, like, sql } from "drizzle-orm";
import { AuthenticatedRequest } from "../middleware/auth";
import { fetchGitHubCommits, getRepositoryInfo, ParsedCommit } from "../services/github";

/**
 * Get all changelogs
 */
export const getAllChangelogs = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status, category, isPublic, search, projectId, limit = "50", offset = "0" } = req.query;

    const conditions = [];

    if (status) {
      conditions.push(eq(changelogs.status, status as string));
    }

    if (category) {
      conditions.push(eq(changelogs.category, category as string));
    }

    if (isPublic !== undefined) {
      conditions.push(eq(changelogs.isPublic, isPublic === "true"));
    }

    if (projectId) {
      conditions.push(eq(changelogs.relatedProjectId, parseInt(projectId as string)));
    }

    if (search) {
      conditions.push(or(like(changelogs.title, `%${search}%`), like(changelogs.description, `%${search}%`))!);
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const results = await db
      .select()
      .from(changelogs)
      .where(whereClause)
      .orderBy(desc(changelogs.createdAt))
      .limit(parseInt(limit as string))
      .offset(parseInt(offset as string));

    const total = await db
      .select({ count: sql<number>`count(*)` })
      .from(changelogs)
      .where(whereClause);

    res.json({
      success: true,
      data: results,
      pagination: {
        total: Number(total[0]?.count || 0),
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      },
    });
  } catch (error) {
    console.error("Error fetching changelogs:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch changelogs",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Get changelog by ID
 */
export const getChangelogById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const [changelog] = await db
      .select()
      .from(changelogs)
      .where(eq(changelogs.id, parseInt(id)))
      .limit(1);

    if (!changelog) {
      return res.status(404).json({
        success: false,
        message: "Changelog not found",
      });
    }

    res.json({
      success: true,
      data: changelog,
    });
  } catch (error) {
    console.error("Error fetching changelog:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch changelog",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Create a new changelog
 */
export const createChangelog = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, description, category, priority, status, isPublic, relatedProjectId, tags, notes } = req.body;

    if (!title || !description || !category) {
      return res.status(400).json({
        success: false,
        message: "Title, description, and category are required",
      });
    }

    const [newChangelog] = await db
      .insert(changelogs)
      .values({
        title,
        description,
        category,
        priority: priority || "medium",
        status: status || "draft",
        isPublic: isPublic !== undefined ? isPublic : true,
        relatedProjectId: relatedProjectId ? parseInt(relatedProjectId) : null,
        tags: tags || [],
        notes: notes || null,
        createdBy: req.user?.id || null,
        isFromGitHub: false,
      })
      .returning();

    res.status(201).json({
      success: true,
      message: "Changelog created successfully",
      data: newChangelog,
    });
  } catch (error) {
    console.error("Error creating changelog:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create changelog",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Update a changelog
 */
export const updateChangelog = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, category, priority, status, isPublic, relatedProjectId, tags, notes } = req.body;

    const [existing] = await db
      .select()
      .from(changelogs)
      .where(eq(changelogs.id, parseInt(id)))
      .limit(1);

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Changelog not found",
      });
    }

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (category !== undefined) updateData.category = category;
    if (priority !== undefined) updateData.priority = priority;
    if (status !== undefined) updateData.status = status;
    if (isPublic !== undefined) updateData.isPublic = isPublic;
    if (relatedProjectId !== undefined) updateData.relatedProjectId = relatedProjectId ? parseInt(relatedProjectId) : null;
    if (tags !== undefined) updateData.tags = tags;
    if (notes !== undefined) updateData.notes = notes;

    const [updated] = await db
      .update(changelogs)
      .set(updateData)
      .where(eq(changelogs.id, parseInt(id)))
      .returning();

    res.json({
      success: true,
      message: "Changelog updated successfully",
      data: updated,
    });
  } catch (error) {
    console.error("Error updating changelog:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update changelog",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Delete a changelog
 */
export const deleteChangelog = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const [existing] = await db
      .select()
      .from(changelogs)
      .where(eq(changelogs.id, parseInt(id)))
      .limit(1);

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Changelog not found",
      });
    }

    await db.delete(changelogs).where(eq(changelogs.id, parseInt(id)));

    res.json({
      success: true,
      message: "Changelog deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting changelog:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete changelog",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Sync changelogs from GitHub
 */
export const syncFromGitHub = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { owner, repo, branch, since, token } = req.body;

    if (!owner || !repo) {
      return res.status(400).json({
        success: false,
        message: "Owner and repo are required",
      });
    }

    // Fetch commits from GitHub
    const commits = await fetchGitHubCommits(owner, repo, branch || "main", since ? new Date(since) : undefined, token || process.env.GITHUB_TOKEN);

    // Get existing commit SHAs to avoid duplicates
    const existingCommits = await db.select({ sha: changelogs.githubCommitSha }).from(changelogs).where(eq(changelogs.isFromGitHub, true));

    const existingShas = new Set(existingCommits.map((c) => c.sha));

    // Filter out commits we already have
    const newCommits = commits.filter((c) => !existingShas.has(c.sha));

    // Insert new changelogs
    const inserted = [];
    for (const commit of newCommits) {
      const [changelog] = await db
        .insert(changelogs)
        .values({
          title: commit.title,
          description: commit.description,
          category: commit.category,
          priority: commit.priority,
          status: "draft",
          isPublic: true,
          isFromGitHub: true,
          githubCommitSha: commit.sha,
          githubCommitUrl: commit.url,
          githubAuthor: commit.author,
          githubDate: commit.date,
          syncedAt: new Date(),
          createdBy: req.user?.id || null,
        })
        .returning();

      inserted.push(changelog);
    }

    res.json({
      success: true,
      message: `Synced ${inserted.length} new changelogs from GitHub`,
      data: {
        total: commits.length,
        new: inserted.length,
        skipped: commits.length - inserted.length,
        changelogs: inserted,
      },
    });
  } catch (error) {
    console.error("Error syncing from GitHub:", error);
    res.status(500).json({
      success: false,
      message: "Failed to sync from GitHub",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Get GitHub repository info
 */
export const getGitHubRepoInfo = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { owner, repo, token } = req.query;

    if (!owner || !repo) {
      return res.status(400).json({
        success: false,
        message: "Owner and repo are required",
      });
    }

    const info = await getRepositoryInfo(owner as string, repo as string, (token as string) || process.env.GITHUB_TOKEN);

    res.json({
      success: true,
      data: info,
    });
  } catch (error) {
    console.error("Error fetching GitHub repo info:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch repository info",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Get public changelogs (for client-facing updates)
 */
export const getPublicChangelogs = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { projectId, limit = "20" } = req.query;

    const conditions = [eq(changelogs.isPublic, true), eq(changelogs.status, "published")];

    if (projectId) {
      conditions.push(eq(changelogs.relatedProjectId, parseInt(projectId as string)));
    }

    const results = await db
      .select()
      .from(changelogs)
      .where(and(...conditions))
      .orderBy(desc(changelogs.createdAt))
      .limit(parseInt(limit as string));

    res.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error("Error fetching public changelogs:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch public changelogs",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};












