/**
 * Input Validation Schemas using Zod
 * Strictly validates all user input to prevent injection attacks
 */

import { z } from "zod";
import { detectPromptInjection } from "./ai-registry";

// ============================================
// GENERATION SCHEMAS
// ============================================

export const GenerateRequestSchema = z.object({
    prompt: z
        .string()
        .min(10, "Prompt must be at least 10 characters")
        .max(500, "Prompt cannot exceed 500 characters")
        .refine((val) => !detectPromptInjection(val), {
            message: "Prompt contains prohibited content",
        }),

    platforms: z
        .array(
            z.enum([
                "linkedin_banner",
                "linkedin_carousel",
                "youtube_thumbnail",
                "instagram_post",
                "twitter_post",
            ])
        )
        .min(1, "Select at least one platform")
        .max(5, "Maximum 5 platforms allowed"),

    // Optional settings
    brandKit: z
        .object({
            primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
            secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
            logoUrl: z.string().url().optional(),
        })
        .optional(),
});

export type GenerateRequest = z.infer<typeof GenerateRequestSchema>;

// ============================================
// USER SCHEMAS
// ============================================

export const UpdateProfileSchema = z.object({
    fullName: z
        .string()
        .min(2, "Name must be at least 2 characters")
        .max(100, "Name cannot exceed 100 characters")
        .regex(/^[a-zA-Z\s'-]+$/, "Name contains invalid characters"),
});

export type UpdateProfileRequest = z.infer<typeof UpdateProfileSchema>;

// ============================================
// FEEDBACK SCHEMAS
// ============================================

export const FeedbackSchema = z.object({
    type: z.enum(["bug", "feature", "general"]),
    message: z
        .string()
        .min(10, "Message must be at least 10 characters")
        .max(2000, "Message cannot exceed 2000 characters"),
    generationId: z.string().uuid().optional(),
    email: z.string().email().optional(),
});

export type FeedbackRequest = z.infer<typeof FeedbackSchema>;

// ============================================
// WAITLIST SCHEMAS
// ============================================

export const WaitlistSchema = z.object({
    email: z.string().email("Invalid email address"),
    tier: z.enum(["pro", "team"]).optional(),
    source: z.string().max(50).optional(),
});

export type WaitlistRequest = z.infer<typeof WaitlistSchema>;

// ============================================
// VALIDATION HELPERS
// ============================================

export function validateRequest<T>(
    schema: z.ZodSchema<T>,
    data: unknown
): { success: true; data: T } | { success: false; error: string } {
    try {
        const parsed = schema.parse(data);
        return { success: true, data: parsed };
    } catch (error) {
        if (error instanceof z.ZodError) {
            const firstError = error.issues[0];
            return { success: false, error: firstError?.message || "Invalid request" };
        }
        return { success: false, error: "Validation failed" };
    }
}

// ============================================
// SANITIZATION HELPERS
// ============================================

/**
 * Sanitize HTML entities in user input
 */
export function sanitizeInput(input: string): string {
    return input
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

/**
 * Remove any potential script tags or event handlers
 */
export function stripScripts(input: string): string {
    return input
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
        .replace(/on\w+\s*=/gi, "")
        .replace(/javascript:/gi, "");
}
