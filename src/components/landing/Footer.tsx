"use client";

import Link from "next/link";
import { Sparkles, Twitter, Linkedin, Github } from "lucide-react";

export default function Footer() {
    const footerLinks = {
        Product: [
            { label: "Features", href: "#features" },
            { label: "Pricing", href: "#pricing" },
            { label: "FAQ", href: "#faq" },
            { label: "Changelog", href: "#" },
        ],
        Company: [
            { label: "About", href: "#" },
            { label: "Blog", href: "#" },
            { label: "Careers", href: "#" },
            { label: "Contact", href: "#" },
        ],
        Legal: [
            { label: "Privacy", href: "#" },
            { label: "Terms", href: "#" },
            { label: "Security", href: "#" },
        ],
    };

    return (
        <footer className="relative border-t border-morph-border">
            <div className="absolute inset-0 bg-gradient-to-t from-morph-bg-secondary/50 to-transparent" />

            <div className="relative z-10 max-w-7xl mx-auto px-6 py-16">
                {/* CTA Section */}
                <div className="text-center mb-16">
                    <h2 className="text-2xl md:text-4xl font-bold font-[family-name:var(--font-space-grotesk)] mb-4">
                        Ready to <span className="text-morph-accent">Stop Resizing</span>?
                    </h2>
                    <p className="text-morph-text-muted mb-8 max-w-lg mx-auto">
                        Join thousands of creators who publish faster with Morph
                    </p>
                    <Link
                        href="/signup"
                        className="btn-primary inline-flex items-center gap-2"
                    >
                        <Sparkles className="w-4 h-4" />
                        Start Creating for Free
                    </Link>
                </div>

                {/* Links Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
                    {/* Logo Column */}
                    <div className="col-span-2 md:col-span-1">
                        <Link href="/" className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-morph-accent to-morph-secondary flex items-center justify-center">
                                <Sparkles className="w-4 h-4 text-white" />
                            </div>
                            <span className="text-xl font-bold font-[family-name:var(--font-space-grotesk)]">
                                Morph
                            </span>
                        </Link>
                        <p className="text-sm text-morph-text-muted mb-4">
                            The Intelligent Design Engine.
                            <br />
                            One Prompt. Every Platform.
                        </p>
                        <div className="flex gap-4">
                            <a
                                href="#"
                                className="text-morph-text-muted hover:text-morph-accent transition-colors"
                            >
                                <Twitter className="w-5 h-5" />
                            </a>
                            <a
                                href="#"
                                className="text-morph-text-muted hover:text-morph-accent transition-colors"
                            >
                                <Linkedin className="w-5 h-5" />
                            </a>
                            <a
                                href="#"
                                className="text-morph-text-muted hover:text-morph-accent transition-colors"
                            >
                                <Github className="w-5 h-5" />
                            </a>
                        </div>
                    </div>

                    {/* Link Columns */}
                    {Object.entries(footerLinks).map(([category, links]) => (
                        <div key={category}>
                            <h4 className="font-medium text-morph-text mb-4">{category}</h4>
                            <ul className="space-y-2">
                                {links.map((link) => (
                                    <li key={link.label}>
                                        <Link
                                            href={link.href}
                                            className="text-sm text-morph-text-muted hover:text-morph-text transition-colors"
                                        >
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* Bottom Bar */}
                <div className="pt-8 border-t border-morph-border flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-sm text-morph-text-muted">
                        © {new Date().getFullYear()} Morph. All rights reserved.
                    </p>
                    <p className="text-sm text-morph-text-muted">
                        Made with{" "}
                        <span className="text-morph-accent">♥</span> for creators
                    </p>
                </div>
            </div>
        </footer>
    );
}
