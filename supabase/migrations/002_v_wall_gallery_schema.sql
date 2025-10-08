-- V Wall Gallery Enhancement Migration
-- This migration enhances the existing schema for V Wall gallery functionality

-- Add new columns to images table for V Wall features
ALTER TABLE public.images 
ADD COLUMN IF NOT EXISTS thumbnail_url TEXT,
ADD COLUMN IF NOT EXISTS optimized_url TEXT,
ADD COLUMN IF NOT EXISTS aspect_ratio DECIMAL(10,8) GENERATED ALWAYS AS (CAST(width AS DECIMAL) / CAST(height AS DECIMAL)) STORED,
ADD COLUMN IF NOT EXISTS safe_mode BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;

-- Create image metadata table for detailed information
CREATE TABLE IF NOT EXISTS public.image_metadata (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    image_id UUID REFERENCES public.images(id) ON DELETE CASCADE,
    file_size INTEGER,
    format VARCHAR(10),
    color_palette JSONB,
    exif_data JSONB,
    processing_metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create moderation logs for tracking content management
CREATE TABLE IF NOT EXISTS public.moderation_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    image_id UUID REFERENCES public.images(id) ON DELETE CASCADE,
    moderator_id UUID REFERENCES auth.users(id),
    action VARCHAR(50) NOT NULL,
    reason TEXT,
    previous_state JSONB,
    new_state JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for optimal V Wall performance
CREATE INDEX IF NOT EXISTS idx_images_public_created_at ON public.images(is_public, created_at DESC) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_images_safe_mode ON public.images(safe_mode, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_images_aspect_ratio ON public.images(aspect_ratio);
CREATE INDEX IF NOT EXISTS idx_image_metadata_image_id ON public.image_metadata(image_id);
CREATE INDEX IF NOT EXISTS idx_moderation_logs_image_id ON public.moderation_logs(image_id);

-- Enable RLS on new tables
ALTER TABLE public.image_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderation_logs ENABLE ROW LEVEL SECURITY;

-- Public read access for V Wall gallery
CREATE POLICY "Public images are viewable by everyone" ON public.images
    FOR SELECT USING (is_public = true);

-- Authenticated users can view metadata
CREATE POLICY "Authenticated users can view image metadata" ON public.image_metadata
    FOR SELECT TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.images 
            WHERE images.id = image_metadata.image_id 
            AND images.is_public = true
        )
    );

-- Anonymous users can view metadata for public images
CREATE POLICY "Anonymous users can view public image metadata" ON public.image_metadata
    FOR SELECT TO anon USING (
        EXISTS (
            SELECT 1 FROM public.images 
            WHERE images.id = image_metadata.image_id 
            AND images.is_public = true
        )
    );

-- Only moderators can view moderation logs
CREATE POLICY "Moderators can view moderation logs" ON public.moderation_logs
    FOR SELECT TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.subscription_tier = 'enterprise' -- Using enterprise as moderator role
        )
    );

-- Function to get gallery images with pagination
CREATE OR REPLACE FUNCTION public.get_gallery_images(
    page_limit INTEGER DEFAULT 50,
    page_offset INTEGER DEFAULT 0,
    safe_mode_filter BOOLEAN DEFAULT true,
    cursor_id UUID DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    original_url TEXT,
    thumbnail_url TEXT,
    optimized_url TEXT,
    processed_url TEXT,
    width INTEGER,
    height INTEGER,
    aspect_ratio DECIMAL,
    safe_mode BOOLEAN,
    view_count INTEGER,
    created_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        i.id,
        i.original_url,
        i.thumbnail_url,
        i.optimized_url,
        i.processed_url,
        i.width,
        i.height,
        i.aspect_ratio,
        i.safe_mode,
        i.view_count,
        i.created_at,
        i.metadata
    FROM public.images i
    WHERE 
        i.is_public = true 
        AND i.status = 'completed'
        AND (NOT safe_mode_filter OR i.safe_mode = true)
        AND (cursor_id IS NULL OR i.created_at < (SELECT created_at FROM public.images WHERE id = cursor_id))
    ORDER BY i.created_at DESC
    LIMIT page_limit
    OFFSET page_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment view count
CREATE OR REPLACE FUNCTION public.increment_image_view_count(image_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.images 
    SET view_count = view_count + 1 
    WHERE id = image_id AND is_public = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update image moderation status
CREATE OR REPLACE FUNCTION public.update_image_moderation(
    image_id UUID,
    new_safe_mode BOOLEAN,
    moderator_id UUID,
    reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    old_safe_mode BOOLEAN;
    is_moderator BOOLEAN;
BEGIN
    -- Check if user is moderator
    SELECT EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = moderator_id 
        AND subscription_tier = 'enterprise'
    ) INTO is_moderator;
    
    IF NOT is_moderator THEN
        RETURN FALSE;
    END IF;
    
    -- Get current safe_mode status
    SELECT safe_mode INTO old_safe_mode 
    FROM public.images 
    WHERE id = image_id;
    
    -- Update image
    UPDATE public.images 
    SET safe_mode = new_safe_mode 
    WHERE id = image_id;
    
    -- Log moderation action
    INSERT INTO public.moderation_logs (
        image_id, 
        moderator_id, 
        action, 
        reason,
        previous_state,
        new_state
    ) VALUES (
        image_id,
        moderator_id,
        'safe_mode_update',
        reason,
        json_build_object('safe_mode', old_safe_mode),
        json_build_object('safe_mode', new_safe_mode)
    );
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions to anon and authenticated roles
GRANT SELECT ON public.images TO anon;
GRANT SELECT ON public.image_metadata TO anon;
GRANT EXECUTE ON FUNCTION public.get_gallery_images TO anon;
GRANT EXECUTE ON FUNCTION public.increment_image_view_count TO anon;

GRANT ALL PRIVILEGES ON public.images TO authenticated;
GRANT ALL PRIVILEGES ON public.image_metadata TO authenticated;
GRANT ALL PRIVILEGES ON public.moderation_logs TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_gallery_images TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_image_view_count TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_image_moderation TO authenticated;

-- Insert sample data for testing V Wall
INSERT INTO public.images (
    user_id, 
    original_url, 
    thumbnail_url, 
    optimized_url,
    processed_url,
    file_name,
    file_size,
    mime_type,
    width, 
    height, 
    safe_mode, 
    is_public,
    status,
    metadata
) VALUES 
    (
        (SELECT id FROM auth.users LIMIT 1),
        'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=person%20making%20peace%20sign%20portrait&image_size=portrait_4_3',
        'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=person%20making%20peace%20sign%20portrait%20thumbnail&image_size=square',
        'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=person%20making%20peace%20sign%20portrait%20optimized&image_size=portrait_4_3',
        'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=stylized%20person%20making%20peace%20sign%20portrait&image_size=portrait_4_3',
        'peace_sign_portrait_1.jpg',
        245760,
        'image/jpeg',
        1024, 
        768, 
        true, 
        true,
        'completed',
        '{"style": "natural", "prompt": "Add peace sign gesture"}'
    ),
    (
        (SELECT id FROM auth.users LIMIT 1),
        'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=cool%20person%20peace%20sign%20urban%20style&image_size=square_hd',
        'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=cool%20person%20peace%20sign%20urban%20style%20thumbnail&image_size=square',
        'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=cool%20person%20peace%20sign%20urban%20style%20optimized&image_size=square_hd',
        'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=stylized%20cool%20person%20peace%20sign%20urban%20style&image_size=square_hd',
        'peace_sign_urban_2.jpg',
        312480,
        'image/jpeg',
        1200, 
        1200, 
        true, 
        true,
        'completed',
        '{"style": "urban", "prompt": "Add cool peace sign"}'
    ),
    (
        (SELECT id FROM auth.users LIMIT 1),
        'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=artistic%20peace%20sign%20gesture%20creative&image_size=landscape_16_9',
        'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=artistic%20peace%20sign%20gesture%20creative%20thumbnail&image_size=square',
        'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=artistic%20peace%20sign%20gesture%20creative%20optimized&image_size=landscape_16_9',
        'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=stylized%20artistic%20peace%20sign%20gesture%20creative&image_size=landscape_16_9',
        'peace_sign_artistic_3.jpg',
        189440,
        'image/jpeg',
        1920, 
        1080, 
        true, 
        true,
        'completed',
        '{"style": "artistic", "prompt": "Add artistic peace sign"}'
    );