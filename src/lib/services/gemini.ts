/**
 * Morph-Vision v3 - Hybrid Asset Pipeline
 * 
 * Primary: Pexels API (Real Stock Photos)
 * Fallback Tier 1: OpenAI gpt-image-1
 * Fallback Tier 2: Pollinations.ai (free)
 * Fallback Tier 3: SVG gradient
 */

import OpenAI from "openai";
import { MORPH_ENGINE_VERSION } from "../ai-registry";

export interface ImageResult {
    success: boolean;
    imageUrl: string;
    provider: "pexels" | "openai" | "pollinations" | "gradient";
    photographer?: string;
    photographerUrl?: string;
    mimeType: string;
}

export interface AssetConfig {
    search_keywords: string;
    fallback_generation_prompt: string;
    use_ai_force: boolean;
}

// LinkedIn Banner dimensions
const BANNER_WIDTH = 1584;
const BANNER_HEIGHT = 396;

/**
 * Main image pipeline - Pexels first, then AI fallback
 */
export async function generateBackgroundImage(
    assetConfig: AssetConfig | string
): Promise<ImageResult> {
    // Handle legacy string parameter
    if (typeof assetConfig === "string") {
        assetConfig = {
            search_keywords: assetConfig,
            fallback_generation_prompt: assetConfig,
            use_ai_force: false,
        };
    }

    const { search_keywords, fallback_generation_prompt, use_ai_force } = assetConfig;

    // If use_ai_force is true, skip Pexels entirely
    if (!use_ai_force && process.env.PEXELS_API_KEY) {
        try {
            const pexelsResult = await searchPexels(search_keywords);
            if (pexelsResult.success) {
                return pexelsResult;
            }
        } catch (error) {
            console.log("Pexels search failed, trying AI generation...");
        }
    }

    // Try OpenAI gpt-image-1 if API key available
    if (process.env.OPENAI_API_KEY) {
        try {
            const openaiResult = await generateWithOpenAI(fallback_generation_prompt);
            if (openaiResult.success) return openaiResult;
        } catch (error) {
            console.log("OpenAI image gen failed, trying Pollinations...");
        }
    }

    // Fallback to Pollinations (free)
    try {
        return generateWithPollinations(fallback_generation_prompt);
    } catch (error) {
        console.error("Pollinations fallback failed:", error);
    }

    // Final fallback: gradient
    return generateGradientFallback(fallback_generation_prompt);
}

/**
 * Search Pexels for stock photos
 */
async function searchPexels(keywords: string): Promise<ImageResult> {
    const apiKey = process.env.PEXELS_API_KEY;
    if (!apiKey) {
        throw new Error("Pexels API key not configured");
    }

    const query = encodeURIComponent(keywords);
    const url = `https://api.pexels.com/v1/search?query=${query}&per_page=5&orientation=landscape`;

    const response = await fetch(url, {
        headers: {
            Authorization: apiKey,
        },
    });

    if (!response.ok) {
        throw new Error(`Pexels API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.photos || data.photos.length === 0) {
        throw new Error("No photos found on Pexels");
    }

    // Pick a random photo from top 5 for variety
    const photo = data.photos[Math.floor(Math.random() * Math.min(data.photos.length, 5))];

    // Get the best size for LinkedIn banner (landscape, high quality)
    const imageUrl = photo.src.landscape || photo.src.large2x || photo.src.large;

    return {
        success: true,
        imageUrl,
        provider: "pexels",
        photographer: photo.photographer,
        photographerUrl: photo.photographer_url,
        mimeType: "image/jpeg",
    };
}

/**
 * Search Pexels API directly (for UI swap feature)
 */
export async function searchPexelsImages(
    keywords: string,
    perPage: number = 10
): Promise<{ photos: Array<{ url: string; photographer: string; photographerUrl: string }> }> {
    const apiKey = process.env.PEXELS_API_KEY;
    if (!apiKey) {
        return { photos: [] };
    }

    try {
        const query = encodeURIComponent(keywords);
        const url = `https://api.pexels.com/v1/search?query=${query}&per_page=${perPage}&orientation=landscape`;

        const response = await fetch(url, {
            headers: {
                Authorization: apiKey,
            },
        });

        if (!response.ok) {
            return { photos: [] };
        }

        const data = await response.json();

        return {
            photos: (data.photos || []).map((photo: {
                src: { landscape?: string; large2x?: string; large: string };
                photographer: string;
                photographer_url: string
            }) => ({
                url: photo.src.landscape || photo.src.large2x || photo.src.large,
                photographer: photo.photographer,
                photographerUrl: photo.photographer_url,
            })),
        };
    } catch {
        return { photos: [] };
    }
}

/**
 * Generate with OpenAI gpt-image-1
 */
async function generateWithOpenAI(prompt: string): Promise<ImageResult> {
    const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
    });

    const enhancedPrompt = `Professional LinkedIn banner background. 
${prompt}
Requirements: No text, no letters, abstract and subtle, suitable for text overlay, high quality, modern, landscape orientation.`;

    const response = await openai.images.generate({
        model: "gpt-image-1",
        prompt: enhancedPrompt,
        n: 1,
        size: "1536x1024",
    });

    const imageUrl = response.data?.[0]?.url;

    if (!imageUrl) {
        throw new Error("No image URL from OpenAI");
    }

    return {
        success: true,
        imageUrl,
        provider: "openai",
        mimeType: "image/png",
    };
}

/**
 * Generate with Pollinations.ai (free, no API key)
 */
function generateWithPollinations(prompt: string): ImageResult {
    const encodedPrompt = encodeURIComponent(
        `${prompt}, professional, clean, linkedin banner background, no text, abstract, modern, landscape, high quality`
    );

    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${BANNER_WIDTH}&height=${BANNER_HEIGHT}&nologo=true&seed=${Date.now()}`;

    return {
        success: true,
        imageUrl,
        provider: "pollinations",
        mimeType: "image/jpeg",
    };
}

/**
 * Generate AI image for UI swap feature
 */
export function generateAIImage(prompt: string): ImageResult {
    return generateWithPollinations(prompt);
}

/**
 * Generate SVG gradient as final fallback
 */
function generateGradientFallback(prompt: string): ImageResult {
    const hash = prompt.split("").reduce((acc, char) => {
        return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);

    const hue1 = Math.abs(hash % 360);
    const hue2 = (hue1 + 40) % 360;

    const color1 = `hsl(${hue1}, 60%, 20%)`;
    const color2 = `hsl(${hue2}, 50%, 30%)`;
    const color3 = `hsl(${hue1}, 40%, 15%)`;

    const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${BANNER_WIDTH}" height="${BANNER_HEIGHT}" viewBox="0 0 ${BANNER_WIDTH} ${BANNER_HEIGHT}">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${color1}"/>
      <stop offset="50%" style="stop-color:${color2}"/>
      <stop offset="100%" style="stop-color:${color3}"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#grad)"/>
</svg>`.trim();

    const base64 = Buffer.from(svg).toString("base64");

    return {
        success: true,
        imageUrl: `data:image/svg+xml;base64,${base64}`,
        provider: "gradient",
        mimeType: "image/svg+xml",
    };
}

// Export for backward compatibility
export const PLATFORM_SPECS = {
    linkedin_banner: { width: 1584, height: 396, aspectRatio: "4:1" },
} as const;
