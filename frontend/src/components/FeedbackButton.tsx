"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Bug, Lightbulb, X, Send, Loader2, Check } from "lucide-react";

interface FeedbackButtonProps {
    generationId?: string;
}

export default function FeedbackButton({ generationId }: FeedbackButtonProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [type, setType] = useState<"bug" | "feature" | "general">("general");
    const [message, setMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleSubmit = async () => {
        if (!message.trim()) return;

        setIsSubmitting(true);
        try {
            const response = await fetch("/api/feedback", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type,
                    message,
                    generationId,
                }),
            });

            if (response.ok) {
                setIsSuccess(true);
                setTimeout(() => {
                    setIsOpen(false);
                    setIsSuccess(false);
                    setMessage("");
                    setType("general");
                }, 2000);
            }
        } catch (error) {
            console.error("Failed to submit feedback:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const typeOptions = [
        { id: "bug" as const, label: "Bug", icon: Bug, color: "text-red-400" },
        { id: "feature" as const, label: "Feature", icon: Lightbulb, color: "text-yellow-400" },
        { id: "general" as const, label: "General", icon: MessageSquare, color: "text-blue-400" },
    ];

    return (
        <>
            {/* Floating Button */}
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 p-4 rounded-full bg-morph-accent shadow-lg hover:bg-morph-accent-light transition-colors z-40 group"
                title="Send Feedback"
            >
                <MessageSquare className="w-6 h-6 text-white" />
                <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg bg-morph-bg-secondary text-sm text-morph-text whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                    Send Feedback
                </span>
            </button>

            {/* Modal */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                        />

                        <motion.div
                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 20, scale: 0.95 }}
                            className="fixed bottom-24 right-6 w-full max-w-md z-50"
                        >
                            <div className="glass rounded-2xl p-6">
                                {/* Header */}
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-lg font-bold">Send Feedback</h3>
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="p-2 rounded-lg hover:bg-morph-bg-secondary text-morph-text-muted hover:text-morph-text transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                {isSuccess ? (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="text-center py-8"
                                    >
                                        <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                                            <Check className="w-8 h-8 text-green-400" />
                                        </div>
                                        <p className="text-morph-text font-medium">Thanks for your feedback!</p>
                                        <p className="text-sm text-morph-text-muted">We'll review it soon.</p>
                                    </motion.div>
                                ) : (
                                    <>
                                        {/* Type Selector */}
                                        <div className="flex gap-2 mb-4">
                                            {typeOptions.map((option) => (
                                                <button
                                                    key={option.id}
                                                    onClick={() => setType(option.id)}
                                                    className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border transition-all ${type === option.id
                                                            ? "border-morph-accent bg-morph-accent/10"
                                                            : "border-morph-border hover:border-morph-accent/50"
                                                        }`}
                                                >
                                                    <option.icon className={`w-4 h-4 ${option.color}`} />
                                                    <span className="text-sm">{option.label}</span>
                                                </button>
                                            ))}
                                        </div>

                                        {/* Message Input */}
                                        <textarea
                                            value={message}
                                            onChange={(e) => setMessage(e.target.value)}
                                            placeholder={
                                                type === "bug"
                                                    ? "Describe the issue you encountered..."
                                                    : type === "feature"
                                                        ? "What feature would you like to see?"
                                                        : "Share your thoughts with us..."
                                            }
                                            rows={4}
                                            className="w-full p-4 rounded-xl bg-morph-bg border border-morph-border text-morph-text placeholder:text-morph-text-muted focus:outline-none focus:border-morph-accent transition-colors resize-none mb-4"
                                        />

                                        {/* Submit Button */}
                                        <button
                                            onClick={handleSubmit}
                                            disabled={isSubmitting || !message.trim()}
                                            className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isSubmitting ? (
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                            ) : (
                                                <>
                                                    <Send className="w-4 h-4" />
                                                    Send Feedback
                                                </>
                                            )}
                                        </button>
                                    </>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
