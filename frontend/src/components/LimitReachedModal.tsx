"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Clock, Sparkles, X, Bell } from "lucide-react";

interface LimitReachedModalProps {
    isOpen: boolean;
    onClose: () => void;
    resetIn: string;
}

export default function LimitReachedModal({
    isOpen,
    onClose,
    resetIn,
}: LimitReachedModalProps) {
    const handleJoinWaitlist = async () => {
        // Open waitlist form or redirect
        window.location.href = "#pricing";
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md p-6 z-50"
                    >
                        <div className="glass rounded-2xl p-8 text-center relative">
                            {/* Close Button */}
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 p-2 rounded-lg hover:bg-morph-bg-secondary text-morph-text-muted hover:text-morph-text transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            {/* Icon */}
                            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-500/20 to-yellow-500/20 flex items-center justify-center mx-auto mb-6">
                                <Sparkles className="w-10 h-10 text-orange-400" />
                            </div>

                            {/* Content */}
                            <h2 className="text-2xl font-bold font-[family-name:var(--font-space-grotesk)] mb-2">
                                You've been busy! 🔥
                            </h2>
                            <p className="text-morph-text-muted mb-6">
                                You've reached your daily limit of <strong className="text-morph-text">5 designs</strong>.
                                <br />
                                Your quota resets in <strong className="text-morph-secondary">{resetIn}</strong>.
                            </p>

                            {/* Reset Timer */}
                            <div className="flex items-center justify-center gap-3 p-4 rounded-xl bg-morph-bg border border-morph-border mb-6">
                                <Clock className="w-5 h-5 text-morph-text-muted" />
                                <span className="text-morph-text-muted">Resets in</span>
                                <span className="text-xl font-bold font-[family-name:var(--font-space-grotesk)] text-morph-text">
                                    {resetIn}
                                </span>
                            </div>

                            {/* CTA */}
                            <div className="space-y-3">
                                <button
                                    onClick={handleJoinWaitlist}
                                    className="btn-primary w-full flex items-center justify-center gap-2"
                                >
                                    <Bell className="w-4 h-4" />
                                    Join Pro Waitlist for Unlimited
                                </button>
                                <button
                                    onClick={onClose}
                                    className="btn-secondary w-full"
                                >
                                    I'll Wait
                                </button>
                            </div>

                            {/* Teaser */}
                            <p className="mt-6 text-xs text-morph-text-muted">
                                Pro users get unlimited generations, 4K exports, and custom brand kits.
                            </p>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
