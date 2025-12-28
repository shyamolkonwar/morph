/**
 * Morph-1.1 Architect - Design Plan Generator
 * 
 * Uses OpenAI GPT to generate banner configuration JSON.
 * Now includes search_keywords for Pexels and fallback prompt for AI.
 */

import OpenAI from "openai";
import { MORPH_ENGINE_VERSION, ERROR_MESSAGES } from "../ai-registry";
import { moderateContent } from "../moderation";

export interface BannerConfig {
    template_id: "minimalist" | "startup" | "tech";
    content: {
        headline: string;
        subheadline: string;
        cta?: string;
    };
    design: {
        primary_color: string;
        secondary_color: string;
        text_color: string;
        font_style: "modern" | "bold" | "elegant" | "tech";
        text_alignment: "left" | "center" | "right";
    };
    assets: {
        search_keywords: string;
        fallback_generation_prompt: string;
        use_ai_force: boolean;
        background_style: string;
    };
}

export interface GenerationResult {
    success: boolean;
    config?: BannerConfig;
    error?: string;
    morphVersion: string;
}

const SYSTEM_PROMPT = `You are a Creative Director for a professional banner design system. You output JSON only, never explain.

Your job is to create configuration for LinkedIn banners based on user descriptions. You will:
1. Write compelling, concise headlines (max 6 words)
2. Write supporting subheadlines (max 12 words)
3. Choose an appropriate visual template
4. Select a modern color palette
5. Provide search keywords for stock photos AND a fallback AI generation prompt

TEMPLATES AVAILABLE:
- "minimalist": Clean, lots of whitespace, centered bold text. Best for executives, consultants, corporate.
- "startup": Split layout, text left, vibrant colors. Best for founders, entrepreneurs, marketing.
- "tech": Dark mode, glassmorphism, glowing elements. Best for developers, engineers, tech professionals.

COLOR RULES:
- primary_color: Main accent color (vibrant, eye-catching)
- secondary_color: Background color
- text_color: Must contrast well with secondary_color

ASSET RULES (CRITICAL):
1. search_keywords: Simple noun-based keywords for Pexels stock photo search. 
   - Use 2-4 simple words like "office laptop woman" or "data center servers"
   - NO adjectives like "beautiful" or "4k"
   - Focus on searchable concrete nouns
   
2. fallback_generation_prompt: Detailed prompt for AI image generation if stock photos fail
   - Include style, mood, colors, composition details
   - Example: "Abstract data flow visualization, blue and purple gradients, dark background, minimalist"

3. use_ai_force: Set to true ONLY if the request is for abstract/fantasy content that stock photos can't provide
   - Examples: dragons, sci-fi scenes, abstract art, surreal imagery -> true
   - Examples: office, developer, business meeting -> false

OUTPUT STRICT JSON FORMAT:
{
  "template_id": "tech",
  "content": {
    "headline": "Backend Systems Expert",
    "subheadline": "Node.js • Python • Cloud Architecture",
    "cta": "Open to Work"
  },
  "design": {
    "primary_color": "#00ff88",
    "secondary_color": "#0a0a0a",
    "text_color": "#ffffff",
    "font_style": "tech",
    "text_alignment": "left"
  },
  "assets": {
    "search_keywords": "programmer coding dark room",
    "fallback_generation_prompt": "Cyberpunk developer workspace with glowing monitors, dark ambient lighting, blue and green neon accents, realistic style",
    "use_ai_force": false,
    "background_style": "technological"
  }
}`;

export async function generateBannerConfig(
    userPrompt: string
): Promise<GenerationResult> {
    // Check for API key
    if (!process.env.OPENAI_API_KEY) {
        return {
            success: false,
            error: ERROR_MESSAGES.NO_API_KEY.public,
            morphVersion: MORPH_ENGINE_VERSION,
        };
    }

    // Content moderation
    const moderation = await moderateContent(userPrompt);
    if (!moderation.safe) {
        return {
            success: false,
            error: moderation.error || "Content flagged by moderation",
            morphVersion: MORPH_ENGINE_VERSION,
        };
    }

    try {
        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });

        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: SYSTEM_PROMPT },
                {
                    role: "user",
                    content: `Create a LinkedIn banner configuration for: ${userPrompt}`
                },
            ],
            response_format: { type: "json_object" },
            temperature: 0.7,
            max_tokens: 600,
        });

        const content = response.choices[0]?.message?.content;
        if (!content) {
            throw new Error("No response from Morph-1.1");
        }

        const config = JSON.parse(content) as BannerConfig;

        // Validate required fields
        if (!config.template_id || !config.content?.headline || !config.design?.primary_color) {
            throw new Error("Invalid configuration structure");
        }

        // Ensure assets has the new structure
        if (!config.assets.search_keywords) {
            config.assets.search_keywords = "professional business abstract";
        }
        if (!config.assets.fallback_generation_prompt) {
            config.assets.fallback_generation_prompt = "Abstract professional gradient background, minimalist, modern";
        }
        if (config.assets.use_ai_force === undefined) {
            config.assets.use_ai_force = false;
        }

        return {
            success: true,
            config,
            morphVersion: MORPH_ENGINE_VERSION,
        };
    } catch (error) {
        console.error("Morph-1.1 error:", error);

        return {
            success: false,
            error: ERROR_MESSAGES.GENERATION_FAILED.public,
            morphVersion: MORPH_ENGINE_VERSION,
        };
    }
}

/**
 * Legacy function for backward compatibility
 */
export async function generateDesignPlan(
    prompt: string,
    platform: string = "linkedin_banner"
): Promise<{ success: boolean; plan?: BannerConfig; error?: string }> {
    const result = await generateBannerConfig(prompt);
    return {
        success: result.success,
        plan: result.config,
        error: result.error,
    };
}
