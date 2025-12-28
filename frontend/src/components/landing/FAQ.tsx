"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Plus, Minus } from "lucide-react";

const faqs = [
    {
        question: "What makes Morph different from Canva or Midjourney?",
        answer:
            "Unlike Canva, Morph generates everything automatically from a single prompt—no manual design work needed. Unlike Midjourney, our text is rendered with code (not AI-generated pixels), so it's always crisp, readable, and editable. You get the best of both worlds: AI creativity with pixel-perfect precision.",
    },
    {
        question: "How does the multi-format export work?",
        answer:
            "When you enter a prompt, our AI analyzes your content and generates layouts optimized for each platform. You'll receive a LinkedIn banner (1584x396), YouTube thumbnail (1280x720), Instagram post (1080x1080), and carousel slides—all perfectly sized and formatted.",
    },
    {
        question: "Can I use my own branding?",
        answer:
            "Yes! Pro and Team plans include Brand Kits. Upload your logo, set your brand colors (hex codes), and choose your fonts. Every generation will automatically stay on-brand without any manual adjustment.",
    },
    {
        question: "What AI models power Morph?",
        answer:
            "Morph is powered by our proprietary Morph Intelligence Engine. Morph-1.1 (Architect) handles intelligent copywriting, layout decisions, and color palette selection. Morph-Vision generates context-aware photorealistic backgrounds with exceptional text rendering. All powered by cutting-edge AI, optimized specifically for design.",
    },
    {
        question: "Is there an API for automation?",
        answer:
            "Team plans include API access, allowing you to integrate Morph into your existing workflows via Zapier, Make, or custom integrations. Generate banners programmatically for newsletters, blog posts, or social media automation.",
    },
    {
        question: "What's your refund policy?",
        answer:
            "We offer a 7-day money-back guarantee on all paid plans. If you're not satisfied with Morph for any reason, contact us within 7 days of your purchase for a full refund—no questions asked.",
    },
];

export default function FAQ() {
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    return (
        <section id="faq" className="py-24 relative">
            <div className="absolute inset-0 grid-pattern opacity-20" />

            <div className="relative z-10 max-w-3xl mx-auto px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-12"
                >
                    <h2 className="text-3xl md:text-5xl font-bold font-[family-name:var(--font-space-grotesk)] mb-4">
                        Frequently Asked{" "}
                        <span className="text-morph-accent">Questions</span>
                    </h2>
                    <p className="text-morph-text-muted text-lg">
                        Everything you need to know about Morph
                    </p>
                </motion.div>

                <div className="space-y-4">
                    {faqs.map((faq, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.3, delay: index * 0.05 }}
                        >
                            <button
                                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                                className="w-full text-left"
                            >
                                <div
                                    className={`glass rounded-xl p-5 transition-all ${openIndex === index
                                        ? "border-morph-accent/50"
                                        : "hover:border-morph-border"
                                        }`}
                                >
                                    <div className="flex items-center justify-between gap-4">
                                        <h3 className="font-medium text-morph-text">
                                            {faq.question}
                                        </h3>
                                        <div
                                            className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${openIndex === index
                                                ? "bg-morph-accent text-white"
                                                : "bg-morph-bg-secondary text-morph-text-muted"
                                                }`}
                                        >
                                            {openIndex === index ? (
                                                <Minus className="w-4 h-4" />
                                            ) : (
                                                <Plus className="w-4 h-4" />
                                            )}
                                        </div>
                                    </div>

                                    <AnimatePresence>
                                        {openIndex === index && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: "auto", opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.2 }}
                                                className="overflow-hidden"
                                            >
                                                <p className="mt-4 text-morph-text-muted text-sm leading-relaxed">
                                                    {faq.answer}
                                                </p>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </button>
                        </motion.div>
                    ))}
                </div>

                {/* Contact CTA */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="mt-12 text-center"
                >
                    <p className="text-morph-text-muted mb-4">
                        Still have questions?
                    </p>
                    <a
                        href="mailto:support@morph.ai"
                        className="inline-flex items-center gap-2 text-morph-accent hover:underline font-medium"
                    >
                        Contact our support team
                        <ChevronDown className="w-4 h-4 rotate-[-90deg]" />
                    </a>
                </motion.div>
            </div>
        </section>
    );
}
