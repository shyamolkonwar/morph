"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
    FolderOpen,
    Search,
    Filter,
    MoreVertical,
    Trash2,
    Download,
    Copy,
    Linkedin,
    Youtube,
    Twitter,
    Clock,
} from "lucide-react";

// Mock projects data
const MOCK_PROJECTS = [
    {
        id: "1",
        title: "Series A Announcement",
        type: "linkedin_banner",
        status: "completed",
        createdAt: "2024-12-28T10:00:00Z",
        thumbnail: "from-indigo-600 via-purple-600 to-pink-500",
        headline: "We've Raised $15M",
    },
    {
        id: "2",
        title: "React Tutorial Thumbnail",
        type: "youtube_thumbnail",
        status: "completed",
        createdAt: "2024-12-27T15:30:00Z",
        thumbnail: "from-red-600 via-orange-500 to-yellow-500",
        headline: "React in 2024",
    },
    {
        id: "3",
        title: "Productivity Tips Carousel",
        type: "linkedin_carousel",
        status: "completed",
        createdAt: "2024-12-26T09:15:00Z",
        thumbnail: "from-emerald-600 via-teal-600 to-cyan-500",
        headline: "5 Tips for 10x",
    },
    {
        id: "4",
        title: "Product Launch",
        type: "twitter_post",
        status: "generating",
        createdAt: "2024-12-28T11:45:00Z",
        thumbnail: "from-blue-600 via-cyan-500 to-teal-500",
        headline: "Launching Soon",
    },
];

const PLATFORM_ICONS: Record<string, typeof Linkedin> = {
    linkedin_banner: Linkedin,
    linkedin_carousel: Linkedin,
    youtube_thumbnail: Youtube,
    twitter_post: Twitter,
};

const PLATFORM_LABELS: Record<string, string> = {
    linkedin_banner: "LinkedIn Banner",
    linkedin_carousel: "LinkedIn Carousel",
    youtube_thumbnail: "YouTube Thumbnail",
    twitter_post: "X Post",
};

export default function ProjectsPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [filter, setFilter] = useState("all");
    const [activeMenu, setActiveMenu] = useState<string | null>(null);

    const filteredProjects = MOCK_PROJECTS.filter((project) => {
        const matchesSearch = project.title
            .toLowerCase()
            .includes(searchQuery.toLowerCase());
        const matchesFilter = filter === "all" || project.type.includes(filter);
        return matchesSearch && matchesFilter;
    });

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffHours < 1) return "Just now";
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    return (
        <div className="p-6 lg:p-10">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold font-[family-name:var(--font-space-grotesk)] mb-2">
                        Your Projects
                    </h1>
                    <p className="text-morph-text-muted">
                        {MOCK_PROJECTS.length} projects created
                    </p>
                </div>
                <Link href="/dashboard" className="btn-primary">
                    + New Project
                </Link>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
                {/* Search */}
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-morph-text-muted" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search projects..."
                        className="w-full pl-12 pr-4 py-3 rounded-xl bg-morph-bg-secondary border border-morph-border text-morph-text placeholder:text-morph-text-muted focus:outline-none focus:border-morph-accent transition-colors"
                    />
                </div>

                {/* Filter Dropdown */}
                <div className="relative">
                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="appearance-none px-4 py-3 pr-10 rounded-xl bg-morph-bg-secondary border border-morph-border text-morph-text focus:outline-none focus:border-morph-accent transition-colors cursor-pointer"
                    >
                        <option value="all">All Types</option>
                        <option value="linkedin">LinkedIn</option>
                        <option value="youtube">YouTube</option>
                        <option value="twitter">Twitter/X</option>
                    </select>
                    <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-morph-text-muted pointer-events-none" />
                </div>
            </div>

            {/* Projects Grid */}
            {filteredProjects.length > 0 ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredProjects.map((project, index) => {
                        const PlatformIcon = PLATFORM_ICONS[project.type] || Linkedin;
                        return (
                            <motion.div
                                key={project.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="group glass rounded-xl overflow-hidden"
                            >
                                {/* Thumbnail */}
                                <div
                                    className={`relative aspect-video bg-gradient-to-br ${project.thumbnail} p-4 flex items-end`}
                                >
                                    {/* Status Badge */}
                                    {project.status === "generating" && (
                                        <div className="absolute top-3 left-3 px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-400 text-xs font-medium flex items-center gap-1">
                                            <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                                            Generating
                                        </div>
                                    )}

                                    {/* Preview Text */}
                                    <div className="bg-black/30 backdrop-blur-sm rounded-lg px-3 py-2">
                                        <p className="text-white font-bold text-sm truncate">
                                            {project.headline}
                                        </p>
                                    </div>

                                    {/* Hover Actions */}
                                    <div className="absolute inset-0 bg-morph-bg/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                        <button className="p-2.5 rounded-lg bg-morph-accent text-white hover:bg-morph-accent-light transition-colors">
                                            <Download className="w-5 h-5" />
                                        </button>
                                        <button className="p-2.5 rounded-lg bg-morph-bg-secondary border border-morph-border text-morph-text hover:border-morph-accent transition-colors">
                                            <Copy className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>

                                {/* Info */}
                                <div className="p-4">
                                    <div className="flex items-start justify-between gap-2 mb-2">
                                        <h3 className="font-medium text-morph-text truncate">
                                            {project.title}
                                        </h3>
                                        <div className="relative">
                                            <button
                                                onClick={() =>
                                                    setActiveMenu(activeMenu === project.id ? null : project.id)
                                                }
                                                className="p-1 rounded hover:bg-morph-bg-secondary text-morph-text-muted hover:text-morph-text transition-colors"
                                            >
                                                <MoreVertical className="w-4 h-4" />
                                            </button>

                                            {/* Dropdown Menu */}
                                            {activeMenu === project.id && (
                                                <div className="absolute right-0 top-full mt-1 w-36 py-1 rounded-lg bg-morph-bg-secondary border border-morph-border shadow-xl z-10">
                                                    <button className="w-full px-3 py-2 text-left text-sm text-morph-text hover:bg-morph-bg flex items-center gap-2">
                                                        <Download className="w-4 h-4" />
                                                        Download
                                                    </button>
                                                    <button className="w-full px-3 py-2 text-left text-sm text-morph-text hover:bg-morph-bg flex items-center gap-2">
                                                        <Copy className="w-4 h-4" />
                                                        Duplicate
                                                    </button>
                                                    <button className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-morph-bg flex items-center gap-2">
                                                        <Trash2 className="w-4 h-4" />
                                                        Delete
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-1.5 text-morph-text-muted">
                                            <PlatformIcon className="w-4 h-4" />
                                            <span>{PLATFORM_LABELS[project.type]}</span>
                                        </div>
                                        <div className="flex items-center gap-1 text-morph-text-muted">
                                            <Clock className="w-3.5 h-3.5" />
                                            <span>{formatDate(project.createdAt)}</span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            ) : (
                <div className="text-center py-16">
                    <div className="w-20 h-20 rounded-2xl bg-morph-bg-secondary border border-morph-border flex items-center justify-center mx-auto mb-6">
                        <FolderOpen className="w-10 h-10 text-morph-text-muted" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">No projects found</h3>
                    <p className="text-morph-text-muted max-w-md mx-auto mb-6">
                        {searchQuery
                            ? "Try adjusting your search or filter criteria"
                            : "Create your first project to get started"}
                    </p>
                    <Link href="/dashboard" className="btn-primary inline-flex">
                        Create First Project
                    </Link>
                </div>
            )}
        </div>
    );
}
