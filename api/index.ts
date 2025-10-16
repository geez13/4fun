/**
 * Consolidated Vercel serverless function handler
 * All API routes are handled through this single function to stay within Hobby plan limits
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { supabaseService } from './services/supabaseService.js';
import { geminiService } from './services/geminiService.js';
import { requireTokenAccess } from './middleware/tokenGateMiddleware.js';
import { rateLimiter } from './middleware/rateLimiter.js';
import { securityLogger } from './lib/logger.js';
import { v4 as uuidv4 } from 'uuid';
import multer from 'multer';
import { verifyTokenAccess } from './services/tokenVerificationService.js';

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// Root API endpoint
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'Four.Fun API Server',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: {
        register: '/api/auth/register',
        login: '/api/auth/login'
      },
      token: {
        verify: '/api/token/verify'
      },
      images: {
        upload: '/api/images/upload',
        generate: '/api/images/generate-image'
      }
    }
  });
});

// ===== HEALTH ROUTES =====
app.get('/api/health', async (req, res) => {
  try {
    const startTime = Date.now();
    const dbHealthy = await supabaseService.testConnection();
    const serviceConfig = supabaseService.getServiceConfig();
    const storageInfo = supabaseService.getStorageInfo();
    const responseTime = Date.now() - startTime;

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      responseTime,
      services: {
        database: {
          status: dbHealthy ? 'up' : 'down',
          configured: serviceConfig.configured,
          mode: serviceConfig.mode
        },
        storage: {
          imageCount: storageInfo.imageCount,
          jobCount: storageInfo.jobCount
        }
      }
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      status: 'unhealthy',
      error: 'Health check failed'
    });
  }
});

// ===== AUTH ROUTES =====
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        error: 'Email, password, and name are required',
      });
    }

    // For now, return success (implement actual registration logic as needed)
    res.json({
      success: true,
      message: 'User registered successfully',
      user: { email, name }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Registration failed'
    });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required',
      });
    }

    // For now, return success (implement actual login logic as needed)
    res.json({
      success: true,
      message: 'Login successful',
      user: { email }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed'
    });
  }
});

// ===== TEST ROUTES =====
app.get('/api/test', (req, res) => {
  res.json({ success: true, message: 'API is working', timestamp: new Date().toISOString() });
});

// ===== TOKEN ROUTES =====
app.post('/api/token/verify', async (req, res) => {
  try {
    console.log('Token verification endpoint called');
    const { walletAddress, signature, message } = req.body;
    console.log('Request body:', { walletAddress, signature: signature?.substring(0, 10) + '...', message: message?.substring(0, 50) + '...' });

    if (!walletAddress || !signature || !message) {
      console.log('Missing required parameters');
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: walletAddress, signature, and message are required'
      });
    }

    console.log('Starting token verification...');
    // Perform token verification
    const result = await verifyTokenAccess({
      walletAddress,
      signature,
      message
    });
    console.log('Token verification result:', result);

    if (result.error) {
      console.log('Token verification error:', result.error);
      return res.status(400).json({
        success: false,
        error: result.error
      });
    }

    console.log('Token verification successful');
    res.json({
      success: true,
      data: {
        hasAccess: result.hasAccess,
        tokenBalance: result.tokenBalance,
        requiredBalance: result.requiredBalance,
        sessionToken: result.sessionToken,
        verificationId: result.verificationId
      }
    });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(500).json({
      success: false,
      error: 'Token verification failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ===== IMAGE ROUTES =====
app.post('/api/images/upload', upload.single('image'), requireTokenAccess, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No image file provided'
      });
    }

    // Convert buffer to data URL to persist without external storage in demo mode
    const base64Data = req.file.buffer.toString('base64');
    const mimeType = req.file.mimetype || 'image/jpeg';
    const dataUrl = `data:${mimeType};base64,${base64Data}`;

    // Persist image record via SupabaseService (falls back to in-memory storage)
    const record = await supabaseService.createImageRecord({
      original_url: dataUrl,
      file_name: req.file.originalname,
      file_size: req.file.size,
      mime_type: mimeType,
      status: 'uploaded',
      token_gated: true,
      verification_id: (req as any)?.tokenVerification?.verificationId || null,
    });

    if (!record) {
      return res.status(500).json({
        success: false,
        error: 'Failed to persist image record'
      });
    }

    res.json({
      success: true,
      data: {
        imageId: record.id,
        originalUrl: record.original_url,
        fileName: req.file.originalname,
        fileSize: req.file.size
      },
      message: 'Image uploaded successfully'
    });
  } catch (error) {
    console.error('Image upload error:', error);
    res.status(500).json({
      success: false,
      error: 'Image upload failed'
    });
  }
});
app.post('/api/images/:id/process-vsign', requireTokenAccess, async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Image ID is required'
      });
    }
    // Optional: prompt overrides to guide AI edits
    const { prompt: requestedPrompt } = (req.body || {}) as { prompt?: string };
    // Retrieve the original image record
    const imageRecord = await supabaseService.getImageRecord(id);
    if (!imageRecord || !imageRecord.original_url) {
      return res.status(404).json({
        success: false,
        error: 'Original image not found'
      });
    }

    // Build image buffer from stored URL
    let imageBuffer: Buffer;
    let mimeType = imageRecord.mime_type || 'image/jpeg';

    try {
      if (imageRecord.original_url.startsWith('data:image/')) {
        // Data URL: extract base64
        const match = imageRecord.original_url.match(/^data:(.*?);base64,(.*)$/);
        if (!match) throw new Error('Invalid data URL');
        mimeType = match[1] || mimeType;
        imageBuffer = Buffer.from(match[2], 'base64');
      } else {
        // Remote URL: fetch bytes
        const resp = await fetch(imageRecord.original_url);
        if (!resp.ok) throw new Error(`Failed to fetch source image: ${resp.status}`);
        const arrayBuf = await resp.arrayBuffer();
        imageBuffer = Buffer.from(arrayBuf);
        mimeType = resp.headers.get('content-type') || mimeType;
      }
    } catch (fetchErr) {
      console.error('Error loading original image:', fetchErr);
      return res.status(500).json({
        success: false,
        error: 'Failed to load original image for processing'
      });
    }

    // Attempt AI processing using Gemini with strict prompt; fallback to overlay
    let processedImageUrl: string;
    try {
      // Prefer prompt provided by client; otherwise load from file if available
      let promptText: string | undefined = requestedPrompt;
      if (!promptText) {
        try {
          const promptPath = path.resolve(__dirname, 'prompts/four-finger-gesture-prompt.md');
          promptText = fs.readFileSync(promptPath, 'utf8');
          if (promptText && promptText.length > 0) {
            promptText = promptText.substring(0, 8000);
          }
          console.log('📄 Loaded four-finger prompt from file');
        } catch (promptErr) {
          console.warn('⚠️ Could not load four-finger prompt file, using default prompt');
        }
      } else {
        console.log('📝 Using strict prompt provided by client');
      }

      const aiResult = await geminiService.processFourFingerImage(imageBuffer, mimeType, {
        style: 'natural',
        prompt: promptText,
      });

      if (aiResult.success && aiResult.processedImageData) {
        processedImageUrl = aiResult.processedImageData;
        console.log('✅ Gemini AI processing succeeded');
      } else {
        console.warn('⚠️ Gemini AI processing failed or returned no data. Falling back to overlay. Reason:', aiResult.error);
        processedImageUrl = await (geminiService as any).addFourFingerOverlay(imageBuffer, mimeType);
      }
    } catch (procErr) {
      console.error('Error during AI processing. Falling back to overlay:', procErr);
      try {
        processedImageUrl = await (geminiService as any).addFourFingerOverlay(imageBuffer, mimeType);
      } catch (overlayErr) {
        console.error('Overlay fallback failed:', overlayErr);
        return res.status(500).json({ success: false, error: 'Failed to process image' });
      }
    }

    // Persist processed URL back to record
    try {
      await supabaseService.updateImageRecord(id, {
        processed_url: processedImageUrl,
        status: 'completed'
      });
    } catch (updateErr) {
      console.warn('Warning: failed to update image record with processed URL:', updateErr);
      // Continue anyway; client already has processed URL
    }

    res.json({
      success: true,
      data: { processedImageUrl }
    });
  } catch (error) {
    console.error('Process V-Sign error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process image'
    });
  }
});

// Retrieve image by ID (original or processed if available)
app.get('/api/images/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, error: 'Image ID is required' });
    }

    const record = await supabaseService.getImageRecord(id);
    if (!record) {
      return res.status(404).json({ success: false, error: 'Image not found' });
    }

    const url = record.processed_url || record.original_url;
    return res.json({ success: true, data: { url } });
  } catch (err) {
    console.error('Get image error:', err);
    return res.status(500).json({ success: false, error: 'Failed to retrieve image' });
  }
});

app.post('/api/images/generate-image', requireTokenAccess, async (req, res) => {
  try {
    const { wallet_address, signature, message, storage_path, prompt, style } = req.body;
    
    if (!wallet_address || !signature || !message) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: wallet_address, signature, message'
      });
    }

    const generationId = uuidv4();
    const generatedImageUrl = `https://picsum.photos/512/512?random=${Date.now()}`;
    
    res.json({
      success: true,
      generated_image_url: generatedImageUrl,
      generation_id: generationId,
      message: 'Image generated successfully'
    });
  } catch (error) {
    console.error('Generate image error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate image'
    });
  }
});

// ===== FOURMOVEMENT ROUTES =====
app.get('/api/fourmovement/images', async (req, res) => {
  try {
    const pageParam = (req.query.page as string) || '1';
    const limitParam = (req.query.limit as string) || '20';
    const page = Math.max(parseInt(pageParam, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(limitParam, 10) || 20, 1), 100);

    const records = await supabaseService.getProcessedImages(limit, page);

    const images = (records || []).map((rec) => ({
      id: rec.id,
      image_url: rec.processed_url || rec.original_url,
      thumbnail_url: rec.processed_url || rec.original_url,
      optimized_url: rec.processed_url || rec.original_url,
      aspect_ratio: 1,
      created_at: rec.created_at,
      prompt: 'Four Movement',
      style: 'fourmovement',
      owner_pubkey: '',
      wallet_address: null,
    }));

    const hasMore = images.length === limit;

    res.json({
      success: true,
      data: images,
      pagination: {
        page,
        limit,
        hasMore,
      },
    });
  } catch (error) {
    console.error('4 Movement images error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch 4 Movement images'
    });
  }
});

// Error handling middleware
app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('API Error:', error);
  (res as any).status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// 404 handler - must be last
app.use((req: express.Request, res: express.Response) => {
  console.log('404 - Request not found:', req.method, req.originalUrl, req.url);
  console.log('Available routes should include: /api/test, /api/token/verify');
  (res as any).status(404).json({
    success: false,
    error: 'API endpoint not found',
    requestedPath: req.originalUrl,
    method: req.method
  });
});

// Vercel serverless function handler
export default function handler(req: VercelRequest, res: VercelResponse) {
  console.log('Handler called:', req.method, req.url);
  return app(req, res);
}

// Local development server
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`🚀 API Server running on http://localhost:${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`🖼️ 4 Movement API: http://localhost:${PORT}/fourmovement/images`);
  });
}
