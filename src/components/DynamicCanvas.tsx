"use client";

import React, { useRef, useCallback } from "react";
import { motion } from "framer-motion";

export interface CanvasData {
    headline: string;
    subheadline?: string;
    cta_text?: string;
    theme: {
        bg_color: string;
        text_color: string;
        accent_color: string;
    };
    backgroundImage?: string;
    layout_id: string;
}

export interface DynamicCanvasProps {
    width: number;
    height: number;
    data: CanvasData;
    className?: string;
    showExportButton?: boolean;
    onExport?: (dataUrl: string) => void;
}

// Layout configurations
const LAYOUTS = {
    hero_center: {
        textAlign: "center" as const,
        justifyContent: "center",
        alignItems: "center",
        textPosition: "center",
        paddingLeft: undefined as string | undefined,
        paddingRight: undefined as string | undefined,
        paddingTop: undefined as string | undefined,
        paddingBottom: undefined as string | undefined,
    },
    split_left: {
        textAlign: "left" as const,
        justifyContent: "flex-start",
        alignItems: "center",
        textPosition: "left",
        paddingLeft: "10%",
        paddingRight: undefined as string | undefined,
        paddingTop: undefined as string | undefined,
        paddingBottom: undefined as string | undefined,
    },
    split_right: {
        textAlign: "right" as const,
        justifyContent: "flex-end",
        alignItems: "center",
        textPosition: "right",
        paddingLeft: undefined as string | undefined,
        paddingRight: "10%",
        paddingTop: undefined as string | undefined,
        paddingBottom: undefined as string | undefined,
    },
    minimal_top: {
        textAlign: "center" as const,
        justifyContent: "center",
        alignItems: "flex-start",
        textPosition: "top",
        paddingLeft: undefined as string | undefined,
        paddingRight: undefined as string | undefined,
        paddingTop: "10%",
        paddingBottom: undefined as string | undefined,
    },
    modern_bottom: {
        textAlign: "left" as const,
        justifyContent: "flex-start",
        alignItems: "flex-end",
        textPosition: "bottom",
        paddingLeft: "8%",
        paddingRight: undefined as string | undefined,
        paddingTop: undefined as string | undefined,
        paddingBottom: "10%",
    },
};

export default function DynamicCanvas({
    width,
    height,
    data,
    className = "",
    showExportButton = false,
    onExport,
}: DynamicCanvasProps) {
    const canvasRef = useRef<HTMLDivElement>(null);
    const layout = LAYOUTS[data.layout_id as keyof typeof LAYOUTS] || LAYOUTS.hero_center;

    // Calculate responsive font sizes based on canvas dimensions
    const baseFontSize = Math.min(width, height) / 20;
    const headlineSize = baseFontSize * 2;
    const subheadlineSize = baseFontSize * 0.8;
    const ctaSize = baseFontSize * 0.6;

    // Determine aspect ratio category for responsive adjustments
    const aspectRatio = width / height;
    const isWide = aspectRatio > 2; // LinkedIn banner (4:1)
    const isSquare = aspectRatio >= 0.9 && aspectRatio <= 1.1; // Carousel (1:1)

    const handleExport = useCallback(async () => {
        if (!canvasRef.current || !onExport) return;

        // Use html2canvas or similar for actual export
        // For now, create a data URL placeholder
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
            ctx.fillStyle = data.theme.bg_color;
            ctx.fillRect(0, 0, width, height);
            ctx.fillStyle = data.theme.text_color;
            ctx.font = `bold ${headlineSize}px Inter, sans-serif`;
            ctx.textAlign = layout.textAlign;
            ctx.fillText(data.headline, width / 2, height / 2);
        }
        onExport(canvas.toDataURL("image/png"));
    }, [width, height, data, headlineSize, layout.textAlign, onExport]);

    return (
        <motion.div
            ref={canvasRef}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className={`relative overflow-hidden ${className}`}
            style={{
                width: "100%",
                aspectRatio: `${width}/${height}`,
                maxWidth: width,
                backgroundColor: data.theme.bg_color,
                containerType: "size",
            }}
        >
            {/* Background Image */}
            {data.backgroundImage && (
                <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url(${data.backgroundImage})` }}
                />
            )}

            {/* Gradient Overlay for text readability */}
            <div
                className="absolute inset-0"
                style={{
                    background:
                        layout.textPosition === "bottom"
                            ? `linear-gradient(to top, ${data.theme.bg_color}dd 0%, transparent 60%)`
                            : layout.textPosition === "top"
                                ? `linear-gradient(to bottom, ${data.theme.bg_color}dd 0%, transparent 60%)`
                                : layout.textPosition === "left"
                                    ? `linear-gradient(to right, ${data.theme.bg_color}dd 0%, transparent 60%)`
                                    : layout.textPosition === "right"
                                        ? `linear-gradient(to left, ${data.theme.bg_color}dd 0%, transparent 60%)`
                                        : `linear-gradient(to bottom, ${data.theme.bg_color}88 0%, ${data.theme.bg_color}88 100%)`,
                }}
            />

            {/* Content */}
            <div
                className="absolute inset-0 flex flex-col p-[5%]"
                style={{
                    justifyContent: layout.justifyContent,
                    alignItems: layout.alignItems,
                    paddingLeft: layout.paddingLeft,
                    paddingRight: layout.paddingRight,
                    paddingTop: layout.paddingTop,
                    paddingBottom: layout.paddingBottom,
                }}
            >
                <div
                    className="max-w-[80%]"
                    style={{ textAlign: layout.textAlign }}
                >
                    {/* Headline */}
                    <h1
                        className="font-bold leading-tight mb-[2%]"
                        style={{
                            fontSize: isWide ? `${headlineSize * 0.7}px` : `${headlineSize}px`,
                            color: data.theme.text_color,
                            textShadow: data.backgroundImage ? "0 2px 10px rgba(0,0,0,0.3)" : "none",
                        }}
                    >
                        {data.headline}
                    </h1>

                    {/* Subheadline */}
                    {data.subheadline && (
                        <p
                            className="leading-relaxed mb-[3%] opacity-90"
                            style={{
                                fontSize: isWide ? `${subheadlineSize * 0.8}px` : `${subheadlineSize}px`,
                                color: data.theme.text_color,
                            }}
                        >
                            {data.subheadline}
                        </p>
                    )}

                    {/* CTA Button */}
                    {data.cta_text && (
                        <div
                            className="inline-block px-[4%] py-[2%] rounded-lg font-semibold"
                            style={{
                                fontSize: `${ctaSize}px`,
                                backgroundColor: data.theme.accent_color,
                                color: data.theme.text_color,
                            }}
                        >
                            {data.cta_text}
                        </div>
                    )}
                </div>
            </div>

            {/* Export Button */}
            {showExportButton && (
                <button
                    onClick={handleExport}
                    className="absolute top-4 right-4 px-3 py-1.5 rounded-lg bg-white/20 backdrop-blur-sm text-white text-sm font-medium hover:bg-white/30 transition-colors"
                >
                    Export
                </button>
            )}
        </motion.div>
    );
}
