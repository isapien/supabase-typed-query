-- Integration Test Schema for supabase-typed-query
-- This schema defines test tables for validating the library against a real database

-- Drop existing test tables if they exist (for clean setup)
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS posts CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Users table: Main entity for testing user-related queries
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  age INTEGER,
  active BOOLEAN DEFAULT true,
  role TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  deleted TIMESTAMPTZ  -- Soft delete column (NULL = not deleted, timestamp = deleted)
);

-- Posts table: Related entity for testing joins and complex queries
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT,
  author_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status TEXT,  -- e.g., 'draft', 'published', 'archived'
  view_count INTEGER DEFAULT 0,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  deleted TIMESTAMPTZ  -- Soft delete column
);

-- Comments table: Child entity for testing nested relationships
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  deleted TIMESTAMPTZ  -- Soft delete column
);

-- Create indexes for better query performance during tests
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(active) WHERE deleted IS NULL;
CREATE INDEX IF NOT EXISTS idx_posts_author ON posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status) WHERE deleted IS NULL;
CREATE INDEX IF NOT EXISTS idx_comments_post ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_user ON comments(user_id);

-- Insert some seed data for basic connectivity tests
INSERT INTO users (name, email, age, active, role) VALUES
  ('Alice Admin', 'alice@example.com', 30, true, 'admin'),
  ('Bob User', 'bob@example.com', 25, true, 'user'),
  ('Charlie Moderator', 'charlie@example.com', 35, true, 'moderator');

-- Note: Test-specific data (with test_ prefix) will be created and cleaned up by test code
