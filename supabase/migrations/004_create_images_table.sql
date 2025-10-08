-- Create images table for the Editor functionality
-- This table is required by the backend API for image upload functionality

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Images table for storing image records (required by Editor.tsx)
CREATE TABLE IF NOT EXISTS public.images (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID,
  original_url TEXT NOT NULL,
  processed_url TEXT,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  width INTEGER,
  height INTEGER,
  status TEXT DEFAULT 'uploaded' CHECK (status IN ('uploaded', 'processing', 'completed', 'failed')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Processing jobs table for tracking AI processing
CREATE TABLE IF NOT EXISTS public.processing_jobs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  image_id UUID REFERENCES public.images(id) ON DELETE CASCADE NOT NULL,
  prompt_used TEXT,
  style_applied TEXT DEFAULT 'natural',
  gemini_response JSONB,
  processing_time_ms INTEGER,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable Row Level Security
ALTER TABLE public.images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processing_jobs ENABLE ROW LEVEL SECURITY;

-- Create policies for images table
CREATE POLICY "Users can view their own images" ON public.images
  FOR SELECT USING (true); -- Allow all users to view for now

CREATE POLICY "Users can insert their own images" ON public.images
  FOR INSERT WITH CHECK (true); -- Allow all users to insert for now

CREATE POLICY "Users can update their own images" ON public.images
  FOR UPDATE USING (true); -- Allow all users to update for now

-- Create policies for processing_jobs table
CREATE POLICY "Users can view processing jobs" ON public.processing_jobs
  FOR SELECT USING (true); -- Allow all users to view for now

CREATE POLICY "Users can insert processing jobs" ON public.processing_jobs
  FOR INSERT WITH CHECK (true); -- Allow all users to insert for now

CREATE POLICY "Users can update processing jobs" ON public.processing_jobs
  FOR UPDATE USING (true); -- Allow all users to update for now

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_images_user_id ON public.images(user_id);
CREATE INDEX IF NOT EXISTS idx_images_status ON public.images(status);
CREATE INDEX IF NOT EXISTS idx_images_created_at ON public.images(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_processing_jobs_image_id ON public.processing_jobs(image_id);
CREATE INDEX IF NOT EXISTS idx_processing_jobs_status ON public.processing_jobs(status);