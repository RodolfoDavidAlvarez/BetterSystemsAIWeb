-- Create users table
CREATE TABLE IF NOT EXISTS "users" (
  "id" SERIAL PRIMARY KEY,
  "username" TEXT NOT NULL UNIQUE,
  "password" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL UNIQUE,
  "role" TEXT NOT NULL DEFAULT 'user',
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create blog posts table
CREATE TABLE IF NOT EXISTS "blog_posts" (
  "id" SERIAL PRIMARY KEY,
  "title" TEXT NOT NULL,
  "slug" TEXT NOT NULL UNIQUE,
  "content" TEXT NOT NULL,
  "excerpt" TEXT NOT NULL,
  "coverImage" TEXT,
  "published" BOOLEAN NOT NULL DEFAULT false,
  "authorId" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "tags" TEXT[] DEFAULT '{}',
  "category" TEXT NOT NULL
);

-- Create index on blog post slug for faster lookups
CREATE INDEX IF NOT EXISTS "blog_posts_slug_idx" ON "blog_posts"("slug");

-- Create index on blog post author
CREATE INDEX IF NOT EXISTS "blog_posts_author_idx" ON "blog_posts"("authorId");

-- Create index on blog post published status
CREATE INDEX IF NOT EXISTS "blog_posts_published_idx" ON "blog_posts"("published");