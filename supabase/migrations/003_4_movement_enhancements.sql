-- 4 Movement Gallery Enhancements
-- Add missing fields and functions for 4 Movement functionality

-- Add missing columns to generated_images table if they don't exist
DO $$ 
BEGIN
    -- Add aspect_ratio column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'generated_images' AND column_name = 'aspect_ratio') THEN
        ALTER TABLE generated_images ADD COLUMN aspect_ratio DECIMAL(5,3) DEFAULT 1.0;
    END IF;
    
    -- Add view_count column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'generated_images' AND column_name = 'view_count') THEN
        ALTER TABLE generated_images ADD COLUMN view_count INTEGER DEFAULT 0;
    END IF;
    
    -- Add safe_mode column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'generated_images' AND column_name = 'safe_mode') THEN
        ALTER TABLE generated_images ADD COLUMN safe_mode BOOLEAN DEFAULT true;
    END IF;
    
    -- Add optimized_url column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'generated_images' AND column_name = 'optimized_url') THEN
        ALTER TABLE generated_images ADD COLUMN optimized_url TEXT;
    END IF;
END $$;

-- Create indexes for 4 Movement performance
CREATE INDEX IF NOT EXISTS idx_generated_images_public_created_at 
ON generated_images (is_public, created_at DESC) WHERE is_public = true;

CREATE INDEX IF NOT EXISTS idx_generated_images_safe_mode 
ON generated_images (safe_mode, is_public, created_at DESC) WHERE is_public = true;

CREATE INDEX IF NOT EXISTS idx_generated_images_view_count 
ON generated_images (view_count DESC) WHERE is_public = true;

-- Function to get gallery images with pagination
CREATE OR REPLACE FUNCTION get_gallery_images(
    page_offset INTEGER DEFAULT 0,
    page_limit INTEGER DEFAULT 20,
    safe_mode_filter BOOLEAN DEFAULT true
)
RETURNS TABLE (
    id UUID,
    image_url TEXT,
    thumbnail_url TEXT,
    optimized_url TEXT,
    style VARCHAR,
    aspect_ratio DECIMAL,
    view_count INTEGER,
    likes_count INTEGER,
    shares_count INTEGER,
    created_at TIMESTAMPTZ,
    owner_pubkey VARCHAR,
    prompt TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        gi.id,
        gi.image_url,
        gi.thumbnail_url,
        gi.optimized_url,
        gi.style,
        gi.aspect_ratio,
        gi.view_count,
        gi.likes_count,
        gi.shares_count,
        gi.created_at,
        gi.owner_pubkey,
        gi.prompt
    FROM generated_images gi
    WHERE gi.is_public = true 
    AND gi.visible = true
    AND (safe_mode_filter = false OR gi.safe_mode = true)
    ORDER BY gi.created_at DESC
    LIMIT page_limit
    OFFSET page_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment view count
CREATE OR REPLACE FUNCTION increment_image_view_count(image_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE generated_images 
    SET view_count = view_count + 1,
        updated_at = NOW()
    WHERE id = image_id AND is_public = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get trending images
CREATE OR REPLACE FUNCTION get_trending_images(
    page_offset INTEGER DEFAULT 0,
    page_limit INTEGER DEFAULT 20,
    safe_mode_filter BOOLEAN DEFAULT true
)
RETURNS TABLE (
    id UUID,
    image_url TEXT,
    thumbnail_url TEXT,
    optimized_url TEXT,
    style VARCHAR,
    aspect_ratio DECIMAL,
    view_count INTEGER,
    likes_count INTEGER,
    shares_count INTEGER,
    created_at TIMESTAMPTZ,
    owner_pubkey VARCHAR,
    prompt TEXT,
    trending_score DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        gi.id,
        gi.image_url,
        gi.thumbnail_url,
        gi.optimized_url,
        gi.style,
        gi.aspect_ratio,
        gi.view_count,
        gi.likes_count,
        gi.shares_count,
        gi.created_at,
        gi.owner_pubkey,
        gi.prompt,
        -- Calculate trending score based on engagement and recency
        (gi.likes_count * 2 + gi.view_count * 0.1 + gi.shares_count * 5) * 
        EXP(-EXTRACT(EPOCH FROM (NOW() - gi.created_at)) / 86400.0) AS trending_score
    FROM generated_images gi
    WHERE gi.is_public = true 
    AND gi.visible = true
    AND (safe_mode_filter = false OR gi.safe_mode = true)
    ORDER BY trending_score DESC, gi.created_at DESC
    LIMIT page_limit
    OFFSET page_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions for the functions
GRANT EXECUTE ON FUNCTION get_gallery_images TO anon, authenticated;
GRANT EXECUTE ON FUNCTION increment_image_view_count TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_trending_images TO anon, authenticated;

-- Update RLS policies to ensure proper access
DROP POLICY IF EXISTS "Public images are viewable by everyone" ON generated_images;
CREATE POLICY "Public images are viewable by everyone" ON generated_images
    FOR SELECT USING (is_public = true AND visible = true);

-- Allow anonymous users to increment view counts
DROP POLICY IF EXISTS "Allow view count updates" ON generated_images;
CREATE POLICY "Allow view count updates" ON generated_images
    FOR UPDATE USING (is_public = true)
    WITH CHECK (is_public = true);