import { Request, Response } from "express";
import { and, count, desc, eq, gte, lte, sql } from "drizzle-orm";
import { db } from "../../db/index";
import { clients, projects, reviews } from "../../db/schema";
import { AuthenticatedRequest } from "../middleware/auth";
import { z } from "zod";

const publicReviewSchema = z.object({
  clientId: z.coerce.number().int().positive().optional(),
  projectId: z.coerce.number().int().positive().optional(),
  phase: z.string().trim().max(120).optional(),
  reviewerName: z.string().trim().min(2).max(120),
  reviewerEmail: z.string().trim().email(),
  companyName: z.string().trim().max(160).optional(),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().min(10).max(5000),
});

const adminReviewUpdateSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5).optional(),
  comment: z.string().trim().min(1).max(5000).optional(),
  phase: z.string().trim().max(120).nullable().optional(),
  reviewerName: z.string().trim().min(2).max(120).optional(),
  reviewerEmail: z.string().trim().email().optional(),
  companyName: z.string().trim().max(160).nullable().optional(),
  status: z.enum(["new", "approved", "hidden"]).optional(),
  isPublic: z.boolean().optional(),
});

export const submitReview = async (req: Request, res: Response) => {
  try {
    const parsed = publicReviewSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid review data",
        errors: parsed.error.errors,
      });
    }

    const data = parsed.data;

    const created = await db
      .insert(reviews)
      .values({
        clientId: data.clientId,
        projectId: data.projectId,
        phase: data.phase,
        reviewerName: data.reviewerName,
        reviewerEmail: data.reviewerEmail.toLowerCase(),
        companyName: data.companyName,
        rating: data.rating,
        comment: data.comment,
        status: "new",
        isPublic: false,
        source: "phase-survey",
        submittedAt: new Date(),
      })
      .returning({ id: reviews.id, submittedAt: reviews.submittedAt });

    return res.status(201).json({
      success: true,
      message: "Review submitted successfully",
      review: created[0],
    });
  } catch (error) {
    console.error("Error submitting review:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to submit review",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const getAllReviews = async (req: Request, res: Response) => {
  try {
    const { status, isPublic, minRating, maxRating } = req.query;
    const conditions = [];

    if (status && status !== "all") {
      conditions.push(eq(reviews.status, String(status)));
    }
    if (typeof isPublic === "string" && isPublic !== "all") {
      conditions.push(eq(reviews.isPublic, isPublic === "true"));
    }
    if (minRating) {
      conditions.push(gte(reviews.rating, Number(minRating)));
    }
    if (maxRating) {
      conditions.push(lte(reviews.rating, Number(maxRating)));
    }

    const results = await db
      .select({
        review: reviews,
        clientName: clients.name,
        projectName: projects.name,
      })
      .from(reviews)
      .leftJoin(clients, eq(reviews.clientId, clients.id))
      .leftJoin(projects, eq(reviews.projectId, projects.id))
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(reviews.submittedAt));

    return res.json({
      success: true,
      reviews: results.map((row: { review: typeof reviews.$inferSelect; clientName: string | null; projectName: string | null }) => ({
        ...row.review,
        clientName: row.clientName,
        projectName: row.projectName,
      })),
    });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch reviews",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const getReviewStats = async (_req: Request, res: Response) => {
  try {
    const totalResult = await db.select({ count: count() }).from(reviews);
    const avgResult = await db
      .select({
        avgRating: sql<number>`COALESCE(ROUND(AVG(${reviews.rating})::numeric, 2), 0)`,
      })
      .from(reviews);
    const approvedResult = await db
      .select({ count: count() })
      .from(reviews)
      .where(eq(reviews.status, "approved"));
    const newResult = await db
      .select({ count: count() })
      .from(reviews)
      .where(eq(reviews.status, "new"));

    return res.json({
      success: true,
      stats: {
        total: Number(totalResult[0]?.count || 0),
        averageRating: Number(avgResult[0]?.avgRating || 0),
        approved: Number(approvedResult[0]?.count || 0),
        new: Number(newResult[0]?.count || 0),
      },
    });
  } catch (error) {
    console.error("Error fetching review stats:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch review stats",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const updateReview = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ success: false, message: "Invalid review ID" });
    }

    const parsed = adminReviewUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid review update data",
        errors: parsed.error.errors,
      });
    }

    const existing = await db.select().from(reviews).where(eq(reviews.id, id)).limit(1);
    if (!existing.length) {
      return res.status(404).json({ success: false, message: "Review not found" });
    }

    const updated = await db
      .update(reviews)
      .set({
        ...parsed.data,
        updatedAt: new Date(),
      })
      .where(eq(reviews.id, id))
      .returning();

    return res.json({
      success: true,
      message: "Review updated successfully",
      review: updated[0],
    });
  } catch (error) {
    console.error("Error updating review:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update review",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const deleteReview = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ success: false, message: "Invalid review ID" });
    }

    const existing = await db.select().from(reviews).where(eq(reviews.id, id)).limit(1);
    if (!existing.length) {
      return res.status(404).json({ success: false, message: "Review not found" });
    }

    await db.delete(reviews).where(eq(reviews.id, id));
    return res.json({
      success: true,
      message: "Review deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting review:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete review",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
