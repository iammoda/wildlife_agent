"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { SquirrelLogo } from "@/components/ui/SquirrelLogo";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function SettingsPage() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const handleBack = () => {
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-warm-sand">
      <header className="flex items-center gap-4 px-6 py-4 border-b border-soft-mist bg-white/50">
        <button
          onClick={handleBack}
          className="p-2 text-secondary-text hover:text-primary-text hover:bg-soft-mist rounded-lg transition-colors"
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
        <h1 className="text-lg font-semibold text-primary-text">Settings</h1>
      </header>
      <div className="max-w-md mx-auto p-6 space-y-6">
        <Card variant="bordered" className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-soft-mist rounded-full flex items-center justify-center">
              <SquirrelLogo size={28} />
            </div>
            <div>
              <h2 className="font-semibold text-primary-text">{user?.name}</h2>
              <p className="text-sm text-secondary-text">
                Wildlife Rehabilitator
              </p>
            </div>
          </div>
        </Card>
        <Card variant="bordered" className="space-y-2">
          <h3 className="font-medium text-primary-text">About</h3>
          <p className="text-sm text-secondary-text">
            Wildlife Intake helps you track animal intakes, care logs, and
            outcomes for your rehabilitation work.
          </p>
          <p className="text-xs text-secondary-text">Version 1.0.0</p>
        </Card>
        <Button onClick={handleLogout} variant="danger" className="w-full">
          Sign Out
        </Button>
      </div>
    </div>
  );
}
