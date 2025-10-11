/**
 * Enhanced Security-Focused Logging System
 * Provides structured logging with security considerations and performance monitoring
 */

import { createHash } from 'crypto';

export interface LogContext {
  userId?: string;
  requestId?: string;
  operation?: string;
  duration?: number;
  metadata?: Record<string, any>;
}

export interface SecurityEvent {
  type: 'auth_failure' | 'rate_limit_exceeded' | 'invalid_input' | 'suspicious_activity';
  severity: 'low' | 'medium' | 'high' | 'critical';
  details: Record<string, any>;
  timestamp: Date;
  source: string;
}

export interface PerformanceMetrics {
  operation: string;
  duration: number;
  success: boolean;
  timestamp: Date;
  resourceUsage?: {
    memory?: number;
    cpu?: number;
  };
}

class SecurityLogger {
  private sensitiveFields = [
    'password', 'token', 'key', 'secret', 'auth', 'credential',
    'api_key', 'access_token', 'refresh_token', 'session_id',
    'private_key', 'wallet_private_key', 'mnemonic'
  ];

  private performanceMetrics: PerformanceMetrics[] = [];
  private securityEvents: SecurityEvent[] = [];
  private maxMetricsHistory = 1000;
  private maxSecurityHistory = 500;

  /**
   * Sanitize sensitive data from logs
   */
  private sanitizeData(data: any): any {
    if (typeof data !== 'object' || data === null) {
      return data;
    }

    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeData(item));
    }

    const sanitized: any = {};
    for (const [key, value] of Object.entries(data)) {
      const lowerKey = key.toLowerCase();
      const isSensitive = this.sensitiveFields.some(field => 
        lowerKey.includes(field)
      );

      if (isSensitive) {
        sanitized[key] = this.hashSensitiveValue(String(value));
      } else if (typeof value === 'object') {
        sanitized[key] = this.sanitizeData(value);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * Hash sensitive values for audit trails
   */
  private hashSensitiveValue(value: string): string {
    if (!value || value.length < 4) {
      return '[REDACTED]';
    }
    
    const hash = createHash('sha256').update(value).digest('hex').substring(0, 8);
    return `[HASH:${hash}]`;
  }

  /**
   * Generate unique request ID for tracing
   */
  generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Log information with context
   */
  info(message: string, context?: LogContext): void {
    const logEntry = {
      level: 'INFO',
      timestamp: new Date().toISOString(),
      message,
      context: context ? this.sanitizeData(context) : undefined,
      service: 'SupabaseService'
    };

    console.log(JSON.stringify(logEntry));
  }

  /**
   * Log warnings with context
   */
  warn(message: string, context?: LogContext): void {
    const logEntry = {
      level: 'WARN',
      timestamp: new Date().toISOString(),
      message,
      context: context ? this.sanitizeData(context) : undefined,
      service: 'SupabaseService'
    };

    console.warn(JSON.stringify(logEntry));
  }

  /**
   * Log errors with sanitized stack traces
   */
  error(message: string, error?: Error | any, context?: LogContext): void {
    const sanitizedError = error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack?.split('\n').slice(0, 5).join('\n') // Limit stack trace
    } : this.sanitizeData(error);

    const logEntry = {
      level: 'ERROR',
      timestamp: new Date().toISOString(),
      message,
      error: sanitizedError,
      context: context ? this.sanitizeData(context) : undefined,
      service: 'SupabaseService'
    };

    console.error(JSON.stringify(logEntry));
  }

  /**
   * Log debug information (only in development)
   */
  debug(message: string, context?: LogContext): void {
    if (process.env.NODE_ENV !== 'development') {
      return;
    }

    const logEntry = {
      level: 'DEBUG',
      timestamp: new Date().toISOString(),
      message,
      context: context ? this.sanitizeData(context) : undefined,
      service: 'SupabaseService'
    };

    console.debug(JSON.stringify(logEntry));
  }

  /**
   * Log security events
   */
  security(event: SecurityEvent): void {
    const sanitizedEvent = {
      ...event,
      details: this.sanitizeData(event.details),
      id: this.generateRequestId()
    };

    // Store for analysis
    this.securityEvents.push(sanitizedEvent);
    if (this.securityEvents.length > this.maxSecurityHistory) {
      this.securityEvents.shift();
    }

    const logEntry = {
      level: 'SECURITY',
      timestamp: new Date().toISOString(),
      event: sanitizedEvent,
      service: 'SupabaseService'
    };

    // Log to console with appropriate level
    if (event.severity === 'critical' || event.severity === 'high') {
      console.error(JSON.stringify(logEntry));
    } else {
      console.warn(JSON.stringify(logEntry));
    }
  }

  /**
   * Log performance metrics
   */
  performance(metrics: PerformanceMetrics): void {
    const sanitizedMetrics = this.sanitizeData(metrics);
    
    // Store for analysis
    this.performanceMetrics.push(sanitizedMetrics);
    if (this.performanceMetrics.length > this.maxMetricsHistory) {
      this.performanceMetrics.shift();
    }

    const logEntry = {
      level: 'PERFORMANCE',
      timestamp: new Date().toISOString(),
      metrics: sanitizedMetrics,
      service: 'SupabaseService'
    };

    console.log(JSON.stringify(logEntry));
  }

  /**
   * Get performance analytics
   */
  getPerformanceAnalytics(operation?: string): {
    averageDuration: number;
    successRate: number;
    totalOperations: number;
    recentMetrics: PerformanceMetrics[];
  } {
    const filteredMetrics = operation 
      ? this.performanceMetrics.filter(m => m.operation === operation)
      : this.performanceMetrics;

    if (filteredMetrics.length === 0) {
      return {
        averageDuration: 0,
        successRate: 0,
        totalOperations: 0,
        recentMetrics: []
      };
    }

    const totalDuration = filteredMetrics.reduce((sum, m) => sum + m.duration, 0);
    const successCount = filteredMetrics.filter(m => m.success).length;

    return {
      averageDuration: totalDuration / filteredMetrics.length,
      successRate: (successCount / filteredMetrics.length) * 100,
      totalOperations: filteredMetrics.length,
      recentMetrics: filteredMetrics.slice(-10) // Last 10 operations
    };
  }

  /**
   * Get security event summary
   */
  getSecuritySummary(): {
    totalEvents: number;
    eventsByType: Record<string, number>;
    eventsBySeverity: Record<string, number>;
    recentEvents: SecurityEvent[];
  } {
    const eventsByType: Record<string, number> = {};
    const eventsBySeverity: Record<string, number> = {};

    this.securityEvents.forEach(event => {
      eventsByType[event.type] = (eventsByType[event.type] || 0) + 1;
      eventsBySeverity[event.severity] = (eventsBySeverity[event.severity] || 0) + 1;
    });

    return {
      totalEvents: this.securityEvents.length,
      eventsByType,
      eventsBySeverity,
      recentEvents: this.securityEvents.slice(-10) // Last 10 events
    };
  }

  /**
   * Clear old metrics and events
   */
  cleanup(): void {
    const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
    
    this.performanceMetrics = this.performanceMetrics.filter(
      m => m.timestamp > cutoffTime
    );
    
    this.securityEvents = this.securityEvents.filter(
      e => e.timestamp > cutoffTime
    );
  }
}

// Export singleton instance
export const securityLogger = new SecurityLogger();

// Export utility functions
export const createLogContext = (
  userId?: string,
  operation?: string,
  metadata?: Record<string, any>
): LogContext => ({
  userId,
  requestId: securityLogger.generateRequestId(),
  operation,
  metadata
});

export const measurePerformance = async <T>(
  operation: string,
  fn: () => Promise<T>
): Promise<T> => {
  const startTime = Date.now();
  let success = false;
  let result: T;

  try {
    result = await fn();
    success = true;
    return result;
  } catch (error) {
    success = false;
    throw error;
  } finally {
    const duration = Date.now() - startTime;
    securityLogger.performance({
      operation,
      duration,
      success,
      timestamp: new Date()
    });
  }
};