-- Token-Gated AI Image Generation Schema
-- Create generations table for token-gated AI image generation

-- Create generations table
CREATE TABLE IF NOT EXISTS public.generations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_address TEXT NOT NULL,
    original_image_path TEXT NOT NULL,
    generated_image_path TEXT NOT NULL,
    prompt TEXT NOT NULL DEFAULT 'AI-enhanced image generation',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_generations_wallet_address ON public.generations(wallet_address);
CREATE INDEX IF NOT EXISTS idx_generations_created_at ON public.generations(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.generations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view generations" ON public.generations;
DROP POLICY IF EXISTS "Only verified token holders can insert" ON public.generations;

-- RLS Policies
CREATE POLICY "Anyone can view generations" ON public.generations
    FOR SELECT USING (true);

CREATE POLICY "Only verified token holders can insert" ON public.generations
    FOR INSERT WITH CHECK (true); -- Verification handled in Edge Function

-- Create Supabase Storage bucket for generated photos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('generated_photos', 'generated_photos', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing storage policies if they exist
DROP POLICY IF EXISTS "Anyone can view generated photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload to generated photos" ON storage.objects;

-- Storage policies
CREATE POLICY "Anyone can view generated photos" ON storage.objects
    FOR SELECT USING (bucket_id = 'generated_photos');

CREATE POLICY "Authenticated users can upload to generated photos" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'generated_photos');

-- Grant permissions to anon and authenticated roles
GRANT SELECT ON public.generations TO anon;
GRANT ALL PRIVILEGES ON public.generations TO authenticated;

-- Insert sample data for testing
INSERT INTO public.generations (wallet_address, original_image_path, generated_image_path, prompt) VALUES
('7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU', 'original/sample1.jpg', 'generated/sample1-enhanced.jpg', 'AI-enhanced landscape image'),
('9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM', 'original/sample2.jpg', 'generated/sample2-enhanced.jpg', 'AI-enhanced portrait image'),
('4vJ9JU1bJJE96FWSJKvHsmmFADCg4gpZQff4P3bkLKi', 'original/sample3.jpg', 'generated/sample3-enhanced.jpg', 'AI-enhanced abstract art')
ON CONFLICT (id) DO NOTHING;