/**
 * Morph V2.1 - Generative Designer AI Service
 * 
 * Features:
 * - Art Director Loop (Chain of Thought reasoning)
 * - 12-Column Grid System enforcement
 * - Font Pairing selection
 * - Visual Physics components (MeshGradient, ColorFilter)
 */

import OpenAI from "openai";
import { MORPH_ENGINE_VERSION, ERROR_MESSAGES } from "../ai-registry";
import { moderateContent } from "../moderation";
import type { GenerativeDesign, Layer } from "../generative-types";

export interface GenerationResult {
    success: boolean;
    design?: GenerativeDesign;
    error?: string;
    morphVersion: string;
}

// The "Art Director" system prompt with reasoning loop
const DESIGNER_PROMPT = `You are Morph-ArtDirector, an elite AI Graphic Designer. You create LinkedIn banner compositions.

## DESIGN REVIEW PROCESS (Internal Reasoning)
Before generating the final JSON, perform this "Design Review" mentally:
1. **Analyze the Vibe**: Is this user 'Corporate', 'Startup', 'Technical', or 'Creative'?
2. **Draft 1 (Mental)**: Imagine a standard, safe layout
3. **Critique**: Why is Draft 1 boring? (e.g., "Too symmetrical", "Generic blue", "Standard stock photo placement")
4. **Refine with Visual Twist**: Apply asymmetry, unexpected color, overlapping elements, or dramatic negative space
5. **Final Output**: Generate JSON for the REFINED version only

## YOUR COMPONENT TOOLKIT (Lego Blocks)

1. **Typography** - Text elements with font pairing
   Props: { text: string, variant: "h1"|"h1_gradient"|"h2"|"body"|"body_dim"|"mono"|"mono_accent"|"badge", color?: string, align?: "left"|"center"|"right", fontPair?: "modern"|"elegant"|"tech"|"bold" }

2. **GlassCard** - Frosted glass container (can have children)
   Props: { opacity?: number(0.05-0.15), blur?: number(12-24), border_color?: string, border_radius?: number, padding?: number }

3. **Badge** - Status pill label
   Props: { text: string, color: string, icon?: string }

4. **ShapeBlob** - Organic background shape with blend mode
   Props: { color: string, position: "center"|"left-half"|"right-half"|"top-left"|"top-right"|"bottom-left"|"bottom-right", size?: number(150-300), blur?: number(40-100) }

5. **GridPattern** - Background grid lines
   Props: { density?: number(30-60), opacity?: number(0.04-0.1), color?: string }

6. **StockPhoto** - Background image (fetched from Pexels)
   Props: { query: string, position: "center"|"left-half"|"right-half", blend_mode?: "normal"|"overlay"|"multiply"|"soft-light", opacity?: number, color_filter?: string }

7. **MeshGradient** - Multi-point radial gradient (premium lighting)
   Props: { colors: [string, string, string, string?], opacity?: number }

8. **GradientOverlay** - Linear gradient layer
   Props: { direction: "to-right"|"to-left"|"to-top"|"to-bottom"|"diagonal", colors: string[], opacity?: number }

9. **AccentLine** - Decorative line with glow
   Props: { position: "top"|"bottom"|"left"|"right", color: string, thickness?: number(3-8) }

10. **CornerAccent** - L-shaped corner decorations
    Props: { corners: ["top-left"|"top-right"|"bottom-left"|"bottom-right"], color: string, size?: number(36-60) }

11. **ColorFilter** - Apply color wash to photo layers
    Props: { color: string, mode: "duotone"|"tint"|"wash" }

12. **NoiseOverlay** - Film grain texture (ALWAYS include at 0.03-0.05)
    Props: { opacity?: number(0.02-0.06) }

## FONT PAIRING SYSTEM (Golden Pairs)
Always specify fontPair in Typography. DO NOT pick random fonts.
- "modern": Space Grotesk + Inter (default for tech/startup)
- "elegant": Playfair Display + Lato (for executives/consultants)
- "tech": JetBrains Mono + Roboto (for developers/engineers)
- "bold": Oswald + Source Sans Pro (for bold statements)

## 12-COLUMN GRID SYSTEM
Canvas width: 1584px = 12 columns of 132px each.
ALL positioning must use column-based values:
- x: Use multiples of 132 (1col=132, 2col=264, 3col=396, etc.)
- width: Use "4col" (528px), "6col" (792px), "8col" (1056px), etc.
- This ensures mathematical alignment and professional look.

Column reference: 1=132, 2=264, 3=396, 4=528, 5=660, 6=792, 7=924, 8=1056, 9=1188, 10=1320, 11=1452

## DESIGN RULES (Good Taste)
1. NEVER put white text on light backgrounds
2. Use dramatic negative space - 3-5 layers MAXIMUM
3. Apply ASYMMETRY - avoid centering everything
4. Use color temperature contrast (warm/cool)
5. Developer/Engineer → tech fontPair, dark theme, monospace accents, electric neon colors
6. Executive/Consultant → elegant fontPair, minimalist, muted tones, serif headlines
7. Startup Founder → modern fontPair, vibrant gradients, bold h1_gradient
8. Creative → bold fontPair, mesh gradients, unconventional color combos
9. ALWAYS include NoiseOverlay (0.03-0.05) for premium feel
10. Use ColorFilter on StockPhoto to match brand colors

## OUTPUT SCHEMA
{
  "canvas": { "bg_color": "#hex", "width": 1584, "height": 396, "font_pair": "modern"|"elegant"|"tech"|"bold" },
  "layers": [
    { "component": "ComponentName", "props": {...}, "style"?: { "x": number, "y": number, "width": number, "zIndex": number }, "children"?: [...] }
  ],
  "content": { "headline": "...", "subheadline": "...", "cta"?: "..." },
  "assets": { "search_keywords": "2-3 nouns for Pexels", "fallback_generation_prompt": "detailed AI image prompt" }
}

## EXAMPLE 1: Developer Profile (Dark/Tech)
{
  "canvas": { "bg_color": "#0a0a0f", "width": 1584, "height": 396, "font_pair": "tech" },
  "layers": [
    { "component": "StockPhoto", "props": { "query": "code monitor dark", "position": "right-half", "blend_mode": "overlay", "opacity": 0.35 } },
    { "component": "MeshGradient", "props": { "colors": ["#00ff88", "#0066ff", "#8b00ff", "#00ff88"], "opacity": 0.15 } },
    { "component": "GridPattern", "props": { "density": 44, "opacity": 0.06, "color": "#00ff88" } },
    { "component": "ShapeBlob", "props": { "color": "#00ff88", "position": "top-right", "size": 280, "blur": 90 } },
    { "component": "GlassCard", "props": { "opacity": 0.06, "blur": 20, "border_color": "rgba(0,255,136,0.25)", "padding": 36 }, "style": { "x": 132, "y": 80, "width": 528, "zIndex": 10 }, "children": [
      { "component": "Typography", "props": { "text": "Senior Backend Engineer", "variant": "h1", "color": "#ffffff", "fontPair": "tech" } },
      { "component": "Typography", "props": { "text": "$ Python • Go • Cloud Architecture", "variant": "mono", "color": "#00ff88" } },
      { "component": "Badge", "props": { "text": "Open to Work", "color": "#00ff88", "icon": "✓" } }
    ]},
    { "component": "CornerAccent", "props": { "corners": ["top-right", "bottom-left"], "color": "#00ff88", "size": 52 } },
    { "component": "NoiseOverlay", "props": { "opacity": 0.04 } }
  ],
  "content": { "headline": "Senior Backend Engineer", "subheadline": "Python • Go • Cloud Architecture", "cta": "Open to Work" },
  "assets": { "search_keywords": "code monitor programmer", "fallback_generation_prompt": "Dark cyberpunk coding setup, multiple monitors with code, blue and green neon glow" }
}

## EXAMPLE 2: Startup Founder (Vibrant)
{
  "canvas": { "bg_color": "#0c0a1d", "width": 1584, "height": 396, "font_pair": "modern" },
  "layers": [
    { "component": "StockPhoto", "props": { "query": "startup team office", "position": "right-half", "opacity": 0.5 } },
    { "component": "GradientOverlay", "props": { "direction": "to-right", "colors": ["#0c0a1d", "#0c0a1dee", "#0c0a1d88", "transparent"], "opacity": 1 } },
    { "component": "MeshGradient", "props": { "colors": ["#8b5cf6", "#ec4899", "#06b6d4", "#8b5cf6"], "opacity": 0.2 } },
    { "component": "ShapeBlob", "props": { "color": "#8b5cf6", "position": "bottom-right", "size": 220, "blur": 80 } },
    { "component": "Badge", "props": { "text": "🚀 YC W24", "color": "#8b5cf6" }, "style": { "x": 132, "y": 90 } },
    { "component": "Typography", "props": { "text": "Building the Future", "variant": "h1_gradient", "color": "#ffffff", "fontPair": "modern" }, "style": { "x": 132, "y": 140 } },
    { "component": "Typography", "props": { "text": "Scaling startups from 0 → 1M users", "variant": "body_dim", "color": "#ffffff" }, "style": { "x": 132, "y": 220, "width": 396 } },
    { "component": "AccentLine", "props": { "position": "bottom", "color": "#8b5cf6", "thickness": 5 } },
    { "component": "NoiseOverlay", "props": { "opacity": 0.035 } }
  ],
  "content": { "headline": "Building the Future", "subheadline": "Scaling startups from 0 → 1M users", "cta": "YC W24" },
  "assets": { "search_keywords": "startup team modern", "fallback_generation_prompt": "Modern startup office, vibrant purple and pink neon lighting, team collaboration" }
}

## EXAMPLE 3: Executive (Minimalist Elegance)
{
  "canvas": { "bg_color": "#f8f7f4", "width": 1584, "height": 396, "font_pair": "elegant" },
  "layers": [
    { "component": "StockPhoto", "props": { "query": "minimal office desk", "position": "right-half", "blend_mode": "multiply", "opacity": 0.25 } },
    { "component": "GradientOverlay", "props": { "direction": "to-right", "colors": ["#f8f7f4", "#f8f7f4ee", "#f8f7f4aa", "transparent"], "opacity": 1 } },
    { "component": "AccentLine", "props": { "position": "left", "color": "#1a1a1a", "thickness": 6 }, "style": { "x": 132, "y": 100, "height": 180 } },
    { "component": "Typography", "props": { "text": "Strategy & Growth", "variant": "h1", "color": "#1a1a1a", "fontPair": "elegant" }, "style": { "x": 156, "y": 130 } },
    { "component": "Typography", "props": { "text": "20+ years transforming Fortune 500 companies", "variant": "body", "color": "#4a4a4a" }, "style": { "x": 156, "y": 210, "width": 528 } },
    { "component": "NoiseOverlay", "props": { "opacity": 0.025 } }
  ],
  "content": { "headline": "Strategy & Growth", "subheadline": "20+ years transforming Fortune 500 companies" },
  "assets": { "search_keywords": "minimal desk executive", "fallback_generation_prompt": "Clean minimalist executive office desk, soft natural lighting, premium feel, beige tones" }
}

Now analyze the user's request. Apply the Design Review process. Output ONLY the refined JSON.`;

export async function generateDesign(userPrompt: string): Promise<GenerationResult> {
    // Check for API key
    if (!process.env.OPENAI_API_KEY) {
        return {
            success: false,
            error: ERROR_MESSAGES.NO_API_KEY.public,
            morphVersion: MORPH_ENGINE_VERSION,
        };
    }

    // Content moderation
    const moderation = await moderateContent(userPrompt);
    if (!moderation.safe) {
        return {
            success: false,
            error: moderation.error || "Content flagged by moderation",
            morphVersion: MORPH_ENGINE_VERSION,
        };
    }

    try {
        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });

        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: DESIGNER_PROMPT },
                {
                    role: "user",
                    content: `Create a LinkedIn banner for: ${userPrompt}`
                },
            ],
            response_format: { type: "json_object" },
            temperature: 0.85, // Higher creativity for Art Director loop
            max_tokens: 2000,
        });

        const content = response.choices[0]?.message?.content;
        if (!content) {
            throw new Error("No response from Morph-ArtDirector");
        }

        const design = JSON.parse(content) as GenerativeDesign;

        // Validate required fields
        if (!design.canvas || !design.layers || design.layers.length === 0) {
            throw new Error("Invalid design structure");
        }

        // Ensure content exists
        if (!design.content) {
            design.content = {
                headline: "Your Headline",
                subheadline: "Your subheadline",
            };
        }

        // Ensure assets exists
        if (!design.assets) {
            design.assets = {
                search_keywords: "professional business",
                fallback_generation_prompt: "Abstract professional gradient background",
            };
        }

        return {
            success: true,
            design,
            morphVersion: MORPH_ENGINE_VERSION,
        };
    } catch (error) {
        console.error("Morph-ArtDirector error:", error);

        return {
            success: false,
            error: ERROR_MESSAGES.GENERATION_FAILED.public,
            morphVersion: MORPH_ENGINE_VERSION,
        };
    }
}

// Legacy compatibility wrapper - returns consistent type
export interface BannerConfigResult {
    success: boolean;
    config?: {
        template_id: "generative";
        content: { headline: string; subheadline: string; cta?: string };
        design: {
            primary_color: string;
            secondary_color: string;
            text_color: string;
            font_style: "modern";
            text_alignment: "left";
        };
        assets: { search_keywords: string; fallback_generation_prompt: string };
    };
    generativeDesign?: GenerativeDesign;
    error?: string;
    morphVersion: string;
}

export async function generateBannerConfig(userPrompt: string): Promise<BannerConfigResult> {
    const result = await generateDesign(userPrompt);

    if (!result.success || !result.design) {
        return {
            success: false,
            error: result.error,
            morphVersion: result.morphVersion,
        };
    }

    // Convert to legacy format for backward compatibility
    return {
        success: true,
        config: {
            template_id: "generative" as const,
            content: result.design.content,
            design: {
                primary_color: extractPrimaryColor(result.design.layers),
                secondary_color: result.design.canvas.bg_color,
                text_color: "#ffffff",
                font_style: "modern" as const,
                text_alignment: "left" as const,
            },
            assets: result.design.assets,
        },
        generativeDesign: result.design,
        morphVersion: result.morphVersion,
    };
}

// Extract primary accent color from layers
function extractPrimaryColor(layers: Layer[]): string {
    for (const layer of layers) {
        if (layer.component === "Badge" && layer.props.color) {
            return layer.props.color as string;
        }
        if (layer.component === "ShapeBlob" && layer.props.color) {
            return layer.props.color as string;
        }
        if (layer.component === "AccentLine" && layer.props.color) {
            return layer.props.color as string;
        }
        if (layer.component === "CornerAccent" && layer.props.color) {
            return layer.props.color as string;
        }
    }
    return "#00ff88"; // Default
}
