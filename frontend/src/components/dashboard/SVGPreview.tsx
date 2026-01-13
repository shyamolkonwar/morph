/**
 * MorphV2 SVG Preview Component
 * 
 * Renders SVG directly and shows verification report
 */

"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    CheckCircle2,
    XCircle,
    AlertTriangle,
    ChevronDown,
    ChevronUp,
    FileCode2,
} from "lucide-react";
import type { VerificationReport } from "@/lib/morph-v2-types";

interface SVGPreviewProps {
    svg: string;
    verificationReport?: VerificationReport;
    iterations?: number;
    className?: string;
}

const LAYER_LABELS: Record<string, string> = {
    syntax: "SVG Syntax",
    spatial: "Spatial Bounds",
    text_readability: "Text Readability",
    color_palette: "Color Palette",
    rendering: "Rendering Test",
};

export function SVGPreview({
    svg,
    verificationReport,
    iterations,
    className = "",
}: SVGPreviewProps) {
    const [showDetails, setShowDetails] = useState(false);
    const [showCode, setShowCode] = useState(false);

    const allPassed = verificationReport?.overall === "pass";

    return (
        <div className={`glass rounded-2xl overflow-hidden ${className}`}>
            {/* SVG Display */}
            <div
                className="w-full bg-morph-bg-secondary"
                dangerouslySetInnerHTML={{ __html: svg }}
            />

            {/* Verification Summary */}
            {verificationReport && (
                <div className="border-t border-morph-border">
                    {/* Summary Bar */}
                    <button
                        onClick={() => setShowDetails(!showDetails)}
                        className="w-full px-4 py-3 flex items-center justify-between hover:bg-morph-bg-secondary/50 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            {allPassed ? (
                                <CheckCircle2 className="w-5 h-5 text-green-400" />
                            ) : (
                                <AlertTriangle className="w-5 h-5 text-amber-400" />
                            )}
                            <span className="font-medium">
                                {allPassed
                                    ? "All Verification Checks Passed"
                                    : "Some Checks Need Attention"}
                            </span>
                            {iterations && iterations > 1 && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-morph-secondary/20 text-morph-secondary">
                                    {iterations} iterations
                                </span>
                            )}
                        </div>
                        {showDetails ? (
                            <ChevronUp className="w-5 h-5 text-morph-text-muted" />
                        ) : (
                            <ChevronDown className="w-5 h-5 text-morph-text-muted" />
                        )}
                    </button>

                    {/* Detailed Report */}
                    <AnimatePresence>
                        {showDetails && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="px-4 pb-4 space-y-2">
                                    {Object.entries(verificationReport.layers).map(
                                        ([layerName, layer]) => (
                                            <div
                                                key={layerName}
                                                className="flex items-start gap-3 p-3 rounded-lg bg-morph-bg"
                                            >
                                                {layer?.status === "pass" ? (
                                                    <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5" />
                                                ) : layer?.status === "fail" ? (
                                                    <XCircle className="w-4 h-4 text-red-400 mt-0.5" />
                                                ) : (
                                                    <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5" />
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-medium text-sm">
                                                        {LAYER_LABELS[layerName] || layerName}
                                                    </div>
                                                    {layer?.errors && layer.errors.length > 0 && (
                                                        <ul className="mt-1 text-xs text-morph-text-muted">
                                                            {layer.errors.map((error, idx) => (
                                                                <li key={idx}>• {error}</li>
                                                            ))}
                                                        </ul>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}

            {/* View SVG Code Toggle */}
            <div className="border-t border-morph-border">
                <button
                    onClick={() => setShowCode(!showCode)}
                    className="w-full px-4 py-2 flex items-center gap-2 text-sm text-morph-text-muted hover:text-morph-text transition-colors"
                >
                    <FileCode2 className="w-4 h-4" />
                    {showCode ? "Hide" : "View"} SVG Code
                </button>


                <AnimatePresence>
                    {showCode && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                        >
                            <pre className="p-4 text-xs bg-morph-bg overflow-x-auto max-h-64">
                                <code>{svg}</code>
                            </pre>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

export default SVGPreview;
