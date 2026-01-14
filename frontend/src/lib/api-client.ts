/**
 * Authenticated API Client
 * Auto-injects Supabase JWT token into requests
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// Get backend URL from environment or default to localhost
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/**
 * Create axios instance with Supabase token interceptor
 */
export function createApiClient(): AxiosInstance {
    const client = axios.create({
        baseURL: API_BASE_URL,
        headers: {
            'Content-Type': 'application/json',
        },
    });

    // Request interceptor: inject auth token
    client.interceptors.request.use(
        async (config) => {
            try {
                const supabase = createClientComponentClient();
                const { data: { session } } = await supabase.auth.getSession();

                if (session?.access_token) {
                    config.headers.Authorization = `Bearer ${session.access_token}`;
                }
            } catch (error) {
                console.error('Failed to get auth token:', error);
            }

            return config;
        },
        (error) => Promise.reject(error)
    );

    // Response interceptor: handle auth errors
    client.interceptors.response.use(
        (response) => response,
        async (error: AxiosError) => {
            if (error.response?.status === 401) {
                // Token expired or invalid - redirect to login
                if (typeof window !== 'undefined') {
                    window.location.href = '/login?error=unauthorized';
                }
            }

            return Promise.reject(error);
        }
    );

    return client;
}

// Singleton instance
export const apiClient = createApiClient();

// ═══════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════

export interface Project {
    id: string;
    user_id: string;
    title: string;
    description: string | null;
    status: 'draft' | 'generating' | 'completed' | 'failed';
    created_at: string;
    updated_at: string;
}

export interface Generation {
    id: string;
    project_id: string;
    user_prompt: string;
    canvas_width: number;
    canvas_height: number;
    brand_colors: string[];
    status: 'pending' | 'processing' | 'completed' | 'failed';
    svg_output: string | null;
    verification_status: string | null;
    created_at: string;
}

export interface AsyncJobResponse {
    job_id: string;
    status: string;
    status_url: string;
}

export interface JobStatus {
    job_id: string;
    status: 'PENDING' | 'STARTED' | 'SUCCESS' | 'FAILURE' | 'CANCELLED';
    progress: number | null;
    step: string | null;
    result: any | null;
    error: string | null;
}

// ═══════════════════════════════════════════════════════════
// API METHODS
// ═══════════════════════════════════════════════════════════

export const api = {
    // Projects
    projects: {
        create: async (data: { title: string; description?: string }): Promise<Project> => {
            const response = await apiClient.post<Project>('/api/v1/projects', data);
            return response.data;
        },

        list: async (): Promise<Project[]> => {
            const response = await apiClient.get<Project[]>('/api/v1/projects');
            return response.data;
        },

        get: async (id: string): Promise<Project> => {
            const response = await apiClient.get<Project>(`/api/v1/projects/${id}`);
            return response.data;
        },

        listGenerations: async (id: string): Promise<Generation[]> => {
            const response = await apiClient.get<Generation[]>(`/api/v1/projects/${id}/generations`);
            return response.data;
        },
    },

    // Async Generation
    generation: {
        generateAsync: async (data: {
            project_id: string;
            prompt: string;
            canvas_width?: number;
            canvas_height?: number;
            brand_colors?: string[];
            max_iterations?: number;
        }): Promise<AsyncJobResponse> => {
            const response = await apiClient.post<AsyncJobResponse>('/api/v1/generate-async', data);
            return response.data;
        },

        getJobStatus: async (jobId: string): Promise<JobStatus> => {
            const response = await apiClient.get<JobStatus>(`/api/v1/status/${jobId}`);
            return response.data;
        },

        cancelJob: async (jobId: string): Promise<void> => {
            await apiClient.delete(`/api/v1/status/${jobId}`);
        },
    },
};
