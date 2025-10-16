import { ethers } from 'ethers';
import { supabase } from './supabaseService.js';

// "4" token contract address on BNB Chain
const VERIFICATION_TOKEN_ADDRESS = '0x0a43fc31a73013089df59194872ecae4cae14444'; // "4" token BEP-20 contract address
const MINIMUM_TOKEN_BALANCE = ethers.parseUnits('1', 18); // 1 token minimum requirement (18 decimals)
const MINIMUM_TOKEN_BALANCE_NUMBER = 1; // 1 token minimum requirement for API responses

// BNB Chain RPC connection
const provider = new ethers.JsonRpcProvider(
  process.env.BSC_RPC_URL || 'https://bsc-dataseed1.binance.org/'
);

// Standard BEP-20 token ABI (minimal for balance checking)
const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function name() view returns (string)'
];

export interface TokenVerificationRequest {
  walletAddress: string;
  signature: string;
  message: string;
}

export interface TokenVerificationResponse {
  hasAccess: boolean;
  tokenBalance: number;
  requiredBalance: number;
  verificationId?: string;
  sessionToken?: string;
  error?: string;
}

export interface UploadSession {
  id: string;
  verificationId: string;
  userId: string;
  sessionToken: string;
  expiresAt: Date;
}

/**
 * Verify wallet signature to ensure the request is authentic
 */
export function verifyWalletSignature(
  walletAddress: string,
  signature: string,
  message: string
): boolean {
  try {
    // Verify the signature using ethers
    const recoveredAddress = ethers.verifyMessage(message, signature);
    return recoveredAddress.toLowerCase() === walletAddress.toLowerCase();
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

/**
 * Get verification token balance for a wallet address
 */
export async function getTokenBalance(walletAddress: string): Promise<number> {
  try {
    console.log(`Getting token balance for wallet: ${walletAddress}`);
    
    // Validate wallet address format
    if (!ethers.isAddress(walletAddress)) {
      throw new Error('Invalid wallet address format');
    }
    
    // Create contract instance
    const tokenContract = new ethers.Contract(VERIFICATION_TOKEN_ADDRESS, ERC20_ABI, provider);
    
    try {
      // Get the token balance
      const balance = await tokenContract.balanceOf(walletAddress);
      console.log(`Raw token balance: ${balance.toString()}`);
      
      // Get token decimals
      const decimals = await tokenContract.decimals();
      console.log(`Token decimals: ${decimals}`);
      
      // Convert to human readable format
      const actualBalance = Number(ethers.formatUnits(balance, decimals));
      console.log(`Calculated token balance: ${actualBalance}`);
      
      return actualBalance;
    } catch (contractError) {
      console.log(`Contract error: ${contractError.message}`);
      // If contract call fails, return 0 balance
      return 0;
    }
  } catch (error) {
    console.error('Failed to get token balance:', error);
    throw new Error('Failed to retrieve token balance');
  }
}

/**
 * Check if wallet has minimum required verification tokens
 */
export function hasRequiredTokens(balance: number): boolean {
  return balance >= Number(ethers.formatUnits(MINIMUM_TOKEN_BALANCE, 18));
}

/**
 * Store token verification result in database
 */
export async function storeTokenVerification(
  userId: string | null,
  walletAddress: string,
  tokenBalance: number,
  hasAccess: boolean
): Promise<string> {
  try {
    const { data, error } = await supabase
      .from('token_verifications')
      .insert({
        user_id: userId,
        wallet_address: walletAddress,
        token_balance: tokenBalance,
        has_access: hasAccess,
        verified_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1 hour expiry
      })
      .select('id')
      .single();

    if (error) {
      console.error('Failed to store token verification:', error);
      throw new Error('Failed to store verification result');
    }

    return data.id;
  } catch (error) {
    console.error('Database error in storeTokenVerification:', error);
    throw new Error('Database operation failed');
  }
}

/**
 * Create upload session for verified users
 */
export async function createUploadSession(
  verificationId: string,
  userId: string | null
): Promise<string> {
  try {
    const sessionToken = generateSessionToken();
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    const { data, error } = await supabase
      .from('upload_sessions')
      .insert({
        verification_id: verificationId,
        user_id: userId,
        session_token: sessionToken,
        expires_at: expiresAt.toISOString()
      })
      .select('session_token')
      .single();

    if (error) {
      console.error('Failed to create upload session:', error);
      throw new Error('Failed to create upload session');
    }

    return data.session_token;
  } catch (error) {
    console.error('Database error in createUploadSession:', error);
    throw new Error('Session creation failed');
  }
}

/**
 * Validate upload session token
 */
export async function validateUploadSession(sessionToken: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('upload_sessions')
      .select('expires_at, verification_id')
      .eq('session_token', sessionToken)
      .single();

    if (error || !data) {
      return false;
    }

    // Check if session is expired
    const now = new Date();
    const expiresAt = new Date(data.expires_at);
    
    if (now > expiresAt) {
      // Clean up expired session
      await supabase
        .from('upload_sessions')
        .delete()
        .eq('session_token', sessionToken);
      return false;
    }

    // Check if associated verification is still valid
    const { data: verification, error: verificationError } = await supabase
      .from('token_verifications')
      .select('has_access, expires_at')
      .eq('id', data.verification_id)
      .single();

    if (verificationError || !verification) {
      return false;
    }

    const verificationExpiresAt = new Date(verification.expires_at);
    return verification.has_access && now <= verificationExpiresAt;
  } catch (error) {
    console.error('Session validation error:', error);
    return false;
  }
}

/**
 * Get existing valid verification for wallet
 */
export async function getExistingVerification(
  walletAddress: string
): Promise<{ id: string; hasAccess: boolean; tokenBalance: number } | null> {
  try {
    const { data, error } = await supabase
      .from('token_verifications')
      .select('id, has_access, token_balance')
      .eq('wallet_address', walletAddress)
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return null;
      }
      throw error;
    }

    return {
      id: data.id,
      hasAccess: data.has_access,
      tokenBalance: data.token_balance
    };
  } catch (error) {
    console.error('Error getting existing verification:', error);
    return null;
  }
}

/**
 * Clear existing verification records for a wallet (for debugging)
 */
export async function clearExistingVerifications(walletAddress: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('token_verifications')
      .delete()
      .eq('wallet_address', walletAddress);

    if (error) {
      console.error('Error clearing existing verifications:', error);
    } else {
      console.log(`Cleared existing verifications for wallet: ${walletAddress}`);
    }
  } catch (error) {
    console.error('Error clearing existing verifications:', error);
  }
}

/**
 * Clean up expired verifications and sessions
 */
export async function cleanupExpiredRecords(): Promise<void> {
  try {
    const now = new Date().toISOString();

    // Clean up expired verifications
    await supabase
      .from('token_verifications')
      .delete()
      .lt('expires_at', now);

    // Clean up expired sessions
    await supabase
      .from('upload_sessions')
      .delete()
      .lt('expires_at', now);

    console.log('Cleanup completed for expired records');
  } catch (error) {
    console.error('Cleanup failed:', error);
  }
}

/**
 * Generate secure session token
 */
function generateSessionToken(): string {
  const timestamp = Date.now().toString();
  const randomBytes = Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  return `${timestamp}_${randomBytes}`;
}

/**
 * Main token verification function
 */
export async function verifyTokenAccess(
  request: TokenVerificationRequest,
  userId: string | null = null
): Promise<TokenVerificationResponse> {
  try {
    console.log('=== Token Verification Started ===');
    const { walletAddress, signature, message } = request;
    console.log(`Wallet: ${walletAddress}`);
    console.log(`Message: ${message}`);

    // Validate input
    if (!walletAddress || !signature || !message) {
      console.log('Missing required parameters');
      return {
        hasAccess: false,
        tokenBalance: 0,
        requiredBalance: MINIMUM_TOKEN_BALANCE_NUMBER,
        error: 'Missing required parameters'
      };
    }

    // Verify wallet signature
    console.log('Verifying wallet signature...');
    if (!verifyWalletSignature(walletAddress, signature, message)) {
      console.log('Invalid wallet signature');
      return {
        hasAccess: false,
        tokenBalance: 0,
        requiredBalance: MINIMUM_TOKEN_BALANCE_NUMBER,
        error: 'Invalid wallet signature'
      };
    }
    console.log('Wallet signature verified successfully');

    // Clear existing verification records for debugging
    console.log('Clearing existing verification records for debugging...');
    await clearExistingVerifications(walletAddress);

    // Check for existing valid verification (temporarily disabled for debugging)
    // const existingVerification = await getExistingVerification(walletAddress);
    // if (existingVerification) {
    //   let sessionToken: string | undefined;
    //   
    //   if (existingVerification.hasAccess) {
    //     sessionToken = await createUploadSession(existingVerification.id, userId);
    //   }

    //   return {
    //     hasAccess: existingVerification.hasAccess,
    //     tokenBalance: existingVerification.tokenBalance,
    //     requiredBalance: MINIMUM_TOKEN_BALANCE,
    //     verificationId: existingVerification.id,
    //     sessionToken
    //   };
    // }

    // Get current token balance
    console.log('Getting current token balance...');
    const tokenBalance = await getTokenBalance(walletAddress);
    console.log(`Token balance retrieved: ${tokenBalance}`);
    
    const hasAccess = hasRequiredTokens(tokenBalance);
    console.log(`Has required tokens (${MINIMUM_TOKEN_BALANCE}): ${hasAccess}`);

    // Store verification result
    console.log('Storing verification result...');
    const verificationId = await storeTokenVerification(
      userId,
      walletAddress,
      tokenBalance,
      hasAccess
    );
    console.log(`Verification stored with ID: ${verificationId}`);

    // Create upload session if user has access
    let sessionToken: string | undefined;
    if (hasAccess) {
      sessionToken = await createUploadSession(verificationId, userId);
    }

    return {
      hasAccess,
      tokenBalance,
      requiredBalance: MINIMUM_TOKEN_BALANCE_NUMBER,
      verificationId,
      sessionToken
    };

  } catch (error) {
    console.error('Token verification error:', error);
    return {
      hasAccess: false,
      tokenBalance: 0,
      requiredBalance: MINIMUM_TOKEN_BALANCE_NUMBER,
      error: error instanceof Error ? error.message : 'Verification failed'
    };
  }
}

// Periodic cleanup (run every hour)
setInterval(cleanupExpiredRecords, 60 * 60 * 1000);