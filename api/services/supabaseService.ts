import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import { SupabaseConnectionManager, ConnectionConfig, ConnectionMetrics } from '../lib/supabaseConnectionManager.js';
import { securityLogger, createLogContext, measurePerformance } from '../lib/logger.js';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Enhanced configuration validation
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

// Use enhanced security logger

// Connection manager instance
let connectionManager: SupabaseConnectionManager | null = null;

// Initialize connection manager if Supabase is configured
if (SUPABASE_CONFIGURED) {
  const connectionConfig: ConnectionConfig = {
    url: supabaseUrl,
    serviceKey: supabaseServiceKey,
    maxRetries: 3,
    retryDelay: 1000,
    connectionTimeout: 10000,
    poolSize: 5,
    healthCheckInterval: 30000,
    enableLogging: process.env.NODE_ENV === 'development',
    rateLimitRequests: 100,
    rateLimitWindow: 60000,
  };

  connectionManager = new SupabaseConnectionManager(connectionConfig);
  
  // Initialize connection manager
  connectionManager.initialize().catch(error => {
    securityLogger.error('Failed to initialize connection manager', error);
  });

  // Setup event listeners
  connectionManager.on('healthCheckFailed', (error) => {
    securityLogger.warn('Health check failed', createLogContext(undefined, 'healthCheck', { error: error.message }));
  });

  connectionManager.on('error', (error) => {
    securityLogger.error('Connection manager error', error);
  });

  securityLogger.info('Supabase connection manager initialized successfully', createLogContext(undefined, 'initialization', {
    poolSize: connectionConfig.poolSize,
    healthCheckInterval: connectionConfig.healthCheckInterval
  }));
} else {
  securityLogger.warn('⚠️  SUPABASE NOT CONFIGURED', createLogContext(undefined, 'configuration', {
    mode: 'fallback',
    reason: 'missing_credentials'
  }));
  securityLogger.warn('📝 Using fallback mode with in-memory storage');
  securityLogger.warn('🔧 To enable persistent storage, follow these steps:');
  securityLogger.warn('   1. Create a Supabase project at https://supabase.com');
  securityLogger.warn('   2. Update your .env file with real Supabase credentials');
  securityLogger.warn('   3. Run the database migration from supabase/migrations/001_initial_schema.sql');
  securityLogger.warn('   4. Restart the server');
  securityLogger.warn('📖 See SUPABASE_SETUP.md for detailed instructions');
}

// Fallback client for backward compatibility
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

// Input validation utilities
const validateInput = {
  uuid: (id: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
  },
  
  fileName: (fileName: string): boolean => {
    // Allow alphanumeric, dots, hyphens, underscores
    const fileNameRegex = /^[a-zA-Z0-9._-]+$/;
    return fileNameRegex.test(fileName) && fileName.length <= 255;
  },
  
  mimeType: (mimeType: string): boolean => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    return allowedTypes.includes(mimeType);
  },
  
  url: (url: string): boolean => {
    try {
      // Allow data URLs for base64 encoded images
      if (url.startsWith('data:image/')) {
        return true;
      }
      // Allow regular HTTP/HTTPS URLs
      new URL(url);
      return url.startsWith('https://') || url.startsWith('http://localhost');
    } catch {
      return false;
    }
  }
};

export class SupabaseService {
  /**
   * Enhanced method to create image record with validation and retry logic
   */
  async createImageRecord(imageData: Partial<ImageRecord>): Promise<ImageRecord | null> {
    // Input validation
    if (imageData.file_name && !validateInput.fileName(imageData.file_name)) {
      securityLogger.warn('Invalid file name provided', createLogContext(undefined, 'createImageRecord', { fileName: imageData.file_name }));
      throw new Error('Invalid file name format');
    }

    if (imageData.mime_type && !validateInput.mimeType(imageData.mime_type)) {
      securityLogger.warn('Invalid MIME type provided', createLogContext(undefined, 'createImageRecord', { mimeType: imageData.mime_type }));
      throw new Error('Invalid MIME type');
    }

    if (imageData.original_url && !validateInput.url(imageData.original_url)) {
      securityLogger.warn('Invalid URL provided', createLogContext(undefined, "operation", { url: imageData.original_url }));
      throw new Error('Invalid URL format');
    }

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
      securityLogger.info(`Stored image record in memory: ${record.file_name} (ID: ${record.id})`);
      return record;
    }

    if (!connectionManager) {
      throw new Error('Connection manager not available');
    }

    try {
      const result = await connectionManager.executeWithRetry(async (client) => {
        securityLogger.debug('Inserting image record into Supabase...');
        
        const { data, error } = await client
          .from('images')
          .insert([imageData])
          .select()
          .single();

        if (error) {
          securityLogger.error('Supabase insert error', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code,
          });
          throw new Error(`Database insert failed: ${error.message}`);
        }

        securityLogger.info('Image record inserted successfully', createLogContext(data.user_id, 'createImageRecord', {
          id: data.id,
          fileName: data.file_name,
          status: data.status
        }));
        
        return data;
      }, `create-image-${imageData.user_id}`);

      return result;
    } catch (error) {
      securityLogger.error('Failed to create image record', error);
      throw error;
    }
  }

  /**
   * Enhanced method to update image record with validation
   */
  async updateImageRecord(id: string, updates: Partial<ImageRecord>): Promise<ImageRecord | null> {
    // Input validation
    if (!validateInput.uuid(id)) {
      securityLogger.warn('Invalid UUID provided for update', createLogContext(undefined, "operation", { id }));
      throw new Error('Invalid record ID format');
    }

    if (updates.file_name && !validateInput.fileName(updates.file_name)) {
      throw new Error('Invalid file name format');
    }

    if (updates.mime_type && !validateInput.mimeType(updates.mime_type)) {
      throw new Error('Invalid MIME type');
    }

    if (!SUPABASE_CONFIGURED) {
      // Fallback mode: update in memory
      const existing = inMemoryStorage.images.get(id);
      if (!existing) {
        securityLogger.warn(`Image record not found in memory: ${id}`);
        return null;
      }
      
      const updated = {
        ...existing,
        ...updates,
        updated_at: new Date().toISOString(),
      };
      
      inMemoryStorage.images.set(id, updated);
      securityLogger.info(`Updated image record in memory: ${id}`);
      return updated;
    }

    if (!connectionManager) {
      throw new Error('Connection manager not available');
    }

    try {
      const result = await connectionManager.executeWithRetry(async (client) => {
        const { data, error } = await client
          .from('images')
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq('id', id)
          .select()
          .single();

        if (error) {
          securityLogger.error('Error updating image record', error);
          throw new Error(`Database update failed: ${error.message}`);
        }

        return data;
      }, `update-image-${id}`);

      securityLogger.info(`Image record updated successfully: ${id}`);
      return result;
    } catch (error) {
      securityLogger.error('Failed to update image record', error);
      throw error;
    }
  }

  /**
   * Enhanced method to get image record with validation
   */
  async getImageRecord(id: string): Promise<ImageRecord | null> {
    if (!validateInput.uuid(id)) {
      securityLogger.warn('Invalid UUID provided for get', createLogContext(undefined, "getImageRecord", { id }));
      throw new Error('Invalid record ID format');
    }

    if (!SUPABASE_CONFIGURED) {
      // Fallback mode: get from memory
      const record = inMemoryStorage.images.get(id);
      if (record) {
        securityLogger.debug(`Retrieved image record from memory: ${id}`);
      } else {
        securityLogger.debug(`Image record not found in memory: ${id}`);
      }
      return record || null;
    }

    if (!connectionManager) {
      throw new Error('Connection manager not available');
    }

    try {
      const result = await connectionManager.executeWithRetry(async (client) => {
        const { data, error } = await client
          .from('images')
          .select('*')
          .eq('id', id)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            // Record not found
            return null;
          }
          securityLogger.error('Error fetching image record', error);
          throw new Error(`Database fetch failed: ${error.message}`);
        }

        return data;
      }, `get-image-${id}`);

      return result;
    } catch (error) {
      securityLogger.error('Failed to get image record', error);
      throw error;
    }
  }

  /**
   * Enhanced method to get user images with validation and pagination
   */
  async getUserImages(userId: string, limit: number = 20): Promise<ImageRecord[]> {
    // Input validation
    if (!validateInput.uuid(userId)) {
      securityLogger.warn('Invalid user ID provided for getUserImages', createLogContext(undefined, "getUserImages", { userId }));
      throw new Error('Invalid user ID format');
    }

    if (limit < 1 || limit > 100) {
      securityLogger.warn('Invalid limit provided for getUserImages', createLogContext(undefined, "getUserImages", { limit }));
      throw new Error('Limit must be between 1 and 100');
    }

    if (!SUPABASE_CONFIGURED) {
      // Fallback mode: get from memory
      const userImages = Array.from(inMemoryStorage.images.values())
        .filter(img => img.user_id === userId)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, limit);
      
      securityLogger.debug(`Retrieved ${userImages.length} images from memory for user: ${userId}`);
      return userImages;
    }

    if (!connectionManager) {
      throw new Error('Connection manager not available');
    }

    try {
      const result = await connectionManager.executeWithRetry(async (client) => {
        const { data, error } = await client
          .from('images')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(limit);

        if (error) {
          securityLogger.error('Error fetching user images', error);
          throw new Error(`Database fetch failed: ${error.message}`);
        }

        return data || [];
      }, `get-user-images-${userId}`);

      securityLogger.debug(`Retrieved ${result.length} images for user: ${userId}`);
      return result;
    } catch (error) {
      securityLogger.error('Failed to get user images', error);
      throw error;
    }
  }

  /**
   * List processed images across all users with pagination
   * Returns images that have a processed_url and status completed, sorted by created_at desc
   */
  async getProcessedImages(limit: number = 20, page: number = 1): Promise<ImageRecord[]> {
    // Validate input
    const safeLimit = Math.min(Math.max(limit, 1), 100);
    const safePage = Math.max(page, 1);
    const offset = (safePage - 1) * safeLimit;

    if (!SUPABASE_CONFIGURED) {
      // Fallback mode: read from in-memory storage
      const images = Array.from(inMemoryStorage.images.values())
        .filter(img => !!img.processed_url && img.status === 'completed')
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(offset, offset + safeLimit);

      securityLogger.debug(`Retrieved ${images.length} processed images from memory (page ${safePage}, limit ${safeLimit})`);
      return images;
    }

    if (!connectionManager) {
      throw new Error('Connection manager not available');
    }

    try {
      const result = await connectionManager.executeWithRetry(async (client) => {
        const { data, error } = await client
          .from('images')
          .select('*')
          .not('processed_url', 'is', null)
          .eq('status', 'completed')
          .order('created_at', { ascending: false })
          .range(offset, offset + safeLimit - 1);

        if (error) {
          securityLogger.error('Error fetching processed images', error);
          throw new Error(`Database fetch failed: ${error.message}`);
        }

        return data || [];
      }, `get-processed-images-${safePage}-${safeLimit}`);

      securityLogger.debug(`Retrieved ${result.length} processed images (page ${safePage}, limit ${safeLimit})`);
      return result;
    } catch (error) {
      securityLogger.error('Failed to get processed images', error);
      throw error;
    }
  }

  /**
   * Enhanced method to create processing job with validation
   */
  async createProcessingJob(jobData: Partial<ProcessingJobRecord>): Promise<ProcessingJobRecord | null> {
    // Input validation
    if (jobData.image_id && !validateInput.uuid(jobData.image_id)) {
      securityLogger.warn('Invalid image ID provided for processing job', createLogContext(undefined, "createProcessingJob", { imageId: jobData.image_id }));
      throw new Error('Invalid image ID format');
    }

    if (jobData.prompt_used && jobData.prompt_used.length > 1000) {
      securityLogger.warn('Prompt too long for processing job', createLogContext(undefined, "createProcessingJob", { promptLength: jobData.prompt_used.length }));
      throw new Error('Prompt must be less than 1000 characters');
    }

    if (!SUPABASE_CONFIGURED) {
      // Fallback mode: store in memory
      const record: ProcessingJobRecord = {
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
      
      inMemoryStorage.processingJobs.set(record.id, record);
      securityLogger.info(`Stored processing job in memory: ${record.id}`);
      return record;
    }

    if (!connectionManager) {
      throw new Error('Connection manager not available');
    }

    try {
      const result = await connectionManager.executeWithRetry(async (client) => {
        const { data, error } = await client
          .from('processing_jobs')
          .insert([jobData])
          .select()
          .single();

        if (error) {
          securityLogger.error('Error creating processing job', error);
          throw new Error(`Database insert failed: ${error.message}`);
        }

        return data;
      }, `create-job-${jobData.image_id}`);

      securityLogger.info(`Processing job created successfully: ${result.id}`);
      return result;
    } catch (error) {
      securityLogger.error('Failed to create processing job', error);
      throw error;
    }
  }

  /**
   * Enhanced method to update processing job with validation
   */
  async updateProcessingJob(id: string, updates: Partial<ProcessingJobRecord>): Promise<ProcessingJobRecord | null> {
    // Input validation
    if (!validateInput.uuid(id)) {
      securityLogger.warn('Invalid processing job ID provided for update', createLogContext(undefined, "updateProcessingJob", { id }));
      throw new Error('Invalid processing job ID format');
    }

    if (updates.prompt_used && updates.prompt_used.length > 1000) {
      securityLogger.warn('Prompt too long for processing job update', createLogContext(undefined, "updateProcessingJob", { promptLength: updates.prompt_used.length }));
      throw new Error('Prompt must be less than 1000 characters');
    }

    if (!SUPABASE_CONFIGURED) {
      // Fallback mode: update in memory
      const existing = inMemoryStorage.processingJobs.get(id);
      if (!existing) {
        securityLogger.warn(`Processing job not found in memory: ${id}`);
        return null;
      }
      
      const updated = {
        ...existing,
        ...updates,
      };
      
      // Set completed_at if status is completed
      if (updates.status === 'completed' && !updated.completed_at) {
        updated.completed_at = new Date().toISOString();
      }
      
      inMemoryStorage.processingJobs.set(id, updated);
      securityLogger.info(`Updated processing job in memory: ${id}`);
      return updated;
    }

    if (!connectionManager) {
      throw new Error('Connection manager not available');
    }

    try {
      const result = await connectionManager.executeWithRetry(async (client) => {
        // Set completed_at if status is completed
        const updateData = { ...updates };
        if (updates.status === 'completed' && !updateData.completed_at) {
          updateData.completed_at = new Date().toISOString();
        }

        const { data, error } = await client
          .from('processing_jobs')
          .update(updateData)
          .eq('id', id)
          .select()
          .single();

        if (error) {
          securityLogger.error('Error updating processing job', error);
          throw new Error(`Database update failed: ${error.message}`);
        }

        return data;
      }, `update-job-${id}`);

      securityLogger.info(`Processing job updated successfully: ${id}`);
      return result;
    } catch (error) {
      securityLogger.error('Failed to update processing job', error);
      throw error;
    }
  }

  async testConnection(): Promise<boolean> {
    if (!SUPABASE_CONFIGURED) {
      securityLogger.info('Fallback mode active - connection test skipped');
      return true; // Return true for fallback mode
    }

    if (!connectionManager) {
      securityLogger.error('Connection manager not available');
      return false;
    }

    try {
      return await connectionManager.performHealthCheck();
    } catch (error) {
      securityLogger.error('Connection test failed', error);
      return false;
    }
  }

  /**
   * Get connection metrics and health information
   */
  getConnectionMetrics(): ConnectionMetrics | null {
    if (!connectionManager) {
      return null;
    }
    return connectionManager.getMetrics();
  }

  /**
   * Check if the service is healthy
   */
  isHealthy(): boolean {
    if (!SUPABASE_CONFIGURED) {
      return true; // Fallback mode is always "healthy"
    }
    return connectionManager?.isHealthy() || false;
  }

  /**
   * Get service configuration (sanitized)
   */
  getServiceConfig(): any {
    return {
      configured: SUPABASE_CONFIGURED,
      connectionManager: connectionManager?.getConfig() || null,
      fallbackMode: !SUPABASE_CONFIGURED,
    };
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
      imageCount: -1, // Would require a count query
      jobCount: -1,   // Would require a count query
    };
  }

  /**
   * Cleanup method for graceful shutdown
   */
  async cleanup(): Promise<void> {
    if (connectionManager) {
      await connectionManager.cleanup();
    }
    securityLogger.info('SupabaseService cleanup completed');
  }
}

export const supabaseService = new SupabaseService();