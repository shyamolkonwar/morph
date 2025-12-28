/**
 * Orchestrator Service for Morph
 * Coordinates the generation pipeline: GPT-4o -> Gemini -> Render
 */

import { generateDesignPlan, mockDesignPlan, type MorphDesignPlan } from "./gpt";
import { generateBackgroundImage, PLATFORM_SPECS, type ImageGenerationResult } from "./gemini";
import { MORPH_ENGINE_VERSION } from "../ai-registry";

export interface OrchestratedResult {
    designPlan: MorphDesignPlan;
    backgroundImage: ImageGenerationResult;
    status: "success" | "partial" | "mock";
    errors?: string[];
    morphVersion: string;
}

export interface GenerationOptions {
    prompt: string;
    platform: keyof typeof PLATFORM_SPECS;
    useMock?: boolean;
}

/**
 * Mock background image for development/fallback
 */
function mockBackgroundImage(): ImageGenerationResult {
    return {
        success: true,
        imageUrl: "/api/placeholder/default",
        mimeType: "image/png",
        morphVersion: MORPH_ENGINE_VERSION,
    };
}

/**
 * Main generation pipeline
 * 1. Send prompt to GPT-4o for design plan
 * 2. Use image_prompt from design plan to generate background with Gemini
 * 3. Return both for rendering
 */
export async function orchestrateGeneration(
    options: GenerationOptions
): Promise<OrchestratedResult> {
    const { prompt, platform, useMock = false } = options;
    const errors: string[] = [];

    // Step 1: Get design plan from GPT-4o
    let designPlan: MorphDesignPlan;

    if (useMock || !process.env.OPENAI_API_KEY) {
        designPlan = mockDesignPlan(prompt);
        if (!useMock) {
            errors.push("Using mock design plan - OPENAI_API_KEY not configured");
        }
    } else {
        const result = await generateDesignPlan(prompt, platform);
        if (result.success && result.plan) {
            designPlan = result.plan;
        } else {
            errors.push(`GPT-4o error: ${result.error || "Unknown error"}`);
            designPlan = mockDesignPlan(prompt);
        }
    }

    // Step 2: Generate background image with Gemini
    let backgroundImage: ImageGenerationResult;

    if (useMock || !process.env.GOOGLE_AI_API_KEY) {
        backgroundImage = mockBackgroundImage();
        if (!useMock) {
            errors.push("Using mock background - GOOGLE_AI_API_KEY not configured");
        }
    } else {
        backgroundImage = await generateBackgroundImage(designPlan.image_prompt, platform);
        if (!backgroundImage.success) {
            errors.push(`Gemini error: ${backgroundImage.error || "Unknown error"}`);
            backgroundImage = mockBackgroundImage();
        }
    }

    // Determine status
    let status: OrchestratedResult["status"];
    if (useMock) {
        status = "mock";
    } else if (errors.length === 0) {
        status = "success";
    } else {
        status = "partial";
    }

    return {
        designPlan,
        backgroundImage,
        status,
        errors: errors.length > 0 ? errors : undefined,
        morphVersion: MORPH_ENGINE_VERSION,
    };
}

/**
 * Get available platforms and their display names
 */
export const PLATFORMS = {
    linkedin_banner: {
        name: "LinkedIn Banner",
        width: 1584,
        height: 396,
        aspectRatio: "4:1",
    },
    linkedin_carousel: {
        name: "LinkedIn Carousel",
        width: 1080,
        height: 1080,
        aspectRatio: "1:1",
    },
    youtube_thumbnail: {
        name: "YouTube Thumbnail",
        width: 1280,
        height: 720,
        aspectRatio: "16:9",
    },
    instagram_post: {
        name: "Instagram Post",
        width: 1080,
        height: 1080,
        aspectRatio: "1:1",
    },
    twitter_post: {
        name: "Twitter/X Post",
        width: 1200,
        height: 675,
        aspectRatio: "16:9",
    },
} as const;

export type Platform = keyof typeof PLATFORMS;
