/**
 * Feedback API Route
 * 
 * POST /api/feedback - Submit bug reports and feedback
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { MORPH_HEADERS } from "@/lib/ai-registry";
import { validateRequest, FeedbackSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Validate input
        const validation = validateRequest(FeedbackSchema, body);
        if (!validation.success) {
            return NextResponse.json(
                { error: validation.error },
                { status: 400, headers: MORPH_HEADERS }
            );
        }

        const { type, message, generationId, email } = validation.data;

        const supabase = await createClient();

        // Get user if logged in
        const { data: { user } } = await supabase.auth.getUser();

        // Insert feedback
        const { error } = await supabase.from("feedback").insert({
            user_id: user?.id,
            type,
            message,
            generation_id: generationId,
            email: email || user?.email,
            status: "new",
        });

        if (error) {
            console.error("Feedback insert error:", error);
            return NextResponse.json(
                { error: "Failed to submit feedback. Please try again." },
                { status: 500, headers: MORPH_HEADERS }
            );
        }

        return NextResponse.json(
            {
                success: true,
                message: "Thank you for your feedback! We'll review it soon.",
            },
            { status: 201, headers: MORPH_HEADERS }
        );

    } catch (error) {
        console.error("Feedback API error:", error);

        return NextResponse.json(
            { error: "Something went wrong. Please try again." },
            { status: 500, headers: MORPH_HEADERS }
        );
    }
}
