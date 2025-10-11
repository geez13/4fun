/**
 * Enhanced Supabase Connection Manager
 * Provides enterprise-level security, connection pooling, and monitoring
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { EventEmitter } from 'events';

// Connection configuration interface
export interface ConnectionConfig {
  url: string;
  serviceKey: string;
  anonKey?: string;
  maxRetries?: number;
  retryDelay?: number;
  connectionTimeout?: number;
  poolSize?: number;
  healthCheckInterval?: number;
  enableLogging?: boolean;
  rateLimitRequests?: number;
  rateLimitWindow?: number;
}

// Connection metrics interface
export interface ConnectionMetrics {
  totalConnections: number;
  activeConnections: number;
  failedConnections: number;
  averageResponseTime: number;
  lastHealthCheck: Date;
  uptime: number;
  requestCount: number;
  errorCount: number;
}

// Connection pool entry
interface PoolEntry {
  client: SupabaseClient;
  isActive: boolean;
  lastUsed: Date;
  connectionId: string;
}

// Rate limiting entry
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

export class SupabaseConnectionManager extends EventEmitter {
  private config: Required<ConnectionConfig>;
  private connectionPool: PoolEntry[] = [];
  private metrics: ConnectionMetrics;
  private healthCheckTimer?: NodeJS.Timeout;
  private isInitialized = false;
  private rateLimitMap = new Map<string, RateLimitEntry>();
  private logger: (level: string, message: string, meta?: any) => void;

  constructor(config: ConnectionConfig) {
    super();
    
    // Set default configuration
    this.config = {
      url: config.url,
      serviceKey: config.serviceKey,
      anonKey: config.anonKey || '',
      maxRetries: config.maxRetries || 3,
      retryDelay: config.retryDelay || 1000,
      connectionTimeout: config.connectionTimeout || 10000,
      poolSize: config.poolSize || 5,
      healthCheckInterval: config.healthCheckInterval || 30000,
      enableLogging: config.enableLogging !== false,
      rateLimitRequests: config.rateLimitRequests || 100,
      rateLimitWindow: config.rateLimitWindow || 60000, // 1 minute
    };

    // Initialize metrics
    this.metrics = {
      totalConnections: 0,
      activeConnections: 0,
      failedConnections: 0,
      averageResponseTime: 0,
      lastHealthCheck: new Date(),
      uptime: Date.now(),
      requestCount: 0,
      errorCount: 0,
    };

    // Setup logger
    this.logger = this.config.enableLogging 
      ? (level: string, message: string, meta?: any) => {
          const timestamp = new Date().toISOString();
          console.log(`[${timestamp}] [${level.toUpperCase()}] [SupabaseManager] ${message}`, meta || '');
        }
      : () => {}; // No-op if logging disabled

    this.validateConfiguration();
  }

  /**
   * Validate connection configuration
   */
  private validateConfiguration(): void {
    if (!this.config.url) {
      throw new Error('Supabase URL is required');
    }

    if (!this.config.url.startsWith('https://')) {
      throw new Error('Supabase URL must use HTTPS');
    }

    if (!this.config.url.includes('.supabase.co')) {
      throw new Error('Invalid Supabase URL format');
    }

    if (!this.config.serviceKey) {
      throw new Error('Supabase service key is required');
    }

    if (!this.config.serviceKey.startsWith('eyJ')) {
      throw new Error('Invalid Supabase service key format');
    }

    if (this.config.poolSize < 1 || this.config.poolSize > 20) {
      throw new Error('Pool size must be between 1 and 20');
    }

    this.logger('info', 'Configuration validated successfully');
  }

  /**
   * Initialize the connection manager
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      this.logger('warn', 'Connection manager already initialized');
      return;
    }

    try {
      this.logger('info', 'Initializing Supabase connection manager...');
      
      // Create initial connection pool
      await this.createConnectionPool();
      
      // Mark as initialized before starting health checks
      this.isInitialized = true;
      
      // Start health checks after initialization
      this.startHealthChecks();
      
      // Test initial connection
      const isHealthy = await this.performHealthCheck();
      if (!isHealthy) {
        this.logger('warn', 'Initial health check failed, but connection manager is initialized');
      }

      this.logger('info', 'Connection manager initialized successfully', {
        poolSize: this.config.poolSize,
        healthCheckInterval: this.config.healthCheckInterval,
      });

      this.emit('initialized');
    } catch (error) {
      this.logger('error', 'Failed to initialize connection manager', error);
      this.isInitialized = false; // Reset initialization flag on error
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Create connection pool
   */
  private async createConnectionPool(): Promise<void> {
    this.logger('info', `Creating connection pool with ${this.config.poolSize} connections`);
    
    for (let i = 0; i < this.config.poolSize; i++) {
      try {
        const client = createClient(this.config.url, this.config.serviceKey, {
          auth: {
            autoRefreshToken: true,
            persistSession: false,
          },
          global: {
            headers: {
              'X-Connection-Pool-ID': `pool-${i}`,
            },
          },
        });

        const poolEntry: PoolEntry = {
          client,
          isActive: false,
          lastUsed: new Date(),
          connectionId: `conn-${i}-${Date.now()}`,
        };

        this.connectionPool.push(poolEntry);
        this.metrics.totalConnections++;
        
        this.logger('debug', `Created connection ${poolEntry.connectionId}`);
      } catch (error) {
        this.logger('error', `Failed to create connection ${i}`, error);
        this.metrics.failedConnections++;
        throw error;
      }
    }
  }

  /**
   * Get an available connection from the pool
   */
  async getConnection(): Promise<SupabaseClient> {
    if (!this.isInitialized) {
      throw new Error('Connection manager not initialized');
    }

    // Find available connection
    const availableConnection = this.connectionPool.find(entry => !entry.isActive);
    
    if (!availableConnection) {
      // If no available connections, wait and retry
      await this.waitForAvailableConnection();
      return this.getConnection();
    }

    // Mark connection as active
    availableConnection.isActive = true;
    availableConnection.lastUsed = new Date();
    this.metrics.activeConnections++;

    this.logger('debug', `Acquired connection ${availableConnection.connectionId}`);
    
    return availableConnection.client;
  }

  /**
   * Release a connection back to the pool
   */
  releaseConnection(client: SupabaseClient): void {
    const poolEntry = this.connectionPool.find(entry => entry.client === client);
    
    if (poolEntry && poolEntry.isActive) {
      poolEntry.isActive = false;
      poolEntry.lastUsed = new Date();
      this.metrics.activeConnections--;
      
      this.logger('debug', `Released connection ${poolEntry.connectionId}`);
    }
  }

  /**
   * Wait for an available connection
   */
  private async waitForAvailableConnection(): Promise<void> {
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        const hasAvailable = this.connectionPool.some(entry => !entry.isActive);
        if (hasAvailable) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);

      // Timeout after 5 seconds
      setTimeout(() => {
        clearInterval(checkInterval);
        resolve();
      }, 5000);
    });
  }

  /**
   * Execute a database operation with retry logic
   */
  async executeWithRetry<T>(
    operation: (client: SupabaseClient) => Promise<T>,
    identifier?: string
  ): Promise<T> {
    // Check rate limiting
    if (identifier && !this.checkRateLimit(identifier)) {
      throw new Error('Rate limit exceeded');
    }

    const startTime = Date.now();
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      let client: SupabaseClient | null = null;
      
      try {
        client = await this.getConnection();
        const result = await Promise.race([
          operation(client),
          this.createTimeoutPromise<T>(this.config.connectionTimeout),
        ]);

        // Update metrics
        const responseTime = Date.now() - startTime;
        this.updateResponseTimeMetrics(responseTime);
        this.metrics.requestCount++;

        this.logger('debug', `Operation completed successfully on attempt ${attempt}`, {
          responseTime,
          identifier,
        });

        return result;
      } catch (error) {
        lastError = error as Error;
        this.metrics.errorCount++;
        
        this.logger('warn', `Operation failed on attempt ${attempt}`, {
          error: lastError.message,
          identifier,
          attempt,
        });

        if (attempt < this.config.maxRetries) {
          await this.delay(this.config.retryDelay * attempt);
        }
      } finally {
        if (client) {
          this.releaseConnection(client);
        }
      }
    }

    this.logger('error', 'Operation failed after all retry attempts', {
      error: lastError?.message,
      identifier,
      maxRetries: this.config.maxRetries,
    });

    throw lastError || new Error('Operation failed after retries');
  }

  /**
   * Check rate limiting for an identifier
   */
  private checkRateLimit(identifier: string): boolean {
    const now = Date.now();
    const entry = this.rateLimitMap.get(identifier);

    if (!entry || now > entry.resetTime) {
      // Reset or create new entry
      this.rateLimitMap.set(identifier, {
        count: 1,
        resetTime: now + this.config.rateLimitWindow,
      });
      return true;
    }

    if (entry.count >= this.config.rateLimitRequests) {
      this.logger('warn', 'Rate limit exceeded', { identifier, count: entry.count });
      return false;
    }

    entry.count++;
    return true;
  }

  /**
   * Create a timeout promise
   */
  private createTimeoutPromise<T>(timeout: number): Promise<T> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Operation timed out after ${timeout}ms`));
      }, timeout);
    });
  }

  /**
   * Update response time metrics
   */
  private updateResponseTimeMetrics(responseTime: number): void {
    const currentAvg = this.metrics.averageResponseTime;
    const requestCount = this.metrics.requestCount;
    
    this.metrics.averageResponseTime = 
      (currentAvg * requestCount + responseTime) / (requestCount + 1);
  }

  /**
   * Start health checks
   */
  private startHealthChecks(): void {
    this.healthCheckTimer = setInterval(async () => {
      await this.performHealthCheck();
    }, this.config.healthCheckInterval);

    this.logger('info', 'Health checks started', {
      interval: this.config.healthCheckInterval,
    });
  }

  /**
   * Perform health check
   */
  async performHealthCheck(): Promise<boolean> {
    // Skip health check if not initialized
    if (!this.isInitialized) {
      this.logger('debug', 'Skipping health check - connection manager not initialized');
      return false;
    }

    try {
      const client = await this.getConnection();
      
      // Simple query to test connection
      const { error } = await client.from('images').select('count').limit(1);
      
      this.releaseConnection(client);
      
      if (error) {
        this.logger('warn', 'Health check failed', error);
        this.emit('healthCheckFailed', error);
        return false;
      }

      this.metrics.lastHealthCheck = new Date();
      this.logger('debug', 'Health check passed');
      this.emit('healthCheckPassed');
      return true;
    } catch (error) {
      this.logger('error', 'Health check error', error);
      this.emit('healthCheckFailed', error);
      return false;
    }
  }

  /**
   * Get connection metrics
   */
  getMetrics(): ConnectionMetrics {
    return {
      ...this.metrics,
      uptime: Date.now() - this.metrics.uptime,
    };
  }

  /**
   * Cleanup and close all connections
   */
  async cleanup(): Promise<void> {
    this.logger('info', 'Cleaning up connection manager...');
    
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
    }

    // Wait for active connections to finish
    while (this.metrics.activeConnections > 0) {
      await this.delay(100);
    }

    this.connectionPool.length = 0;
    this.rateLimitMap.clear();
    this.isInitialized = false;

    this.logger('info', 'Connection manager cleaned up');
    this.emit('cleanup');
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Check if manager is healthy
   */
  isHealthy(): boolean {
    const timeSinceLastCheck = Date.now() - this.metrics.lastHealthCheck.getTime();
    return this.isInitialized && timeSinceLastCheck < this.config.healthCheckInterval * 2;
  }

  /**
   * Get configuration (without sensitive data)
   */
  getConfig(): Partial<ConnectionConfig> {
    return {
      maxRetries: this.config.maxRetries,
      retryDelay: this.config.retryDelay,
      connectionTimeout: this.config.connectionTimeout,
      poolSize: this.config.poolSize,
      healthCheckInterval: this.config.healthCheckInterval,
      enableLogging: this.config.enableLogging,
      rateLimitRequests: this.config.rateLimitRequests,
      rateLimitWindow: this.config.rateLimitWindow,
    };
  }
}