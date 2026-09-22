-- Hollywood Time - Cloudflare D1 Database Schema
CREATE TABLE IF NOT EXISTS posts (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE,
  title TEXT NOT NULL,
  subtitle TEXT,
  excerpt TEXT,
  content TEXT NOT NULL,
  category TEXT NOT NULL,
  category_label TEXT NOT NULL,
  badge TEXT,
  featured_image TEXT,
  image_caption TEXT,
  image_credit TEXT,
  author_name TEXT NOT NULL,
  author_role TEXT,
  author_slug TEXT,
  author_avatar TEXT,
  published_at TEXT NOT NULL,
  updated_at TEXT,
  reading_time_minutes INTEGER DEFAULT 4,
  source_url TEXT,
  source_name TEXT,
  indexed_in_google INTEGER DEFAULT 0,
  google_indexed_at TEXT,
  tags TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_posts_published ON posts(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_category ON posts(category, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_slug ON posts(slug);
