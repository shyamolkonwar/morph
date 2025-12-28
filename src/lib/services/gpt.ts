/**
 * Morph-1.1 (Architect) - Text & Layout Generation Service
 * 
 * Uses GPT-4o for intelligent copywriting, color selection,
 * and layout decisions. All responses use Morph branding.
 */

import OpenAI from "openai";
import { getModelConfig, ERROR_MESSAGES, MORPH_ENGINE_VERSION } from "../ai-registry";
import { moderateContent } from "../moderation";

// Type definitions for Morph-1.1 response
export interface MorphDesignPlan {
    headline: string;
    subheadline?: string;
    cta_text?: string;
    theme: {
        bg_color: string;
        text_color: string;
        accent_color: string;
    };
    image_prompt: string;
    layout_id: string;
    hashtags?: string[];
}

export interface GenerationResult {
    success: boolean;
    plan?: MorphDesignPlan;
    error?: string;
    morphVersion: string;
}

const SYSTEM_PROMPT = `You are Morph-1.1 (Architect), an expert UI designer and copywriter for social media content.

You understand design hierarchy and create layouts that maximize engagement. You output ONLY valid JSON.

Your responsibilities:
1. Write compelling, concise copy optimized for the platform
2. Select a cohesive color palette that matches the brand/mood
3. Choose the best layout for the content type
4. Create a detailed image prompt for the background (Morph-Vision will generate it)

Available layouts:
- hero_center: Bold centered text, dramatic impact
- split_left: Text on left, visual space on right
- split_right: Visual focus left, text on right
- minimal_top: Clean header style, modern feel
- modern_bottom: Text anchored at bottom, cinematic

Always return this exact JSON structure:
{
  "headline": "string (max 50 chars, impactful)",
  "subheadline": "string (max 100 chars, supporting context)",
  "cta_text": "string (max 20 chars, optional action)",
  "theme": {
    "bg_color": "#hex (dark backgrounds work best)",
    "text_color": "#hex (ensure high contrast)",
    "accent_color": "#hex (for buttons/highlights)"
  },
  "image_prompt": "string (detailed description for AI image generation, professional backgrounds)",
  "layout_id": "hero_center | split_left | split_right | minimal_top | modern_bottom",
  "hashtags": ["relevant", "hashtags", "for", "platform"]
}`;

const PLATFORM_CONTEXTS: Record<string, string> = {
    linkedin_banner: "LinkedIn profile background banner (1584x396, wide format). Professional, corporate-friendly.",
    linkedin_carousel: "LinkedIn carousel slide (1080x1080, square). Educational, value-driven content.",
    youtube_thumbnail: "YouTube video thumbnail (1280x720). Eye-catching, clickbait-worthy but authentic.",
    instagram_post: "Instagram post (1080x1080, square). Visually stunning, lifestyle-oriented.",
    twitter_post: "Twitter/X post (1200x675). Punchy, conversation-starting.",
};

export async function generateDesignPlan(
    prompt: string,
    platform: string = "linkedin_banner"
): Promise<GenerationResult> {
    // Step 1: Moderate content
    const moderation = await moderateContent(prompt);
    if (!moderation.safe) {
        return {
            success: false,
            error: moderation.error || ERROR_MESSAGES.CONTENT_BLOCKED.public,
            morphVersion: MORPH_ENGINE_VERSION,
        };
    }

    // Step 2: Get model config
    const modelConfig = getModelConfig("MODEL_TEXT_CORE");

    if (!process.env.OPENAI_API_KEY) {
        return {
            success: false,
            error: "Morph-1.1 is not configured. Please contact support.",
            morphVersion: MORPH_ENGINE_VERSION,
        };
    }

    const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
    });

    const platformContext = PLATFORM_CONTEXTS[platform] || PLATFORM_CONTEXTS.linkedin_banner;

    try {
        const response = await openai.chat.completions.create({
            model: modelConfig.model,
            messages: [
                { role: "system", content: SYSTEM_PROMPT },
                {
                    role: "user",
                    content: `Platform: ${platformContext}\n\nUser Request: ${prompt}`,
                },
            ],
            response_format: { type: "json_object" },
            temperature: 0.7,
            max_tokens: 600,
        });

        const content = response.choices[0]?.message?.content;
        if (!content) {
            return {
                success: false,
                error: ERROR_MESSAGES.GENERATION_FAILED.public,
                morphVersion: MORPH_ENGINE_VERSION,
            };
        }

        const plan = JSON.parse(content) as MorphDesignPlan;

        // Validate required fields
        if (!plan.headline || !plan.theme || !plan.image_prompt || !plan.layout_id) {
            return {
                success: false,
                error: "Morph-1.1 returned an incomplete design. Please try again.",
                morphVersion: MORPH_ENGINE_VERSION,
            };
        }

        // Validate layout_id
        const validLayouts = ["hero_center", "split_left", "split_right", "minimal_top", "modern_bottom"];
        if (!validLayouts.includes(plan.layout_id)) {
            plan.layout_id = "hero_center"; // Default fallback
        }

        // Validate colors are valid hex
        const hexRegex = /^#[0-9A-Fa-f]{6}$/;
        if (!hexRegex.test(plan.theme.bg_color)) plan.theme.bg_color = "#0F172A";
        if (!hexRegex.test(plan.theme.text_color)) plan.theme.text_color = "#FFFFFF";
        if (!hexRegex.test(plan.theme.accent_color)) plan.theme.accent_color = "#4F46E5";

        return {
            success: true,
            plan,
            morphVersion: MORPH_ENGINE_VERSION,
        };
    } catch (error) {
        console.error("Morph-1.1 error:", error);

        // Handle specific OpenAI errors
        if (error instanceof OpenAI.APIError) {
            if (error.status === 429) {
                return {
                    success: false,
                    error: ERROR_MESSAGES.OPENAI_RATE_LIMIT.public,
                    morphVersion: MORPH_ENGINE_VERSION,
                };
            }
        }

        return {
            success: false,
            error: ERROR_MESSAGES.GENERATION_FAILED.public,
            morphVersion: MORPH_ENGINE_VERSION,
        };
    }
}

// Mock function for development/testing
export function mockDesignPlan(prompt: string): MorphDesignPlan {
    return {
        headline: "Your Amazing Headline",
        subheadline: "Compelling subtext that supports the main message",
        cta_text: "Learn More",
        theme: {
            bg_color: "#0F172A",
            text_color: "#FFFFFF",
            accent_color: "#4F46E5",
        },
        image_prompt: "Abstract gradient background with subtle geometric shapes, professional and modern, high resolution, minimalist aesthetic",
        layout_id: "hero_center",
        hashtags: ["innovation", "design", "ai"],
    };
}
