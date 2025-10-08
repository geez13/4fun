-- Token-Gated Image Upload System Migration
-- This migration creates the necessary tables and policies for SOL token-gated image uploads

-- Create token_verifications table
CREATE TABLE IF NOT EXISTS token_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    wallet_address VARCHAR(44) NOT NULL,
    token_balance DECIMAL(18,9) NOT NULL DEFAULT 0,
    has_access BOOLEAN NOT NULL DEFAULT false,
    verified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '1 hour'),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for token_verifications
CREATE INDEX IF NOT EXISTS idx_token_verifications_wallet ON token_verifications(wallet_address);
CREATE INDEX IF NOT EXISTS idx_token_verifications_user_id ON token_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_token_verifications_expires_at ON token_verifications(expires_at);

-- Create upload_sessions table
CREATE TABLE IF NOT EXISTS upload_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    verification_id UUID REFERENCES token_verifications(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 minutes')
);

-- Create indexes for upload_sessions
CREATE INDEX IF NOT EXISTS idx_upload_sessions_token ON upload_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_upload_sessions_user_id ON upload_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_upload_sessions_expires_at ON upload_sessions(expires_at);

-- Enhance existing images table with token verification
ALTER TABLE images ADD COLUMN IF NOT EXISTS verification_id UUID REFERENCES token_verifications(id);
ALTER TABLE images ADD COLUMN IF NOT EXISTS token_gated BOOLEAN DEFAULT false;

-- Create indexes for enhanced images table
CREATE INDEX IF NOT EXISTS idx_images_verification_id ON images(verification_id);
CREATE INDEX IF NOT EXISTS idx_images_token_gated ON images(token_gated);

-- Create system_config table for token requirements
CREATE TABLE IF NOT EXISTS system_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(255) UNIQUE NOT NULL,
    value TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert system configuration for token requirements
INSERT INTO system_config (key, value, description) VALUES
('sol_token_address', 'So11111111111111111111111111111111111111111', 'SOL token mint address'),
('minimum_token_balance', '1', 'Minimum SOL tokens required for access'),
('verification_expiry_hours', '1', 'Hours before token verification expires'),
('upload_session_expiry_minutes', '30', 'Minutes before upload session expires')
ON CONFLICT (key) DO NOTHING;

-- Enable Row Level Security
ALTER TABLE token_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE upload_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_config ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own token verifications" ON token_verifications;
DROP POLICY IF EXISTS "Users can insert own token verifications" ON token_verifications;
DROP POLICY IF EXISTS "Users can update own token verifications" ON token_verifications;
DROP POLICY IF EXISTS "Users can manage own upload sessions" ON upload_sessions;
DROP POLICY IF EXISTS "Token-gated images access" ON images;
DROP POLICY IF EXISTS "System config read access" ON system_config;

-- Create RLS policies for token_verifications
CREATE POLICY "Users can view own token verifications" ON token_verifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own token verifications" ON token_verifications
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own token verifications" ON token_verifications
    FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for upload_sessions
CREATE POLICY "Users can manage own upload sessions" ON upload_sessions
    FOR ALL USING (auth.uid() = user_id);

-- Create RLS policy for system_config (read-only for all authenticated users)
CREATE POLICY "System config read access" ON system_config
    FOR SELECT USING (true);

-- Update images table RLS for token-gated access
CREATE POLICY "Token-gated images access" ON images
    FOR SELECT USING (
        NOT token_gated OR 
        EXISTS (
            SELECT 1 FROM token_verifications tv 
            WHERE tv.user_id = auth.uid() 
            AND tv.has_access = true 
            AND tv.expires_at > NOW()
        )
    );

-- Grant permissions to anon and authenticated roles
GRANT SELECT, INSERT, UPDATE ON token_verifications TO anon;
GRANT ALL PRIVILEGES ON token_verifications TO authenticated;

GRANT SELECT, INSERT, UPDATE ON upload_sessions TO anon;
GRANT ALL PRIVILEGES ON upload_sessions TO authenticated;

GRANT SELECT ON system_config TO anon;
GRANT ALL PRIVILEGES ON system_config TO authenticated;

-- Update permissions for enhanced images table
GRANT SELECT ON images TO anon;
GRANT ALL PRIVILEGES ON images TO authenticated;

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_token_verifications_updated_at BEFORE UPDATE ON token_verifications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_config_updated_at BEFORE UPDATE ON system_config
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to clean up expired verifications and sessions
CREATE OR REPLACE FUNCTION cleanup_expired_records()
RETURNS void AS $$
BEGIN
    -- Delete expired token verifications
    DELETE FROM token_verifications WHERE expires_at < NOW();
    
    -- Delete expired upload sessions
    DELETE FROM upload_sessions WHERE expires_at < NOW();
END;
$$ language 'plpgsql';

-- Create a scheduled job to run cleanup (this would typically be done via pg_cron or similar)
-- For now, we'll rely on application-level cleanup