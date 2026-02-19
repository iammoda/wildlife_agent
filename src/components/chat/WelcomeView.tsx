"use client";

import { SquirrelLogo } from "@/components/ui/SquirrelLogo";

interface WelcomeViewProps {
  userName: string;
  onSettingsClick: () => void;
}

export function WelcomeView({ userName, onSettingsClick }: WelcomeViewProps) {
  return (
    <>
      {/* Settings button in top right - fixed position */}
      <div className="fixed top-4 right-4 z-10">
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
      </div>

      {/* Greeting content - centered */}
      <div className="flex flex-col items-center mb-6">
        {/* Squirrel icon */}
        <div
          className="mb-4"
          style={{ color: "var(--color-brand-primary)" }}
        >
          <SquirrelLogo size={94.5} />
        </div>
        
        {/* Greeting - Lora font */}
        <h1 
          className="text-3xl font-title font-medium text-center tracking-tight"
          style={{ color: "var(--color-text-greeting)" }}
        >
          Welcome back, {userName}
        </h1>
      </div>
    </>
  );
}
