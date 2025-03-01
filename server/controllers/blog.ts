import { Request, Response } from 'express';
import { db } from '../../db/index';
import { blogPosts, insertBlogPostSchema, users } from '../../db/schema';
import { eq, desc, sql, and, ilike } from 'drizzle-orm';

// Create a blog post
export const createBlogPost = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { title, content, excerpt, coverImage, tags, category, published, slug } = req.body;
    
    // Validate post data
    const parsedInput = insertBlogPostSchema.parse({
      title,
      content,
      excerpt,
      coverImage,
      authorId: user.id,
      published: published || false,
      tags: tags || [],
      category,
      slug: slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    });
    
    // Check if slug already exists
    const existingPost = await db.select()
      .from(blogPosts)
      .where(eq(blogPosts.slug, parsedInput.slug))
      .limit(1);
    
    if (existingPost.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'A blog post with this slug already exists'
      });
    }
    
    // Insert blog post
    const newPost = await db.insert(blogPosts).values([parsedInput]).returning();
    
    res.status(201).json({
      success: true,
      message: 'Blog post created successfully',
      post: newPost[0]
    });
  } catch (error) {
    console.error('Create blog post error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create blog post',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get all blog posts (public)
export const getAllBlogPosts = async (req: Request, res: Response) => {
  try {
    const { page = '1', limit = '10', category, tag, search } = req.query;
    const pageNumber = parseInt(page as string, 10);
    const limitNumber = parseInt(limit as string, 10);
    const offset = (pageNumber - 1) * limitNumber;
    
    let query = db.select({
      post: blogPosts,
      authorName: users.name
    })
      .from(blogPosts)
      .innerJoin(users, eq(blogPosts.authorId, users.id))
      .where(eq(blogPosts.published, true))
      .orderBy(desc(blogPosts.createdAt));
    
    // Apply filters if provided
    if (category) {
      query = query.where(eq(blogPosts.category, category as string));
    }
    
    if (tag) {
      query = query.where(sql`${blogPosts.tags} @> ARRAY[${tag as string}]::text[]`);
    }
    
    if (search) {
      const searchTerm = `%${search as string}%`;
      query = query.where(
        or(
          ilike(blogPosts.title, searchTerm),
          ilike(blogPosts.content, searchTerm),
          ilike(blogPosts.excerpt, searchTerm)
        )
      );
    }
    
    // Get total count for pagination
    const countResult = await db.select({ count: sql<number>`count(*)` })
      .from(blogPosts)
      .where(eq(blogPosts.published, true));
    const totalPosts = countResult[0].count;
    
    // Get paginated results
    const results = await query.limit(limitNumber).offset(offset);
    
    // Format response
    const formattedPosts = results.map(({ post, authorName }) => ({
      ...post,
      authorName
    }));
    
    res.json({
      success: true,
      posts: formattedPosts,
      pagination: {
        total: totalPosts,
        page: pageNumber,
        limit: limitNumber,
        pages: Math.ceil(totalPosts / limitNumber)
      }
    });
  } catch (error) {
    console.error('Get all blog posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch blog posts',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get all blog posts (admin)
export const getAllBlogPostsAdmin = async (req: Request, res: Response) => {
  try {
    const { page = '1', limit = '10', published } = req.query;
    const pageNumber = parseInt(page as string, 10);
    const limitNumber = parseInt(limit as string, 10);
    const offset = (pageNumber - 1) * limitNumber;
    
    let query = db.select({
      post: blogPosts,
      authorName: users.name
    })
      .from(blogPosts)
      .innerJoin(users, eq(blogPosts.authorId, users.id))
      .orderBy(desc(blogPosts.createdAt));
    
    // Filter by published status if provided
    if (published !== undefined) {
      const isPublished = published === 'true';
      query = query.where(eq(blogPosts.published, isPublished));
    }
    
    // Get total count for pagination
    const countResult = await db.select({ count: sql<number>`count(*)` })
      .from(blogPosts);
    const totalPosts = countResult[0].count;
    
    // Get paginated results
    const results = await query.limit(limitNumber).offset(offset);
    
    // Format response
    const formattedPosts = results.map(({ post, authorName }) => ({
      ...post,
      authorName
    }));
    
    res.json({
      success: true,
      posts: formattedPosts,
      pagination: {
        total: totalPosts,
        page: pageNumber,
        limit: limitNumber,
        pages: Math.ceil(totalPosts / limitNumber)
      }
    });
  } catch (error) {
    console.error('Get all blog posts admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch blog posts',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get blog post by slug (public)
export const getBlogPostBySlug = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    
    const results = await db.select({
      post: blogPosts,
      authorName: users.name
    })
      .from(blogPosts)
      .innerJoin(users, eq(blogPosts.authorId, users.id))
      .where(and(
        eq(blogPosts.slug, slug),
        eq(blogPosts.published, true)
      ))
      .limit(1);
    
    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Blog post not found'
      });
    }
    
    const { post, authorName } = results[0];
    
    res.json({
      success: true,
      post: {
        ...post,
        authorName
      }
    });
  } catch (error) {
    console.error('Get blog post by slug error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch blog post',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get blog post by ID (admin)
export const getBlogPostById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const results = await db.select({
      post: blogPosts,
      authorName: users.name
    })
      .from(blogPosts)
      .innerJoin(users, eq(blogPosts.authorId, users.id))
      .where(eq(blogPosts.id, parseInt(id, 10)))
      .limit(1);
    
    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Blog post not found'
      });
    }
    
    const { post, authorName } = results[0];
    
    res.json({
      success: true,
      post: {
        ...post,
        authorName
      }
    });
  } catch (error) {
    console.error('Get blog post by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch blog post',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Update blog post
export const updateBlogPost = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      title,
      content,
      excerpt,
      coverImage,
      published,
      tags,
      category,
      slug
    } = req.body;
    
    // Check if blog post exists
    const existingPost = await db.select()
      .from(blogPosts)
      .where(eq(blogPosts.id, parseInt(id, 10)))
      .limit(1);
    
    if (existingPost.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Blog post not found'
      });
    }
    
    // Check if the new slug already exists for a different post
    if (slug && slug !== existingPost[0].slug) {
      const existingSlug = await db.select()
        .from(blogPosts)
        .where(and(
          eq(blogPosts.slug, slug),
          sql`${blogPosts.id} != ${parseInt(id, 10)}`
        ))
        .limit(1);
      
      if (existingSlug.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'A blog post with this slug already exists'
        });
      }
    }
    
    // Update blog post
    const updatedFields: Record<string, any> = {};
    
    if (title !== undefined) updatedFields.title = title;
    if (content !== undefined) updatedFields.content = content;
    if (excerpt !== undefined) updatedFields.excerpt = excerpt;
    if (coverImage !== undefined) updatedFields.coverImage = coverImage;
    if (published !== undefined) updatedFields.published = published;
    if (tags !== undefined) updatedFields.tags = tags;
    if (category !== undefined) updatedFields.category = category;
    if (slug !== undefined) updatedFields.slug = slug;
    
    // Always update the updatedAt timestamp
    updatedFields.updatedAt = new Date();
    
    const updatedPost = await db.update(blogPosts)
      .set(updatedFields)
      .where(eq(blogPosts.id, parseInt(id, 10)))
      .returning();
    
    res.json({
      success: true,
      message: 'Blog post updated successfully',
      post: updatedPost[0]
    });
  } catch (error) {
    console.error('Update blog post error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update blog post',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Delete blog post
export const deleteBlogPost = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Check if blog post exists
    const existingPost = await db.select()
      .from(blogPosts)
      .where(eq(blogPosts.id, parseInt(id, 10)))
      .limit(1);
    
    if (existingPost.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Blog post not found'
      });
    }
    
    // Delete blog post
    await db.delete(blogPosts)
      .where(eq(blogPosts.id, parseInt(id, 10)));
    
    res.json({
      success: true,
      message: 'Blog post deleted successfully'
    });
  } catch (error) {
    console.error('Delete blog post error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete blog post',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Import missing or function
function or(...conditions: any[]) {
  return sql`(${sql.join(conditions, sql` OR `)})`;
}