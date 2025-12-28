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

// ============================================
// CREDIT CHECK & RESET
// ============================================

/**
 * Check user's credit status with lazy daily reset
 */
export async function checkCredits(userId: string): Promise<CreditStatus> {
    const supabase = await createClient();

    // Fetch user data
    const { data: user, error } = await supabase
        .from("users")
        .select("daily_usage_count, last_reset_date, tier, is_banned")
        .eq("id", userId)
        .single();

    if (error || !user) {
        return {
            hasCredits: false,
            remaining: 0,
            dailyLimit: 0,
            resetTime: new Date(),
            tier: "free",
            error: "User not found",
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

    // Get daily limit from system config
    const { data: config } = await supabase
        .from("system_config")
        .select("value")
        .eq("key", `${user.tier}_tier_daily_limit`)
        .single();

    const dailyLimit = config?.value || 5;

    // Check if we need to reset (lazy reset)
    const today = new Date().toISOString().split("T")[0];
    let currentUsage = user.daily_usage_count;

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

        // Log the reset
        await supabase.from("credit_transactions").insert({
            user_id: userId,
            amount: 0,
            type: "daily_reset",
            description: `Daily credit reset for ${today}`,
        });
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

    // First check credits
    const status = await checkCredits(userId);
    if (!status.hasCredits) {
        return {
            success: false,
            newBalance: 0,
            error: ERROR_MESSAGES.DAILY_LIMIT_REACHED.public,
        };
    }

    // Increment usage count
    const { data: updatedUser, error: updateError } = await supabase
        .from("users")
        .update({
            daily_usage_count: status.dailyLimit - status.remaining + 1,
        })
        .eq("id", userId)
        .select("daily_usage_count")
        .single();

    if (updateError) {
        return {
            success: false,
            newBalance: status.remaining,
            error: "Failed to update credits",
        };
    }

    // Record transaction
    const { data: transaction } = await supabase
        .from("credit_transactions")
        .insert({
            user_id: userId,
            amount: -1,
            type: "generation",
            description,
            generation_id: generationId,
        })
        .select("id")
        .single();

    return {
        success: true,
        newBalance: status.remaining - 1,
        transactionId: transaction?.id,
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

    // Record refund transaction
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
 * Check if user is in maintenance mode
 */
export async function isMaintenanceMode(): Promise<boolean> {
    const supabase = await createClient();

    const { data } = await supabase
        .from("system_config")
        .select("value")
        .eq("key", "maintenance_mode")
        .single();

    return data?.value === 1;
}
