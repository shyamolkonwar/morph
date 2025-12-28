/**
 * Image Proxy API Route
 * 
 * GET /api/proxy-image?url=...
 * 
 * Fetches external image and returns as base64 data URL
 * This bypasses CORS issues for html-to-image capture
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { MORPH_HEADERS } from "@/lib/ai-registry";

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

        const imageUrl = request.nextUrl.searchParams.get("url");
        if (!imageUrl) {
            return NextResponse.json(
                { error: "Missing image URL" },
                { status: 400, headers: MORPH_HEADERS }
            );
        }

        // Validate URL (only allow certain domains)
        const url = new URL(imageUrl);
        const allowedDomains = [
            "images.pexels.com",
            "image.pollinations.ai",
            "oaidalleapiprodscus.blob.core.windows.net",
            "dalleproduse.blob.core.windows.net",
        ];

        const isAllowed = allowedDomains.some(domain => url.hostname.includes(domain));
        if (!isAllowed) {
            return NextResponse.json(
                { error: "Domain not allowed" },
                { status: 403, headers: MORPH_HEADERS }
            );
        }

        // Fetch the image
        const response = await fetch(imageUrl, {
            headers: {
                "User-Agent": "Morph-Banner-Generator/1.0",
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch image: ${response.status}`);
        }

        // Get image data as buffer
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Detect content type
        const contentType = response.headers.get("content-type") || "image/jpeg";

        // Convert to base64 data URL
        const base64 = buffer.toString("base64");
        const dataUrl = `data:${contentType};base64,${base64}`;

        return NextResponse.json({
            success: true,
            dataUrl,
            contentType,
        }, { headers: MORPH_HEADERS });

    } catch (error) {
        console.error("Image proxy error:", error);
        return NextResponse.json(
            { error: "Failed to proxy image" },
            { status: 500, headers: MORPH_HEADERS }
        );
    }
}
