import express, { Request, Response } from 'express';
import { 
  verifyTokenAccess, 
  validateUploadSession,
  TokenVerificationRequest 
} from '../services/tokenVerificationService.js';

const router = express.Router();

/**
 * POST /api/token/verify
 * Verify SOL token balance and create upload session for qualified users
 */
router.post('/verify', async (req: Request, res: Response) => {
  try {
    console.log('=== Token Verification API Called ===');
    const { walletAddress, signature, message, userId } = req.body;
    console.log(`Request body:`, { walletAddress, signature: signature?.substring(0, 20) + '...', message, userId });

    // Validate required fields
    if (!walletAddress || !signature || !message) {
      console.log('Missing required fields');
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: walletAddress, signature, message'
      });
    }

    // Create verification request
    const verificationRequest: TokenVerificationRequest = {
      walletAddress,
      signature,
      message
    };

    // Verify token access
    const result = await verifyTokenAccess(verificationRequest, userId || null);

    if (result.error) {
      return res.status(400).json({
        success: false,
        error: result.error,
        hasAccess: result.hasAccess,
        tokenBalance: result.tokenBalance,
        requiredBalance: result.requiredBalance
      });
    }

    console.log('Sending successful response:', {
      hasAccess: result.hasAccess,
      tokenBalance: result.tokenBalance,
      requiredBalance: result.requiredBalance,
      verificationId: result.verificationId,
      sessionToken: result.sessionToken ? 'present' : 'none'
    });

    return res.status(200).json({
      success: true,
      data: {
        hasAccess: result.hasAccess,
        tokenBalance: result.tokenBalance,
        requiredBalance: result.requiredBalance,
        verificationId: result.verificationId,
        sessionToken: result.sessionToken
      },
      message: result.hasAccess 
        ? 'Token verification successful. Upload access granted.'
        : `Insufficient token balance. You have ${result.tokenBalance} tokens, but need at least ${result.requiredBalance} tokens.`
    });

  } catch (error) {
    console.error('Token verification API error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error during token verification'
    });
  }
});

/**
 * POST /api/token/validate-session
 * Validate upload session token
 */
router.post('/validate-session', async (req: Request, res: Response) => {
  try {
    const { sessionToken } = req.body;

    if (!sessionToken) {
      return res.status(400).json({
        success: false,
        error: 'Session token is required'
      });
    }

    const isValid = await validateUploadSession(sessionToken);

    return res.status(200).json({
      success: true,
      isValid,
      message: isValid ? 'Session is valid' : 'Session is invalid or expired'
    });

  } catch (error) {
    console.error('Session validation API error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error during session validation'
    });
  }
});

/**
 * GET /api/token/config
 * Get token configuration (public endpoint)
 */
router.get('/config', async (req: Request, res: Response) => {
  try {
    return res.status(200).json({
      success: true,
      config: {
        solTokenAddress: 'So11111111111111111111111111111111111111111',
        minimumBalance: 1,
        tokenSymbol: 'SOL',
        purchaseUrl: 'https://pump.fun',
        verificationExpiryHours: 1,
        sessionExpiryMinutes: 30
      }
    });
  } catch (error) {
    console.error('Token config API error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;