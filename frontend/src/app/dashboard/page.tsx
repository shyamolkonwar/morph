"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Sparkles,
    Wand2,
    Download,
    RefreshCw,
    Loader2,
    Image as ImageIcon,
    AlertCircle,
    Edit3,
    Check,
    X,
    Search,
    Zap,
} from "lucide-react";
import { GenerativeCanvas } from "@/components/LayerRenderer";
import type { GenerativeDesign } from "@/lib/generative-types";

interface GenerationResult {
    design: GenerativeDesign;
    backgroundUrl: string;
    projectId?: string;
    photographer?: string;
    photographerUrl?: string;
    provider?: string;
}

interface PexelsPhoto {
    url: string;
    photographer: string;
    photographerUrl: string;
}

// Extract primary accent color from design layers
function extractPrimaryColor(layers: GenerativeDesign["layers"]): string {
    for (const layer of layers) {
        if (layer.component === "Badge" && layer.props.color) {
            return layer.props.color as string;
        }
        if (layer.component === "ShapeBlob" && layer.props.color) {
            return layer.props.color as string;
        }
        if (layer.component === "AccentLine" && layer.props.color) {
            return layer.props.color as string;
        }
        if (layer.component === "CornerAccent" && layer.props.color) {
            return layer.props.color as string;
        }
    }
    return "#00ff88";
}

export default function DashboardPage() {
    const [prompt, setPrompt] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [generationStep, setGenerationStep] = useState("");
    const [result, setResult] = useState<GenerationResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [showSwapModal, setShowSwapModal] = useState(false);
    const [swapTab, setSwapTab] = useState<"stock" | "ai">("stock");
    const [stockSearchQuery, setStockSearchQuery] = useState("");
    const [aiPrompt, setAiPrompt] = useState("");
    const [stockResults, setStockResults] = useState<PexelsPhoto[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const bannerRef = useRef<HTMLDivElement>(null);

    const handleGenerate = async () => {
        if (!prompt.trim()) return;

        setIsGenerating(true);
        setError(null);
        setResult(null);

        try {
            setGenerationStep("Morph-1.1 is designing your banner...");

            const response = await fetch("/api/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    prompt: prompt.trim(),
                    platform: "linkedin_banner",
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Generation failed");
            }

            setGenerationStep("Assembling your banner...");
            await new Promise((resolve) => setTimeout(resolve, 500));

            setResult({
                design: data.generativeDesign || data.designPlan,
                backgroundUrl: data.backgroundImage?.imageUrl || "",
                projectId: data.projectId,
                photographer: data.backgroundImage?.photographer,
                photographerUrl: data.backgroundImage?.photographerUrl,
                provider: data.backgroundImage?.provider,
            });

            // Set default search query from generated keywords
            if (data.designPlan?.assets?.search_keywords) {
                setStockSearchQuery(data.designPlan.assets.search_keywords);
            }
            if (data.designPlan?.assets?.fallback_generation_prompt) {
                setAiPrompt(data.designPlan.assets.fallback_generation_prompt);
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";
            setError(errorMessage);
            console.error("Generation error:", err);
        } finally {
            setIsGenerating(false);
            setGenerationStep("");
        }
    };

    const handleUpdateContent = (field: "headline" | "subheadline" | "cta", value: string) => {
        if (!result) return;
        setResult({
            ...result,
            design: {
                ...result.design,
                content: {
                    ...result.design.content,
                    [field]: value,
                },
            },
        });
    };

    const handleSearchStock = async () => {
        if (!stockSearchQuery.trim()) return;
        setIsSearching(true);

        try {
            const response = await fetch(`/api/images?q=${encodeURIComponent(stockSearchQuery)}`);
            const data = await response.json();

            if (data.success && data.photos) {
                setStockResults(data.photos);
            }
        } catch (err) {
            console.error("Stock search error:", err);
        } finally {
            setIsSearching(false);
        }
    };

    const handleSelectStockImage = (photo: PexelsPhoto) => {
        if (!result) return;
        setResult({
            ...result,
            backgroundUrl: photo.url,
            photographer: photo.photographer,
            photographerUrl: photo.photographerUrl,
            provider: "pexels",
        });
        setShowSwapModal(false);
    };

    const handleGenerateAI = async () => {
        if (!aiPrompt.trim() || !result) return;
        setIsSearching(true);

        try {
            const response = await fetch("/api/images", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt: aiPrompt }),
            });

            const data = await response.json();

            if (data.success && data.imageUrl) {
                setResult({
                    ...result,
                    backgroundUrl: data.imageUrl,
                    photographer: undefined,
                    photographerUrl: undefined,
                    provider: data.provider,
                });
                setShowSwapModal(false);
            }
        } catch (err) {
            console.error("AI generation error:", err);
        } finally {
            setIsSearching(false);
        }
    };

    const handleDownload = async () => {
        if (!result) return;

        setIsDownloading(true);
        setError(null);

        try {
            // Use Supabase Edge Function for server-side rendering
            // Replace with your actual Supabase project URL
            const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
            const ogEndpoint = `${SUPABASE_URL}/functions/v1/og-generator`;

            // Extract primary color from design layers
            const primaryColor = extractPrimaryColor(result.design.layers);

            // Build query params for GET request (simpler for browser download)
            const params = new URLSearchParams({
                headline: result.design.content.headline,
                subheadline: result.design.content.subheadline,
                ...(result.design.content.cta && { cta: result.design.content.cta }),
                primaryColor: primaryColor,
                bgColor: result.design.canvas.bg_color,
                ...(result.backgroundUrl && { bgUrl: result.backgroundUrl }),
                fontPair: "tech",
            });

            const downloadUrl = `${ogEndpoint}?${params.toString()}`;

            // Fetch the image from Edge Function
            const response = await fetch(downloadUrl);

            if (!response.ok) {
                throw new Error("Server rendering failed");
            }

            // Convert to blob and download
            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);

            const link = document.createElement("a");
            link.download = `linkedin-banner-${Date.now()}.png`;
            link.href = blobUrl;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Clean up blob URL
            URL.revokeObjectURL(blobUrl);

        } catch (err) {
            console.error("Download failed:", err);
            setError("Failed to download banner. Please try again.");
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <div className="p-6 lg:p-10 max-w-5xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold font-[family-name:var(--font-space-grotesk)] mb-2">
                    LinkedIn Banner Generator
                </h1>
                <p className="text-morph-text-muted">
                    Describe yourself and we&apos;ll create a professional banner in seconds
                </p>
            </div>

            {/* Generator Form */}
            <div className="glass rounded-2xl p-6 mb-8">
                <div className="mb-6">
                    <label className="block text-sm font-medium text-morph-text-muted mb-2">
                        Describe yourself or your banner
                    </label>
                    <div className="relative">
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="e.g., 'I'm a backend engineer with 5 years experience in Python and Go. I love building scalable systems. Looking for freelance opportunities.'"
                            rows={3}
                            maxLength={500}
                            className="w-full p-4 rounded-xl bg-morph-bg border border-morph-border text-morph-text placeholder:text-morph-text-muted focus:outline-none focus:border-morph-accent transition-colors resize-none"
                        />
                        <div className="absolute bottom-3 right-3">
                            <span className="text-xs text-morph-text-muted">
                                {prompt.length}/500
                            </span>
                        </div>
                    </div>
                </div>

                <button
                    onClick={handleGenerate}
                    disabled={isGenerating || !prompt.trim()}
                    className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isGenerating ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            {generationStep || "Generating..."}
                        </>
                    ) : (
                        <>
                            <Wand2 className="w-5 h-5" />
                            Generate Banner
                        </>
                    )}
                </button>

                {isGenerating && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="mt-6"
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <Sparkles className="w-5 h-5 text-morph-secondary animate-pulse" />
                            <span className="text-sm text-morph-text">{generationStep}</span>
                        </div>
                        <div className="h-2 bg-morph-bg rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-gradient-to-r from-morph-accent to-morph-secondary"
                                initial={{ width: "0%" }}
                                animate={{ width: "100%" }}
                                transition={{ duration: 4, ease: "linear" }}
                            />
                        </div>
                    </motion.div>
                )}

                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-6 flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400"
                    >
                        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="font-medium mb-1">Generation Failed</p>
                            <p className="text-sm opacity-90">{error}</p>
                        </div>
                    </motion.div>
                )}
            </div>

            {/* Result */}
            <AnimatePresence>
                {result && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                    >
                        {/* Actions Bar */}
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold font-[family-name:var(--font-space-grotesk)]">
                                Your Banner
                            </h2>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setIsEditing(!isEditing)}
                                    className={`btn-secondary flex items-center gap-2 text-sm ${isEditing ? "bg-morph-accent/20 border-morph-accent" : ""}`}
                                >
                                    {isEditing ? <Check className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
                                    {isEditing ? "Done" : "Edit Text"}
                                </button>
                                <button
                                    onClick={() => setShowSwapModal(true)}
                                    className="btn-secondary flex items-center gap-2 text-sm"
                                >
                                    <ImageIcon className="w-4 h-4" />
                                    Swap Image
                                </button>
                                <button
                                    onClick={handleGenerate}
                                    disabled={isGenerating}
                                    className="btn-secondary flex items-center gap-2 text-sm"
                                >
                                    <RefreshCw className={`w-4 h-4 ${isGenerating ? "animate-spin" : ""}`} />
                                    Regenerate
                                </button>
                            </div>
                        </div>

                        {/* Banner Preview */}
                        <div ref={bannerRef} className="glass rounded-2xl overflow-hidden mb-4">
                            <GenerativeCanvas
                                design={result.design}
                                imageUrl={result.backgroundUrl}
                            />
                        </div>

                        {/* Info & Download */}
                        <div className="glass rounded-xl p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4 text-sm text-morph-text-muted">
                                    <span className="flex items-center gap-2">
                                        <ImageIcon className="w-4 h-4" />
                                        1584 × 396 px
                                    </span>
                                    <span className="px-2 py-0.5 rounded-full bg-morph-secondary/20 text-morph-secondary">
                                        {result.provider === "pexels" ? "📷 Stock Photo" : result.provider === "openai" ? "🤖 AI Generated" : "🎨 Generated"}
                                    </span>
                                    {result.photographer && (
                                        <span className="text-xs">
                                            Photo by{" "}
                                            <a
                                                href={result.photographerUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="underline hover:text-morph-accent"
                                            >
                                                {result.photographer}
                                            </a>
                                            {" "}on Pexels
                                        </span>
                                    )}
                                </div>
                                <button
                                    onClick={handleDownload}
                                    disabled={isDownloading}
                                    className="btn-primary flex items-center gap-2 min-w-[160px] justify-center"
                                >
                                    {isDownloading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Preparing...
                                        </>
                                    ) : (
                                        <>
                                            <Download className="w-4 h-4" />
                                            Download PNG
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        {isEditing && (
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-center text-sm text-morph-text-muted mt-4"
                            >
                                💡 Click on any text in the banner to edit it directly
                            </motion.p>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Empty State */}
            {!result && !isGenerating && !error && (
                <div className="text-center py-16">
                    <div className="w-20 h-20 rounded-2xl bg-morph-bg-secondary border border-morph-border flex items-center justify-center mx-auto mb-6">
                        <ImageIcon className="w-10 h-10 text-morph-text-muted" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Create your LinkedIn banner</h3>
                    <p className="text-morph-text-muted max-w-md mx-auto">
                        Describe yourself above and our AI will create a professional,
                        eye-catching banner in seconds. You can edit the text afterwards!
                    </p>
                </div>
            )}

            {/* Swap Image Modal */}
            <AnimatePresence>
                {showSwapModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                        onClick={() => setShowSwapModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-2xl glass rounded-2xl overflow-hidden"
                        >
                            {/* Modal Header */}
                            <div className="flex items-center justify-between p-4 border-b border-morph-border">
                                <h3 className="text-lg font-bold">Swap Background Image</h3>
                                <button
                                    onClick={() => setShowSwapModal(false)}
                                    className="p-2 rounded-lg hover:bg-morph-bg-secondary transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Tabs */}
                            <div className="flex border-b border-morph-border">
                                <button
                                    onClick={() => setSwapTab("stock")}
                                    className={`flex-1 py-3 px-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${swapTab === "stock"
                                        ? "text-morph-accent border-b-2 border-morph-accent"
                                        : "text-morph-text-muted hover:text-morph-text"
                                        }`}
                                >
                                    <Search className="w-4 h-4" />
                                    Stock Photos (Pexels)
                                </button>
                                <button
                                    onClick={() => setSwapTab("ai")}
                                    className={`flex-1 py-3 px-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${swapTab === "ai"
                                        ? "text-morph-accent border-b-2 border-morph-accent"
                                        : "text-morph-text-muted hover:text-morph-text"
                                        }`}
                                >
                                    <Zap className="w-4 h-4" />
                                    Generate (AI)
                                </button>
                            </div>

                            {/* Tab Content */}
                            <div className="p-4">
                                {swapTab === "stock" ? (
                                    <div>
                                        {/* Search Input */}
                                        <div className="flex gap-2 mb-4">
                                            <input
                                                type="text"
                                                value={stockSearchQuery}
                                                onChange={(e) => setStockSearchQuery(e.target.value)}
                                                onKeyDown={(e) => e.key === "Enter" && handleSearchStock()}
                                                placeholder="Search photos... e.g., 'office laptop'"
                                                className="flex-1 px-4 py-2 rounded-lg bg-morph-bg border border-morph-border text-morph-text placeholder:text-morph-text-muted focus:outline-none focus:border-morph-accent"
                                            />
                                            <button
                                                onClick={handleSearchStock}
                                                disabled={isSearching}
                                                className="btn-primary px-4"
                                            >
                                                {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                                            </button>
                                        </div>

                                        {/* Results Grid */}
                                        <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto">
                                            {stockResults.map((photo, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => handleSelectStockImage(photo)}
                                                    className="relative aspect-video rounded-lg overflow-hidden group hover:ring-2 hover:ring-morph-accent transition-all"
                                                >
                                                    <img
                                                        src={photo.url}
                                                        alt={`Stock photo by ${photo.photographer}`}
                                                        className="w-full h-full object-cover"
                                                    />
                                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                                                        <span className="text-xs text-white truncate">
                                                            {photo.photographer}
                                                        </span>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>

                                        {stockResults.length === 0 && (
                                            <p className="text-center text-morph-text-muted py-8">
                                                Search for stock photos above
                                            </p>
                                        )}
                                    </div>
                                ) : (
                                    <div>
                                        {/* AI Prompt Input */}
                                        <div className="mb-4">
                                            <textarea
                                                value={aiPrompt}
                                                onChange={(e) => setAiPrompt(e.target.value)}
                                                placeholder="Describe the background you want... e.g., 'Abstract data visualization with blue and purple gradients, dark background, minimalist'"
                                                rows={3}
                                                className="w-full px-4 py-3 rounded-lg bg-morph-bg border border-morph-border text-morph-text placeholder:text-morph-text-muted focus:outline-none focus:border-morph-accent resize-none"
                                            />
                                        </div>
                                        <button
                                            onClick={handleGenerateAI}
                                            disabled={isSearching || !aiPrompt.trim()}
                                            className="btn-primary w-full flex items-center justify-center gap-2"
                                        >
                                            {isSearching ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                    Generating...
                                                </>
                                            ) : (
                                                <>
                                                    <Zap className="w-4 h-4" />
                                                    Generate with AI
                                                </>
                                            )}
                                        </button>
                                        <p className="text-xs text-morph-text-muted text-center mt-3">
                                            AI generation is free and uses Pollinations.ai
                                        </p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
