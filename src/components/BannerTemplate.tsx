"use client";

import { forwardRef } from "react";

export interface BannerConfig {
    template_id: "minimalist" | "startup" | "tech";
    content: {
        headline: string;
        subheadline: string;
        cta?: string;
    };
    design: {
        primary_color: string;
        secondary_color: string;
        text_color: string;
        font_style: "modern" | "bold" | "elegant" | "tech";
        text_alignment: "left" | "center" | "right";
    };
    assets: {
        search_keywords: string;
        fallback_generation_prompt: string;
        use_ai_force: boolean;
        background_style: string;
    };
}

interface BannerTemplateProps {
    config: BannerConfig;
    backgroundUrl: string;
    isEditing?: boolean;
    onUpdateContent?: (field: "headline" | "subheadline" | "cta", value: string) => void;
}

// Fixed banner dimensions
const BANNER_WIDTH = 1584;
const BANNER_HEIGHT = 396;

/**
 * LinkedIn Banner Template - Export-Optimized Version
 * 
 * Uses pure inline styles instead of Tailwind for reliable html-to-image capture.
 * All CSS effects are implemented with compatible properties.
 */
const BannerTemplate = forwardRef<HTMLDivElement, BannerTemplateProps>(
    ({ config, backgroundUrl, isEditing, onUpdateContent }, ref) => {
        const { template_id, content, design } = config;

        // Font family based on style
        const getFontFamily = () => {
            switch (design.font_style) {
                case "tech": return "'Courier New', monospace";
                case "elegant": return "Georgia, serif";
                case "bold": return "'Arial Black', sans-serif";
                default: return "'Inter', 'Segoe UI', sans-serif";
            }
        };

        // Editable text component with inline styles
        const EditableText = ({
            field,
            style,
            children,
        }: {
            field: "headline" | "subheadline" | "cta";
            style: React.CSSProperties;
            children: React.ReactNode;
        }) => {
            const baseStyle: React.CSSProperties = {
                ...style,
                outline: "none",
            };

            if (isEditing) {
                return (
                    <div
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e) => onUpdateContent?.(field, e.currentTarget.textContent || "")}
                        style={{
                            ...baseStyle,
                            cursor: "text",
                        }}
                    >
                        {children}
                    </div>
                );
            }
            return <div style={baseStyle}>{children}</div>;
        };

        // =========================================
        // TEMPLATE A: "The Executive" (Minimalist)
        // =========================================
        if (template_id === "minimalist") {
            return (
                <div
                    ref={ref}
                    style={{
                        position: "relative",
                        width: "100%",
                        aspectRatio: `${BANNER_WIDTH}/${BANNER_HEIGHT}`,
                        backgroundColor: design.secondary_color,
                        overflow: "hidden",
                        fontFamily: getFontFamily(),
                    }}
                >
                    {/* Background Image */}
                    <div
                        style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundImage: `url(${backgroundUrl})`,
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                            opacity: 0.3,
                        }}
                    />

                    {/* Gradient overlay */}
                    <div
                        style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: `linear-gradient(135deg, ${design.secondary_color} 0%, ${design.secondary_color}ee 40%, ${design.secondary_color}dd 60%, ${design.secondary_color} 100%)`,
                        }}
                    />

                    {/* Content with left border accent */}
                    <div
                        style={{
                            position: "relative",
                            zIndex: 10,
                            height: "100%",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "center",
                            padding: "48px 64px",
                        }}
                    >
                        <div
                            style={{
                                borderLeft: `6px solid ${design.primary_color}`,
                                paddingLeft: "32px",
                            }}
                        >
                            <EditableText
                                field="headline"
                                style={{
                                    fontSize: "48px",
                                    fontWeight: "bold",
                                    letterSpacing: "-0.02em",
                                    lineHeight: 1.1,
                                    color: design.text_color,
                                    margin: 0,
                                }}
                            >
                                {content.headline}
                            </EditableText>

                            <EditableText
                                field="subheadline"
                                style={{
                                    fontSize: "20px",
                                    fontWeight: 500,
                                    marginTop: "16px",
                                    opacity: 0.75,
                                    color: design.text_color,
                                }}
                            >
                                {content.subheadline}
                            </EditableText>

                            {content.cta && (
                                <EditableText
                                    field="cta"
                                    style={{
                                        display: "inline-block",
                                        marginTop: "24px",
                                        fontSize: "14px",
                                        fontWeight: 600,
                                        textTransform: "uppercase",
                                        letterSpacing: "0.05em",
                                        padding: "12px 24px",
                                        borderRadius: "999px",
                                        backgroundColor: design.primary_color,
                                        color: design.secondary_color,
                                        boxShadow: `0 8px 24px ${design.primary_color}50`,
                                    }}
                                >
                                    {content.cta}
                                </EditableText>
                            )}
                        </div>
                    </div>

                    {/* Bottom accent line */}
                    <div
                        style={{
                            position: "absolute",
                            bottom: 0,
                            left: 0,
                            right: 0,
                            height: "4px",
                            backgroundColor: design.primary_color,
                        }}
                    />
                </div>
            );
        }

        // =========================================
        // TEMPLATE B: "The Founder" (Startup Split)
        // =========================================
        if (template_id === "startup") {
            return (
                <div
                    ref={ref}
                    style={{
                        position: "relative",
                        width: "100%",
                        aspectRatio: `${BANNER_WIDTH}/${BANNER_HEIGHT}`,
                        backgroundColor: design.secondary_color,
                        overflow: "hidden",
                        fontFamily: getFontFamily(),
                    }}
                >
                    {/* Background Image - Right side */}
                    <div
                        style={{
                            position: "absolute",
                            top: 0,
                            right: 0,
                            bottom: 0,
                            width: "50%",
                            backgroundImage: `url(${backgroundUrl})`,
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                        }}
                    />

                    {/* Gradient overlay from left */}
                    <div
                        style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: `linear-gradient(90deg, ${design.secondary_color} 35%, ${design.secondary_color}ee 50%, ${design.secondary_color}66 70%, transparent 100%)`,
                            zIndex: 5,
                        }}
                    />

                    {/* Content - Left side */}
                    <div
                        style={{
                            position: "relative",
                            zIndex: 10,
                            height: "100%",
                            width: "60%",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "center",
                            padding: "48px",
                        }}
                    >
                        {/* Badge */}
                        <div
                            style={{
                                display: "inline-block",
                                width: "fit-content",
                                marginBottom: "16px",
                                fontSize: "11px",
                                fontWeight: 700,
                                textTransform: "uppercase",
                                letterSpacing: "0.1em",
                                padding: "8px 16px",
                                borderRadius: "999px",
                                backgroundColor: `${design.primary_color}20`,
                                color: design.primary_color,
                                border: `1px solid ${design.primary_color}40`,
                            }}
                        >
                            {content.cta || "✨ Available Now"}
                        </div>

                        <EditableText
                            field="headline"
                            style={{
                                fontSize: "44px",
                                fontWeight: "bold",
                                letterSpacing: "-0.01em",
                                lineHeight: 1.15,
                                color: design.text_color,
                                margin: 0,
                            }}
                        >
                            {content.headline}
                        </EditableText>

                        <EditableText
                            field="subheadline"
                            style={{
                                fontSize: "18px",
                                fontWeight: 500,
                                marginTop: "16px",
                                opacity: 0.85,
                                color: design.text_color,
                                maxWidth: "400px",
                            }}
                        >
                            {content.subheadline}
                        </EditableText>
                    </div>

                    {/* Accent glow */}
                    <div
                        style={{
                            position: "absolute",
                            right: "-80px",
                            top: "50%",
                            transform: "translateY(-50%)",
                            width: "200px",
                            height: "200px",
                            borderRadius: "50%",
                            backgroundColor: design.primary_color,
                            opacity: 0.25,
                            filter: "blur(60px)",
                        }}
                    />
                </div>
            );
        }

        // =========================================
        // TEMPLATE C: "The Engineer" (Tech/Dark)
        // =========================================
        return (
            <div
                ref={ref}
                style={{
                    position: "relative",
                    width: "100%",
                    aspectRatio: `${BANNER_WIDTH}/${BANNER_HEIGHT}`,
                    backgroundColor: "#0a0a0f",
                    overflow: "hidden",
                    fontFamily: "'Courier New', monospace",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                {/* Background Image */}
                <div
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundImage: `url(${backgroundUrl})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        opacity: 0.35,
                    }}
                />

                {/* Dark vignette overlay */}
                <div
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: "linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, transparent 30%, transparent 70%, rgba(0,0,0,0.7) 100%)",
                    }}
                />
                <div
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: "linear-gradient(to right, rgba(0,0,0,0.5) 0%, transparent 30%, transparent 70%, rgba(0,0,0,0.5) 100%)",
                    }}
                />

                {/* Grid pattern */}
                <div
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundImage: `linear-gradient(${design.primary_color}15 1px, transparent 1px), linear-gradient(90deg, ${design.primary_color}15 1px, transparent 1px)`,
                        backgroundSize: "40px 40px",
                        opacity: 0.5,
                    }}
                />

                {/* Glass Card - Using solid background instead of blur for export */}
                <div
                    style={{
                        position: "relative",
                        zIndex: 10,
                        backgroundColor: "rgba(20, 20, 30, 0.9)",
                        border: `1px solid ${design.primary_color}40`,
                        borderRadius: "16px",
                        padding: "32px 48px",
                        maxWidth: "600px",
                        boxShadow: `0 0 60px ${design.primary_color}30, 0 25px 50px rgba(0,0,0,0.5)`,
                    }}
                >
                    <EditableText
                        field="headline"
                        style={{
                            fontSize: "36px",
                            fontWeight: "bold",
                            letterSpacing: "-0.01em",
                            lineHeight: 1.2,
                            color: design.text_color,
                            margin: 0,
                        }}
                    >
                        {content.headline}
                    </EditableText>

                    <EditableText
                        field="subheadline"
                        style={{
                            fontSize: "16px",
                            marginTop: "12px",
                            color: design.primary_color,
                            opacity: 0.9,
                        }}
                    >
                        <span style={{ opacity: 0.5 }}>$</span> {content.subheadline}
                    </EditableText>

                    {content.cta && (
                        <EditableText
                            field="cta"
                            style={{
                                fontSize: "14px",
                                marginTop: "20px",
                                color: design.text_color,
                                opacity: 0.6,
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                            }}
                        >
                            <span style={{ color: "#22c55e" }}>→</span> {content.cta}
                        </EditableText>
                    )}
                </div>

                {/* Corner accents */}
                <div
                    style={{
                        position: "absolute",
                        top: "24px",
                        right: "24px",
                        width: "3px",
                        height: "48px",
                        backgroundColor: design.primary_color,
                    }}
                />
                <div
                    style={{
                        position: "absolute",
                        top: "24px",
                        right: "24px",
                        width: "48px",
                        height: "3px",
                        backgroundColor: design.primary_color,
                    }}
                />
                <div
                    style={{
                        position: "absolute",
                        bottom: "24px",
                        left: "24px",
                        width: "3px",
                        height: "48px",
                        backgroundColor: design.primary_color,
                    }}
                />
                <div
                    style={{
                        position: "absolute",
                        bottom: "24px",
                        left: "24px",
                        width: "48px",
                        height: "3px",
                        backgroundColor: design.primary_color,
                    }}
                />

                {/* Glow orbs - using gradients instead of blur for export */}
                <div
                    style={{
                        position: "absolute",
                        top: "20%",
                        left: "20%",
                        width: "200px",
                        height: "200px",
                        borderRadius: "50%",
                        background: `radial-gradient(circle, ${design.primary_color}40 0%, transparent 70%)`,
                    }}
                />
                <div
                    style={{
                        position: "absolute",
                        bottom: "20%",
                        right: "25%",
                        width: "150px",
                        height: "150px",
                        borderRadius: "50%",
                        background: "radial-gradient(circle, rgba(168,85,247,0.3) 0%, transparent 70%)",
                    }}
                />
            </div>
        );
    }
);

BannerTemplate.displayName = "BannerTemplate";

export default BannerTemplate;
