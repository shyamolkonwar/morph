/**
 * Generation API Route - Smart Template Engine
 * 
 * POST /api/generate
 * 
 * Pipeline:
 * 1. Validate & authenticate
 * 2. Generate banner config with Morph-1.1 (GPT)
 * 3. Generate background with Morph-Vision (GPT-image-1 / Pollinations)
 * 4. Return config + background URL for client-side assembly
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { MORPH_HEADERS, ERROR_MESSAGES, MORPH_ENGINE_VERSION } from "@/lib/ai-registry";
import { checkSpeedLimit } from "@/lib/rate-limit";
import { checkCredits, deductCredit, refundCredit, isMaintenanceMode } from "@/lib/credits";
import { validateRequest, GenerateRequestSchema } from "@/lib/validation";
import { generateBannerConfig } from "@/lib/services/gpt";
import { generateBackgroundImage } from "@/lib/services/gemini";

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
        const validation = validateRequest(GenerateRequestSchema, body);
        if (!validation.success) {
            return NextResponse.json(
                { error: validation.error },
                { status: 400, headers: MORPH_HEADERS }
            );
        }

        const { prompt } = validation.data;

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
        const deduction = await deductCredit(user.id, `Banner: ${prompt.slice(0, 40)}...`);
        if (!deduction.success) {
            return NextResponse.json(
                { error: deduction.error },
                { status: 402, headers: MORPH_HEADERS }
            );
        }

        // Step 1: Generate banner config with Morph-1.1
        const configResult = await generateBannerConfig(prompt);

        if (!configResult.success || !configResult.config) {
            // Refund credit on failure
            if (deduction.transactionId) {
                await refundCredit(user.id, deduction.transactionId, "Config generation failed");
            }
            return NextResponse.json(
                { error: configResult.error || ERROR_MESSAGES.GENERATION_FAILED.public },
                { status: 500, headers: MORPH_HEADERS }
            );
        }

        // Step 2: Generate background image using hybrid pipeline (Pexels -> AI fallback)
        const imageResult = await generateBackgroundImage(configResult.config.assets);

        // Create project record (optional, don't fail on error)
        const { data: project } = await supabase
            .from("projects")
            .insert({
                user_id: user.id,
                title: configResult.config.content.headline.slice(0, 50),
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
            copy_json: configResult.config,
            image_url: imageResult.imageUrl,
            layout_id: configResult.config.template_id,
            platform: "linkedin_banner",
            morph_engine_version: MORPH_ENGINE_VERSION,
            generation_time_ms: Date.now() - startTime,
        });

        // Return successful response
        return NextResponse.json(
            {
                success: true,
                projectId: project?.id,
                designPlan: configResult.config,
                generativeDesign: configResult.generativeDesign, // V2: Component tree
                backgroundImage: {
                    imageUrl: imageResult.imageUrl,
                    provider: imageResult.provider,
                    mimeType: imageResult.mimeType,
                    photographer: imageResult.photographer,
                    photographerUrl: imageResult.photographerUrl,
                },
                creditsRemaining: deduction.newBalance,
                generationTime: Date.now() - startTime,
                morphVersion: MORPH_ENGINE_VERSION,
            },
            { status: 200, headers: MORPH_HEADERS }
        );

    } catch (error) {
        console.error("Generation API error:", error);

        return NextResponse.json(
            { error: ERROR_MESSAGES.GENERATION_FAILED.public },
            { status: 500, headers: MORPH_HEADERS }
        );
    }
}

// Health check endpoint
export async function GET() {
    return NextResponse.json(
        {
            status: "ok",
            version: MORPH_ENGINE_VERSION,
            service: "Morph Generation API",
            engine: "Smart Template Engine v1",
        },
        { headers: MORPH_HEADERS }
    );
}
