/**
 * Morph V2 - Generative Designer Type Definitions
 * 
 * Defines the component tree schema and atomic component types
 */

// Canvas configuration
export interface CanvasConfig {
    bg_color: string;
    width: number;
    height: number;
}

// Position presets
export type PositionPreset =
    | "center"
    | "left-half"
    | "right-half"
    | "top-half"
    | "bottom-half"
    | "top-left"
    | "top-right"
    | "bottom-left"
    | "bottom-right";

// Blend modes
export type BlendMode =
    | "normal"
    | "overlay"
    | "multiply"
    | "screen"
    | "soft-light";

// Typography variants
export type TypographyVariant =
    | "h1"
    | "h1_gradient"
    | "h2"
    | "body"
    | "body_dim"
    | "mono"
    | "mono_accent"
    | "badge";

// Component prop types
export interface TypographyProps {
    text: string;
    variant: TypographyVariant;
    color?: string;
    align?: "left" | "center" | "right";
}

export interface GlassCardProps {
    opacity?: number;
    blur?: number;
    border_color?: string;
    border_radius?: number;
    padding?: number;
}

export interface BadgeProps {
    text: string;
    color: string;
    icon?: string;
}

export interface ShapeBlobProps {
    color: string;
    position: PositionPreset;
    size?: number;
    rotation?: number;
    blur?: number;
}

export interface GridPatternProps {
    density?: number;
    opacity?: number;
    color?: string;
}

export interface StockPhotoProps {
    query: string;
    position: PositionPreset;
    blend_mode?: BlendMode;
    opacity?: number;
}

export interface GradientOverlayProps {
    direction?: "to-right" | "to-left" | "to-top" | "to-bottom" | "diagonal";
    colors: string[];
    opacity?: number;
}

export interface AccentLineProps {
    position: "top" | "bottom" | "left" | "right";
    color: string;
    thickness?: number;
}

export interface CornerAccentProps {
    corners: ("top-left" | "top-right" | "bottom-left" | "bottom-right")[];
    color: string;
    size?: number;
    thickness?: number;
}

// Union type for all component props
export type ComponentProps =
    | { component: "Typography"; props: TypographyProps }
    | { component: "GlassCard"; props: GlassCardProps; children?: Layer[] }
    | { component: "Badge"; props: BadgeProps }
    | { component: "ShapeBlob"; props: ShapeBlobProps }
    | { component: "GridPattern"; props: GridPatternProps }
    | { component: "StockPhoto"; props: StockPhotoProps }
    | { component: "GradientOverlay"; props: GradientOverlayProps }
    | { component: "AccentLine"; props: AccentLineProps }
    | { component: "CornerAccent"; props: CornerAccentProps };

// Layer definition
export interface Layer {
    component: string;
    props: Record<string, unknown>;
    style?: LayerStyle;
    children?: Layer[];
}

export interface LayerStyle {
    x?: number;
    y?: number;
    width?: number | string;
    height?: number | string;
    zIndex?: number;
}

// Complete design output from AI
export interface GenerativeDesign {
    canvas: CanvasConfig;
    layers: Layer[];
    content: {
        headline: string;
        subheadline: string;
        cta?: string;
    };
    assets: {
        search_keywords: string;
        fallback_generation_prompt: string;
    };
}

// Component registry type
export type ComponentName =
    | "Typography"
    | "GlassCard"
    | "Badge"
    | "ShapeBlob"
    | "GridPattern"
    | "StockPhoto"
    | "GradientOverlay"
    | "AccentLine"
    | "CornerAccent";
