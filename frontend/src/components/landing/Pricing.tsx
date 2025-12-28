"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Sparkles, Zap, Crown } from "lucide-react";
import Link from "next/link";

const plans = [
    {
        name: "Free",
        price: "0",
        description: "Perfect for trying out Morph",
        icon: Zap,
        features: [
            "5 generations per day",
            "Standard layouts",
            "LinkedIn & YouTube formats",
            "720p export quality",
            "Morph watermark",
        ],
        cta: "Start Free",
        href: "/signup",
        popular: false,
        comingSoon: false,
    },
    {
        name: "Pro",
        price: "19",
        period: "/month",
        description: "For creators who publish regularly",
        icon: Sparkles,
        features: [
            "Unlimited generations",
            "Remove watermark",
            "4K export quality",
            "Custom brand colors",
            "All premium layouts",
            "All platform formats",
            "Priority support",
        ],
        cta: "Join Waitlist",
        href: "#waitlist",
        popular: true,
        comingSoon: true,
    },
    {
        name: "Team",
        price: "49",
        period: "/month",
        description: "For agencies and content teams",
        icon: Crown,
        features: [
            "Everything in Pro",
            "Up to 10 team members",
            "Brand kit management",
            "API access",
            "Custom templates",
            "Dedicated account manager",
            "SSO authentication",
        ],
        cta: "Notify Me",
        href: "#waitlist",
        popular: false,
        comingSoon: true,
    },
];

export default function Pricing() {
    const [isAnnual, setIsAnnual] = useState(true);

    return (
        <section id="pricing" className="py-24 relative">
            <div className="absolute inset-0 bg-gradient-to-b from-morph-bg via-morph-bg-secondary/50 to-morph-bg" />

            <div className="relative z-10 max-w-7xl mx-auto px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-12"
                >
                    <h2 className="text-3xl md:text-5xl font-bold font-[family-name:var(--font-space-grotesk)] mb-4">
                        Simple, <span className="text-morph-accent">Transparent</span> Pricing
                    </h2>
                    <p className="text-morph-text-muted text-lg max-w-2xl mx-auto mb-8">
                        Start free. Upgrade when you need more power.
                    </p>

                    {/* Billing Toggle */}
                    <div className="inline-flex items-center gap-4 p-1 rounded-full bg-morph-bg-secondary border border-morph-border">
                        <button
                            onClick={() => setIsAnnual(false)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${!isAnnual
                                ? "bg-morph-accent text-white"
                                : "text-morph-text-muted hover:text-morph-text"
                                }`}
                        >
                            Monthly
                        </button>
                        <button
                            onClick={() => setIsAnnual(true)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${isAnnual
                                ? "bg-morph-accent text-white"
                                : "text-morph-text-muted hover:text-morph-text"
                                }`}
                        >
                            Annual
                            <span className="text-xs bg-morph-secondary text-morph-bg px-2 py-0.5 rounded-full">
                                Save 20%
                            </span>
                        </button>
                    </div>
                </motion.div>

                <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                    {plans.map((plan, index) => (
                        <motion.div
                            key={plan.name}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.4, delay: index * 0.1 }}
                            className={`relative ${plan.popular ? "md:-mt-4 md:mb-4" : ""}`}
                        >
                            {plan.popular && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-morph-accent to-morph-secondary text-white text-sm font-medium">
                                    Most Popular
                                </div>
                            )}

                            <div
                                className={`h-full rounded-2xl p-8 ${plan.popular
                                    ? "bg-gradient-to-b from-morph-accent/10 to-morph-bg-secondary border-2 border-morph-accent"
                                    : "glass"
                                    }`}
                            >
                                {/* Icon */}
                                <div
                                    className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${plan.popular
                                        ? "bg-morph-accent"
                                        : "bg-morph-bg-secondary border border-morph-border"
                                        }`}
                                >
                                    <plan.icon
                                        className={`w-6 h-6 ${plan.popular ? "text-white" : "text-morph-accent"
                                            }`}
                                    />
                                </div>

                                {/* Plan Name */}
                                <h3 className="text-xl font-bold text-morph-text mb-1">
                                    {plan.name}
                                </h3>
                                <p className="text-sm text-morph-text-muted mb-4">
                                    {plan.description}
                                </p>

                                {/* Price */}
                                <div className="mb-6">
                                    <span className="text-4xl font-bold text-morph-text">
                                        ${isAnnual ? Math.round(parseInt(plan.price) * 0.8) : plan.price}
                                    </span>
                                    {plan.period && (
                                        <span className="text-morph-text-muted">{plan.period}</span>
                                    )}
                                </div>

                                {/* Features */}
                                <ul className="space-y-3 mb-8">
                                    {plan.features.map((feature) => (
                                        <li
                                            key={feature}
                                            className="flex items-start gap-3 text-sm"
                                        >
                                            <Check
                                                className={`w-4 h-4 mt-0.5 flex-shrink-0 ${plan.popular ? "text-morph-secondary" : "text-morph-accent"
                                                    }`}
                                            />
                                            <span className="text-morph-text-muted">{feature}</span>
                                        </li>
                                    ))}
                                </ul>

                                {/* CTA */}
                                <div className="relative">
                                    {plan.comingSoon && (
                                        <span className="absolute -top-2 right-2 px-2 py-0.5 text-xs rounded-full bg-morph-secondary/20 text-morph-secondary font-medium">
                                            Coming Soon
                                        </span>
                                    )}
                                    <Link
                                        href={plan.href}
                                        className={`block w-full text-center py-3 rounded-xl font-medium transition-all ${plan.popular
                                            ? "btn-primary"
                                            : "btn-secondary"
                                            }`}
                                    >
                                        {plan.cta}
                                    </Link>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Money-back guarantee */}
                <motion.p
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    className="text-center text-morph-text-muted text-sm mt-8"
                >
                    ✨ 7-day money-back guarantee • No credit card required for free tier
                </motion.p>
            </div>
        </section>
    );
}
