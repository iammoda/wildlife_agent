"use client";

import { SquirrelLogo } from "@/components/ui/SquirrelLogo";

interface GreetingHeaderProps {
  userName: string;
  onSettingsClick: () => void;
}

export function GreetingHeader({
  userName,
  onSettingsClick,
}: GreetingHeaderProps) {
  return (
    <header 
      className="flex items-center justify-between px-6 py-4"
      style={{ backgroundColor: "var(--color-bg-primary)" }}
    >
      <div className="flex items-center gap-3">
        {/* Squirrel logo with circular green background */}
        <div 
          className="p-2 rounded-full"
          style={{ 
            backgroundColor: "var(--color-brand-light)",
            color: "var(--color-brand-primary)"
          }}
        >
          <SquirrelLogo size={24} />
        </div>
        <div>
          <h1
            className="text-base font-semibold"
            style={{ color: "var(--color-text-primary)" }}
          >
            Wildlife Intake
          </h1>
        </div>
      </div>
      <button
        onClick={onSettingsClick}
        className="p-2.5 rounded-xl transition-all duration-200"
        style={{ color: "var(--color-text-secondary)" }}
        onMouseOver={(e) => {
          e.currentTarget.style.color = "var(--color-brand-primary)";
          e.currentTarget.style.backgroundColor = "var(--color-brand-light)";
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.color = "var(--color-text-secondary)";
          e.currentTarget.style.backgroundColor = "transparent";
        }}
        aria-label="Settings"
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
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      </button>
    </header>
  );
}
