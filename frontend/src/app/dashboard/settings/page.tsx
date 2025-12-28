"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
    User,
    Mail,
    CreditCard,
    Palette,
    Bell,
    Shield,
    Sparkles,
    Check,
    ChevronRight,
    Upload,
} from "lucide-react";

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState("account");

    const tabs = [
        { id: "account", label: "Account", icon: User },
        { id: "billing", label: "Billing", icon: CreditCard },
        { id: "brand", label: "Brand Kit", icon: Palette },
        { id: "notifications", label: "Notifications", icon: Bell },
    ];

    return (
        <div className="p-6 lg:p-10 max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold font-[family-name:var(--font-space-grotesk)] mb-2">
                    Settings
                </h1>
                <p className="text-morph-text-muted">
                    Manage your account and preferences
                </p>
            </div>

            {/* Tabs */}
            <div className="flex flex-wrap gap-2 mb-8 p-1 rounded-xl bg-morph-bg-secondary">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id
                                ? "bg-morph-accent text-white"
                                : "text-morph-text-muted hover:text-morph-text"
                            }`}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
            >
                {activeTab === "account" && (
                    <div className="space-y-6">
                        {/* Profile Section */}
                        <div className="glass rounded-xl p-6">
                            <h2 className="text-lg font-bold mb-4">Profile</h2>
                            <div className="flex items-start gap-6">
                                <div className="relative">
                                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-morph-accent to-morph-secondary flex items-center justify-center text-white text-2xl font-bold">
                                        D
                                    </div>
                                    <button className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-morph-bg-secondary border border-morph-border flex items-center justify-center hover:border-morph-accent transition-colors">
                                        <Upload className="w-4 h-4 text-morph-text-muted" />
                                    </button>
                                </div>
                                <div className="flex-1 space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-morph-text-muted mb-2">
                                            Name
                                        </label>
                                        <input
                                            type="text"
                                            defaultValue="Demo User"
                                            className="w-full px-4 py-3 rounded-xl bg-morph-bg border border-morph-border text-morph-text focus:outline-none focus:border-morph-accent transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-morph-text-muted mb-2">
                                            Email
                                        </label>
                                        <input
                                            type="email"
                                            defaultValue="demo@morph.ai"
                                            className="w-full px-4 py-3 rounded-xl bg-morph-bg border border-morph-border text-morph-text focus:outline-none focus:border-morph-accent transition-colors"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="mt-6 pt-6 border-t border-morph-border flex justify-end">
                                <button className="btn-primary">Save Changes</button>
                            </div>
                        </div>

                        {/* Security Section */}
                        <div className="glass rounded-xl p-6">
                            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <Shield className="w-5 h-5 text-morph-accent" />
                                Security
                            </h2>
                            <div className="space-y-4">
                                <button className="w-full flex items-center justify-between p-4 rounded-xl bg-morph-bg border border-morph-border hover:border-morph-accent transition-colors">
                                    <div className="flex items-center gap-3">
                                        <Mail className="w-5 h-5 text-morph-text-muted" />
                                        <div className="text-left">
                                            <p className="font-medium">Change Password</p>
                                            <p className="text-sm text-morph-text-muted">
                                                Update your password
                                            </p>
                                        </div>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-morph-text-muted" />
                                </button>
                            </div>
                        </div>

                        {/* Danger Zone */}
                        <div className="glass rounded-xl p-6 border-red-500/30">
                            <h2 className="text-lg font-bold mb-4 text-red-400">Danger Zone</h2>
                            <p className="text-sm text-morph-text-muted mb-4">
                                Once you delete your account, there is no going back.
                            </p>
                            <button className="px-4 py-2 rounded-lg border border-red-500/50 text-red-400 hover:bg-red-500/10 transition-colors">
                                Delete Account
                            </button>
                        </div>
                    </div>
                )}

                {activeTab === "billing" && (
                    <div className="space-y-6">
                        {/* Current Plan */}
                        <div className="glass rounded-xl p-6">
                            <h2 className="text-lg font-bold mb-4">Current Plan</h2>
                            <div className="flex items-center justify-between p-4 rounded-xl bg-morph-bg border border-morph-border">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-morph-accent/20 flex items-center justify-center">
                                        <Sparkles className="w-6 h-6 text-morph-accent" />
                                    </div>
                                    <div>
                                        <p className="font-bold">Free Plan</p>
                                        <p className="text-sm text-morph-text-muted">
                                            3 generations per month
                                        </p>
                                    </div>
                                </div>
                                <button className="btn-primary">Upgrade to Pro</button>
                            </div>
                        </div>

                        {/* Usage */}
                        <div className="glass rounded-xl p-6">
                            <h2 className="text-lg font-bold mb-4">Usage This Month</h2>
                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between mb-2">
                                        <span className="text-sm text-morph-text-muted">
                                            Generations
                                        </span>
                                        <span className="text-sm font-medium">2 / 3</span>
                                    </div>
                                    <div className="h-2 bg-morph-bg rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-morph-accent rounded-full"
                                            style={{ width: "66%" }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Pro Features */}
                        <div className="glass rounded-xl p-6 border-morph-accent/30">
                            <h2 className="text-lg font-bold mb-4">Upgrade to Pro</h2>
                            <ul className="space-y-3 mb-6">
                                {[
                                    "Unlimited generations",
                                    "All premium layouts",
                                    "4K export quality",
                                    "No watermark",
                                    "Custom brand colors",
                                    "Priority support",
                                ].map((feature) => (
                                    <li key={feature} className="flex items-center gap-3">
                                        <Check className="w-5 h-5 text-morph-secondary" />
                                        <span>{feature}</span>
                                    </li>
                                ))}
                            </ul>
                            <div className="text-center">
                                <p className="text-3xl font-bold mb-1">
                                    $19<span className="text-lg text-morph-text-muted">/mo</span>
                                </p>
                                <p className="text-sm text-morph-text-muted mb-4">
                                    Billed monthly
                                </p>
                                <button className="btn-primary w-full">Upgrade Now</button>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === "brand" && (
                    <div className="space-y-6">
                        <div className="glass rounded-xl p-6">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-lg font-bold">Brand Kit</h2>
                                    <p className="text-sm text-morph-text-muted">
                                        Save your brand colors and logo for consistent designs
                                    </p>
                                </div>
                                <span className="px-3 py-1 rounded-full text-xs bg-morph-accent/20 text-morph-accent">
                                    Pro Feature
                                </span>
                            </div>

                            <div className="space-y-6 opacity-50 pointer-events-none">
                                {/* Logo Upload */}
                                <div>
                                    <label className="block text-sm font-medium text-morph-text-muted mb-2">
                                        Logo
                                    </label>
                                    <div className="border-2 border-dashed border-morph-border rounded-xl p-8 text-center">
                                        <Upload className="w-8 h-8 mx-auto mb-2 text-morph-text-muted" />
                                        <p className="text-sm text-morph-text-muted">
                                            Drop your logo here or click to upload
                                        </p>
                                    </div>
                                </div>

                                {/* Brand Colors */}
                                <div>
                                    <label className="block text-sm font-medium text-morph-text-muted mb-2">
                                        Brand Colors
                                    </label>
                                    <div className="grid grid-cols-3 gap-4">
                                        {["#4F46E5", "#22D3EE", "#F8FAFC"].map((color) => (
                                            <div
                                                key={color}
                                                className="flex items-center gap-3 p-3 rounded-xl bg-morph-bg border border-morph-border"
                                            >
                                                <div
                                                    className="w-8 h-8 rounded-lg"
                                                    style={{ backgroundColor: color }}
                                                />
                                                <span className="text-sm font-mono">{color}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 text-center">
                                <button className="btn-primary">Upgrade to Unlock</button>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === "notifications" && (
                    <div className="space-y-6">
                        <div className="glass rounded-xl p-6">
                            <h2 className="text-lg font-bold mb-6">Email Notifications</h2>
                            <div className="space-y-4">
                                {[
                                    {
                                        label: "Generation complete",
                                        description: "Get notified when your design is ready",
                                        enabled: true,
                                    },
                                    {
                                        label: "Weekly digest",
                                        description: "Summary of your activity and tips",
                                        enabled: false,
                                    },
                                    {
                                        label: "Product updates",
                                        description: "New features and improvements",
                                        enabled: true,
                                    },
                                    {
                                        label: "Marketing emails",
                                        description: "Tips, tutorials, and promotions",
                                        enabled: false,
                                    },
                                ].map((notification) => (
                                    <div
                                        key={notification.label}
                                        className="flex items-center justify-between p-4 rounded-xl bg-morph-bg border border-morph-border"
                                    >
                                        <div>
                                            <p className="font-medium">{notification.label}</p>
                                            <p className="text-sm text-morph-text-muted">
                                                {notification.description}
                                            </p>
                                        </div>
                                        <button
                                            className={`relative w-12 h-6 rounded-full transition-colors ${notification.enabled
                                                    ? "bg-morph-accent"
                                                    : "bg-morph-border"
                                                }`}
                                        >
                                            <span
                                                className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${notification.enabled ? "left-7" : "left-1"
                                                    }`}
                                            />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </motion.div>
        </div>
    );
}
