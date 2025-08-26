/**
 * Rate Limiting Middleware
 * Handles rate limiting for third-party API calls and application endpoints
 * Provides both in-memory and Redis-based rate limiting options
 */

const logger = require('./utils/logger');

class RateLimiter {
    constructor(options = {}) {
        this.options = {
            windowMs: options.windowMs || 60000, // 1 minute default
            maxRequests: options.maxRequests || 100,
            keyGenerator: options.keyGenerator || this.defaultKeyGenerator,
            skipSuccessfulRequests: options.skipSuccessfulRequests || false,
            skipFailedRequests: options.skipFailedRequests || false,
            onLimitReached: options.onLimitReached || this.defaultOnLimitReached,
            store: options.store || 'memory' // 'memory' or 'redis'
        };
        
        // In-memory store for rate limiting
        this.memoryStore = new Map();
        
        // Cleanup interval for memory store
        this.cleanupInterval = setInterval(() => {
            this.cleanupExpiredEntries();
        }, this.options.windowMs);
    }

    /**
     * Default key generator - uses IP address
     */
    defaultKeyGenerator(req) {
        return req.ip || req.connection.remoteAddress || 'unknown';
    }

    /**
     * Default handler when rate limit is reached
     */
    defaultOnLimitReached(req, res, options) {
        logger.warn('Rate limit exceeded', {
            ip: req.ip,
            path: req.path,
            method: req.method,
            userAgent: req.get('User-Agent')
        });
        
        res.status(429).json({
            error: 'Too Many Requests',
            message: `Rate limit exceeded. Try again in ${Math.ceil(options.windowMs / 1000)} seconds.`,
            retryAfter: Math.ceil(options.windowMs / 1000)
        });
    }

    /**
     * Express middleware for rate limiting
     */
    middleware() {
        return async (req, res, next) => {
            try {
                const key = this.options.keyGenerator(req);
                const now = Date.now();
                const windowStart = now - this.options.windowMs;
                
                // Get current request count
                const requestCount = await this.getRequestCount(key, windowStart, now);
                
                // Check if limit exceeded
                if (requestCount >= this.options.maxRequests) {
                    return this.options.onLimitReached(req, res, this.options);
                }
                
                // Record this request
                await this.recordRequest(key, now);
                
                // Add rate limit headers
                res.set({
                    'X-RateLimit-Limit': this.options.maxRequests,
                    'X-RateLimit-Remaining': Math.max(0, this.options.maxRequests - requestCount - 1),
                    'X-RateLimit-Reset': new Date(now + this.options.windowMs).toISOString()
                });
                
                next();
                
            } catch (error) {
                logger.error('Rate limiter error', {
                    error: error.message,
                    path: req.path
                });
                next(); // Continue on error to avoid blocking requests
            }
        };
    }

    /**
     * Get request count for a key within the time window
     */
    async getRequestCount(key, windowStart, now) {
        if (this.options.store === 'memory') {
            return this.getMemoryRequestCount(key, windowStart);
        }
        // Redis implementation would go here
        return 0;
    }

    /**
     * Record a request for rate limiting
     */
    async recordRequest(key, timestamp) {
        if (this.options.store === 'memory') {
            return this.recordMemoryRequest(key, timestamp);
        }
        // Redis implementation would go here
    }

    /**
     * Get request count from memory store
     */
    getMemoryRequestCount(key, windowStart) {
        const requests = this.memoryStore.get(key) || [];
        return requests.filter(timestamp => timestamp > windowStart).length;
    }

    /**
     * Record request in memory store
     */
    recordMemoryRequest(key, timestamp) {
        const requests = this.memoryStore.get(key) || [];
        requests.push(timestamp);
        this.memoryStore.set(key, requests);
    }

    /**
     * Clean up expired entries from memory store
     */
    cleanupExpiredEntries() {
        const now = Date.now();
        const windowStart = now - this.options.windowMs;
        
        for (const [key, requests] of this.memoryStore.entries()) {
            const validRequests = requests.filter(timestamp => timestamp > windowStart);
            if (validRequests.length === 0) {
                this.memoryStore.delete(key);
            } else {
                this.memoryStore.set(key, validRequests);
            }
        }
    }

    /**
     * Check if a specific key is rate limited
     */
    async isRateLimited(key) {
        const now = Date.now();
        const windowStart = now - this.options.windowMs;
        const requestCount = await this.getRequestCount(key, windowStart, now);
        return requestCount >= this.options.maxRequests;
    }

    /**
     * Get remaining requests for a key
     */
    async getRemainingRequests(key) {
        const now = Date.now();
        const windowStart = now - this.options.windowMs;
        const requestCount = await this.getRequestCount(key, windowStart, now);
        return Math.max(0, this.options.maxRequests - requestCount);
    }

    /**
     * Reset rate limit for a specific key
     */
    async resetRateLimit(key) {
        if (this.options.store === 'memory') {
            this.memoryStore.delete(key);
        }
        // Redis implementation would go here
    }

    /**
     * Get rate limit statistics
     */
    getStats() {
        return {
            store: this.options.store,
            windowMs: this.options.windowMs,
            maxRequests: this.options.maxRequests,
            activeKeys: this.memoryStore.size,
            totalRequests: Array.from(this.memoryStore.values())
                .reduce((total, requests) => total + requests.length, 0)
        };
    }

    /**
     * Cleanup resources
     */
    destroy() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
        this.memoryStore.clear();
    }
}

/**
 * Third-party API Rate Limiter
 * Specialized rate limiter for external API calls
 */
class ThirdPartyAPIRateLimiter {
    constructor() {
        this.limiters = new Map();
        this.defaultConfig = {
            windowMs: 60000, // 1 minute
            maxRequests: 10,
            retryAfter: 60000 // 1 minute
        };
    }

    /**
     * Register a rate limiter for a specific API
     */
    registerAPI(apiName, config = {}) {
        const finalConfig = { ...this.defaultConfig, ...config };
        this.limiters.set(apiName, {
            config: finalConfig,
            requests: new Map()
        });
        
        logger.info(`Rate limiter registered for API: ${apiName}`, finalConfig);
    }

    /**
     * Check if API call is allowed
     */
    async checkRateLimit(apiName, identifier = 'default') {
        const limiter = this.limiters.get(apiName);
        if (!limiter) {
            throw new Error(`Rate limiter not registered for API: ${apiName}`);
        }

        const now = Date.now();
        const windowStart = now - limiter.config.windowMs;
        const key = `${apiName}:${identifier}`;
        
        // Get current requests for this identifier
        const requests = limiter.requests.get(key) || [];
        const validRequests = requests.filter(timestamp => timestamp > windowStart);
        
        // Check if limit exceeded
        if (validRequests.length >= limiter.config.maxRequests) {
            const oldestRequest = Math.min(...validRequests);
            const retryAfter = oldestRequest + limiter.config.windowMs - now;
            
            throw new Error(`Rate limit exceeded for ${apiName}. Retry after ${Math.ceil(retryAfter / 1000)} seconds.`);
        }
        
        // Record this request
        validRequests.push(now);
        limiter.requests.set(key, validRequests);
        
        return {
            allowed: true,
            remaining: limiter.config.maxRequests - validRequests.length,
            resetTime: now + limiter.config.windowMs
        };
    }

    /**
     * Get rate limit status for an API
     */
    getRateLimitStatus(apiName, identifier = 'default') {
        const limiter = this.limiters.get(apiName);
        if (!limiter) {
            return null;
        }

        const now = Date.now();
        const windowStart = now - limiter.config.windowMs;
        const key = `${apiName}:${identifier}`;
        
        const requests = limiter.requests.get(key) || [];
        const validRequests = requests.filter(timestamp => timestamp > windowStart);
        
        return {
            limit: limiter.config.maxRequests,
            used: validRequests.length,
            remaining: limiter.config.maxRequests - validRequests.length,
            resetTime: now + limiter.config.windowMs
        };
    }

    /**
     * Clean up expired entries
     */
    cleanup() {
        const now = Date.now();
        
        for (const [apiName, limiter] of this.limiters.entries()) {
            const windowStart = now - limiter.config.windowMs;
            
            for (const [key, requests] of limiter.requests.entries()) {
                const validRequests = requests.filter(timestamp => timestamp > windowStart);
                if (validRequests.length === 0) {
                    limiter.requests.delete(key);
                } else {
                    limiter.requests.set(key, validRequests);
                }
            }
        }
    }

    /**
     * Get statistics for all APIs
     */
    getStats() {
        const stats = {};
        
        for (const [apiName, limiter] of this.limiters.entries()) {
            stats[apiName] = {
                config: limiter.config,
                activeIdentifiers: limiter.requests.size,
                totalRequests: Array.from(limiter.requests.values())
                    .reduce((total, requests) => total + requests.length, 0)
            };
        }
        
        return stats;
    }
}

// Create global instances
const globalRateLimiter = new RateLimiter();
const thirdPartyAPILimiter = new ThirdPartyAPIRateLimiter();

// Register SurePass API rate limiter
thirdPartyAPILimiter.registerAPI('surepass', {
    windowMs: 60000, // 1 minute
    maxRequests: 5, // 5 requests per minute (reduced to be more conservative)
    retryAfter: 60000
});

// Cleanup interval for third-party API limiter
setInterval(() => {
    thirdPartyAPILimiter.cleanup();
}, 300000); // Clean up every 5 minutes

// Export simple middleware for express
const simpleRateLimiter = globalRateLimiter.middleware();

module.exports = {
    RateLimiter,
    ThirdPartyAPIRateLimiter,
    globalRateLimiter,
    thirdPartyAPILimiter,
    simpleRateLimiter
};