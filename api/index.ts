/**
 * Consolidated Vercel serverless function handler
 * All API routes are handled through this single function to stay within Hobby plan limits
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { supabaseService } from './services/supabaseService';
import { requireTokenAccess } from './middleware/tokenGateMiddleware';
import { rateLimiter } from './middleware/rateLimiter';
import { securityLogger } from './lib/logger';
import { v4 as uuidv4 } from 'uuid';
import multer from 'multer';

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
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Four.Fun API is running',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      images: '/api/images',
      token: '/api/token',
      vwall: '/api/vwall',
      health: '/api/health'
    }
  });
});

// ===== HEALTH ROUTES =====
app.get('/health', async (req, res) => {
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
app.post('/auth/register', async (req, res) => {
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

app.post('/auth/login', async (req, res) => {
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

// ===== TOKEN ROUTES =====
app.post('/token/verify', async (req, res) => {
  try {
    const { wallet_address, token_address } = req.body;

    if (!wallet_address || !token_address) {
      return res.status(400).json({
        success: false,
        error: 'Wallet address and token address are required'
      });
    }

    // For now, return success (implement actual token verification logic as needed)
    res.json({
      success: true,
      verified: true,
      balance: '1000'
    });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(500).json({
      success: false,
      error: 'Token verification failed'
    });
  }
});

// ===== IMAGE ROUTES =====
app.post('/images/upload', upload.single('image'), requireTokenAccess, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No image file provided'
      });
    }

    const imageId = uuidv4();
    
    // For now, return success (implement actual image upload logic as needed)
    res.json({
      success: true,
      imageId,
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

app.post('/images/generate-image', requireTokenAccess, async (req, res) => {
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

// ===== VWALL ROUTES =====
app.get('/vwall/images', async (req, res) => {
  try {
    // For now, return empty array (implement actual vwall logic as needed)
    res.json({
      success: true,
      images: []
    });
  } catch (error) {
    console.error('VWall images error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch VWall images'
    });
  }
});

// Error handling middleware
app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('API Error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// 404 handler
app.use((req: express.Request, res: express.Response) => {
  res.status(404).json({
    success: false,
    error: 'API endpoint not found'
  });
});

// Vercel serverless function handler
export default function handler(req: VercelRequest, res: VercelResponse) {
  return app(req, res);
}