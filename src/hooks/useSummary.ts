"use client";

import { useState, useEffect, useCallback } from "react";
import { SummaryStats } from "@/lib/types";

export function useSummary() {
  const [stats, setStats] = useState<SummaryStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/analytics/summary");
      const data = await res.json();
      if (data.success) {
        setStats(data.data);
      } else {
        setError(data.error || "Failed to fetch summary");
      }
    } catch {
      setError("Failed to fetch summary");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return {
    stats,
    isLoading,
    error,
    refresh: fetchSummary,
  };
}
