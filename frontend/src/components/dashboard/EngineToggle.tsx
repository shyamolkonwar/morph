/**
 * MorphV2 Engine Toggle Component
 *
 * Toggle between V1 (template) and V2 (first-principles) engines
 */

"use client";

import { motion } from "framer-motion";
import { Zap, Sparkles } from "lucide-react";

interface EngineToggleProps {
    useV2: boolean;
    onToggle: (useV2: boolean) => void;
    disabled?: boolean;
}

export function EngineToggle({ useV2, onToggle, disabled }: EngineToggleProps) {
    return (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-morph-bg border border-morph-border">
            <span className="text-sm text-morph-text-muted">Engine:</span>

            <div className="flex items-center rounded-lg bg-morph-bg-secondary p-1">
                <button
                    onClick={() => !disabled && onToggle(false)}
                    disabled={disabled}
                    className={`relative px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${!useV2
                            ? "text-morph-text"
                            : "text-morph-text-muted hover:text-morph-text"
                        } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                    {!useV2 && (
                        <motion.div
                            layoutId="engineBg"
                            className="absolute inset-0 bg-morph-accent/20 border border-morph-accent/50 rounded-md"
                            transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                        />
                    )}
                    <Sparkles className="w-4 h-4 relative z-10" />
                    <span className="relative z-10">V1 Template</span>
                </button>

                <button
                    onClick={() => !disabled && onToggle(true)}
                    disabled={disabled}
                    className={`relative px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${useV2
                            ? "text-morph-text"
                            : "text-morph-text-muted hover:text-morph-text"
                        } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                    {useV2 && (
                        <motion.div
                            layoutId="engineBg"
                            className="absolute inset-0 bg-gradient-to-r from-morph-accent/20 to-morph-secondary/20 border border-morph-secondary/50 rounded-md"
                            transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                        />
                    )}
                    <Zap className="w-4 h-4 relative z-10" />
                    <span className="relative z-10">V2 First-Principles</span>
                </button>
            </div>

            {useV2 && (
                <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-xs text-morph-secondary"
                >
                    ✨ AI calculates from scratch
                </motion.span>
            )}
        </div>
    );
}

export default EngineToggle;
