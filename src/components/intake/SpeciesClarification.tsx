"use client";

import { useState } from "react";

interface SpeciesClarificationProps {
  question: string;
  options: string[];
  onSelect: (species: string) => void;
}

export function SpeciesClarification({
  question,
  options,
  onSelect,
}: SpeciesClarificationProps) {
  const [selected, setSelected] = useState<string | null>(null);

  const handleSelect = (species: string) => {
    if (selected) return;
    setSelected(species);
    onSelect(species);
  };

  return (
    <div className="animate-fadeIn">
      <p
        className="text-sm mb-2.5"
        style={{ color: "var(--color-text-secondary)" }}
      >
        {question}
      </p>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const isSelected = selected === option;
          const isDimmed = selected !== null && !isSelected;
          return (
            <button
              key={option}
              onClick={() => handleSelect(option)}
              disabled={isDimmed}
              className="px-4 py-2 rounded-full text-sm font-medium transition-all"
              style={{
                backgroundColor: isSelected
                  ? "var(--color-brand-primary)"
                  : "var(--color-bg-tertiary)",
                color: isSelected
                  ? "#ffffff"
                  : "var(--color-text-primary)",
                opacity: isDimmed ? 0.35 : 1,
                cursor: isDimmed ? "default" : "pointer",
                transform: isSelected ? "scale(1.02)" : undefined,
              }}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}
