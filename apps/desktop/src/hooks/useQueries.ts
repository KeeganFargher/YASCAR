/**
 * TanStack Query hooks for data fetching
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { GameTitle } from '@yascar/types';
import { UserConfig } from '@yascar/user-config';
import { fetchAvailableCodes, CodesFetchResult } from '../lib/api';
import { redeemShiftCode, RedemptionResult } from '../lib/redemption';
import { loadConfig, saveConfig } from '../lib/store';
import { ShiftCode } from '@yascar/types';

// ─────────────────────────────────────────────────────────────
// Query Keys
// ─────────────────────────────────────────────────────────────

export const queryKeys = {
    codes: (games: GameTitle[]) => ['codes', games] as const,
    config: ['config'] as const,
};

// ─────────────────────────────────────────────────────────────
// Codes Hooks
// ─────────────────────────────────────────────────────────────

export function useCodes(games: GameTitle[]) {
    return useQuery({
        queryKey: queryKeys.codes(games),
        queryFn: () => fetchAvailableCodes(games),
        staleTime: 60_000, // 1 minute
        refetchOnWindowFocus: true,
        retry: 3,
    });
}

export function useRedeemCode() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ code, isRetry = false }: { code: ShiftCode; isRetry?: boolean }) => {
            return redeemShiftCode(code, isRetry);
        },
        onSuccess: () => {
            // Invalidate codes to refetch fresh data
            queryClient.invalidateQueries({ queryKey: ['codes'] });
        },
    });
}

// ─────────────────────────────────────────────────────────────
// Config Hooks
// ─────────────────────────────────────────────────────────────

export function useConfig() {
    return useQuery({
        queryKey: queryKeys.config,
        queryFn: loadConfig,
        staleTime: Infinity, // Config doesn't change externally
    });
}

export function useUpdateConfig() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: saveConfig,
        onMutate: async (newConfig) => {
            // Cancel any outgoing refetches
            await queryClient.cancelQueries({ queryKey: queryKeys.config });

            // Snapshot the previous value
            const previousConfig = queryClient.getQueryData<UserConfig>(queryKeys.config);

            // Optimistically update
            queryClient.setQueryData(queryKeys.config, newConfig);

            return { previousConfig };
        },
        onError: (err, newConfig, context) => {
            // Rollback on error
            if (context?.previousConfig) {
                queryClient.setQueryData(queryKeys.config, context.previousConfig);
            }
        },
    });
}
