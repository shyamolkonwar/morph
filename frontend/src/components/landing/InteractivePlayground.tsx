"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Play, Loader2 } from "lucide-react";

const DEMO_PROMPTS = [
    "Series A funding announcement for a fintech startup",
    "LinkedIn carousel about 5 productivity tips for developers",
    "YouTube thumbnail for a React tutorial video",
    "Personal brand banner for a UX designer",
];

const DEMO_OUTPUTS = [
    {
        type: "LinkedIn Banner",
        aspect: "4/1",
        gradient: "from-indigo-600 via-purple-600 to-pink-500",
        headline: "We've Raised $15M",
        subtext: "Series A led by Sequoia",
    },
    {
        type: "Carousel Slide",
        aspect: "1/1",
        gradient: "from-emerald-600 via-teal-600 to-cyan-500",
        headline: "5 Tips for 10x Productivity",
        subtext: "@yourhandle",
    },
    {
        type: "YouTube Thumbnail",
        aspect: "16/9",
        gradient: "from-red-600 via-orange-500 to-yellow-500",
        headline: "React in 2024",
        subtext: "Complete Guide",
    },
];

export default function InteractivePlayground() {
    const [currentPrompt, setCurrentPrompt] = useState(0);
    const [isGenerating, setIsGenerating] = useState(false);
    const [showOutput, setShowOutput] = useState(true);
    const [typedText, setTypedText] = useState("");

    // Typing effect
    useEffect(() => {
        const prompt = DEMO_PROMPTS[currentPrompt];
        let index = 0;
        setTypedText("");
        setShowOutput(false);

        const typingInterval = setInterval(() => {
            if (index <= prompt.length) {
                setTypedText(prompt.slice(0, index));
                index++;
            } else {
                clearInterval(typingInterval);
                // Simulate generation
                setIsGenerating(true);
                setTimeout(() => {
                    setIsGenerating(false);
                    setShowOutput(true);
                }, 1500);
            }
        }, 50);

        return () => clearInterval(typingInterval);
    }, [currentPrompt]);

    // Auto-cycle prompts
    useEffect(() => {
        const cycleInterval = setInterval(() => {
            setCurrentPrompt((prev) => (prev + 1) % DEMO_PROMPTS.length);
        }, 8000);

        return () => clearInterval(cycleInterval);
    }, []);

    return (
        <section id="demo" className="py-24 relative">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-morph-bg-secondary/50 to-transparent" />

            <div className="relative z-10 max-w-7xl mx-auto px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-16"
                >
                    <h2 className="text-3xl md:text-5xl font-bold font-[family-name:var(--font-space-grotesk)] mb-4">
                        Watch the <span className="text-morph-accent">Magic</span> Happen
                    </h2>
                    <p className="text-morph-text-muted text-lg max-w-2xl mx-auto">
                        From a simple prompt to production-ready banners in seconds
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="glass rounded-2xl p-6 md:p-10 max-w-5xl mx-auto"
                >
                    {/* Prompt Input */}
                    <div className="mb-8">
                        <label className="text-sm text-morph-text-muted mb-2 block">
                            Your Prompt
                        </label>
                        <div className="flex items-center gap-4 bg-morph-bg rounded-xl p-4 border border-morph-border">
                            <div className="flex-1">
                                <p className="text-morph-text min-h-[24px]">
                                    {typedText}
                                    <span className="animate-pulse text-morph-accent">|</span>
                                </p>
                            </div>
                            <button
                                onClick={() => setCurrentPrompt((prev) => (prev + 1) % DEMO_PROMPTS.length)}
                                className="btn-primary flex items-center gap-2 text-sm"
                            >
                                {isGenerating ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Play className="w-4 h-4" />
                                )}
                                {isGenerating ? "Generating..." : "Generate"}
                            </button>
                        </div>
                    </div>

                    {/* Generation Status */}
                    {isGenerating && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="mb-8 p-4 rounded-lg bg-morph-bg border border-morph-border"
                        >
                            <div className="flex items-center gap-4">
                                <Loader2 className="w-5 h-5 animate-spin text-morph-accent" />
                                <div className="flex-1">
                                    <div className="flex justify-between mb-2">
                                        <span className="text-sm text-morph-text">Analyzing text...</span>
                                        <span className="text-sm text-morph-accent">45%</span>
                                    </div>
                                    <div className="h-2 bg-morph-border rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: "0%" }}
                                            animate={{ width: "100%" }}
                                            transition={{ duration: 1.5 }}
                                            className="h-full bg-gradient-to-r from-morph-accent to-morph-secondary"
                                        />
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Output Preview */}
                    {showOutput && !isGenerating && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.4 }}
                        >
                            <label className="text-sm text-morph-text-muted mb-4 block">
                                Generated Outputs
                            </label>
                            <div className="grid md:grid-cols-3 gap-4">
                                {DEMO_OUTPUTS.map((output, index) => (
                                    <motion.div
                                        key={output.type}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.4, delay: index * 0.1 }}
                                        className="group relative overflow-hidden rounded-xl border border-morph-border hover:border-morph-accent transition-all cursor-pointer"
                                    >
                                        <div
                                            className={`aspect-[${output.aspect}] min-h-[120px] bg-gradient-to-br ${output.gradient} p-4 flex flex-col justify-end`}
                                        >
                                            <div className="bg-black/30 backdrop-blur-sm rounded-lg p-3">
                                                <p className="text-white font-bold text-sm">{output.headline}</p>
                                                <p className="text-white/70 text-xs">{output.subtext}</p>
                                            </div>
                                        </div>
                                        <div className="absolute inset-0 bg-morph-bg/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <span className="text-sm font-medium text-morph-text">
                                                Click to Download
                                            </span>
                                        </div>
                                        <div className="p-3 bg-morph-bg-secondary">
                                            <p className="text-xs text-morph-text-muted">{output.type}</p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* Prompt Selector Pills */}
                    <div className="mt-8 flex flex-wrap gap-2 justify-center">
                        {DEMO_PROMPTS.map((prompt, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrentPrompt(index)}
                                className={`px-3 py-1.5 rounded-full text-xs transition-all ${currentPrompt === index
                                        ? "bg-morph-accent text-white"
                                        : "bg-morph-bg-secondary text-morph-text-muted hover:text-morph-text"
                                    }`}
                            >
                                {prompt.slice(0, 30)}...
                            </button>
                        ))}
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
