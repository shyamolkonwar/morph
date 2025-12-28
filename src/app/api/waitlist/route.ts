/**
 * Waitlist API Route
 * 
 * POST /api/waitlist - Join Pro/Team waitlist
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { MORPH_HEADERS } from "@/lib/ai-registry";
import { validateRequest, WaitlistSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Validate input
        const validation = validateRequest(WaitlistSchema, body);
        if (!validation.success) {
            return NextResponse.json(
                { error: validation.error },
                { status: 400, headers: MORPH_HEADERS }
            );
        }

        const { email, tier, source } = validation.data;

        const supabase = await createClient();

        // Check if already on waitlist
        const { data: existing } = await supabase
            .from("waitlist")
            .select("id")
            .eq("email", email)
            .single();

        if (existing) {
            return NextResponse.json(
                { message: "You're already on the waitlist! We'll notify you soon." },
                { status: 200, headers: MORPH_HEADERS }
            );
        }

        // Get user_id if logged in
        const { data: { user } } = await supabase.auth.getUser();

        // Add to waitlist
        const { error } = await supabase.from("waitlist").insert({
            email,
            tier: tier || "pro",
            source: source || "pricing_page",
            user_id: user?.id,
        });

        if (error) {
            console.error("Waitlist insert error:", error);
            return NextResponse.json(
                { error: "Failed to join waitlist. Please try again." },
                { status: 500, headers: MORPH_HEADERS }
            );
        }

        return NextResponse.json(
            {
                success: true,
                message: "You're on the list! We'll email you when Pro launches.",
            },
            { status: 201, headers: MORPH_HEADERS }
        );

    } catch (error) {
        console.error("Waitlist API error:", error);

        return NextResponse.json(
            { error: "Something went wrong. Please try again." },
            { status: 500, headers: MORPH_HEADERS }
        );
    }
}
