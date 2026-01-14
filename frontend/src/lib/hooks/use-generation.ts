/**
 * React Query hooks for async banner generation
 */

import { useMutation, useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { api, AsyncJobResponse, JobStatus, Project, Generation } from '../api-client';

// ═══════════════════════════════════════════════════════════
// PROJECTS
// ═══════════════════════════════════════════════════════════

export function useProjects() {
    return useQuery({
        queryKey: ['projects'],
        queryFn: () => api.projects.list(),
    });
}

export function useProject(id: string) {
    return useQuery({
        queryKey: ['projects', id],
        queryFn: () => api.projects.get(id),
        enabled: !!id,
    });
}

export function useProjectGenerations(projectId: string) {
    return useQuery({
        queryKey: ['projects', projectId, 'generations'],
        queryFn: () => api.projects.listGenerations(projectId),
        enabled: !!projectId,
    });
}

export function useCreateProject() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: { title: string; description?: string }) =>
            api.projects.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projects'] });
        },
    });
}

// ═══════════════════════════════════════════════════════════
// ASYNC GENERATION
// ═══════════════════════════════════════════════════════════

export function useGenerateAsync() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: {
            project_id: string;
            prompt: string;
            canvas_width?: number;
            canvas_height?: number;
            brand_colors?: string[];
            max_iterations?: number;
        }) => api.generation.generateAsync(data),
        onSuccess: (_data, variables) => {
            // Invalidate project generations list
            queryClient.invalidateQueries({
                queryKey: ['projects', variables.project_id, 'generations'],
            });
        },
    });
}

// ═══════════════════════════════════════════════════════════
// JOB STATUS POLLING
// ═══════════════════════════════════════════════════════════

export function useJobStatus(
    jobId: string | null,
    options?: Partial<UseQueryOptions<JobStatus>>
) {
    return useQuery({
        queryKey: ['jobs', jobId],
        queryFn: () => api.generation.getJobStatus(jobId!),
        enabled: !!jobId,
        refetchInterval: (data) => {
            // Stop polling if job is completed
            if (data?.status === 'SUCCESS' || data?.status === 'FAILURE' || data?.status === 'CANCELLED') {
                return false;
            }
            // Poll every 2 seconds while job is active
            return 2000;
        },
        ...options,
    });
}

export function useCancelJob() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (jobId: string) => api.generation.cancelJob(jobId),
        onSuccess: (_data, jobId) => {
            queryClient.invalidateQueries({ queryKey: ['jobs', jobId] });
        },
    });
}
