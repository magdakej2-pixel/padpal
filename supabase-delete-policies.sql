-- ============================================
-- PadPal — Create missing tables + Delete Policies
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Create profiles table (if not exists)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  name TEXT DEFAULT '',
  age INTEGER,
  bio TEXT DEFAULT '',
  location TEXT DEFAULT '',
  postcode TEXT DEFAULT '',
  occupation TEXT DEFAULT '',
  budget_min INTEGER DEFAULT 500,
  budget_max INTEGER DEFAULT 1200,
  looking_for TEXT DEFAULT 'both',
  is_student BOOLEAN DEFAULT FALSE,
  photos TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Profiles RLS policies
DROP POLICY IF EXISTS "Anyone can view profiles" ON profiles;
CREATE POLICY "Anyone can view profiles" ON profiles
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can create own profile" ON profiles;
CREATE POLICY "Users can create own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own profile" ON profiles;
CREATE POLICY "Users can delete own profile" ON profiles
  FOR DELETE USING (auth.uid() = user_id);

-- Index
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);

-- 2. Create quiz_answers table (if not exists)
CREATE TABLE IF NOT EXISTS quiz_answers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  sleep_schedule TEXT,
  cleanliness TEXT,
  noise_level TEXT,
  guests TEXT,
  smoking TEXT,
  pets TEXT,
  budget_range TEXT,
  hobbies TEXT[] DEFAULT '{}',
  is_student BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE quiz_answers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view quiz_answers" ON quiz_answers;
CREATE POLICY "Authenticated users can view quiz_answers" ON quiz_answers
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can create own quiz_answers" ON quiz_answers;
CREATE POLICY "Users can create own quiz_answers" ON quiz_answers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own quiz_answers" ON quiz_answers;
CREATE POLICY "Users can update own quiz_answers" ON quiz_answers
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own quiz_answers" ON quiz_answers;
CREATE POLICY "Users can delete own quiz_answers" ON quiz_answers
  FOR DELETE USING (auth.uid() = user_id);

-- 3. Delete policies for other tables

-- Listings
DROP POLICY IF EXISTS "Users can delete own listings" ON listings;
CREATE POLICY "Users can delete own listings" ON listings
  FOR DELETE USING (auth.uid() = user_id);

-- Interactions
DROP POLICY IF EXISTS "Users can delete own interactions" ON interactions;
CREATE POLICY "Users can delete own interactions" ON interactions
  FOR DELETE USING (auth.uid() = user_id OR auth.uid() = target_id);

-- Conversations
DROP POLICY IF EXISTS "Users can delete own conversations" ON conversations;
CREATE POLICY "Users can delete own conversations" ON conversations
  FOR DELETE USING (auth.uid() IN (user1_id, user2_id));

-- Messages
DROP POLICY IF EXISTS "Users can delete own messages" ON messages;
CREATE POLICY "Users can delete own messages" ON messages
  FOR DELETE USING (auth.uid() = sender_id);
