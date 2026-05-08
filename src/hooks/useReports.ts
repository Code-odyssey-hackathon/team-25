"use client";

// =============================================================================
// JanaVaani — Reports Data Hook
// Fetches, filters, and manages report data from Supabase
// =============================================================================

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Report, ReportFilters } from "@/types";

interface UseReportsReturn {
  reports: Report[];
  isLoading: boolean;
  error: string | null;
  total: number;
  refetch: () => Promise<void>;
}

export function useReports(filters?: ReportFilters): UseReportsReturn {
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  const supabase = createClient();

  const fetchReports = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      let query = supabase
        .from("reports")
        .select("*, profiles!reports_user_id_fkey(full_name, avatar_url)", {
          count: "exact",
        });

      // Apply filters
      if (filters?.category) {
        query = query.eq("category", filters.category);
      }
      if (filters?.status) {
        query = query.eq("status", filters.status);
      }
      if (filters?.ward) {
        query = query.eq("ward", filters.ward);
      }
      if (filters?.search) {
        query = query.or(
          `title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
        );
      }

      // Sorting
      const sortBy = filters?.sortBy || "created_at";
      const sortOrder = filters?.sortOrder || "desc";
      query = query.order(sortBy, { ascending: sortOrder === "asc" });

      // Pagination
      const page = filters?.page || 1;
      const pageSize = filters?.pageSize || 20;
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error: fetchError, count } = await query;

      if (fetchError) throw fetchError;

      setReports((data as Report[]) || []);
      setTotal(count || 0);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to fetch reports";
      setError(msg);
      console.error("useReports error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [supabase, filters]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // Real-time subscription for live updates
  useEffect(() => {
    const channel = supabase
      .channel("reports-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "reports" },
        () => {
          fetchReports();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, fetchReports]);

  return { reports, isLoading, error, total, refetch: fetchReports };
}
