"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { SquirrelLogo } from "@/components/ui/SquirrelLogo";
import { useAuth } from "@/hooks/useAuth";

export default function ActivateAccountPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }

    if (user?.accountSetupCompleted) {
      router.replace("/");
    }
  }, [isAuthenticated, isLoading, router, user?.accountSetupCompleted]);

  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "var(--color-bg-primary)" }}
      >
        <span style={{ color: "var(--color-text-secondary)" }}>Loading...</span>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  if (user.accountSetupCompleted) {
    return null;
  }

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
            Create Your Account
          </h1>
          <p
            className="mt-1"
            style={{ color: "var(--color-text-secondary)" }}
          >
            Finish setting up your invited account to access Wildlife Intake.
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
          <RegisterForm
            email={user.email || ""}
            initialName={user.profileName}
            onSuccess={() => {
              router.replace("/");
              router.refresh();
            }}
          />
        </div>
      </div>
    </div>
  );
}
