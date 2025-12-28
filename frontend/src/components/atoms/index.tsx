/**
 * Morph V2.1 - Advanced Atomic Components with Visual Physics
 * 
 * Implements:
 * - Grain/Noise textures
 * - Mesh gradients (radial gradient combos)
 * - Color filter pipelines (duotone effect)
 * - Advanced blend modes
 * - 12-column grid constraints
 */

import React from "react";
import type {
    TypographyProps,
    GlassCardProps,
    BadgeProps,
    ShapeBlobProps,
    GridPatternProps,
    GradientOverlayProps,
    AccentLineProps,
    CornerAccentProps,
    PositionPreset,
} from "@/lib/generative-types";

// ============================================
// FONT PAIRING SYSTEM (Golden Pairs)
// ============================================
export const FONT_PAIRS = {
    modern: {
        header: "'Space Grotesk', sans-serif",
        body: "'Inter', sans-serif",
    },
    elegant: {
        header: "'Playfair Display', serif",
        body: "'Lato', sans-serif",
    },
    tech: {
        header: "'JetBrains Mono', monospace",
        body: "'Roboto', sans-serif",
    },
    bold: {
        header: "'Oswald', sans-serif",
        body: "'Source Sans Pro', sans-serif",
    },
} as const;

export type FontPairId = keyof typeof FONT_PAIRS;

// ============================================
// 12-COLUMN GRID SYSTEM
// ============================================
export const GRID_COLS = 12;
export const COL_WIDTH = 1584 / GRID_COLS; // 132px per column

export function colToPixels(cols: number): number {
    return cols * COL_WIDTH;
}

export function colSpanStyle(span: number, start?: number): React.CSSProperties {
    return {
        width: colToPixels(span),
        marginLeft: start ? colToPixels(start) : undefined,
    };
}

// ============================================
// TYPOGRAPHY with Kerning Rules
// ============================================
interface AdvancedTypographyProps extends TypographyProps {
    fontPair?: FontPairId;
}

export function Typography({
    text,
    variant,
    color,
    align = "left",
    fontPair = "modern"
}: AdvancedTypographyProps) {
    const pair = FONT_PAIRS[fontPair] || FONT_PAIRS.modern;

    // Semantic kerning rules
    const isHeadline = variant.startsWith("h1") || variant.startsWith("h2");
    const isBadge = variant === "badge";
    const isMono = variant.includes("mono");

    const getLetterSpacing = () => {
        if (isBadge) return "0.1em"; // Wide tracking for uppercase labels
        if (isHeadline) return "-0.03em"; // Tight tracking for headlines
        return "0";
    };

    const baseStyles: React.CSSProperties = {
        display: "flex",
        textAlign: align,
        margin: 0,
        padding: 0,
        letterSpacing: getLetterSpacing(),
        fontFamily: isMono ? "'JetBrains Mono', monospace" : (isHeadline ? pair.header : pair.body),
    };

    const variants: Record<string, React.CSSProperties> = {
        h1: {
            fontSize: "52px",
            fontWeight: 700,
            lineHeight: 1.05,
            color: color || "#ffffff",
        },
        h1_gradient: {
            fontSize: "52px",
            fontWeight: 700,
            lineHeight: 1.05,
            background: "linear-gradient(135deg, #ffffff 0%, #a0a0a0 100%)",
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            color: "transparent",
        },
        h2: {
            fontSize: "36px",
            fontWeight: 600,
            lineHeight: 1.15,
            color: color || "#ffffff",
        },
        body: {
            fontSize: "18px",
            fontWeight: 400,
            lineHeight: 1.5,
            color: color || "#ffffff",
        },
        body_dim: {
            fontSize: "18px",
            fontWeight: 400,
            lineHeight: 1.5,
            color: color || "#ffffff",
            opacity: 0.7,
        },
        mono: {
            fontSize: "16px",
            fontWeight: 500,
            color: color || "#00ff88",
        },
        mono_accent: {
            fontSize: "16px",
            fontWeight: 500,
            color: color || "#00ff88",
        },
        badge: {
            fontSize: "11px",
            fontWeight: 700,
            textTransform: "uppercase",
            color: color || "#ffffff",
        },
    };

    return (
        <div style={{ ...baseStyles, ...variants[variant] }}>
            {text}
        </div>
    );
}

// ============================================
// GLASS CARD with Physics
// ============================================
interface GlassCardWithChildren extends GlassCardProps {
    children?: React.ReactNode;
}

export function GlassCard({
    opacity = 0.1,
    blur = 16,
    border_color = "rgba(255,255,255,0.2)",
    border_radius = 16,
    padding = 32,
    children
}: GlassCardWithChildren) {
    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                backgroundColor: `rgba(255, 255, 255, ${opacity})`,
                backdropFilter: `blur(${blur}px)`,
                WebkitBackdropFilter: `blur(${blur}px)`,
                border: `1px solid ${border_color}`,
                borderRadius: `${border_radius}px`,
                padding: `${padding}px`,
                boxShadow: "0 25px 50px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.1)",
            }}
        >
            {children}
        </div>
    );
}

// ============================================
// BADGE with Icon Support
// ============================================
export function Badge({ text, color, icon }: BadgeProps) {
    return (
        <div
            style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 18px",
                borderRadius: 999,
                backgroundColor: `${color}15`,
                color: color,
                border: `1px solid ${color}30`,
                fontSize: 11,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
            }}
        >
            {icon && <span>{icon}</span>}
            {text}
        </div>
    );
}

// ============================================
// SHAPE BLOB (Generative SVG with Physics)
// ============================================
export function ShapeBlob({ color, position, size = 200, rotation = 0, blur = 60 }: ShapeBlobProps) {
    const positionStyles = getPositionStyles(position, size);

    // Generate organic blob path
    const seed = color.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
    const blobPath = generateBlobPath(seed);

    return (
        <div
            style={{
                position: "absolute",
                ...positionStyles,
                width: `${size}px`,
                height: `${size}px`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transform: `rotate(${rotation}deg)`,
                filter: `blur(${blur}px)`,
                opacity: 0.5,
                mixBlendMode: "screen", // Advanced blend mode
            }}
        >
            <svg viewBox="0 0 200 200" style={{ width: "100%", height: "100%" }}>
                <path d={blobPath} fill={color} />
            </svg>
        </div>
    );
}

function generateBlobPath(seed: number): string {
    const r = (i: number) => 55 + ((seed * (i + 1) * 7) % 45);
    const points = 8;
    const angleStep = (2 * Math.PI) / points;

    let path = "";
    for (let i = 0; i < points; i++) {
        const angle = angleStep * i;
        const radius = r(i);
        const x = 100 + radius * Math.cos(angle);
        const y = 100 + radius * Math.sin(angle);

        if (i === 0) {
            path = `M ${x} ${y}`;
        } else {
            const cpRadius = r(i - 1) * 0.7;
            const cpAngle = angle - angleStep / 2;
            const cpX = 100 + cpRadius * Math.cos(cpAngle);
            const cpY = 100 + cpRadius * Math.sin(cpAngle);
            path += ` Q ${cpX} ${cpY}, ${x} ${y}`;
        }
    }
    path += " Z";
    return path;
}

// ============================================
// GRID PATTERN
// ============================================
export function GridPattern({ density = 40, opacity = 0.08, color = "#ffffff" }: GridPatternProps) {
    const hexOpacity = Math.round(opacity * 255).toString(16).padStart(2, '0');

    return (
        <div
            style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                display: "flex",
                backgroundImage: `linear-gradient(${color}${hexOpacity} 1px, transparent 1px), linear-gradient(90deg, ${color}${hexOpacity} 1px, transparent 1px)`,
                backgroundSize: `${density}px ${density}px`,
                pointerEvents: "none",
            }}
        />
    );
}

// ============================================
// MESH GRADIENT (Visual Physics 2.0)
// ============================================
interface MeshGradientProps {
    colors: string[];
    opacity?: number;
}

export function MeshGradient({ colors, opacity = 1 }: MeshGradientProps) {
    const [c1, c2, c3, c4] = colors;

    // Build complex radial gradient combo (simulates mesh)
    const gradient = `
    radial-gradient(ellipse at 20% 20%, ${c1}80 0%, transparent 50%),
    radial-gradient(ellipse at 80% 20%, ${c2}60 0%, transparent 50%),
    radial-gradient(ellipse at 80% 80%, ${c3}70 0%, transparent 50%),
    radial-gradient(ellipse at 20% 80%, ${c4 || c1}50 0%, transparent 50%)
  `;

    return (
        <div
            style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                display: "flex",
                background: gradient,
                opacity,
                pointerEvents: "none",
                mixBlendMode: "soft-light",
            }}
        />
    );
}

// ============================================
// GRADIENT OVERLAY (Enhanced)
// ============================================
export function GradientOverlay({ direction = "to-right", colors, opacity = 1 }: GradientOverlayProps) {
    const directionMap: Record<string, string> = {
        "to-right": "90deg",
        "to-left": "270deg",
        "to-top": "0deg",
        "to-bottom": "180deg",
        "diagonal": "135deg",
    };

    const gradient = `linear-gradient(${directionMap[direction]}, ${colors.join(", ")})`;

    return (
        <div
            style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                display: "flex",
                background: gradient,
                opacity,
                pointerEvents: "none",
            }}
        />
    );
}

// ============================================
// COLOR FILTER (Duotone Effect)
// ============================================
interface ColorFilterProps {
    color: string;
    mode?: "duotone" | "tint" | "wash";
}

export function ColorFilter({ color, mode = "wash" }: ColorFilterProps) {
    // Convert hex to HSL for rotation
    const hue = hexToHue(color);

    const filters: Record<string, string> = {
        duotone: `grayscale(100%) sepia(100%) hue-rotate(${hue}deg) saturate(200%)`,
        tint: `sepia(50%) hue-rotate(${hue}deg) saturate(150%)`,
        wash: `saturate(120%) brightness(105%)`,
    };

    return (
        <div
            style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                display: "flex",
                backgroundColor: `${color}20`,
                mixBlendMode: "overlay",
                filter: filters[mode],
                pointerEvents: "none",
            }}
        />
    );
}

function hexToHue(hex: string): number {
    // Simple hue extraction from hex
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);

    let h = 0;
    if (max !== min) {
        const d = max - min;
        switch (max) {
            case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
            case g: h = ((b - r) / d + 2) / 6; break;
            case b: h = ((r - g) / d + 4) / 6; break;
        }
    }

    return Math.round(h * 360);
}

// ============================================
// ACCENT LINE
// ============================================
export function AccentLine({ position, color, thickness = 4 }: AccentLineProps) {
    const positionStyles: Record<string, React.CSSProperties> = {
        top: { top: 0, left: 0, width: "100%", height: `${thickness}px` },
        bottom: { bottom: 0, left: 0, width: "100%", height: `${thickness}px` },
        left: { top: 0, left: 0, width: `${thickness}px`, height: "100%" },
        right: { top: 0, right: 0, width: `${thickness}px`, height: "100%" },
    };

    return (
        <div
            style={{
                position: "absolute",
                ...positionStyles[position],
                backgroundColor: color,
                display: "flex",
                boxShadow: `0 0 20px ${color}50`,
            }}
        />
    );
}

// ============================================
// CORNER ACCENT
// ============================================
export function CornerAccent({ corners, color, size = 48, thickness = 3 }: CornerAccentProps) {
    return (
        <>
            {corners.map((corner) => {
                const isTop = corner.includes("top");
                const isLeft = corner.includes("left");

                return (
                    <React.Fragment key={corner}>
                        <div
                            style={{
                                position: "absolute",
                                [isTop ? "top" : "bottom"]: "24px",
                                [isLeft ? "left" : "right"]: "24px",
                                width: `${thickness}px`,
                                height: `${size}px`,
                                backgroundColor: color,
                                display: "flex",
                                boxShadow: `0 0 15px ${color}40`,
                            }}
                        />
                        <div
                            style={{
                                position: "absolute",
                                [isTop ? "top" : "bottom"]: "24px",
                                [isLeft ? "left" : "right"]: "24px",
                                width: `${size}px`,
                                height: `${thickness}px`,
                                backgroundColor: color,
                                display: "flex",
                                boxShadow: `0 0 15px ${color}40`,
                            }}
                        />
                    </React.Fragment>
                );
            })}
        </>
    );
}

// ============================================
// NOISE OVERLAY (Film Grain - Visual Physics)
// ============================================
export function NoiseOverlay({ opacity = 0.04 }: { opacity?: number }) {
    // High-quality SVG noise pattern
    const noiseSvg = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise' x='0' y='0'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`;

    return (
        <div
            style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                display: "flex",
                backgroundImage: noiseSvg,
                opacity,
                mixBlendMode: "overlay",
                pointerEvents: "none",
            }}
        />
    );
}

// ============================================
// HELPER: Position preset to CSS
// ============================================
function getPositionStyles(position: PositionPreset, size: number): React.CSSProperties {
    const half = size / 2;

    const positions: Record<PositionPreset, React.CSSProperties> = {
        "center": { top: `calc(50% - ${half}px)`, left: `calc(50% - ${half}px)` },
        "left-half": { top: `calc(50% - ${half}px)`, left: `calc(25% - ${half}px)` },
        "right-half": { top: `calc(50% - ${half}px)`, right: `calc(25% - ${half}px)` },
        "top-half": { top: `calc(25% - ${half}px)`, left: `calc(50% - ${half}px)` },
        "bottom-half": { bottom: `calc(25% - ${half}px)`, left: `calc(50% - ${half}px)` },
        "top-left": { top: "5%", left: "5%" },
        "top-right": { top: "5%", right: "5%" },
        "bottom-left": { bottom: "5%", left: "5%" },
        "bottom-right": { bottom: "5%", right: "5%" },
    };

    return positions[position] || positions["center"];
}
