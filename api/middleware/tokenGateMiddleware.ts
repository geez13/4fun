import { Request, Response, NextFunction } from 'express';
import { validateUploadSession } from '../services/tokenVerificationService.js';

// Extend Request interface to include token verification data
declare global {
  namespace Express {
    interface Request {
      tokenVerification?: {
        sessionToken: string;
        verificationId: string;
        hasAccess: boolean;
      };
    }
  }
}

/**
 * Middleware to enforce token-gated access for upload endpoints
 */
export async function requireTokenAccess(
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> {
  try {
    const sessionToken = req.headers['x-session-token'] as string || req.body.sessionToken;

    if (!sessionToken) {
      res.status(401).json({
        success: false,
        error: 'Token verification required',
        code: 'TOKEN_REQUIRED',
        message: 'Please verify your SOL token balance to access upload features'
      });
      return;
    }

    // Validate session token
    const isValid = await validateUploadSession(sessionToken);

    if (!isValid) {
      res.status(403).json({
        success: false,
        error: 'Invalid or expired token session',
        code: 'TOKEN_INVALID',
        message: 'Your token verification has expired. Please verify your SOL balance again.'
      });
      return;
    }

    // Add token verification data to request
    req.tokenVerification = {
      sessionToken,
      verificationId: '', // This could be extracted from session if needed
      hasAccess: true
    };

    next();
  } catch (error) {
    console.error('Token gate middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'Token verification failed',
      code: 'TOKEN_ERROR',
      message: 'Unable to verify token access. Please try again.'
    });
  }
}

/**
 * Optional middleware for endpoints that can work with or without token access
 * Sets req.tokenVerification if valid session is provided
 */
export async function optionalTokenAccess(
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> {
  try {
    const sessionToken = req.headers['x-session-token'] as string || req.body.sessionToken;

    if (sessionToken) {
      const isValid = await validateUploadSession(sessionToken);
      
      if (isValid) {
        req.tokenVerification = {
          sessionToken,
          verificationId: '',
          hasAccess: true
        };
      }
    }

    next();
  } catch (error) {
    console.error('Optional token middleware error:', error);
    // Don't block the request, just continue without token verification
    next();
  }
}