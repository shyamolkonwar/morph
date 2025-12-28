/**
 * Credits API Route
 * 
 * GET /api/credits - Get current credit status
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { MORPH_HEADERS, ERROR_MESSAGES } from "@/lib/ai-registry";
import { checkCredits, getTimeUntilReset } from "@/lib/credits";

export async function GET(request: NextRequest) {
    try {
        // Verify authentication
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: ERROR_MESSAGES.UNAUTHORIZED.public },
                { status: 401, headers: MORPH_HEADERS }
            );
        }

        // Get credit status
        const creditStatus = await checkCredits(user.id);

        if (creditStatus.error) {
            return NextResponse.json(
                { error: creditStatus.error },
                { status: 400, headers: MORPH_HEADERS }
            );
        }

        return NextResponse.json(
            {
                remaining: creditStatus.remaining,
                dailyLimit: creditStatus.dailyLimit,
                tier: creditStatus.tier,
                resetTime: creditStatus.resetTime.toISOString(),
                resetIn: getTimeUntilReset(creditStatus.resetTime),
            },
            { headers: MORPH_HEADERS }
        );

    } catch (error) {
        console.error("Credits API error:", error);

        return NextResponse.json(
            { error: "Failed to fetch credit status" },
            { status: 500, headers: MORPH_HEADERS }
        );
    }
}
