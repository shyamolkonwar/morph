"use client";

import { useState, useEffect } from "react";
import { Sparkles } from "lucide-react";

interface CreditBadgeProps {
    className?: string;
}

interface CreditStatus {
    remaining: number;
    dailyLimit: number;
    tier: string;
    resetIn: string;
}

export default function CreditBadge({ className = "" }: CreditBadgeProps) {
    const [credits, setCredits] = useState<CreditStatus | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchCredits() {
            try {
                const response = await fetch("/api/credits");
                if (response.ok) {
                    const data = await response.json();
                    setCredits(data);
                }
            } catch (error) {
                console.error("Failed to fetch credits:", error);
            } finally {
                setIsLoading(false);
            }
        }

        fetchCredits();

        // Refresh every 60 seconds
        const interval = setInterval(fetchCredits, 60000);
        return () => clearInterval(interval);
    }, []);

    if (isLoading || !credits) {
        return (
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full bg-morph-bg-secondary border border-morph-border ${className}`}>
                <div className="w-4 h-4 rounded-full bg-morph-border animate-pulse" />
                <span className="text-sm text-morph-text-muted">...</span>
            </div>
        );
    }

    const percentage = (credits.remaining / credits.dailyLimit) * 100;
    const isLow = credits.remaining <= 1;

    return (
        <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-colors ${isLow
                    ? "bg-orange-500/20 border border-orange-500/30"
                    : "bg-morph-bg-secondary border border-morph-border"
                } ${className}`}
        >
            <Sparkles className={`w-4 h-4 ${isLow ? "text-orange-400" : "text-morph-secondary"}`} />
            <span className={`text-sm font-medium ${isLow ? "text-orange-400" : "text-morph-text"}`}>
                {credits.remaining}/{credits.dailyLimit}
            </span>
            <span className="text-xs text-morph-text-muted">today</span>

            {/* Progress bar */}
            <div className="w-12 h-1.5 bg-morph-border rounded-full overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all ${isLow ? "bg-orange-400" : "bg-morph-secondary"
                        }`}
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
}
