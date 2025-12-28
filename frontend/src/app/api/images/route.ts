/**
 * Image Search API Route
 * 
 * GET /api/images/search?q=keyword
 * POST /api/images/generate
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { MORPH_HEADERS } from "@/lib/ai-registry";
import { searchPexelsImages, generateAIImage } from "@/lib/services/gemini";

// Search Pexels for stock photos
export async function GET(request: NextRequest) {
    try {
        // Verify authentication
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401, headers: MORPH_HEADERS }
            );
        }

        const query = request.nextUrl.searchParams.get("q");
        if (!query) {
            return NextResponse.json(
                { error: "Missing search query" },
                { status: 400, headers: MORPH_HEADERS }
            );
        }

        const result = await searchPexelsImages(query, 12);

        return NextResponse.json({
            success: true,
            photos: result.photos,
        }, { headers: MORPH_HEADERS });

    } catch (error) {
        console.error("Image search error:", error);
        return NextResponse.json(
            { error: "Failed to search images" },
            { status: 500, headers: MORPH_HEADERS }
        );
    }
}

// Generate AI image
export async function POST(request: NextRequest) {
    try {
        // Verify authentication
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401, headers: MORPH_HEADERS }
            );
        }

        const body = await request.json();
        const { prompt } = body;

        if (!prompt) {
            return NextResponse.json(
                { error: "Missing prompt" },
                { status: 400, headers: MORPH_HEADERS }
            );
        }

        const result = generateAIImage(prompt);

        return NextResponse.json({
            success: true,
            imageUrl: result.imageUrl,
            provider: result.provider,
        }, { headers: MORPH_HEADERS });

    } catch (error) {
        console.error("Image generation error:", error);
        return NextResponse.json(
            { error: "Failed to generate image" },
            { status: 500, headers: MORPH_HEADERS }
        );
    }
}
