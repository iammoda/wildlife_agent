"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SquirrelLogo } from "@/components/ui/SquirrelLogo";
import { LoginForm } from "@/components/auth/LoginForm";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { useAuth } from "@/hooks/useAuth";

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [isRegistering, setIsRegistering] = useState(false);
  const [showConfirmationNotice, setShowConfirmationNotice] = useState(false);

  const handleSuccess = () => {
    router.replace("/");
    router.refresh();
  };

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/");
    }
  }, [isAuthenticated, isLoading, router]);

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
            {isRegistering ? "Create your account" : "Sign in to continue"}
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
          {showConfirmationNotice ? (
            <div className="space-y-3 text-center">
              <h2
                className="text-lg font-semibold"
                style={{ color: "var(--color-text-primary)" }}
              >
                Thanks for creating your account
              </h2>
              <p
                className="text-sm"
                style={{ color: "var(--color-text-secondary)" }}
              >
                Check your email to confirm your setup. After confirming, you
                can sign in.
              </p>
              <button
                type="button"
                onClick={() => {
                  setShowConfirmationNotice(false);
                  setIsRegistering(false);
                }}
                className="text-sm"
                style={{ color: "var(--color-brand-primary)" }}
              >
                Back to sign in
              </button>
            </div>
          ) : isRegistering ? (
            <RegisterForm
              onSuccess={(result) => {
                if (result?.needsConfirmation) {
                  setShowConfirmationNotice(true);
                  return;
                }
                handleSuccess();
              }}
              onSwitchToLogin={() => setIsRegistering(false)}
            />
          ) : (
            <LoginForm
              onSuccess={handleSuccess}
              onSwitchToRegister={() => setIsRegistering(true)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
