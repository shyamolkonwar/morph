/**
 * Content Moderation Service (Morph-Shield)
 * 
 * Uses OpenAI's Moderation API and custom checks
 * to filter harmful content before AI generation.
 */

import OpenAI from "openai";
import {
    ERROR_MESSAGES,
    BLOCKED_CATEGORIES,
    detectPromptInjection,
    getModelConfig,
} from "./ai-registry";

export interface ModerationResult {
    safe: boolean;
    flagged: boolean;
    categories: string[];
    error?: string;
}

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Run full content moderation pipeline
 */
export async function moderateContent(prompt: string): Promise<ModerationResult> {
    // Step 1: Check for prompt injection attempts
    if (detectPromptInjection(prompt)) {
        return {
            safe: false,
            flagged: true,
            categories: ["prompt_injection"],
            error: ERROR_MESSAGES.PROMPT_INJECTION.public,
        };
    }

    // Step 2: Check for obviously problematic patterns
    const customCheck = customModeration(prompt);
    if (!customCheck.safe) {
        return customCheck;
    }

    // Step 3: Use OpenAI Moderation API
    try {
        const modelConfig = getModelConfig("MODEL_SAFETY_GUARD");
        const response = await openai.moderations.create({
            model: modelConfig.model,
            input: prompt,
        });

        const result = response.results[0];
        const flaggedCategories: string[] = [];

        // Check each category
        for (const category of BLOCKED_CATEGORIES) {
            const categoryKey = category.replace("/", "_") as keyof typeof result.categories;
            if (result.categories[categoryKey]) {
                flaggedCategories.push(category);
            }
        }

        if (flaggedCategories.length > 0) {
            return {
                safe: false,
                flagged: true,
                categories: flaggedCategories,
                error: ERROR_MESSAGES.CONTENT_BLOCKED.public,
            };
        }

        return {
            safe: true,
            flagged: false,
            categories: [],
        };
    } catch (error) {
        console.error("Moderation API error:", error);
        // Fail open but log the error
        return {
            safe: true, // Allow through but log
            flagged: false,
            categories: [],
        };
    }
}

/**
 * Custom moderation rules for business-specific content
 */
function customModeration(prompt: string): ModerationResult {
    const lowercasePrompt = prompt.toLowerCase();

    // Block competitor mentions (optional business rule)
    const competitors = ["canva", "midjourney", "dall-e", "dalle", "stable diffusion"];
    for (const competitor of competitors) {
        if (lowercasePrompt.includes(competitor)) {
            // Don't block, but could log for analytics
        }
    }

    // Block obvious spam patterns
    const spamPatterns = [
        /(.)\1{10,}/, // Repeated characters
        /\b(buy|sell|cheap|discount|offer|click here)\b.*\b(now|today|limited)\b/i,
        /\b(viagra|casino|crypto|bitcoin|nft)\b/i,
    ];

    for (const pattern of spamPatterns) {
        if (pattern.test(prompt)) {
            return {
                safe: false,
                flagged: true,
                categories: ["spam"],
                error: "Your prompt appears to contain spam content. Please try a different prompt.",
            };
        }
    }

    // Check for excessive special characters (potential attack)
    const specialCharRatio = (prompt.match(/[^a-zA-Z0-9\s.,!?'"()-]/g) || []).length / prompt.length;
    if (specialCharRatio > 0.3) {
        return {
            safe: false,
            flagged: true,
            categories: ["suspicious_input"],
            error: "Your prompt contains too many special characters. Please simplify it.",
        };
    }

    return {
        safe: true,
        flagged: false,
        categories: [],
    };
}

/**
 * Check if generated text is safe for display
 */
export function sanitizeGeneratedText(text: string): string {
    // Remove any HTML/script tags that might have slipped through
    return text
        .replace(/<[^>]*>/g, "")
        .replace(/javascript:/gi, "")
        .replace(/on\w+=/gi, "");
}

/**
 * Log suspicious activity for review
 */
export async function logSuspiciousActivity(
    userId: string,
    activityType: string,
    details: Record<string, unknown>,
    ipAddress?: string,
    deviceFingerprint?: string
): Promise<void> {
    // This would log to Supabase in production
    console.warn("Suspicious activity detected:", {
        userId,
        activityType,
        details,
        ipAddress,
        deviceFingerprint,
        timestamp: new Date().toISOString(),
    });

    // TODO: Insert into suspicious_activity table
}
