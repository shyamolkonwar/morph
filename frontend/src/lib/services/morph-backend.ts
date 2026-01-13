/**
 * MorphV2 Backend Proxy Service
 * 
 * Handles communication between Next.js frontend and Python FastAPI backend
 */

const MORPH_BACKEND_URL = process.env.MORPH_BACKEND_URL || "http://localhost:8000";

export interface GenerateBannerRequest {
    prompt: string;
    canvas_width?: number;
    canvas_height?: number;
    brand_colors?: string[];
    max_iterations?: number;
}

export interface GenerateBannerResponse {
    status: string;
    svg?: string;
    png_base64?: string;
    errors?: string[];
    iterations: number;
    verification_report?: {
        overall: string;
        layers: Record<string, { status: string; errors: string[] }>;
    };
    constraint_graph?: object;
}

export interface VerifySVGRequest {
    svg: string;
    canvas_width?: number;
    canvas_height?: number;
    brand_colors?: string[];
}

export interface VerifySVGResponse {
    overall: string;
    layers: Record<string, { status: string; errors: string[] }>;
    timestamp: string;
}

/**
 * Generate a banner using the MorphV2 backend
 */
export async function generateBannerV2(
    request: GenerateBannerRequest
): Promise<GenerateBannerResponse> {
    const response = await fetch(`${MORPH_BACKEND_URL}/api/v1/generate-banner`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            prompt: request.prompt,
            canvas_width: request.canvas_width || 1200,
            canvas_height: request.canvas_height || 630,
            brand_colors: request.brand_colors || ["#FF6B35", "#FFFFFF", "#004E89"],
            max_iterations: request.max_iterations || 5,
        }),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: "Unknown error" }));
        throw new Error(error.detail || `Backend error: ${response.status}`);
    }

    return response.json();
}

/**
 * Verify an SVG using the MorphV2 backend
 */
export async function verifySVG(
    request: VerifySVGRequest
): Promise<VerifySVGResponse> {
    const response = await fetch(`${MORPH_BACKEND_URL}/api/v1/verify-svg`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            svg: request.svg,
            canvas_width: request.canvas_width || 1200,
            canvas_height: request.canvas_height || 630,
            brand_colors: request.brand_colors,
        }),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: "Unknown error" }));
        throw new Error(error.detail || `Backend error: ${response.status}`);
    }

    return response.json();
}

/**
 * Check if MorphV2 backend is available
 */
export async function checkBackendHealth(): Promise<boolean> {
    try {
        const response = await fetch(`${MORPH_BACKEND_URL}/health`, {
            method: "GET",
        });
        return response.ok;
    } catch {
        return false;
    }
}
