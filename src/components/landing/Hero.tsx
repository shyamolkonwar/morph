"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Sparkles, Zap, Layout } from "lucide-react";

export default function Hero() {
    return (
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden gradient-bg">
            {/* Grid Pattern Overlay */}
            <div className="absolute inset-0 grid-pattern opacity-50" />

            {/* Accent Glows */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-morph-accent/20 rounded-full blur-[128px]" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-morph-secondary/20 rounded-full blur-[128px]" />

            <div className="relative z-10 max-w-7xl mx-auto px-6 pt-32 pb-20 text-center">
                {/* Badge */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8"
                >
                    <Sparkles className="w-4 h-4 text-morph-secondary" />
                    <span className="text-sm text-morph-text-muted">
                        Powered by the Morph Intelligence Engine
                    </span>
                </motion.div>

                {/* Main Headline */}
                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="text-5xl md:text-7xl lg:text-8xl font-bold font-[family-name:var(--font-space-grotesk)] leading-tight mb-6"
                >
                    <span className="text-morph-text">One Prompt.</span>
                    <br />
                    <span className="bg-gradient-to-r from-morph-accent via-morph-accent-light to-morph-secondary bg-clip-text text-transparent">
                        Every Platform.
                    </span>
                </motion.h1>

                {/* Subheadline */}
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="text-lg md:text-xl text-morph-text-muted max-w-2xl mx-auto mb-10"
                >
                    Type one prompt. Our AI writes the copy, designs the background, and
                    auto-formats it for{" "}
                    <span className="text-morph-text font-medium">LinkedIn</span>,{" "}
                    <span className="text-morph-text font-medium">YouTube</span>, and{" "}
                    <span className="text-morph-text font-medium">X</span>.
                </motion.p>

                {/* CTA Buttons */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
                >
                    <Link
                        href="/signup"
                        className="btn-primary flex items-center gap-2 text-lg animate-pulse-glow"
                    >
                        Generate Your First Banner
                        <ArrowRight className="w-5 h-5" />
                    </Link>
                    <Link href="#demo" className="btn-secondary flex items-center gap-2">
                        See How It Works
                    </Link>
                </motion.div>

                {/* Stats/Trust */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    className="flex flex-wrap justify-center gap-8 md:gap-16"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-morph-accent/20 flex items-center justify-center">
                            <Zap className="w-5 h-5 text-morph-accent" />
                        </div>
                        <div className="text-left">
                            <p className="text-2xl font-bold text-morph-text">30s</p>
                            <p className="text-sm text-morph-text-muted">Average Generation</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-morph-secondary/20 flex items-center justify-center">
                            <Layout className="w-5 h-5 text-morph-secondary" />
                        </div>
                        <div className="text-left">
                            <p className="text-2xl font-bold text-morph-text">10+</p>
                            <p className="text-sm text-morph-text-muted">Format Options</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-morph-accent/20 flex items-center justify-center">
                            <Sparkles className="w-5 h-5 text-morph-accent" />
                        </div>
                        <div className="text-left">
                            <p className="text-2xl font-bold text-morph-text">100%</p>
                            <p className="text-sm text-morph-text-muted">Crisp Text</p>
                        </div>
                    </div>
                </motion.div>

                {/* Preview Mock */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.5 }}
                    className="mt-20 relative"
                >
                    <div className="glass rounded-2xl p-4 md:p-8 max-w-5xl mx-auto">
                        <div className="bg-morph-bg-secondary rounded-xl p-6 flex flex-col md:flex-row items-center gap-6">
                            {/* Input Mock */}
                            <div className="flex-1 w-full">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-3 h-3 rounded-full bg-red-500/70" />
                                    <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                                    <div className="w-3 h-3 rounded-full bg-green-500/70" />
                                </div>
                                <div className="bg-morph-bg rounded-lg p-4 border border-morph-border">
                                    <p className="text-morph-text-muted text-sm mb-2">Your Prompt</p>
                                    <p className="text-morph-text font-medium cursor-blink">
                                        LinkedIn banner for a Data Scientist announcing a new role at Google
                                    </p>
                                </div>
                            </div>

                            {/* Arrow */}
                            <div className="hidden md:flex items-center justify-center">
                                <div className="w-12 h-12 rounded-full bg-morph-accent flex items-center justify-center animate-float">
                                    <ArrowRight className="w-6 h-6 text-white" />
                                </div>
                            </div>

                            {/* Output Mock */}
                            <div className="flex-1 w-full">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="aspect-[4/1] bg-gradient-to-r from-morph-accent/30 to-morph-secondary/30 rounded-lg flex items-center justify-center border border-morph-border">
                                        <span className="text-xs text-morph-text-muted">LinkedIn Banner</span>
                                    </div>
                                    <div className="aspect-video bg-gradient-to-r from-morph-secondary/30 to-morph-accent/30 rounded-lg flex items-center justify-center border border-morph-border">
                                        <span className="text-xs text-morph-text-muted">YouTube Thumb</span>
                                    </div>
                                    <div className="aspect-square bg-gradient-to-r from-morph-accent/30 to-morph-secondary/30 rounded-lg flex items-center justify-center border border-morph-border col-span-2 max-w-[50%] mx-auto">
                                        <span className="text-xs text-morph-text-muted">Carousel</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Floating Elements */}
                    <div className="absolute -top-4 -left-4 w-8 h-8 rounded-full bg-morph-accent/50 animate-float" style={{ animationDelay: "0s" }} />
                    <div className="absolute -bottom-4 -right-4 w-6 h-6 rounded-full bg-morph-secondary/50 animate-float" style={{ animationDelay: "1s" }} />
                </motion.div>
            </div>
        </section>
    );
}
