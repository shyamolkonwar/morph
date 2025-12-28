"use client";

import { motion } from "framer-motion";
import {
    Layers,
    Palette,
    MonitorSmartphone,
    Sparkles,
    Download,
    Zap,
} from "lucide-react";

const features = [
    {
        icon: MonitorSmartphone,
        title: "Multi-Format Export",
        description:
            "One prompt generates LinkedIn banners, YouTube thumbnails, Instagram posts, and carousels simultaneously.",
        gradient: "from-blue-500 to-cyan-500",
        platforms: ["LinkedIn", "YouTube", "X", "Instagram"],
    },
    {
        icon: Sparkles,
        title: "Morph Intelligence Engine",
        description:
            "Powered by Morph-1.1 for intelligent copywriting and Morph-Vision for context-aware photorealistic backgrounds.",
        gradient: "from-purple-500 to-pink-500",
        badge: "Morph-1.1",
    },
    {
        icon: Palette,
        title: "Brand Kits",
        description:
            "Upload your logo and hex codes once. Every generation stays perfectly on brand.",
        gradient: "from-orange-500 to-red-500",
        feature: "Coming Soon",
    },
    {
        icon: Layers,
        title: "Smart Layouts",
        description:
            "Our engine understands context—automatically shifting layouts for thumbnails vs. carousels.",
        gradient: "from-green-500 to-emerald-500",
        layouts: ["Hero", "Split", "Minimal"],
    },
    {
        icon: Download,
        title: "High-Res Export",
        description:
            "Export print-ready PNG and JPG files at any resolution. Perfect for any use case.",
        gradient: "from-indigo-500 to-violet-500",
    },
    {
        icon: Zap,
        title: "Blazing Fast",
        description:
            "Average generation time under 30 seconds. Stop waiting, start publishing.",
        gradient: "from-yellow-500 to-orange-500",
        stat: "< 30s",
    },
];

export default function FeatureGrid() {
    return (
        <section id="features" className="py-24 relative">
            <div className="absolute inset-0 bg-gradient-to-b from-morph-bg via-morph-bg-secondary to-morph-bg" />

            <div className="relative z-10 max-w-7xl mx-auto px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-16"
                >
                    <h2 className="text-3xl md:text-5xl font-bold font-[family-name:var(--font-space-grotesk)] mb-4">
                        Everything You Need to{" "}
                        <span className="text-morph-accent">Publish Faster</span>
                    </h2>
                    <p className="text-morph-text-muted text-lg max-w-2xl mx-auto">
                        Built for creators who value their time. No design skills required.
                    </p>
                </motion.div>

                {/* Bento Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {features.map((feature, index) => (
                        <motion.div
                            key={feature.title}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.4, delay: index * 0.1 }}
                            className={`group relative ${index === 0 ? "lg:col-span-2 lg:row-span-1" : ""
                                }`}
                        >
                            <div className="relative h-full glass rounded-2xl p-6 hover:border-morph-accent/50 transition-all duration-300 overflow-hidden">
                                {/* Gradient Glow on Hover */}
                                <div
                                    className={`absolute -inset-px bg-gradient-to-r ${feature.gradient} opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity duration-300`}
                                />

                                <div className="relative z-10">
                                    {/* Icon */}
                                    <div
                                        className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4`}
                                    >
                                        <feature.icon className="w-6 h-6 text-white" />
                                    </div>

                                    {/* Title */}
                                    <h3 className="text-xl font-bold text-morph-text mb-2">
                                        {feature.title}
                                    </h3>

                                    {/* Description */}
                                    <p className="text-morph-text-muted text-sm leading-relaxed mb-4">
                                        {feature.description}
                                    </p>

                                    {/* Extra Content */}
                                    {feature.platforms && (
                                        <div className="flex flex-wrap gap-2">
                                            {feature.platforms.map((platform) => (
                                                <span
                                                    key={platform}
                                                    className="px-2 py-1 text-xs rounded-md bg-morph-bg-secondary text-morph-text-muted"
                                                >
                                                    {platform}
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    {feature.badge && (
                                        <span className="inline-flex items-center gap-1 px-3 py-1 text-xs rounded-full bg-gradient-to-r from-morph-accent to-morph-secondary text-white font-medium">
                                            <Sparkles className="w-3 h-3" />
                                            {feature.badge}
                                        </span>
                                    )}

                                    {feature.layouts && (
                                        <div className="flex gap-2">
                                            {feature.layouts.map((layout) => (
                                                <div
                                                    key={layout}
                                                    className="px-2 py-1 text-xs rounded-md bg-morph-bg text-morph-secondary border border-morph-secondary/30"
                                                >
                                                    {layout}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {feature.stat && (
                                        <div className="text-3xl font-bold text-morph-accent">
                                            {feature.stat}
                                        </div>
                                    )}

                                    {feature.feature && (
                                        <span className="inline-flex items-center px-3 py-1 text-xs rounded-full bg-morph-bg-secondary text-morph-text-muted border border-morph-border">
                                            {feature.feature}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
