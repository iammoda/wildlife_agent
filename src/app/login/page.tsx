"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SquirrelLogo } from "@/components/ui/SquirrelLogo";
import { LoginForm } from "@/components/auth/LoginForm";
import { useAuth } from "@/hooks/useAuth";

export default function LoginPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setErrorMessage(params.get("error"));
  }, []);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace(user?.accountSetupCompleted ? "/" : "/activate-account");
    }
  }, [isAuthenticated, isLoading, router, user?.accountSetupCompleted]);

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: "var(--color-bg-primary)" }}
    >
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div
            className="flex justify-center mb-4"
            style={{ color: "var(--color-brand-primary)" }}
          >
            <SquirrelLogo size={64} />
          </div>
          <h1
            className="text-2xl font-semibold font-title"
            style={{ color: "var(--color-text-primary)" }}
          >
            Wildlife Intake
          </h1>
          <p
            className="mt-1"
            style={{ color: "var(--color-text-secondary)" }}
          >
            Sign in to continue
          </p>
        </div>
        <div
          className="rounded-2xl p-6"
          style={{
            backgroundColor: "var(--color-bg-card)",
            boxShadow: "var(--shadow-md)",
            border: "1px solid var(--color-border)",
          }}
        >
          {errorMessage ? (
            <div
              className="mb-4 rounded-xl px-4 py-3 text-sm"
              style={{
                backgroundColor: "rgba(197, 69, 69, 0.12)",
                color: "var(--color-error)",
                border: "1px solid rgba(197, 69, 69, 0.28)",
              }}
            >
              {errorMessage}
            </div>
          ) : null}
          <LoginForm
            onSuccess={() => {
              router.replace("/");
              router.refresh();
            }}
          />
        </div>
        <p
          className="text-center text-xs mt-8"
          style={{ color: "var(--color-text-muted)" }}
        >
          &copy; {new Date().getFullYear()} Wildlife Intake. All rights reserved.
        </p>
      </div>
    </div>
  );
}
