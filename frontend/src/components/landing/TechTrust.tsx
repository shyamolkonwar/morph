"use client";

import { motion } from "framer-motion";
import { Cpu, Type, Shield, Zap } from "lucide-react";

const techStack = [
    {
        icon: Cpu,
        title: "Morph-1.1 Architect",
        description: "Proprietary layout engine trained on high-converting social media posts",
    },
    {
        icon: Type,
        title: "Vector Text Rendering",
        description: "Crystal-clear typography that scales to any resolution",
    },
    {
        icon: Shield,
        title: "Enterprise Security",
        description: "Your data and assets are encrypted and never used for training",
    },
    {
        icon: Zap,
        title: "Edge-Optimized",
        description: "Global CDN ensures sub-second load times worldwide",
    },
];

export default function TechTrust() {
    return (
        <section className="py-24 relative overflow-hidden">
            <div className="absolute inset-0 grid-pattern opacity-20" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-morph-accent/10 rounded-full blur-[128px]" />

            <div className="relative z-10 max-w-7xl mx-auto px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-16"
                >
                    <span className="inline-block px-4 py-1.5 rounded-full text-sm font-medium bg-morph-accent/20 text-morph-accent mb-4">
                        Built for Professionals
                    </span>
                    <h2 className="text-3xl md:text-5xl font-bold font-[family-name:var(--font-space-grotesk)] mb-4">
                        Powered by{" "}
                        <span className="text-morph-accent">Cutting-Edge</span> Technology
                    </h2>
                    <p className="text-morph-text-muted text-lg max-w-2xl mx-auto">
                        We combine the best AI models with precision engineering to deliver professional results
                    </p>
                </motion.div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {techStack.map((tech, index) => (
                        <motion.div
                            key={tech.title}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.4, delay: index * 0.1 }}
                            className="text-center"
                        >
                            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-morph-bg-secondary border border-morph-border flex items-center justify-center group hover:border-morph-accent transition-colors">
                                <tech.icon className="w-8 h-8 text-morph-accent group-hover:scale-110 transition-transform" />
                            </div>
                            <h3 className="text-lg font-bold text-morph-text mb-2">
                                {tech.title}
                            </h3>
                            <p className="text-sm text-morph-text-muted">
                                {tech.description}
                            </p>
                        </motion.div>
                    ))}
                </div>

                {/* Logos / Integrations */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    className="mt-20 text-center"
                >
                    <p className="text-sm text-morph-text-muted mb-6">
                        Integrates with the tools you already use
                    </p>
                    <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
                        {["LinkedIn", "YouTube", "X (Twitter)", "Notion", "Zapier"].map((tool) => (
                            <div
                                key={tool}
                                className="px-6 py-3 rounded-lg bg-morph-bg-secondary border border-morph-border text-morph-text-muted text-sm font-medium"
                            >
                                {tool}
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
