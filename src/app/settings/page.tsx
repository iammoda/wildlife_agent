"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { SquirrelLogo } from "@/components/ui/SquirrelLogo";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

type StatusMessage = { type: "success" | "error"; message: string } | null;

export default function SettingsPage() {
  const router = useRouter();
  const { user, isLoading, isAuthenticated, logout, refreshAuth } = useAuth();
  const [name, setName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<StatusMessage>(null);

  useEffect(() => {
    setName(user?.name || "");
  }, [user?.name]);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }

    if (user && !user.accountSetupCompleted) {
      router.replace("/activate-account");
    }
  }, [isAuthenticated, isLoading, router, user]);

  const normalizedName = useMemo(() => name.trim(), [name]);
  const isNameChanged = normalizedName !== (user?.name || "");
  const canSave = Boolean(normalizedName) && isNameChanged && !isSaving;

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const handleBack = () => {
    router.push("/");
  };

  const handleSaveProfile = async (event: FormEvent) => {
    event.preventDefault();
    if (!normalizedName) {
      setStatus({ type: "error", message: "Name cannot be empty." });
      return;
    }

    setIsSaving(true);
    setStatus(null);
    try {
      const res = await fetch("/api/auth/update-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: normalizedName }),
      });
      const data = await res.json();
      if (!data.success) {
        setStatus({
          type: "error",
          message: data.error || "Failed to update profile.",
        });
      } else {
        setStatus({
          type: "success",
          message: "Name updated successfully.",
        });
        refreshAuth();
      }
    } catch {
      setStatus({ type: "error", message: "Failed to update profile." });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || !user || !user.accountSetupCompleted) {
    return null;
  }

  return (
    <div
      className="min-h-screen relative"
      style={{ backgroundColor: "var(--color-bg-primary)" }}
    >
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle at top, rgba(74, 122, 69, 0.18), transparent 55%), radial-gradient(circle at 15% 30%, rgba(91, 139, 86, 0.15), transparent 45%)",
        }}
      />
      <header
        className="relative z-10 flex items-center gap-4 px-6 py-4 border-b"
        style={{ borderColor: "var(--color-border)" }}
      >
        <button
          onClick={handleBack}
          className="p-2 rounded-lg transition-colors"
          style={{
            backgroundColor: "var(--color-brand-light)",
            color: "var(--color-text-secondary)",
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.color = "var(--color-bg-primary)";
            e.currentTarget.style.backgroundColor =
              "var(--color-brand-primary)";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.color = "var(--color-text-secondary)";
            e.currentTarget.style.backgroundColor = "var(--color-brand-light)";
          }}
          aria-label="Back"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
        <h1 className="text-lg font-semibold font-title">Settings</h1>
      </header>

      <div className="relative z-10 max-w-2xl mx-auto p-6 space-y-6">
        <Card variant="bordered" className="space-y-4">
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 flex items-center justify-center"
              style={{ color: "var(--color-brand-primary)" }}
            >
              <SquirrelLogo size={35} />
            </div>
            <div>
              <h2 className="font-semibold text-primary">{user?.name}</h2>
              <p className="text-sm text-secondary">
                Wildlife Rehabilitator
              </p>
              {user?.email && (
                <p className="text-xs text-muted">{user.email}</p>
              )}
            </div>
          </div>
        </Card>

        <Card variant="bordered" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold">Profile</h3>
              <p className="text-sm text-secondary">
                Update how your name appears across the app.
              </p>
            </div>
          </div>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="space-y-2">
              <label
                htmlFor="display-name"
                className="text-sm"
                style={{ color: "var(--color-text-secondary)" }}
              >
                Display name
              </label>
              <input
                id="display-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="w-full px-4 py-2.5 rounded-xl input-base"
                placeholder="Your name"
              />
              <p className="text-xs text-muted">
                Keep it short and recognizable for your team.
              </p>
            </div>
            {status && (
              <div
                className="text-sm px-3 py-2 rounded-lg"
                style={{
                  backgroundColor:
                    status.type === "success"
                      ? "rgba(74, 138, 78, 0.2)"
                      : "rgba(197, 69, 69, 0.2)",
                  color:
                    status.type === "success"
                      ? "var(--color-success)"
                      : "var(--color-error)",
                  border:
                    status.type === "success"
                      ? "1px solid rgba(74, 138, 78, 0.35)"
                      : "1px solid rgba(197, 69, 69, 0.35)",
                }}
              >
                {status.message}
              </div>
            )}
            <div className="flex items-center justify-between">
              <Button
                type="submit"
                size="sm"
                isLoading={isSaving}
                disabled={!canSave}
              >
                Save changes
              </Button>
              {!isNameChanged && normalizedName && (
                <span className="text-xs text-muted">No changes</span>
              )}
            </div>
          </form>
        </Card>

        <Card variant="bordered" className="space-y-2">
          <h3 className="font-medium">About</h3>
          <p className="text-sm text-secondary">
            Wildlife Intake helps you track animal intakes, care logs, and
            outcomes for your rehabilitation work.
          </p>
          <p className="text-xs text-muted">Version 1.0.0</p>
        </Card>

        <Button onClick={handleLogout} variant="danger" className="w-full">
          Sign Out
        </Button>
      </div>
    </div>
  );
}
