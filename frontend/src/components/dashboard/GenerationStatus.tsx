/**
 * MorphV2 Generation Status Component
 *
 * Real-time status updates during banner generation
 */

"use client";

import { motion } from "framer-motion";
import {
    Brain,
    Palette,
    Layout,
    CheckCircle,
    AlertCircle,
    Loader2,
    Sparkles,
} from "lucide-react";

export type GenerationPhase =
    | "idle"
    | "designing"
    | "validating"
    | "refining"
    | "rendering"
    | "complete"
    | "error";

interface GenerationStatusProps {
    phase: GenerationPhase;
    iteration?: number;
    maxIterations?: number;
    error?: string;
}

const PHASE_CONFIG: Record<
    GenerationPhase,
    { icon: React.ReactNode; label: string; color: string }
> = {
    idle: {
        icon: <Sparkles className="w-5 h-5" />,
        label: "Ready to generate",
        color: "text-morph-text-muted",
    },
    designing: {
        icon: <Brain className="w-5 h-5 animate-pulse" />,
        label: "AI is designing your banner...",
        color: "text-morph-accent",
    },
    validating: {
        icon: <CheckCircle className="w-5 h-5 animate-pulse" />,
        label: "Running 5-layer verification...",
        color: "text-morph-secondary",
    },
    refining: {
        icon: <Palette className="w-5 h-5 animate-spin" />,
        label: "Refining design based on feedback...",
        color: "text-amber-400",
    },
    rendering: {
        icon: <Layout className="w-5 h-5 animate-pulse" />,
        label: "Rendering final output...",
        color: "text-green-400",
    },
    complete: {
        icon: <CheckCircle className="w-5 h-5" />,
        label: "Generation complete!",
        color: "text-green-400",
    },
    error: {
        icon: <AlertCircle className="w-5 h-5" />,
        label: "Generation failed",
        color: "text-red-400",
    },
};

const PHASES_ORDER: GenerationPhase[] = [
    "designing",
    "validating",
    "refining",
    "rendering",
    "complete",
];

export function GenerationStatus({
    phase,
    iteration = 1,
    maxIterations = 5,
    error,
}: GenerationStatusProps) {
    const config = PHASE_CONFIG[phase];
    const currentPhaseIndex = PHASES_ORDER.indexOf(phase);

    if (phase === "idle") {
        return null;
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-xl p-4"
        >
            {/* Current Phase */}
            <div className="flex items-center gap-3 mb-4">
                <div className={config.color}>{config.icon}</div>
                <div className="flex-1">
                    <div className={`font-medium ${config.color}`}>{config.label}</div>
                    {phase === "refining" && (
                        <div className="text-xs text-morph-text-muted mt-0.5">
                            Iteration {iteration} of {maxIterations}
                        </div>
                    )}
                    {error && phase === "error" && (
                        <div className="text-xs text-red-400 mt-1">{error}</div>
                    )}
                </div>
                {phase !== "complete" && phase !== "error" && (
                    <Loader2 className="w-4 h-4 animate-spin text-morph-text-muted" />
                )}
            </div>

            {/* Progress Steps */}
            <div className="flex items-center gap-1">
                {PHASES_ORDER.slice(0, 4).map((p, idx) => {
                    const isActive = currentPhaseIndex >= idx;
                    const isCurrent = currentPhaseIndex === idx;

                    return (
                        <div key={p} className="flex-1 flex items-center gap-1">
                            <motion.div
                                className={`h-1.5 flex-1 rounded-full transition-colors ${isActive
                                        ? "bg-morph-accent"
                                        : "bg-morph-border"
                                    }`}
                                initial={false}
                                animate={{
                                    opacity: isCurrent ? [0.5, 1, 0.5] : 1,
                                }}
                                transition={{
                                    duration: 1,
                                    repeat: isCurrent ? Infinity : 0,
                                }}
                            />
                        </div>
                    );
                })}
            </div>

            {/* Phase Labels */}
            <div className="flex justify-between mt-2 text-[10px] text-morph-text-muted">
                <span>Design</span>
                <span>Validate</span>
                <span>Refine</span>
                <span>Render</span>
            </div>
        </motion.div>
    );
}

export default GenerationStatus;
