"use client";

import { useState, useEffect, useCallback } from "react";
import { User } from "@/lib/types";

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  });

  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      if (data.success) {
        setState({
          user: data.data,
          isLoading: false,
          isAuthenticated: true,
        });
      } else {
        setState({
          user: null,
          isLoading: false,
          isAuthenticated: false,
        });
      }
    } catch {
      setState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
      });
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
      });
    } catch {
      setState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
      });
    }
  }, []);

  const refreshAuth = useCallback(() => {
    setState((prev) => ({ ...prev, isLoading: true }));
    checkAuth();
  }, [checkAuth]);

  return {
    ...state,
    logout,
    refreshAuth,
  };
}
