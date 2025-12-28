/**
 * Credit Service - Daily Allowance System
 * 
 * Implements the "soft reset" lazy evaluation model
 * where credits reset on first access each day.
 */

import { createClient } from "@/lib/supabase/server";
import { ERROR_MESSAGES } from "./ai-registry";

export interface CreditStatus {
    hasCredits: boolean;
    remaining: number;
    dailyLimit: number;
    resetTime: Date;
    tier: "free" | "pro" | "team";
    error?: string;
}

export interface DeductResult {
    success: boolean;
    newBalance: number;
    transactionId?: string;
    error?: string;
}

const DEFAULT_DAILY_LIMIT = 5;

// ============================================
// ENSURE USER EXISTS
// ============================================

/**
 * Ensure user record exists in public.users table
 * Creates one if it doesn't exist (for new OAuth users)
 */
async function ensureUserExists(
    userId: string,
    supabase: Awaited<ReturnType<typeof createClient>>
): Promise<boolean> {
    // Check if user exists
    const { data: existingUser, error: fetchError } = await supabase
        .from("users")
        .select("id")
        .eq("id", userId)
        .single();

    if (existingUser) {
        return true;
    }

    // User doesn't exist, try to create them
    if (fetchError && fetchError.code === "PGRST116") {
        // Get auth user data for name/avatar
        const { data: { user: authUser } } = await supabase.auth.getUser();

        const today = new Date().toISOString().split("T")[0];

        const { error: insertError } = await supabase.from("users").insert({
            id: userId,
            email: authUser?.email || "",
            full_name: authUser?.user_metadata?.full_name || authUser?.user_metadata?.name || null,
            avatar_url: authUser?.user_metadata?.avatar_url || authUser?.user_metadata?.picture || null,
            tier: "free",
            daily_usage_count: 0,
            last_reset_date: today,
        });

        if (insertError) {
            console.error("Failed to create user record:", insertError);
            return false;
        }

        return true;
    }

    return false;
}

// ============================================
// CREDIT CHECK & RESET
// ============================================

/**
 * Check user's credit status with lazy daily reset
 */
export async function checkCredits(userId: string): Promise<CreditStatus> {
    const supabase = await createClient();

    // Ensure user exists first
    const userExists = await ensureUserExists(userId, supabase);
    if (!userExists) {
        // Return default free tier credits for new users
        const now = new Date();
        const nextMidnight = new Date(now);
        nextMidnight.setUTCHours(24, 0, 0, 0);

        return {
            hasCredits: true,
            remaining: DEFAULT_DAILY_LIMIT,
            dailyLimit: DEFAULT_DAILY_LIMIT,
            resetTime: nextMidnight,
            tier: "free",
        };
    }

    // Fetch user data
    const { data: user, error } = await supabase
        .from("users")
        .select("daily_usage_count, last_reset_date, tier, is_banned")
        .eq("id", userId)
        .single();

    if (error || !user) {
        const now = new Date();
        const nextMidnight = new Date(now);
        nextMidnight.setUTCHours(24, 0, 0, 0);

        return {
            hasCredits: true,
            remaining: DEFAULT_DAILY_LIMIT,
            dailyLimit: DEFAULT_DAILY_LIMIT,
            resetTime: nextMidnight,
            tier: "free",
        };
    }

    // Check if banned
    if (user.is_banned) {
        return {
            hasCredits: false,
            remaining: 0,
            dailyLimit: 0,
            resetTime: new Date(),
            tier: user.tier as "free" | "pro" | "team",
            error: ERROR_MESSAGES.BANNED_USER.public,
        };
    }

    // Get daily limit based on tier
    const tierLimits: Record<string, number> = {
        free: 5,
        pro: 100,
        team: 500,
    };
    const dailyLimit = tierLimits[user.tier] || DEFAULT_DAILY_LIMIT;

    // Check if we need to reset (lazy reset)
    const today = new Date().toISOString().split("T")[0];
    let currentUsage = user.daily_usage_count || 0;

    if (user.last_reset_date !== today) {
        // Reset the counter
        await supabase
            .from("users")
            .update({
                daily_usage_count: 0,
                last_reset_date: today,
            })
            .eq("id", userId);

        currentUsage = 0;
    }

    const remaining = Math.max(0, dailyLimit - currentUsage);

    // Calculate reset time (next midnight UTC)
    const now = new Date();
    const nextMidnight = new Date(now);
    nextMidnight.setUTCHours(24, 0, 0, 0);

    return {
        hasCredits: remaining > 0,
        remaining,
        dailyLimit,
        resetTime: nextMidnight,
        tier: user.tier as "free" | "pro" | "team",
    };
}

// ============================================
// CREDIT DEDUCTION
// ============================================

/**
 * Deduct a credit with atomic transaction
 * Should be called BEFORE AI generation
 */
export async function deductCredit(
    userId: string,
    description: string,
    generationId?: string
): Promise<DeductResult> {
    const supabase = await createClient();

    // Ensure user exists
    await ensureUserExists(userId, supabase);

    // Check credits
    const status = await checkCredits(userId);
    if (!status.hasCredits) {
        return {
            success: false,
            newBalance: 0,
            error: ERROR_MESSAGES.DAILY_LIMIT_REACHED.public,
        };
    }

    // Calculate new usage count
    const newUsageCount = status.dailyLimit - status.remaining + 1;

    // Increment usage count
    const { error: updateError } = await supabase
        .from("users")
        .update({
            daily_usage_count: newUsageCount,
        })
        .eq("id", userId);

    if (updateError) {
        console.error("Credit update error:", updateError);
        return {
            success: false,
            newBalance: status.remaining,
            error: "Failed to update credits",
        };
    }

    // Record transaction (optional, don't fail if it errors)
    const transactionResult = await supabase
        .from("credit_transactions")
        .insert({
            user_id: userId,
            amount: -1,
            type: "generation",
            description,
            generation_id: generationId || null,
        })
        .select("id")
        .single();

    return {
        success: true,
        newBalance: status.remaining - 1,
        transactionId: transactionResult.data?.id,
    };
}

// ============================================
// CREDIT REFUND
// ============================================

/**
 * Refund a credit if generation fails
 */
export async function refundCredit(
    userId: string,
    originalTransactionId: string,
    reason: string
): Promise<DeductResult> {
    const supabase = await createClient();

    // Get current status
    const status = await checkCredits(userId);

    // Decrement usage count (give back the credit)
    const newUsage = Math.max(0, status.dailyLimit - status.remaining - 1);

    await supabase
        .from("users")
        .update({
            daily_usage_count: newUsage,
        })
        .eq("id", userId);

    // Record refund transaction (optional)
    await supabase.from("credit_transactions").insert({
        user_id: userId,
        amount: 1,
        type: "refund",
        description: `Refund: ${reason} (Original: ${originalTransactionId})`,
    });

    return {
        success: true,
        newBalance: status.remaining + 1,
    };
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Get time until next credit reset (formatted)
 */
export function getTimeUntilReset(resetTime: Date): string {
    const now = new Date();
    const diff = resetTime.getTime() - now.getTime();

    if (diff <= 0) return "now";

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
}

/**
 * Check if system is in maintenance mode
 */
export async function isMaintenanceMode(): Promise<boolean> {
    try {
        const supabase = await createClient();

        const { data } = await supabase
            .from("system_config")
            .select("value")
            .eq("key", "maintenance_mode")
            .single();

        return data?.value === 1;
    } catch {
        // If config table doesn't exist, not in maintenance
        return false;
    }
}
