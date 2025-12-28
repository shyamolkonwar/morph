"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Sparkles,
    Wand2,
    Download,
    RefreshCw,
    Loader2,
    ChevronDown,
    Check,
    Image as ImageIcon,
    Linkedin,
    Youtube,
    Twitter,
} from "lucide-react";

// Platform configurations
const PLATFORMS = [
    {
        id: "linkedin_banner",
        name: "LinkedIn Banner",
        icon: Linkedin,
        width: 1584,
        height: 396,
        aspectRatio: "4/1",
    },
    {
        id: "linkedin_carousel",
        name: "LinkedIn Carousel",
        icon: Linkedin,
        width: 1080,
        height: 1080,
        aspectRatio: "1/1",
    },
    {
        id: "youtube_thumbnail",
        name: "YouTube Thumbnail",
        icon: Youtube,
        width: 1280,
        height: 720,
        aspectRatio: "16/9",
    },
    {
        id: "twitter_post",
        name: "X Post",
        icon: Twitter,
        width: 1200,
        height: 675,
        aspectRatio: "16/9",
    },
];

// Mock generated results
const MOCK_RESULTS = [
    {
        id: "1",
        platform: "linkedin_banner",
        gradient: "from-indigo-600 via-purple-600 to-pink-500",
        headline: "Your Generated Headline",
        subtext: "Supporting text goes here",
    },
    {
        id: "2",
        platform: "youtube_thumbnail",
        gradient: "from-red-600 via-orange-500 to-yellow-500",
        headline: "Watch This Video",
        subtext: "Click to learn more",
    },
    {
        id: "3",
        platform: "linkedin_carousel",
        gradient: "from-emerald-600 via-teal-600 to-cyan-500",
        headline: "Slide 1 of 5",
        subtext: "@yourhandle",
    },
];

export default function DashboardPage() {
    const [prompt, setPrompt] = useState("");
    const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([
        "linkedin_banner",
    ]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generationStep, setGenerationStep] = useState("");
    const [results, setResults] = useState<typeof MOCK_RESULTS | null>(null);
    const [isPlatformDropdownOpen, setIsPlatformDropdownOpen] = useState(false);

    const handleGenerate = async () => {
        if (!prompt.trim()) return;

        setIsGenerating(true);
        setResults(null);

        // Simulate generation steps
        const steps = [
            "Analyzing prompt...",
            "Generating copy with GPT-4o...",
            "Creating background image...",
            "Composing layouts...",
            "Rendering final outputs...",
        ];

        for (const step of steps) {
            setGenerationStep(step);
            await new Promise((resolve) => setTimeout(resolve, 800));
        }

        setIsGenerating(false);
        setGenerationStep("");
        setResults(MOCK_RESULTS);
    };

    const togglePlatform = (platformId: string) => {
        setSelectedPlatforms((prev) =>
            prev.includes(platformId)
                ? prev.filter((p) => p !== platformId)
                : [...prev, platformId]
        );
    };

    return (
        <div className="p-6 lg:p-10 max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold font-[family-name:var(--font-space-grotesk)] mb-2">
                    Create New Design
                </h1>
                <p className="text-morph-text-muted">
                    Describe what you want to create and we&apos;ll handle the rest
                </p>
            </div>

            {/* Generator Form */}
            <div className="glass rounded-2xl p-6 mb-8">
                {/* Prompt Input */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-morph-text-muted mb-2">
                        Your Prompt
                    </label>
                    <div className="relative">
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="Describe your design... e.g., 'LinkedIn banner announcing our Series A funding round of $15M led by Sequoia'"
                            rows={3}
                            className="w-full p-4 rounded-xl bg-morph-bg border border-morph-border text-morph-text placeholder:text-morph-text-muted focus:outline-none focus:border-morph-accent transition-colors resize-none"
                        />
                        <div className="absolute bottom-3 right-3 flex items-center gap-2">
                            <span className="text-xs text-morph-text-muted">
                                {prompt.length}/500
                            </span>
                        </div>
                    </div>
                </div>

                {/* Platform Selection */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-morph-text-muted mb-2">
                        Output Formats
                    </label>
                    <div className="relative">
                        <button
                            onClick={() => setIsPlatformDropdownOpen(!isPlatformDropdownOpen)}
                            className="w-full flex items-center justify-between p-4 rounded-xl bg-morph-bg border border-morph-border text-morph-text hover:border-morph-accent transition-colors"
                        >
                            <div className="flex items-center gap-2 flex-wrap">
                                {selectedPlatforms.length === 0 ? (
                                    <span className="text-morph-text-muted">Select platforms...</span>
                                ) : (
                                    selectedPlatforms.map((platformId) => {
                                        const platform = PLATFORMS.find((p) => p.id === platformId);
                                        return platform ? (
                                            <span
                                                key={platformId}
                                                className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-morph-accent/20 text-morph-accent text-sm"
                                            >
                                                <platform.icon className="w-3 h-3" />
                                                {platform.name}
                                            </span>
                                        ) : null;
                                    })
                                )}
                            </div>
                            <ChevronDown
                                className={`w-5 h-5 text-morph-text-muted transition-transform ${isPlatformDropdownOpen ? "rotate-180" : ""
                                    }`}
                            />
                        </button>

                        <AnimatePresence>
                            {isPlatformDropdownOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="absolute top-full left-0 right-0 mt-2 p-2 rounded-xl bg-morph-bg-secondary border border-morph-border shadow-xl z-10"
                                >
                                    {PLATFORMS.map((platform) => {
                                        const isSelected = selectedPlatforms.includes(platform.id);
                                        return (
                                            <button
                                                key={platform.id}
                                                onClick={() => togglePlatform(platform.id)}
                                                className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${isSelected
                                                        ? "bg-morph-accent/10 text-morph-accent"
                                                        : "hover:bg-morph-bg text-morph-text-muted hover:text-morph-text"
                                                    }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <platform.icon className="w-5 h-5" />
                                                    <div className="text-left">
                                                        <p className="font-medium">{platform.name}</p>
                                                        <p className="text-xs opacity-60">
                                                            {platform.width}×{platform.height}
                                                        </p>
                                                    </div>
                                                </div>
                                                {isSelected && <Check className="w-5 h-5" />}
                                            </button>
                                        );
                                    })}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Generate Button */}
                <button
                    onClick={handleGenerate}
                    disabled={isGenerating || !prompt.trim() || selectedPlatforms.length === 0}
                    className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isGenerating ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            {generationStep}
                        </>
                    ) : (
                        <>
                            <Wand2 className="w-5 h-5" />
                            Generate Designs
                        </>
                    )}
                </button>

                {/* Generation Progress */}
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
            </div>

            {/* Results */}
            <AnimatePresence>
                {results && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold font-[family-name:var(--font-space-grotesk)]">
                                Generated Designs
                            </h2>
                            <button
                                onClick={handleGenerate}
                                className="btn-secondary flex items-center gap-2 text-sm"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Regenerate
                            </button>
                        </div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {results.map((result, index) => {
                                const platform = PLATFORMS.find(
                                    (p) => p.id === result.platform
                                );
                                return (
                                    <motion.div
                                        key={result.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        className="group relative glass rounded-xl overflow-hidden"
                                    >
                                        {/* Preview */}
                                        <div
                                            className={`relative bg-gradient-to-br ${result.gradient} p-6 flex flex-col justify-end`}
                                            style={{ aspectRatio: platform?.aspectRatio || "16/9" }}
                                        >
                                            <div className="bg-black/30 backdrop-blur-sm rounded-lg p-4">
                                                <p className="text-white font-bold text-lg">
                                                    {result.headline}
                                                </p>
                                                <p className="text-white/70 text-sm">{result.subtext}</p>
                                            </div>

                                            {/* Hover Overlay */}
                                            <div className="absolute inset-0 bg-morph-bg/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                                                <button className="p-3 rounded-xl bg-morph-accent text-white hover:bg-morph-accent-light transition-colors">
                                                    <Download className="w-5 h-5" />
                                                </button>
                                                <button className="p-3 rounded-xl bg-morph-bg-secondary text-morph-text border border-morph-border hover:border-morph-accent transition-colors">
                                                    <ImageIcon className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Info */}
                                        <div className="p-4 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                {platform && <platform.icon className="w-4 h-4 text-morph-text-muted" />}
                                                <span className="text-sm text-morph-text-muted">
                                                    {platform?.name}
                                                </span>
                                            </div>
                                            <span className="text-xs text-morph-text-muted">
                                                {platform?.width}×{platform?.height}
                                            </span>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Empty State */}
            {!results && !isGenerating && (
                <div className="text-center py-16">
                    <div className="w-20 h-20 rounded-2xl bg-morph-bg-secondary border border-morph-border flex items-center justify-center mx-auto mb-6">
                        <ImageIcon className="w-10 h-10 text-morph-text-muted" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">No designs yet</h3>
                    <p className="text-morph-text-muted max-w-md mx-auto">
                        Enter a prompt above to generate your first design. Our AI will
                        create perfectly sized assets for all your selected platforms.
                    </p>
                </div>
            )}
        </div>
    );
}
