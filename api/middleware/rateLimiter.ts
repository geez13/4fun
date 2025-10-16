/**
 * Advanced Rate Limiting Middleware for Database Operations
 * Provides protection against abuse and ensures fair resource usage
 */

import { Request, Response, NextFunction } from 'express';
import { securityLogger } from '../lib/logger.js';

interface RateLimitConfig {
  windowMs: number;           // Time window in milliseconds
  maxRequests: number;        // Maximum requests per window
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (req: Request) => string;
  onLimitReached?: (req: Request, res: Response) => void;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
  firstRequest: number;
}

class DatabaseRateLimiter {
  private store = new Map<string, RateLimitEntry>();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  /**
   * Create rate limiting middleware
   */
  create(config: RateLimitConfig) {
    const self = this;
    const {
      windowMs,
      maxRequests,
      skipSuccessfulRequests = false,
      skipFailedRequests = false
    } = config;
    
    const keyGenerator = config.keyGenerator || ((req: Request) => self.defaultKeyGenerator(req));
    const onLimitReached = config.onLimitReached || ((req: Request, res: Response) => self.defaultLimitHandler(req, res));

    return (req: Request, res: Response, next: NextFunction) => {
      const key = self.sanitizeKey(keyGenerator(req));
      const now = Date.now();
      
      // Get or create rate limit entry
      let entry = self.store.get(key);
      
      if (!entry || now > entry.resetTime) {
        // Create new entry or reset expired one
        entry = {
          count: 0,
          resetTime: now + windowMs,
          firstRequest: now
        };
        self.store.set(key, entry);
      }

      // Check if limit exceeded
      if (entry.count >= maxRequests) {
        // Log security event
        securityLogger.security({
          type: 'rate_limit_exceeded',
          severity: 'medium',
          details: {
            key: self.sanitizeKey(key),
            currentCount: entry.count,
            maxRequests,
            windowMs,
            userAgent: req.get('User-Agent'),
            ip: self.getClientIP(req)
          },
          timestamp: new Date(),
          source: 'DatabaseRateLimiter'
        });

        onLimitReached(req, res);
        return;
      }

      // Increment counter
      entry.count++;

      // Add rate limit headers
      res.set({
        'X-RateLimit-Limit': maxRequests.toString(),
        'X-RateLimit-Remaining': Math.max(0, maxRequests - entry.count).toString(),
        'X-RateLimit-Reset': Math.ceil(entry.resetTime / 1000).toString(),
        'X-RateLimit-Window': windowMs.toString()
      });

      // Handle response to potentially skip counting
      const originalSend = res.send;
      res.send = function(body) {
        const statusCode = res.statusCode;
        const shouldSkip = 
          (skipSuccessfulRequests && statusCode < 400) ||
          (skipFailedRequests && statusCode >= 400);

        if (shouldSkip && entry) {
          entry.count = Math.max(0, entry.count - 1);
        }

        return originalSend.call(this, body);
      };

      next();
    };
  }

  /**
   * Default key generator (IP + User Agent hash)
   */
  private defaultKeyGenerator(req: Request): string {
    const ip = this.getClientIP(req);
    const userAgent = req.get('User-Agent') || 'unknown';
    const hash = require('crypto')
      .createHash('md5')
      .update(userAgent)
      .digest('hex')
      .substring(0, 8);
    
    return `${ip}:${hash}`;
  }

  /**
   * Default limit reached handler
   */
  private defaultLimitHandler(req: Request, res: Response): void {
    res.status(429).json({
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter: res.get('X-RateLimit-Reset')
    });
  }

  /**
   * Get client IP address
   */
  private getClientIP(req: Request): string {
    return (
      req.ip ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      (req.connection as any)?.socket?.remoteAddress ||
      'unknown'
    );
  }

  /**
   * Sanitize key for logging (remove sensitive info)
   */
  private sanitizeKey(key: string): string {
    const parts = key.split(':');
    if (parts.length >= 2) {
      const ip = parts[0];
      const hash = parts[1];
      // Mask IP for privacy
      const maskedIP = ip.split('.').map((octet, index) => 
        index < 2 ? octet : 'xxx'
      ).join('.');
      return `${maskedIP}:${hash}`;
    }
    return '[SANITIZED]';
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetTime) {
        this.store.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      securityLogger.debug(`Cleaned up ${cleanedCount} expired rate limit entries`);
    }
  }

  /**
   * Get current rate limit stats
   */
  getStats(): {
    totalEntries: number;
    activeEntries: number;
    topConsumers: Array<{ key: string; count: number; remaining: number }>;
  } {
    const now = Date.now();
    const activeEntries: Array<{ key: string; count: number; remaining: number }> = [];

    for (const [key, entry] of this.store.entries()) {
      if (now <= entry.resetTime) {
        activeEntries.push({
          key: this.sanitizeKey(key),
          count: entry.count,
          remaining: Math.max(0, entry.resetTime - now)
        });
      }
    }

    // Sort by count (highest first)
    const topConsumers = activeEntries
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalEntries: this.store.size,
      activeEntries: activeEntries.length,
      topConsumers
    };
  }

  /**
   * Reset rate limit for a specific key
   */
  reset(key: string): boolean {
    return this.store.delete(key);
  }

  /**
   * Reset all rate limits
   */
  resetAll(): void {
    this.store.clear();
    securityLogger.info('All rate limits have been reset');
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.store.clear();
  }
}

// Create singleton instance
const rateLimiter = new DatabaseRateLimiter();

// Predefined rate limiting configurations
export const rateLimitConfigs = {
  // Strict limits for database writes
  databaseWrite: {
    windowMs: 60 * 1000,      // 1 minute
    maxRequests: 10,          // 10 requests per minute
    skipSuccessfulRequests: false,
    skipFailedRequests: true
  },

  // Moderate limits for database reads
  databaseRead: {
    windowMs: 60 * 1000,      // 1 minute
    maxRequests: 50,          // 50 requests per minute
    skipSuccessfulRequests: false,
    skipFailedRequests: true
  },

  // Strict limits for image uploads
  imageUpload: {
    windowMs: 60 * 1000,      // 1 minute
    maxRequests: 5,           // 5 uploads per minute
    skipSuccessfulRequests: false,
    skipFailedRequests: false
  },

  // Moderate limits for AI generation
  aiGeneration: {
    windowMs: 60 * 1000,      // 1 minute
    maxRequests: 3,           // 3 generations per minute
    skipSuccessfulRequests: false,
    skipFailedRequests: false
  },

  // General API limits
  general: {
    windowMs: 60 * 1000,      // 1 minute
    maxRequests: 100,         // 100 requests per minute
    skipSuccessfulRequests: true,
    skipFailedRequests: true
  }
};

// Export middleware creators
export const createDatabaseWriteLimit = () => rateLimiter.create(rateLimitConfigs.databaseWrite);
export const createDatabaseReadLimit = () => rateLimiter.create(rateLimitConfigs.databaseRead);
export const createImageUploadLimit = () => rateLimiter.create(rateLimitConfigs.imageUpload);
export const createAIGenerationLimit = () => rateLimiter.create(rateLimitConfigs.aiGeneration);
export const createGeneralLimit = () => rateLimiter.create(rateLimitConfigs.general);

// Export custom rate limiter
export const createCustomRateLimit = (config: RateLimitConfig) => rateLimiter.create(config);

// Export rate limiter instance for stats and management
export { rateLimiter };

// Export types
export type { RateLimitConfig };