/**
 * MorphV2 Generation API Route
 * 
 * POST /api/v2/generate
 * 
 * Uses the Python FastAPI backend for first-principles design generation
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { MORPH_HEADERS, ERROR_MESSAGES, MORPH_ENGINE_VERSION } from "@/lib/ai-registry";
import { checkSpeedLimit } from "@/lib/rate-limit";
import { checkCredits, deductCredit, refundCredit, isMaintenanceMode } from "@/lib/credits";
import { validateRequest } from "@/lib/validation";
import { z } from "zod";

// MorphV2 backend URL
const MORPH_BACKEND_URL = process.env.MORPH_BACKEND_URL || "http://localhost:8000";

// Request schema
const GenerateV2RequestSchema = z.object({
    prompt: z.string().min(5).max(1000),
    canvas_width: z.number().min(100).max(4096).optional().default(1200),
    canvas_height: z.number().min(100).max(4096).optional().default(630),
    brand_colors: z.array(z.string()).optional().default(["#FF6B35", "#FFFFFF", "#004E89"]),
    max_iterations: z.number().min(1).max(10).optional().default(5),
});

export async function POST(request: NextRequest) {
    const startTime = Date.now();

    try {
        // Check maintenance mode
        if (await isMaintenanceMode()) {
            return NextResponse.json(
                { error: ERROR_MESSAGES.MAINTENANCE_MODE.public },
                { status: 503, headers: MORPH_HEADERS }
            );
        }

        // Parse request body
        const body = await request.json();

        // Validate input
        const validation = validateRequest(GenerateV2RequestSchema, body);
        if (!validation.success) {
            return NextResponse.json(
                { error: validation.error },
                { status: 400, headers: MORPH_HEADERS }
            );
        }

        const { prompt, canvas_width, canvas_height, brand_colors, max_iterations } = validation.data;

        // Verify authentication
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: ERROR_MESSAGES.UNAUTHORIZED.public },
                { status: 401, headers: MORPH_HEADERS }
            );
        }

        // Check rate limits
        const speedLimit = await checkSpeedLimit(user.id);
        if (!speedLimit.success) {
            return NextResponse.json(
                {
                    error: speedLimit.error,
                    retryAfter: Math.ceil((speedLimit.reset - Date.now()) / 1000),
                },
                { status: 429, headers: MORPH_HEADERS }
            );
        }

        // Check credit status
        const creditStatus = await checkCredits(user.id);
        if (!creditStatus.hasCredits) {
            return NextResponse.json(
                {
                    error: creditStatus.error || ERROR_MESSAGES.DAILY_LIMIT_REACHED.public,
                    remaining: creditStatus.remaining,
                    resetTime: creditStatus.resetTime,
                },
                { status: 429, headers: MORPH_HEADERS }
            );
        }

        // Deduct credit BEFORE generation
        const deduction = await deductCredit(user.id, `MorphV2: ${prompt.slice(0, 40)}...`);
        if (!deduction.success) {
            return NextResponse.json(
                { error: deduction.error },
                { status: 402, headers: MORPH_HEADERS }
            );
        }

        // Call MorphV2 Python backend
        let morphResponse;
        try {
            const backendResponse = await fetch(`${MORPH_BACKEND_URL}/api/v1/generate-banner`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    prompt,
                    canvas_width,
                    canvas_height,
                    brand_colors,
                    max_iterations,
                }),
            });

            if (!backendResponse.ok) {
                throw new Error(`Backend returned ${backendResponse.status}`);
            }

            morphResponse = await backendResponse.json();
        } catch (backendError) {
            // Refund credit on backend failure
            if (deduction.transactionId) {
                await refundCredit(user.id, deduction.transactionId, "MorphV2 backend unavailable");
            }

            console.error("MorphV2 backend error:", backendError);
            return NextResponse.json(
                {
                    error: "MorphV2 Engine is temporarily unavailable. Please try again.",
                    fallback: true
                },
                { status: 503, headers: MORPH_HEADERS }
            );
        }

        // Check if generation succeeded
        if (morphResponse.status !== "success") {
            if (deduction.transactionId && morphResponse.errors) {
                await refundCredit(user.id, deduction.transactionId, "Generation failed");
            }
            return NextResponse.json(
                {
                    error: morphResponse.errors?.join(", ") || ERROR_MESSAGES.GENERATION_FAILED.public,
                    verification_report: morphResponse.verification_report,
                },
                { status: 500, headers: MORPH_HEADERS }
            );
        }

        // Create project record
        const { data: project } = await supabase
            .from("projects")
            .insert({
                user_id: user.id,
                title: `MorphV2: ${prompt.slice(0, 50)}`,
                type: "linkedin_banner",
                status: "completed",
            })
            .select("id")
            .single();

        // Store generation record
        await supabase.from("generations").insert({
            project_id: project?.id,
            user_id: user.id,
            prompt,
            copy_json: {
                svg: morphResponse.svg,
                constraint_graph: morphResponse.constraint_graph,
                verification_report: morphResponse.verification_report,
            },
            image_url: morphResponse.png_base64 ? `data:image/png;base64,${morphResponse.png_base64}` : null,
            platform: "linkedin_banner",
            morph_engine_version: `MorphV2-${MORPH_ENGINE_VERSION}`,
            generation_time_ms: Date.now() - startTime,
        });

        // Return successful response
        return NextResponse.json(
            {
                success: true,
                projectId: project?.id,
                svg: morphResponse.svg,
                png_base64: morphResponse.png_base64,
                verification_report: morphResponse.verification_report,
                constraint_graph: morphResponse.constraint_graph,
                iterations: morphResponse.iterations,
                creditsRemaining: deduction.newBalance,
                generationTime: Date.now() - startTime,
                morphVersion: `V2-${MORPH_ENGINE_VERSION}`,
            },
            { status: 200, headers: MORPH_HEADERS }
        );

    } catch (error) {
        console.error("MorphV2 Generation API error:", error);

        return NextResponse.json(
            { error: ERROR_MESSAGES.GENERATION_FAILED.public },
            { status: 500, headers: MORPH_HEADERS }
        );
    }
}

// Health check endpoint
export async function GET() {
    // Check if MorphV2 backend is available
    let backendStatus = "unknown";
    try {
        const healthResponse = await fetch(`${MORPH_BACKEND_URL}/health`, {
            method: "GET",
        });
        backendStatus = healthResponse.ok ? "healthy" : "unhealthy";
    } catch {
        backendStatus = "unavailable";
    }

    return NextResponse.json(
        {
            status: "ok",
            version: `MorphV2-${MORPH_ENGINE_VERSION}`,
            service: "MorphV2 Generation API",
            engine: "First-Principles Design Engine",
            backend: backendStatus,
        },
        { headers: MORPH_HEADERS }
    );
}
