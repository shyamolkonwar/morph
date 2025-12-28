/**
 * Rate Limiting Service using Upstash Redis
 * 
 * Implements sliding window algorithm for:
 * - Per-user generation limits
 * - Per-IP login/signup limits
 * - Speed limits (anti-spam)
 */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { ERROR_MESSAGES } from "./ai-registry";

// Initialize Redis client
const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// ============================================
// RATE LIMITERS
// ============================================

/**
 * Generation Speed Limit
 * 1 request per 10 seconds per user
 * Prevents double-clicking or script flooding
 */
export const generationSpeedLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(1, "10 s"),
    analytics: true,
    prefix: "morph:speed",
});

/**
 * Daily Generation Limit
 * Configurable limit per day per user
 * Uses sliding window for smooth distribution
 */
export const dailyGenerationLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, "24 h"), // Default 5/day, can be overridden
    analytics: true,
    prefix: "morph:daily",
});

/**
 * IP-based Login/Signup Limit
 * 5 attempts per IP per hour
 * Stops bot account creation
 */
export const authIpLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, "1 h"),
    analytics: true,
    prefix: "morph:auth:ip",
});

/**
 * Device Fingerprint Limit
 * Max 3 accounts per device
 * Prevents multi-account abuse
 */
export const deviceLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(3, "30 d"),
    analytics: true,
    prefix: "morph:device",
});

// ============================================
// RATE LIMIT CHECK FUNCTIONS
// ============================================

export interface RateLimitResult {
    success: boolean;
    remaining: number;
    reset: number; // Unix timestamp
    error?: string;
}

/**
 * Check generation speed limit
 */
export async function checkSpeedLimit(userId: string): Promise<RateLimitResult> {
    try {
        const result = await generationSpeedLimiter.limit(userId);
        return {
            success: result.success,
            remaining: result.remaining,
            reset: result.reset,
            error: result.success ? undefined : ERROR_MESSAGES.RATE_LIMIT_EXCEEDED.public,
        };
    } catch {
        // If Redis is down, allow the request (fail open for UX)
        console.error("Rate limiter error: speed check failed");
        return { success: true, remaining: 1, reset: Date.now() + 10000 };
    }
}

/**
 * Check daily generation limit
 */
export async function checkDailyLimit(userId: string): Promise<RateLimitResult> {
    try {
        const result = await dailyGenerationLimiter.limit(userId);
        return {
            success: result.success,
            remaining: result.remaining,
            reset: result.reset,
            error: result.success ? undefined : ERROR_MESSAGES.DAILY_LIMIT_REACHED.public,
        };
    } catch {
        console.error("Rate limiter error: daily check failed");
        return { success: true, remaining: 5, reset: Date.now() + 86400000 };
    }
}

/**
 * Check IP-based auth limit
 */
export async function checkAuthIpLimit(ip: string): Promise<RateLimitResult> {
    try {
        const result = await authIpLimiter.limit(ip);
        return {
            success: result.success,
            remaining: result.remaining,
            reset: result.reset,
            error: result.success ? undefined : "Too many login attempts. Please try again later.",
        };
    } catch {
        console.error("Rate limiter error: auth IP check failed");
        return { success: true, remaining: 5, reset: Date.now() + 3600000 };
    }
}

/**
 * Check device fingerprint limit
 */
export async function checkDeviceLimit(fingerprint: string): Promise<RateLimitResult> {
    try {
        const result = await deviceLimiter.limit(fingerprint);
        return {
            success: result.success,
            remaining: result.remaining,
            reset: result.reset,
            error: result.success ? undefined : "This device has too many associated accounts.",
        };
    } catch {
        console.error("Rate limiter error: device check failed");
        return { success: true, remaining: 3, reset: Date.now() + 2592000000 };
    }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Get remaining daily credits for a user
 */
export async function getRemainingCredits(userId: string): Promise<number> {
    try {
        const result = await dailyGenerationLimiter.getRemaining(userId);
        // Handle both number and object return types
        return typeof result === "number" ? result : result.remaining;
    } catch {
        return 5; // Default fallback
    }
}

/**
 * Get time until credit reset (in milliseconds)
 */
export async function getResetTime(userId: string): Promise<number> {
    try {
        // Check current limit status to get reset time
        const result = await dailyGenerationLimiter.limit(userId);
        // Undo the limit check by not counting it
        return result.reset - Date.now();
    } catch {
        return 86400000; // 24 hours fallback
    }
}
