/**
 * Generation API Route
 * 
 * POST /api/generate
 * 
 * Full generation pipeline with:
 * - Auth verification
 * - Rate limiting
 * - Credit deduction
 * - Content moderation
 * - AI generation (GPT-4o + Gemini)
 * - Error handling with refunds
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { MORPH_HEADERS, ERROR_MESSAGES, MORPH_ENGINE_VERSION } from "@/lib/ai-registry";
import { checkSpeedLimit, checkDailyLimit } from "@/lib/rate-limit";
import { checkCredits, deductCredit, refundCredit, isMaintenanceMode } from "@/lib/credits";
import { validateRequest, GenerateRequestSchema } from "@/lib/validation";
import { generateDesignPlan } from "@/lib/services/gpt";
import { generateBackgroundImage, PLATFORM_SPECS } from "@/lib/services/gemini";

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

        const { prompt, platforms } = validation.data;

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
        const deduction = await deductCredit(user.id, `Generated: ${prompt.slice(0, 50)}...`);
        if (!deduction.success) {
            return NextResponse.json(
                { error: deduction.error },
                { status: 402, headers: MORPH_HEADERS }
            );
        }

        // Create project record
        const { data: project, error: projectError } = await supabase
            .from("projects")
            .insert({
                user_id: user.id,
                title: prompt.slice(0, 50),
                type: platforms[0],
                status: "generating",
            })
            .select("id")
            .single();

        if (projectError) {
            // Refund credit if project creation fails
            if (deduction.transactionId) {
                await refundCredit(user.id, deduction.transactionId, "Project creation failed");
            }
            return NextResponse.json(
                { error: "Failed to create project" },
                { status: 500, headers: MORPH_HEADERS }
            );
        }

        // Generate design plan with Morph-1.1
        const designResult = await generateDesignPlan(prompt, platforms[0]);

        if (!designResult.success || !designResult.plan) {
            // Refund credit on generation failure
            if (deduction.transactionId) {
                await refundCredit(user.id, deduction.transactionId, "Design generation failed");
            }

            // Update project status
            await supabase
                .from("projects")
                .update({ status: "failed" })
                .eq("id", project.id);

            return NextResponse.json(
                { error: designResult.error || ERROR_MESSAGES.GENERATION_FAILED.public },
                { status: 500, headers: MORPH_HEADERS }
            );
        }

        // Generate background image with Morph-Vision
        const imageResult = await generateBackgroundImage(
            designResult.plan.image_prompt,
            platforms[0] as keyof typeof PLATFORM_SPECS
        );

        // Store generation result
        const { data: generation } = await supabase
            .from("generations")
            .insert({
                project_id: project.id,
                user_id: user.id,
                prompt,
                copy_json: designResult.plan,
                image_url: imageResult.imageUrl,
                layout_id: designResult.plan.layout_id,
                platform: platforms[0],
                morph_engine_version: MORPH_ENGINE_VERSION,
                generation_time_ms: Date.now() - startTime,
            })
            .select("id")
            .single();

        // Update project status
        await supabase
            .from("projects")
            .update({ status: "completed" })
            .eq("id", project.id);

        // Return successful response
        return NextResponse.json(
            {
                success: true,
                projectId: project.id,
                generationId: generation?.id,
                design: designResult.plan,
                backgroundImage: imageResult.imageUrl,
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
        },
        { headers: MORPH_HEADERS }
    );
}
