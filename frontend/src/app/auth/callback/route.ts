/**
 * Auth Callback Route
 * 
 * Handles the OAuth callback from Supabase after Google authentication.
 * Exchanges the code for a session and redirects to the dashboard.
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get("code");
    // If "next" is in param, use it as the redirect URL
    let next = searchParams.get("next") ?? "/dashboard";

    if (!next.startsWith("/")) {
        // If "next" is not a relative URL, use the default
        next = "/dashboard";
    }

    if (code) {
        const supabase = await createClient();
        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (!error) {
            const forwardedHost = request.headers.get("x-forwarded-host");
            const isLocalEnv = process.env.NODE_ENV === "development";

            if (isLocalEnv) {
                // In local dev, no load balancer, so redirect to origin
                return NextResponse.redirect(`${origin}${next}`);
            } else if (forwardedHost) {
                // In production with load balancer
                return NextResponse.redirect(`https://${forwardedHost}${next}`);
            } else {
                return NextResponse.redirect(`${origin}${next}`);
            }
        }
    }

    // Return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}
