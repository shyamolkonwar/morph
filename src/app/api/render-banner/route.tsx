/**
 * Server-Side Banner Render API
 * 
 * POST /api/render-banner
 * 
 * Uses @vercel/og (satori) to render banners server-side
 * This avoids CORS and html-to-image issues
 */

import { NextRequest, NextResponse } from "next/server";
import { ImageResponse } from "next/og";
import { createClient } from "@/lib/supabase/server";
import { MORPH_HEADERS } from "@/lib/ai-registry";

export const runtime = "edge";

// Banner dimensions
const BANNER_WIDTH = 1584;
const BANNER_HEIGHT = 396;

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
        const {
            template = "tech",
            headline = "Your Headline",
            subheadline = "Your subheadline goes here",
            cta = null,
            primaryColor = "#00ff88",
            secondaryColor = "#0a0a0f",
            textColor = "#ffffff",
            backgroundUrl = "",
        } = body;

        // Fetch background image and convert to base64
        let bgDataUrl = "";
        if (backgroundUrl && !backgroundUrl.startsWith("data:")) {
            try {
                const bgResponse = await fetch(backgroundUrl);
                if (bgResponse.ok) {
                    const bgBuffer = await bgResponse.arrayBuffer();
                    const bgBase64 = Buffer.from(bgBuffer).toString("base64");
                    const contentType = bgResponse.headers.get("content-type") || "image/jpeg";
                    bgDataUrl = `data:${contentType};base64,${bgBase64}`;
                }
            } catch (e) {
                console.error("Failed to fetch background:", e);
            }
        } else {
            bgDataUrl = backgroundUrl;
        }

        // Render based on template
        let element: React.ReactNode;

        if (template === "tech") {
            element = renderTechTemplate(headline, subheadline, cta, primaryColor, textColor, bgDataUrl);
        } else if (template === "minimalist") {
            element = renderMinimalistTemplate(headline, subheadline, cta, primaryColor, secondaryColor, textColor, bgDataUrl);
        } else {
            element = renderStartupTemplate(headline, subheadline, cta, primaryColor, secondaryColor, textColor, bgDataUrl);
        }

        const imageResponse = new ImageResponse(element, {
            width: BANNER_WIDTH,
            height: BANNER_HEIGHT,
        });

        // Convert to base64 for JSON response
        const imageBuffer = await imageResponse.arrayBuffer();
        const base64 = Buffer.from(imageBuffer).toString("base64");

        return NextResponse.json({
            success: true,
            imageData: `data:image/png;base64,${base64}`,
        }, { headers: MORPH_HEADERS });

    } catch (error) {
        console.error("Render error:", error);
        return NextResponse.json(
            { error: "Failed to render banner" },
            { status: 500, headers: MORPH_HEADERS }
        );
    }
}

// Tech template - Satori-compatible (all divs have display: flex)
function renderTechTemplate(
    headline: string,
    subheadline: string,
    cta: string | null,
    primaryColor: string,
    textColor: string,
    bgDataUrl: string
) {
    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#0a0a0f",
                fontFamily: "monospace",
                position: "relative",
            }}
        >
            {/* Background Image */}
            {bgDataUrl ? (
                <img
                    src={bgDataUrl}
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        opacity: 0.35,
                    }}
                />
            ) : null}

            {/* Dark overlay */}
            <div
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    background: "linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, transparent 30%, transparent 70%, rgba(0,0,0,0.7) 100%)",
                }}
            />

            {/* Grid pattern */}
            <div
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    backgroundImage: `linear-gradient(${primaryColor}15 1px, transparent 1px), linear-gradient(90deg, ${primaryColor}15 1px, transparent 1px)`,
                    backgroundSize: "40px 40px",
                }}
            />

            {/* Card */}
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    backgroundColor: "rgba(20, 20, 30, 0.95)",
                    border: `2px solid ${primaryColor}50`,
                    borderRadius: "16px",
                    padding: "32px 48px",
                    maxWidth: "600px",
                    boxShadow: `0 0 60px ${primaryColor}30`,
                }}
            >
                <div style={{ display: "flex", fontSize: "36px", fontWeight: "bold", color: textColor }}>
                    {headline}
                </div>
                <div style={{ display: "flex", fontSize: "16px", marginTop: "12px", color: primaryColor }}>
                    $ {subheadline}
                </div>
                {cta ? (
                    <div style={{ display: "flex", fontSize: "14px", marginTop: "20px", color: textColor, opacity: 0.6 }}>
                        <span style={{ color: "#22c55e", marginRight: "8px" }}>→</span> {cta}
                    </div>
                ) : null}
            </div>

            {/* Corner accents - Top Right */}
            <div style={{ position: "absolute", top: "24px", right: "24px", width: "3px", height: "48px", backgroundColor: primaryColor, display: "flex" }} />
            <div style={{ position: "absolute", top: "24px", right: "24px", width: "48px", height: "3px", backgroundColor: primaryColor, display: "flex" }} />

            {/* Corner accents - Bottom Left */}
            <div style={{ position: "absolute", bottom: "24px", left: "24px", width: "3px", height: "48px", backgroundColor: primaryColor, display: "flex" }} />
            <div style={{ position: "absolute", bottom: "24px", left: "24px", width: "48px", height: "3px", backgroundColor: primaryColor, display: "flex" }} />
        </div>
    );
}

// Minimalist template
function renderMinimalistTemplate(
    headline: string,
    subheadline: string,
    cta: string | null,
    primaryColor: string,
    secondaryColor: string,
    textColor: string,
    bgDataUrl: string
) {
    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                backgroundColor: secondaryColor,
                padding: "48px 64px",
                position: "relative",
                fontFamily: "sans-serif",
            }}
        >
            {/* Background */}
            {bgDataUrl ? (
                <img
                    src={bgDataUrl}
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        opacity: 0.3,
                    }}
                />
            ) : null}

            {/* Gradient overlay */}
            <div
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    background: `linear-gradient(135deg, ${secondaryColor} 0%, ${secondaryColor}ee 40%, ${secondaryColor}dd 60%, ${secondaryColor} 100%)`,
                }}
            />

            {/* Content */}
            <div style={{ display: "flex", flexDirection: "column", borderLeft: `6px solid ${primaryColor}`, paddingLeft: "32px", zIndex: 10 }}>
                <div style={{ display: "flex", fontSize: "48px", fontWeight: "bold", color: textColor, letterSpacing: "-0.02em" }}>
                    {headline}
                </div>
                <div style={{ display: "flex", fontSize: "20px", marginTop: "16px", color: textColor, opacity: 0.75 }}>
                    {subheadline}
                </div>
                {cta ? (
                    <div
                        style={{
                            display: "flex",
                            marginTop: "24px",
                            fontSize: "14px",
                            fontWeight: 600,
                            padding: "12px 24px",
                            borderRadius: "999px",
                            backgroundColor: primaryColor,
                            color: secondaryColor,
                            width: "fit-content",
                        }}
                    >
                        {cta}
                    </div>
                ) : null}
            </div>

            {/* Bottom accent */}
            <div style={{ position: "absolute", bottom: 0, left: 0, width: "100%", height: "4px", backgroundColor: primaryColor, display: "flex" }} />
        </div>
    );
}

// Startup template
function renderStartupTemplate(
    headline: string,
    subheadline: string,
    cta: string | null,
    primaryColor: string,
    secondaryColor: string,
    textColor: string,
    bgDataUrl: string
) {
    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                display: "flex",
                backgroundColor: secondaryColor,
                position: "relative",
                fontFamily: "sans-serif",
            }}
        >
            {/* Right side background */}
            {bgDataUrl ? (
                <img
                    src={bgDataUrl}
                    style={{
                        position: "absolute",
                        top: 0,
                        right: 0,
                        width: "50%",
                        height: "100%",
                        objectFit: "cover",
                    }}
                />
            ) : null}

            {/* Gradient overlay */}
            <div
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    background: `linear-gradient(90deg, ${secondaryColor} 35%, ${secondaryColor}ee 50%, ${secondaryColor}66 70%, transparent 100%)`,
                }}
            />

            {/* Content */}
            <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", padding: "48px", width: "60%", zIndex: 10 }}>
                {/* Badge */}
                <div
                    style={{
                        display: "flex",
                        marginBottom: "16px",
                        fontSize: "11px",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        padding: "8px 16px",
                        borderRadius: "999px",
                        backgroundColor: `${primaryColor}30`,
                        color: primaryColor,
                        border: `1px solid ${primaryColor}50`,
                        width: "fit-content",
                    }}
                >
                    {cta || "✨ Available Now"}
                </div>

                <div style={{ display: "flex", fontSize: "44px", fontWeight: "bold", color: textColor }}>
                    {headline}
                </div>
                <div style={{ display: "flex", fontSize: "18px", marginTop: "16px", color: textColor, opacity: 0.85, maxWidth: "400px" }}>
                    {subheadline}
                </div>
            </div>
        </div>
    );
}
