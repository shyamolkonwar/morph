"use client";

import { motion } from "framer-motion";
import { X, Check, Clock, Paintbrush, Type, AlertCircle } from "lucide-react";

export default function ProblemSolution() {
    return (
        <section className="py-24 relative overflow-hidden">
            <div className="absolute inset-0 grid-pattern opacity-30" />

            <div className="relative z-10 max-w-7xl mx-auto px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-16"
                >
                    <h2 className="text-3xl md:text-5xl font-bold font-[family-name:var(--font-space-grotesk)] mb-4">
                        The <span className="text-red-400">Old Way</span> vs{" "}
                        <span className="text-morph-secondary">Your Way</span>
                    </h2>
                    <p className="text-morph-text-muted text-lg max-w-2xl mx-auto">
                        Stop wasting hours on manual resizing and broken AI text
                    </p>
                </motion.div>

                <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                    {/* The Old Way */}
                    <motion.div
                        initial={{ opacity: 0, x: -40 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="relative"
                    >
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-red-500/20 to-orange-500/20 rounded-2xl blur" />
                        <div className="relative bg-morph-bg-secondary rounded-2xl p-8 border border-red-500/30 h-full">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                                    <X className="w-5 h-5 text-red-400" />
                                </div>
                                <h3 className="text-xl font-bold text-red-400">Manual Design Tools</h3>
                            </div>

                            {/* Mock Bad Output */}
                            <div className="aspect-video bg-morph-bg rounded-lg mb-6 overflow-hidden relative border border-morph-border">
                                <div className="absolute inset-0 bg-gradient-to-br from-gray-600 to-gray-800" />
                                <div className="absolute inset-0 flex items-center justify-center p-4">
                                    <div className="text-center">
                                        <p className="text-xl font-bold text-white opacity-90 blur-[0.5px]" style={{ letterSpacing: "-2px" }}>
                                            MASTERING PY7H0N
                                        </p>
                                        <p className="text-xs text-white/50 mt-2">
                                            *AI text rendering artifacts*
                                        </p>
                                    </div>
                                </div>
                                <div className="absolute bottom-2 right-2">
                                    <AlertCircle className="w-5 h-5 text-red-400" />
                                </div>
                            </div>

                            <ul className="space-y-3">
                                <li className="flex items-start gap-3 text-morph-text-muted">
                                    <Clock className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                                    <span>Hours spent resizing for each platform</span>
                                </li>
                                <li className="flex items-start gap-3 text-morph-text-muted">
                                    <Type className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                                    <span>AI generates blurry, unreadable text</span>
                                </li>
                                <li className="flex items-start gap-3 text-morph-text-muted">
                                    <Paintbrush className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                                    <span>Need design skills for every edit</span>
                                </li>
                            </ul>
                        </div>
                    </motion.div>

                    {/* The Morph Way */}
                    <motion.div
                        initial={{ opacity: 0, x: 40 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="relative"
                    >
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-morph-accent/30 to-morph-secondary/30 rounded-2xl blur" />
                        <div className="relative bg-morph-bg-secondary rounded-2xl p-8 border border-morph-secondary/30 h-full">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-full bg-morph-secondary/20 flex items-center justify-center">
                                    <Check className="w-5 h-5 text-morph-secondary" />
                                </div>
                                <h3 className="text-xl font-bold text-morph-secondary">Morph AI Engine</h3>
                            </div>

                            {/* Mock Good Output */}
                            <div className="aspect-video bg-morph-bg rounded-lg mb-6 overflow-hidden relative border border-morph-accent/30">
                                <div className="absolute inset-0 bg-gradient-to-br from-morph-accent via-purple-600 to-morph-secondary" />
                                <div className="absolute inset-0 flex items-center justify-center p-4">
                                    <div className="text-center">
                                        <p className="text-2xl font-bold text-white tracking-tight">
                                            Mastering Python
                                        </p>
                                        <p className="text-sm text-white/80 mt-1">
                                            From Zero to Hero
                                        </p>
                                    </div>
                                </div>
                                <div className="absolute bottom-2 right-2">
                                    <Check className="w-5 h-5 text-green-400" />
                                </div>
                            </div>

                            <ul className="space-y-3">
                                <li className="flex items-start gap-3 text-morph-text">
                                    <Check className="w-5 h-5 text-morph-secondary mt-0.5 flex-shrink-0" />
                                    <span>All formats generated in <strong>30 seconds</strong></span>
                                </li>
                                <li className="flex items-start gap-3 text-morph-text">
                                    <Check className="w-5 h-5 text-morph-secondary mt-0.5 flex-shrink-0" />
                                    <span>Vector-sharp text, <strong>always readable</strong></span>
                                </li>
                                <li className="flex items-start gap-3 text-morph-text">
                                    <Check className="w-5 h-5 text-morph-secondary mt-0.5 flex-shrink-0" />
                                    <span><strong>Zero design skills</strong> required</span>
                                </li>
                            </ul>
                        </div>
                    </motion.div>
                </div>

                {/* Key Differentiator Callout */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="mt-12 text-center"
                >
                    <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full glass">
                        <Type className="w-5 h-5 text-morph-accent" />
                        <span className="text-morph-text">
                            Our text is <strong className="text-morph-accent">rendered code</strong>, not{" "}
                            <span className="line-through text-morph-text-muted">hallucinated pixels</span>
                        </span>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
