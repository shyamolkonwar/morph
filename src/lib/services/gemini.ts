/**
 * Morph-Vision v2 - Image Generation Service
 * 
 * Uses Google Gemini for high-fidelity background generation.
 * All responses use Morph branding.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { getModelConfig, ERROR_MESSAGES, MORPH_ENGINE_VERSION } from "../ai-registry";
import { createClient } from "../supabase/server";

export interface ImageGenerationResult {
    success: boolean;
    imageUrl?: string;
    mimeType?: string;
    error?: string;
    morphVersion: string;
}

// Platform aspect ratios and dimensions
export const PLATFORM_SPECS = {
    linkedin_banner: { width: 1584, height: 396, aspectRatio: "4:1" },
    linkedin_carousel: { width: 1080, height: 1080, aspectRatio: "1:1" },
    youtube_thumbnail: { width: 1280, height: 720, aspectRatio: "16:9" },
    instagram_post: { width: 1080, height: 1080, aspectRatio: "1:1" },
    twitter_post: { width: 1200, height: 675, aspectRatio: "16:9" },
} as const;

export async function generateBackgroundImage(
    prompt: string,
    platform: keyof typeof PLATFORM_SPECS = "linkedin_banner"
): Promise<ImageGenerationResult> {
    const modelConfig = getModelConfig("MODEL_IMAGE_CORE");

    if (!process.env.GOOGLE_AI_API_KEY) {
        return {
            success: false,
            error: "Morph-Vision is not configured. Please contact support.",
            morphVersion: MORPH_ENGINE_VERSION,
        };
    }

    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
    const specs = PLATFORM_SPECS[platform];

    // Enhanced prompt for better results
    const enhancedPrompt = `Create a professional background image for a ${platform.replace(/_/g, " ")}.

REQUIREMENTS:
- Aspect ratio: ${specs.aspectRatio}
- Resolution: High quality, suitable for ${specs.width}x${specs.height}
- Style: Professional, modern, clean
- IMPORTANT: Leave negative space for text overlay
- NO text, words, letters, or numbers in the image
- Subtle, not too busy - this is a background

IMAGE DESCRIPTION: ${prompt}

Make it look premium and suitable for professional social media content.`;

    try {
        const model = genAI.getGenerativeModel({
            model: modelConfig.model,
        });

        const result = await model.generateContent(enhancedPrompt);
        const response = await result.response;

        // Note: Actual image generation would return binary data
        // For now, we return a placeholder until Gemini image API is available

        // In production, you would:
        // 1. Get the image bytes from response
        // 2. Upload to Supabase Storage
        // 3. Return the public URL

        // Placeholder implementation
        const placeholderUrl = `/api/placeholder/${platform}?prompt=${encodeURIComponent(prompt.slice(0, 50))}`;

        return {
            success: true,
            imageUrl: placeholderUrl,
            mimeType: "image/png",
            morphVersion: MORPH_ENGINE_VERSION,
        };
    } catch (error) {
        console.error("Morph-Vision error:", error);

        return {
            success: false,
            error: ERROR_MESSAGES.GENERATION_FAILED.public,
            morphVersion: MORPH_ENGINE_VERSION,
        };
    }
}

/**
 * Upload generated image to Supabase Storage
 */
export async function uploadToStorage(
    imageData: Buffer | Blob,
    userId: string,
    filename: string
): Promise<{ url: string } | { error: string }> {
    const supabase = await createClient();

    const path = `${userId}/${Date.now()}-${filename}`;

    const { data, error } = await supabase.storage
        .from("generated-assets")
        .upload(path, imageData, {
            contentType: "image/png",
            cacheControl: "3600",
        });

    if (error) {
        return { error: "Failed to upload image to storage" };
    }

    const { data: urlData } = supabase.storage
        .from("generated-assets")
        .getPublicUrl(data.path);

    return { url: urlData.publicUrl };
}

/**
 * Generate a gradient placeholder image
 * Used as fallback when Gemini is unavailable
 */
export function getGradientPlaceholder(
    theme: { bg_color: string; accent_color: string }
): string {
    // Return a CSS gradient that can be used as background
    return `linear-gradient(135deg, ${theme.bg_color} 0%, ${theme.accent_color}40 50%, ${theme.bg_color} 100%)`;
}
