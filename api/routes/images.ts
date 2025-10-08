import express, { Request, Response } from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { geminiService } from '../services/geminiService.js';
import { supabaseService } from '../services/supabaseService.js';
import { requireTokenAccess, optionalTokenAccess } from '../middleware/tokenGateMiddleware.js';

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isValidUUID(uuid: string): boolean {
  return UUID_REGEX.test(uuid);
}

const router = express.Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

// Upload image endpoint
router.post('/upload', upload.single('image'), async (req: Request, res: Response) => {
  try {
    console.log('🚀 Upload endpoint called');
    
    if (!req.file) {
      console.error('❌ No image file provided');
      return res.status(400).json({
        success: false,
        error: 'No image file provided',
      });
    }

    const { userId } = req.body;
    const file = req.file;

    console.log('📁 File details:', {
      originalname: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      userId: userId || 'null'
    });

    // Convert buffer to base64 for storage
    const base64Data = file.buffer.toString('base64');
    const dataUrl = `data:${file.mimetype};base64,${base64Data}`;

    console.log('🔄 Creating image record...');
    
    // Create image record in database with basic required fields only
    const imageData = {
      user_id: userId || null,
      original_url: dataUrl,
      file_name: file.originalname,
      file_size: file.size,
      mime_type: file.mimetype,
      status: 'uploaded' as const
      // Removed token_gated and verification_id to avoid schema compatibility issues
    };

    const imageRecord = await supabaseService.createImageRecord(imageData);

    if (!imageRecord) {
      console.error('❌ Failed to create image record');
      return res.status(500).json({
        success: false,
        error: 'Failed to save image record',
      });
    }

    console.log('✅ Image uploaded successfully:', imageRecord.id);

    const response = {
      success: true,
      data: {
        imageId: imageRecord.id,
        originalUrl: imageRecord.original_url,
        fileName: imageRecord.file_name,
        fileSize: imageRecord.file_size,
      },
      storageMode: supabaseService.isConfigured() ? 'supabase' : 'fallback',
      message: supabaseService.isConfigured() 
        ? 'Image uploaded successfully' 
        : 'Image uploaded to temporary storage. Configure Supabase for persistent storage.',
    };

    res.json(response);
  } catch (error) {
    console.error('❌ Upload error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      error: error
    });
    res.status(500).json({
      success: false,
      error: 'Failed to upload image',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Token-gated upload endpoint
router.post('/upload-gated', requireTokenAccess, upload.single('image'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No image file provided',
      });
    }

    const { userId } = req.body;
    const file = req.file;

    // Convert buffer to base64 for storage
    const base64Data = file.buffer.toString('base64');
    const dataUrl = `data:${file.mimetype};base64,${base64Data}`;

    // Create image record in database with token verification
    const imageRecord = await supabaseService.createImageRecord({
      user_id: userId || null,
      original_url: dataUrl,
      file_name: file.originalname,
      file_size: file.size,
      mime_type: file.mimetype,
      status: 'uploaded',
      token_gated: true, // Mark as token-gated upload
      verification_id: req.tokenVerification?.verificationId || null
    });

    if (!imageRecord) {
      return res.status(500).json({
        success: false,
        error: 'Failed to save image record',
      });
    }

    const response = {
      success: true,
      data: {
        imageId: imageRecord.id,
        originalUrl: imageRecord.original_url,
        fileName: imageRecord.file_name,
        fileSize: imageRecord.file_size,
        tokenGated: true,
      },
      storageMode: supabaseService.isConfigured() ? 'supabase' : 'fallback',
      message: 'Token-gated image uploaded successfully with SOL verification',
    };

    res.json(response);
  } catch (error) {
    console.error('Token-gated upload error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload image',
    });
  }
});



// Process V-sign on uploaded image (with optional token gating)
router.post('/:imageId/process-vsign', optionalTokenAccess, async (req: Request, res: Response) => {
  const startTime = Date.now();
  
  try {
    const { imageId } = req.params;
    
    // Validate UUID format
    if (!isValidUUID(imageId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid image ID format',
      });
    }
    const { prompt, style = 'natural' } = req.body;

    console.log('🚀 Processing ✌️-sign request:', { imageId, style, prompt: prompt ? 'custom' : 'default' });

    if (!imageId) {
      console.error('❌ Missing imageId in request');
      return res.status(400).json({
        success: false,
        error: 'Image ID is required',
      });
    }

    // Get image record
    console.log('📖 Fetching image record for:', imageId);
    const imageRecord = await supabaseService.getImageRecord(imageId);
    if (!imageRecord) {
      console.error('❌ Image not found:', imageId);
      return res.status(404).json({
        success: false,
        error: 'Image not found',
      });
    }

    console.log('✅ Image record found:', { 
      id: imageRecord.id, 
      fileName: imageRecord.file_name,
      mimeType: imageRecord.mime_type,
      status: imageRecord.status 
    });

    // Update image status to processing
    console.log('🔄 Updating image status to processing...');
    await supabaseService.updateImageRecord(imageId, { status: 'processing' });

    // Create processing job
    console.log('📝 Creating processing job...');
    const processingJob = await supabaseService.createProcessingJob({
      image_id: imageId,
      prompt_used: prompt || `Add a realistic ✌️ sign hand gesture with ${style} style`,
      style_applied: style,
      status: 'processing',
    });

    console.log('✅ Processing job created:', processingJob?.id);

    // Extract image data from data URL
    console.log('🔍 Extracting image data...');
    const base64Data = imageRecord.original_url.split(',')[1];
    const imageBuffer = Buffer.from(base64Data, 'base64');
    console.log('✅ Image buffer created, size:', imageBuffer.length, 'bytes');

    // Process with Gemini AI
    console.log('🎨 Starting ✌️-sign processing...');
    const result = await geminiService.processVSignImage(
      imageBuffer,
      imageRecord.mime_type,
      { style, prompt }
    );

    console.log('🎯 Processing result:', { 
      success: result.success, 
      processingTime: result.processingTime,
      hasProcessedData: !!result.processedImageData,
      error: result.error 
    });

    if (result.success && result.processedImageData) {
      // Create processed image data URL
      const processedDataUrl = result.processedImageData;
      console.log('✅ Processing successful, updating records...');

      // Update image record with processed URL
      await supabaseService.updateImageRecord(imageId, {
        processed_url: processedDataUrl,
        status: 'completed',
      });

      // Update processing job
      if (processingJob) {
        await supabaseService.updateProcessingJob(processingJob.id, {
          status: 'completed',
          processing_time_ms: result.processingTime,
          completed_at: new Date().toISOString(),
        });
      }

      const totalTime = Date.now() - startTime;
      console.log('🎉 ✌️-sign processing completed successfully in', totalTime, 'ms');

      res.json({
        success: true,
        data: {
          jobId: processingJob?.id || 'unknown',
          processedImageUrl: processedDataUrl,
          processingTime: result.processingTime / 1000, // Convert to seconds
          imageId: imageId,
        }
      });
    } else {
      console.error('❌ Processing failed:', result.error);
      
      // Update status to failed
      await supabaseService.updateImageRecord(imageId, { status: 'failed' });

      if (processingJob) {
        await supabaseService.updateProcessingJob(processingJob.id, {
          status: 'failed',
          processing_time_ms: result.processingTime,
          completed_at: new Date().toISOString(),
        });
      }

      const totalTime = Date.now() - startTime;
      console.log('💥 Processing failed after', totalTime, 'ms');

      res.status(500).json({
        success: false,
        error: result.error || 'Failed to process image',
        processingTime: result.processingTime / 1000,
      });
    }
  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error('💥 Processing route error after', totalTime, 'ms:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process image',
    });
  }
});

// Get current user images (for gallery) - without userId parameter
router.get('/user', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    
    // For now, use a default userId since we don't have auth implemented
    // In a real app, you would extract userId from the auth token
    const defaultUserId = '00000000-0000-0000-0000-000000000001';
    
    const images = await supabaseService.getUserImages(defaultUserId, limit);

    res.json({
      success: true,
      images,
      count: images.length,
    });
  } catch (error) {
    console.error('Get user images error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user images',
    });
  }
});

// Get user images (for gallery) - with userId parameter
router.get('/user/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit as string) || 20;
    
    // Validate UUID format
    if (!isValidUUID(userId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user ID format',
      });
    }

    const images = await supabaseService.getUserImages(userId, limit);

    res.json({
      success: true,
      images,
      count: images.length,
    });
  } catch (error) {
    console.error('Get user images error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user images',
    });
  }
});

// Health check for services
router.get('/health/services', async (req: Request, res: Response) => {
  try {
    // Test services without throwing errors
    let geminiStatus = false;
    let supabaseStatus = false;
    let geminiConfig = { configured: false, message: 'Unknown status' };

    try {
      geminiStatus = await geminiService.testConnection();
      geminiConfig = geminiService.getConfigurationStatus();
    } catch (error) {
      console.error('Gemini health check error:', error);
      geminiStatus = false;
      geminiConfig = { 
        configured: false, 
        message: 'Gemini API error - check configuration' 
      };
    }

    try {
      supabaseStatus = await supabaseService.testConnection();
    } catch (error) {
      console.error('Supabase health check error:', error);
      supabaseStatus = false;
    }

    const storageInfo = supabaseService.getStorageInfo();

    res.json({
      success: true,
      services: {
        gemini: {
          status: geminiStatus,
          configured: geminiConfig.configured,
          message: geminiConfig.message
        },
        supabase: supabaseStatus,
      },
      storage: {
        mode: storageInfo.mode,
        configured: supabaseService.isConfigured(),
        imageCount: storageInfo.imageCount,
        jobCount: storageInfo.jobCount,
        message: supabaseService.isConfigured() 
          ? 'Using Supabase for persistent storage'
          : 'Using in-memory storage - data will be lost on server restart. Configure Supabase for persistent storage.'
      }
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      success: false,
      error: 'Health check failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get image by ID - MUST be last to avoid catching other routes
router.get('/:imageId', async (req: Request, res: Response) => {
  try {
    const { imageId } = req.params;
    
    // Validate UUID format
    if (!isValidUUID(imageId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid image ID format',
      });
    }

    const imageRecord = await supabaseService.getImageRecord(imageId);
    if (!imageRecord) {
      return res.status(404).json({
        success: false,
        error: 'Image not found',
      });
    }

    res.json({
      success: true,
      image: imageRecord,
    });
  } catch (error) {
    console.error('Get image error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get image',
    });
  }
});

export default router;