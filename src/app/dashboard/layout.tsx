"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import {
    Sparkles,
    Home,
    FolderOpen,
    Settings,
    LogOut,
    Menu,
    X,
    Plus,
    CreditCard,
    Loader2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

interface DashboardLayoutProps {
    children: React.ReactNode;
}

interface UserProfile {
    full_name: string | null;
    avatar_url: string | null;
    tier: string;
    daily_usage_count: number;
}

interface CreditStatus {
    remaining: number;
    dailyLimit: number;
    tier: string;
}

const navItems = [
    { href: "/dashboard", icon: Home, label: "Dashboard" },
    { href: "/dashboard/projects", icon: FolderOpen, label: "Projects" },
    { href: "/dashboard/settings", icon: Settings, label: "Settings" },
];

export default function DashboardLayout({ children }: DashboardLayoutProps) {
    const pathname = usePathname();
    const router = useRouter();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [credits, setCredits] = useState<CreditStatus>({
        remaining: 5,
        dailyLimit: 5,
        tier: "free",
    });

    const supabase = createClient();

    useEffect(() => {
        async function loadUserData() {
            try {
                // Get current user
                const { data: { user: authUser } } = await supabase.auth.getUser();

                if (!authUser) {
                    router.push("/login");
                    return;
                }

                setUser(authUser);

                // Fetch user profile from public.users table
                const { data: profileData } = await supabase
                    .from("users")
                    .select("full_name, avatar_url, tier, daily_usage_count")
                    .eq("id", authUser.id)
                    .single();

                if (profileData) {
                    setProfile(profileData);

                    // Calculate credits based on tier
                    const dailyLimit = profileData.tier === "pro" ? 100 : 5;
                    setCredits({
                        remaining: Math.max(0, dailyLimit - (profileData.daily_usage_count || 0)),
                        dailyLimit,
                        tier: profileData.tier || "free",
                    });
                } else {
                    // Use data from auth metadata if profile doesn't exist yet
                    setProfile({
                        full_name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || null,
                        avatar_url: authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture || null,
                        tier: "free",
                        daily_usage_count: 0,
                    });
                }
            } catch (error) {
                console.error("Error loading user data:", error);
            } finally {
                setIsLoading(false);
            }
        }

        loadUserData();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (event === "SIGNED_OUT" || !session) {
                    router.push("/login");
                }
            }
        );

        return () => {
            subscription.unsubscribe();
        };
    }, [supabase, router]);

    const handleLogout = async () => {
        setIsLoggingOut(true);
        try {
            await supabase.auth.signOut();
            router.push("/login");
        } catch (error) {
            console.error("Logout error:", error);
            setIsLoggingOut(false);
        }
    };

    // Get display name
    const displayName = profile?.full_name || user?.email?.split("@")[0] || "User";
    const displayEmail = user?.email || "";
    const avatarUrl = profile?.avatar_url || null;
    const tierLabel = credits.tier === "pro" ? "Pro" : credits.tier === "team" ? "Team" : "Free";

    if (isLoading) {
        return (
            <div className="min-h-screen bg-morph-bg flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 animate-spin text-morph-accent" />
                    <p className="text-morph-text-muted">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-morph-bg flex">
            {/* Mobile Sidebar Backdrop */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-morph-bg-secondary border-r border-morph-border transform transition-transform lg:transform-none ${isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
                    }`}
            >
                <div className="flex flex-col h-full">
                    {/* Logo */}
                    <div className="p-6 flex items-center justify-between">
                        <Link href="/" className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-morph-accent to-morph-secondary flex items-center justify-center">
                                <Sparkles className="w-4 h-4 text-white" />
                            </div>
                            <span className="text-xl font-bold font-[family-name:var(--font-space-grotesk)]">
                                Morph
                            </span>
                        </Link>
                        <button
                            onClick={() => setIsSidebarOpen(false)}
                            className="lg:hidden text-morph-text-muted hover:text-morph-text"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* New Generation Button */}
                    <div className="px-4 mb-6">
                        <Link
                            href="/dashboard"
                            className="btn-primary w-full flex items-center justify-center gap-2 text-sm"
                        >
                            <Plus className="w-4 h-4" />
                            New Generation
                        </Link>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-4 space-y-1">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${isActive
                                            ? "bg-morph-accent/10 text-morph-accent"
                                            : "text-morph-text-muted hover:text-morph-text hover:bg-morph-bg/50"
                                        }`}
                                >
                                    <item.icon className="w-5 h-5" />
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Credits Card */}
                    <div className="p-4">
                        <div className="glass rounded-xl p-4">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-sm text-morph-text-muted">Daily Credits</span>
                                <span className="px-2 py-0.5 rounded-full text-xs bg-morph-accent/20 text-morph-accent">
                                    {tierLabel}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 mb-2">
                                <Sparkles className="w-5 h-5 text-morph-secondary" />
                                <span className="text-2xl font-bold text-morph-text">
                                    {credits.remaining}
                                </span>
                                <span className="text-morph-text-muted">/ {credits.dailyLimit}</span>
                            </div>
                            {/* Progress bar */}
                            <div className="w-full h-1.5 bg-morph-border rounded-full mb-3 overflow-hidden">
                                <div
                                    className="h-full bg-morph-secondary rounded-full transition-all"
                                    style={{ width: `${(credits.remaining / credits.dailyLimit) * 100}%` }}
                                />
                            </div>
                            <Link
                                href="/#pricing"
                                className="flex items-center justify-center gap-2 w-full py-2 rounded-lg bg-morph-bg border border-morph-border text-sm text-morph-text-muted hover:text-morph-text hover:border-morph-accent transition-colors"
                            >
                                <CreditCard className="w-4 h-4" />
                                {credits.tier === "free" ? "Join Pro Waitlist" : "Manage Plan"}
                            </Link>
                        </div>
                    </div>

                    {/* User */}
                    <div className="p-4 border-t border-morph-border">
                        <div className="flex items-center gap-3">
                            {avatarUrl ? (
                                <Image
                                    src={avatarUrl}
                                    alt={displayName}
                                    width={40}
                                    height={40}
                                    className="w-10 h-10 rounded-full object-cover"
                                />
                            ) : (
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-morph-accent to-morph-secondary flex items-center justify-center text-white font-bold">
                                    {displayName.charAt(0).toUpperCase()}
                                </div>
                            )}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-morph-text truncate">
                                    {displayName}
                                </p>
                                <p className="text-xs text-morph-text-muted truncate">
                                    {displayEmail}
                                </p>
                            </div>
                            <button
                                onClick={handleLogout}
                                disabled={isLoggingOut}
                                className="text-morph-text-muted hover:text-morph-text disabled:opacity-50"
                                title="Sign out"
                            >
                                {isLoggingOut ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <LogOut className="w-5 h-5" />
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Mobile Header */}
                <header className="lg:hidden flex items-center justify-between p-4 border-b border-morph-border">
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="text-morph-text"
                    >
                        <Menu className="w-6 h-6" />
                    </button>
                    <Link href="/" className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-morph-accent to-morph-secondary flex items-center justify-center">
                            <Sparkles className="w-4 h-4 text-white" />
                        </div>
                    </Link>
                    {avatarUrl ? (
                        <Image
                            src={avatarUrl}
                            alt={displayName}
                            width={32}
                            height={32}
                            className="w-8 h-8 rounded-full object-cover"
                        />
                    ) : (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-morph-accent to-morph-secondary flex items-center justify-center text-white text-sm font-bold">
                            {displayName.charAt(0).toUpperCase()}
                        </div>
                    )}
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-auto">{children}</main>
            </div>
        </div>
    );
}
