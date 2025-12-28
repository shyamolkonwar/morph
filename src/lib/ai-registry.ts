/**
 * Morph Intelligence Engine - AI Registry
 * 
 * The only place where actual AI provider names should exist.
 * All other code references our proprietary model names.
 */

// ============================================
// MORPH ENGINE VERSION
// ============================================
export const MORPH_ENGINE_VERSION = "1.0-beta";

// ============================================
// MODEL MAPPING (Internal -> Provider)
// ============================================

export const AI_MODELS = {
    // Text/Layout Engine
    MODEL_TEXT_CORE: {
        provider: "openai",
        model: "gpt-4o",
        publicName: "Morph-1.1 (Architect)",
        description: "The reasoning engine that parses prompts and structures layouts.",
    },

    // Image Generation Engine
    MODEL_IMAGE_CORE: {
        provider: "google",
        model: "gemini-2.0-flash-exp",
        publicName: "Morph-Vision v2",
        description: "The rendering engine that generates high-fidelity backgrounds and assets.",
    },

    // Content Moderation
    MODEL_SAFETY_GUARD: {
        provider: "openai",
        model: "omni-moderation-latest",
        publicName: "Morph-Shield",
        description: "The security layer that filters abuse and unsafe content.",
    },
} as const;

// ============================================
// ERROR MESSAGE TRANSLATIONS
// ============================================

export const ERROR_MESSAGES = {
    // Rate Limiting
    RATE_LIMIT_EXCEEDED: {
        internal: "Upstash rate limit exceeded",
        public: "Morph Engine is currently at capacity. Our GPUs are cooling down. Please try again in 30 seconds.",
    },

    // OpenAI Errors
    OPENAI_RATE_LIMIT: {
        internal: "OpenAI API Rate Limit Exceeded",
        public: "Morph-1.1 is processing many requests. Please try again in a moment.",
    },
    OPENAI_QUOTA: {
        internal: "OpenAI quota exceeded",
        public: "Morph Engine is undergoing maintenance. Please try again later.",
    },

    // Safety/Moderation
    CONTENT_BLOCKED: {
        internal: "Safety settings triggered",
        public: "Morph-Shield detected content that violates our safe-use policy. Please revise your prompt.",
    },
    PROMPT_INJECTION: {
        internal: "Prompt injection detected",
        public: "Your request contains prohibited instructions. Please try a different prompt.",
    },

    // Generation Errors
    GENERATION_FAILED: {
        internal: "Generation failed",
        public: "Morph-Vision encountered an issue. Your credit has been refunded. Please try again.",
    },

    // Credit System
    DAILY_LIMIT_REACHED: {
        internal: "Daily credit limit reached",
        public: "You've reached your daily design limit. Come back tomorrow for more free generations!",
    },
    INSUFFICIENT_CREDITS: {
        internal: "Insufficient credits",
        public: "You're out of credits for today. Upgrade to Pro for unlimited access.",
    },

    // Auth Errors
    UNAUTHORIZED: {
        internal: "No valid session",
        public: "Please sign in to continue.",
    },
    BANNED_USER: {
        internal: "User is banned",
        public: "Your account has been suspended. Contact support for assistance.",
    },

    // Maintenance
    MAINTENANCE_MODE: {
        internal: "System in maintenance mode",
        public: "We are upgrading our systems. Please check back in a few minutes.",
    },
} as const;

// ============================================
// API RESPONSE HEADERS
// ============================================

export const MORPH_HEADERS = {
    "X-Powered-By": `Morph-Engine-v${MORPH_ENGINE_VERSION}`,
    "X-Morph-Version": MORPH_ENGINE_VERSION,
};

// ============================================
// PROMPT INJECTION DETECTION PATTERNS
// ============================================

export const INJECTION_PATTERNS = [
    /ignore\s+(previous|all|prior)\s+(instructions?|prompts?)/i,
    /system\s*(override|prompt)/i,
    /disregard\s+(previous|all|above)/i,
    /forget\s+(everything|all|previous)/i,
    /new\s+instructions?/i,
    /you\s+are\s+now/i,
    /act\s+as\s+(if|though)/i,
    /pretend\s+(you|to\s+be)/i,
    /jailbreak/i,
    /bypass\s+(filter|safety|security)/i,
    /reveal\s+(system|hidden|secret)/i,
    /<\/?script/i,
    /\$\{.*\}/,  // Template injection
    /{{.*}}/,   // Handlebars injection
];

// ============================================
// CONTENT MODERATION CATEGORIES
// ============================================

export const BLOCKED_CATEGORIES = [
    "hate",
    "hate/threatening",
    "harassment",
    "harassment/threatening",
    "self-harm",
    "self-harm/intent",
    "self-harm/instructions",
    "sexual",
    "sexual/minors",
    "violence",
    "violence/graphic",
] as const;

// ============================================
// HELPER FUNCTIONS
// ============================================

export function getPublicError(internalError: string): string {
    for (const [, messages] of Object.entries(ERROR_MESSAGES)) {
        if (messages.internal.toLowerCase().includes(internalError.toLowerCase())) {
            return messages.public;
        }
    }
    return "An unexpected error occurred. Please try again.";
}

export function detectPromptInjection(prompt: string): boolean {
    return INJECTION_PATTERNS.some((pattern) => pattern.test(prompt));
}

export function getModelConfig(modelKey: keyof typeof AI_MODELS) {
    return AI_MODELS[modelKey];
}
