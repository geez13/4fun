import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Check if Supabase credentials are properly configured
const isSupabaseConfigured = () => {
  const hasValidUrl = supabaseUrl && 
    supabaseUrl !== 'https://your-project-ref.supabase.co' && 
    supabaseUrl.startsWith('https://') && 
    supabaseUrl.includes('.supabase.co');
  
  const hasValidKey = supabaseServiceKey && 
    supabaseServiceKey !== 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' && 
    supabaseServiceKey.startsWith('eyJ');
  
  return hasValidUrl && hasValidKey;
};

const SUPABASE_CONFIGURED = isSupabaseConfigured();

if (!SUPABASE_CONFIGURED) {
  console.warn('⚠️  SUPABASE NOT CONFIGURED');
  console.warn('📝 Using fallback mode with in-memory storage');
  console.warn('🔧 To enable persistent storage, follow these steps:');
  console.warn('   1. Create a Supabase project at https://supabase.com');
  console.warn('   2. Update your .env file with real Supabase credentials');
  console.warn('   3. Run the database migration from supabase/migrations/001_initial_schema.sql');
  console.warn('   4. Restart the server');
  console.warn('📖 See SUPABASE_SETUP.md for detailed instructions');
}

export const supabase = SUPABASE_CONFIGURED ? createClient(supabaseUrl, supabaseServiceKey) : null;

// In-memory storage for fallback mode
const inMemoryStorage = {
  images: new Map<string, ImageRecord>(),
  processingJobs: new Map<string, ProcessingJobRecord>(),
};

export interface ImageRecord {
  id: string;
  user_id?: string;
  original_url: string;
  processed_url?: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  status: 'uploaded' | 'processing' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
  token_gated?: boolean;
  verification_id?: string;
}

export interface ProcessingJobRecord {
  id: string;
  image_id: string;
  prompt_used: string;
  style_applied: string;
  gemini_response?: any;
  processing_time_ms?: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
  completed_at?: string;
}

// Default demo user UUID - consistent across app restarts
const DEMO_USER_UUID = '00000000-0000-0000-0000-000000000001';

export class SupabaseService {
  async createImageRecord(imageData: Partial<ImageRecord>): Promise<ImageRecord | null> {
    if (!SUPABASE_CONFIGURED) {
      // Fallback mode: store in memory
      const record: ImageRecord = {
        id: uuidv4(),
        user_id: imageData.user_id || DEMO_USER_UUID,
        original_url: imageData.original_url || '',
        processed_url: imageData.processed_url,
        file_name: imageData.file_name || '',
        file_size: imageData.file_size || 0,
        mime_type: imageData.mime_type || '',
        status: imageData.status || 'uploaded',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        token_gated: imageData.token_gated || false,
        verification_id: imageData.verification_id || null,
      };
      
      inMemoryStorage.images.set(record.id, record);
      console.log(`📝 Stored image record in memory: ${record.file_name} (ID: ${record.id})`);
      return record;
    }

    try {
      console.log('🔄 Inserting image record into Supabase...');
      const { data, error } = await supabase!
        .from('images')
        .insert([imageData])
        .select()
        .single();

      if (error) {
        console.error('❌ Supabase insert error:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          error: error
        });
        return null;
      }

      console.log('✅ Image record inserted successfully:', {
        id: data.id,
        fileName: data.file_name,
        status: data.status
      });
      return data;
    } catch (error) {
      console.error('❌ Supabase service error:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        error: error
      });
      return null;
    }
  }

  async updateImageRecord(id: string, updates: Partial<ImageRecord>): Promise<ImageRecord | null> {
    if (!SUPABASE_CONFIGURED) {
      // Fallback mode: update in memory
      const existing = inMemoryStorage.images.get(id);
      if (!existing) {
        console.log(`❌ Image record not found in memory: ${id}`);
        return null;
      }
      
      const updated = {
        ...existing,
        ...updates,
        updated_at: new Date().toISOString(),
      };
      
      inMemoryStorage.images.set(id, updated);
      console.log(`📝 Updated image record in memory: ${id}`);
      return updated;
    }

    try {
      const { data, error } = await supabase!
        .from('images')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating image record:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Supabase error:', error);
      return null;
    }
  }

  async getImageRecord(id: string): Promise<ImageRecord | null> {
    if (!SUPABASE_CONFIGURED) {
      // Fallback mode: get from memory
      const record = inMemoryStorage.images.get(id);
      if (record) {
        console.log(`📖 Retrieved image record from memory: ${id}`);
      } else {
        console.log(`❌ Image record not found in memory: ${id}`);
      }
      return record || null;
    }

    try {
      const { data, error } = await supabase!
        .from('images')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching image record:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Supabase error:', error);
      return null;
    }
  }

  async getUserImages(userId: string, limit: number = 20): Promise<ImageRecord[]> {
    if (!SUPABASE_CONFIGURED) {
      // Fallback mode: get from memory
      const allImages = Array.from(inMemoryStorage.images.values());
      const userImages = allImages
        .filter(img => img.user_id === userId)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, limit);
      
      console.log(`📖 Retrieved ${userImages.length} images from memory for user: ${userId}`);
      return userImages;
    }

    try {
      const { data, error } = await supabase!
        .from('images')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching user images:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Supabase error:', error);
      return [];
    }
  }

  async createProcessingJob(jobData: Partial<ProcessingJobRecord>): Promise<ProcessingJobRecord | null> {
    if (!SUPABASE_CONFIGURED) {
      // Fallback mode: store in memory
      const job: ProcessingJobRecord = {
        id: uuidv4(),
        image_id: jobData.image_id || '',
        prompt_used: jobData.prompt_used || '',
        style_applied: jobData.style_applied || '',
        gemini_response: jobData.gemini_response,
        processing_time_ms: jobData.processing_time_ms,
        status: jobData.status || 'pending',
        created_at: new Date().toISOString(),
        completed_at: jobData.completed_at,
      };
      
      inMemoryStorage.processingJobs.set(job.id, job);
      console.log(`📝 Stored processing job in memory: ${job.id}`);
      return job;
    }

    try {
      const { data, error } = await supabase!
        .from('processing_jobs')
        .insert([jobData])
        .select()
        .single();

      if (error) {
        console.error('Error creating processing job:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Supabase error:', error);
      return null;
    }
  }

  async updateProcessingJob(id: string, updates: Partial<ProcessingJobRecord>): Promise<ProcessingJobRecord | null> {
    if (!SUPABASE_CONFIGURED) {
      // Fallback mode: update in memory
      const existing = inMemoryStorage.processingJobs.get(id);
      if (!existing) {
        console.log(`❌ Processing job not found in memory: ${id}`);
        return null;
      }
      
      const updated = {
        ...existing,
        ...updates,
      };
      
      inMemoryStorage.processingJobs.set(id, updated);
      console.log(`📝 Updated processing job in memory: ${id}`);
      return updated;
    }

    try {
      const { data, error } = await supabase!
        .from('processing_jobs')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating processing job:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Supabase error:', error);
      return null;
    }
  }

  async testConnection(): Promise<boolean> {
    if (!SUPABASE_CONFIGURED) {
      console.log('📝 Fallback mode active - connection test skipped');
      return true; // Return true for fallback mode
    }

    try {
      const { data, error } = await supabase!
        .from('images')
        .select('count')
        .limit(1);

      return !error;
    } catch (error) {
      console.error('Supabase connection test failed:', error);
      return false;
    }
  }

  // Helper method to check if Supabase is configured
  isConfigured(): boolean {
    return SUPABASE_CONFIGURED;
  }

  // Helper method to get storage info
  getStorageInfo(): { mode: string; imageCount: number; jobCount: number } {
    if (!SUPABASE_CONFIGURED) {
      return {
        mode: 'fallback',
        imageCount: inMemoryStorage.images.size,
        jobCount: inMemoryStorage.processingJobs.size,
      };
    }
    
    return {
      mode: 'supabase',
      imageCount: -1, // Would need to query database
      jobCount: -1,   // Would need to query database
    };
  }
}

export const supabaseService = new SupabaseService();