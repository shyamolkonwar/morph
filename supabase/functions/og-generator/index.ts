/**
 * Morph OG Generator - Supabase Edge Function
 * 
 * Renders LinkedIn banners server-side using satori/og_edge.
 * This bypasses all browser/CORS limitations.
 * 
 * Deploy: supabase functions deploy og-generator --no-verify-jwt
 * URL: https://[YOUR_REF].supabase.co/functions/v1/og-generator
 */

import { ImageResponse } from "https://deno.land/x/og_edge@0.0.6/mod.ts";

// Banner dimensions
const BANNER_WIDTH = 1584;
const BANNER_HEIGHT = 396;

// CORS headers
const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const url = new URL(req.url);

        // Extract parameters from query string
        const headline = url.searchParams.get("headline") || "Your Headline";
        const subheadline = url.searchParams.get("subheadline") || "Your subheadline";
        const cta = url.searchParams.get("cta") || null;
        const primaryColor = url.searchParams.get("primaryColor") || "#00ff88";
        const bgColor = url.searchParams.get("bgColor") || "#0a0a0f";
        const bgUrl = url.searchParams.get("bgUrl") || null;
        const fontPair = url.searchParams.get("fontPair") || "tech";

        // Fetch and convert background to base64 if provided
        let bgDataUrl = "";
        if (bgUrl) {
            try {
                const bgResponse = await fetch(bgUrl);
                if (bgResponse.ok) {
                    const bgBuffer = await bgResponse.arrayBuffer();
                    const bgBase64 = btoa(String.fromCharCode(...new Uint8Array(bgBuffer)));
                    const contentType = bgResponse.headers.get("content-type") || "image/jpeg";
                    bgDataUrl = `data:${contentType};base64,${bgBase64}`;
                }
            } catch (e) {
                console.error("Failed to fetch background:", e);
            }
        }

        // Determine text color based on background
        const isLightBg = isLightColor(bgColor);
        const textColor = isLightBg ? "#1a1a1a" : "#ffffff";
        const textDimColor = isLightBg ? "#4a4a4a" : "rgba(255,255,255,0.7)";

        // Build the banner element using React.createElement syntax
        const element = {
            type: "div",
            props: {
                style: {
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    backgroundColor: bgColor,
                    position: "relative",
                    fontFamily: fontPair === "tech" ? "monospace" : "sans-serif",
                },
                children: [
                    // Background Image
                    bgDataUrl ? {
                        type: "img",
                        props: {
                            src: bgDataUrl,
                            style: {
                                position: "absolute",
                                top: 0,
                                left: 0,
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                opacity: 0.35,
                            },
                        },
                    } : null,
                    // Dark overlay
                    {
                        type: "div",
                        props: {
                            style: {
                                position: "absolute",
                                top: 0,
                                left: 0,
                                width: "100%",
                                height: "100%",
                                display: "flex",
                                background: isLightBg
                                    ? "linear-gradient(90deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.8) 50%, transparent 100%)"
                                    : "linear-gradient(90deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.6) 50%, transparent 100%)",
                            },
                        },
                    },
                    // Grid pattern
                    !isLightBg ? {
                        type: "div",
                        props: {
                            style: {
                                position: "absolute",
                                top: 0,
                                left: 0,
                                width: "100%",
                                height: "100%",
                                display: "flex",
                                backgroundImage: `linear-gradient(to bottom, ${hexToRgba(primaryColor, 0.08)} 1px, transparent 1px), linear-gradient(to right, ${hexToRgba(primaryColor, 0.08)} 1px, transparent 1px)`,
                                backgroundSize: "44px 44px",
                            },
                        },
                    } : null,
                    // Content Card
                    {
                        type: "div",
                        props: {
                            style: {
                                position: "absolute",
                                top: 80,
                                left: 100,
                                display: "flex",
                                flexDirection: "column",
                                backgroundColor: isLightBg ? "transparent" : "rgba(20, 20, 30, 0.9)",
                                border: isLightBg ? "none" : `2px solid ${hexToRgba(primaryColor, 0.25)}`,
                                borderRadius: 16,
                                padding: isLightBg ? "0" : "32px 40px",
                                maxWidth: 600,
                            },
                            children: [
                                // Badge / CTA
                                cta ? {
                                    type: "div",
                                    props: {
                                        style: {
                                            display: "flex",
                                            alignItems: "center",
                                            padding: "8px 16px",
                                            borderRadius: 999,
                                            backgroundColor: hexToRgba(primaryColor, 0.12),
                                            color: primaryColor,
                                            border: `1px solid ${hexToRgba(primaryColor, 0.25)}`,
                                            fontSize: 11,
                                            fontWeight: 700,
                                            textTransform: "uppercase",
                                            letterSpacing: "0.08em",
                                            marginBottom: 16,
                                        },
                                        children: cta,
                                    },
                                } : null,
                                // Headline
                                {
                                    type: "div",
                                    props: {
                                        style: {
                                            display: "flex",
                                            fontSize: 48,
                                            fontWeight: 700,
                                            color: textColor,
                                            letterSpacing: "-0.02em",
                                            lineHeight: 1.1,
                                        },
                                        children: headline,
                                    },
                                },
                                // Subheadline
                                {
                                    type: "div",
                                    props: {
                                        style: {
                                            display: "flex",
                                            fontSize: 18,
                                            marginTop: 16,
                                            color: fontPair === "tech" ? primaryColor : textDimColor,
                                            fontFamily: fontPair === "tech" ? "monospace" : "sans-serif",
                                        },
                                        children: fontPair === "tech" ? `$ ${subheadline}` : subheadline,
                                    },
                                },
                            ].filter(Boolean),
                        },
                    },
                    // Corner accents - only for dark themes
                    ...(!isLightBg ? [
                        { type: "div", props: { style: { position: "absolute", top: 24, right: 24, width: 3, height: 48, backgroundColor: primaryColor, display: "flex" } } },
                        { type: "div", props: { style: { position: "absolute", top: 24, right: 24, width: 48, height: 3, backgroundColor: primaryColor, display: "flex" } } },
                        { type: "div", props: { style: { position: "absolute", bottom: 24, left: 24, width: 3, height: 48, backgroundColor: primaryColor, display: "flex" } } },
                        { type: "div", props: { style: { position: "absolute", bottom: 24, left: 24, width: 48, height: 3, backgroundColor: primaryColor, display: "flex" } } },
                    ] : []),
                    // Accent line for light themes
                    isLightBg ? {
                        type: "div",
                        props: {
                            style: {
                                position: "absolute",
                                bottom: 0,
                                left: 0,
                                width: "100%",
                                height: 4,
                                backgroundColor: primaryColor,
                                display: "flex",
                            },
                        },
                    } : null,
                ].filter(Boolean),
            },
        };

        // Generate the image
        const imageResponse = new ImageResponse(element, {
            width: BANNER_WIDTH,
            height: BANNER_HEIGHT,
        });

        // Return the image with CORS headers
        const imageBuffer = await imageResponse.arrayBuffer();

        return new Response(imageBuffer, {
            headers: {
                ...corsHeaders,
                "Content-Type": "image/png",
                "Cache-Control": "public, max-age=31536000, immutable",
            },
        });

    } catch (error) {
        console.error("OG Generator error:", error);
        return new Response(
            JSON.stringify({ error: "Failed to generate banner", details: error.message }),
            {
                status: 500,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            }
        );
    }
});

// Helper: Convert hex color to rgba
function hexToRgba(hex: string, alpha: number): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Helper: Determine if a color is light
function isLightColor(hex: string): boolean {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5;
}
