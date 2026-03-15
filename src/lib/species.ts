const SQUIRREL_TYPE_PATTERNS = [
  {
    label: "Flying Squirrel",
    pattern: /\bflying squirrel(s)?\b/i,
    shortPattern: /^flying$/i,
  },
  {
    label: "Fox Squirrel",
    pattern: /\bfox squirrel(s)?\b/i,
    shortPattern: /^fox$/i,
  },
  {
    label: "Eastern Grey Squirrel",
    pattern: /\beastern gr(?:a|e)y squirrel(s)?\b/i,
    shortPattern: /^eastern gr(?:a|e)y$/i,
  },
  {
    label: "Ground Squirrel",
    pattern: /\bground squirrel(s)?\b/i,
    shortPattern: /^ground$/i,
  },
] as const;

function normalizeSpeciesValue(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export function isGenericSquirrelSpecies(species: unknown): boolean {
  if (typeof species !== "string") {
    return false;
  }

  const normalized = normalizeSpeciesValue(species);
  return normalized === "squirrel" || normalized === "squirrels";
}

export function requiresSpeciesClarification(species: unknown): boolean {
  if (typeof species !== "string" || !species.trim()) {
    return false;
  }

  return isGenericSquirrelSpecies(species);
}

export function resolveSpecificSquirrelSpecies(text: unknown): string | null {
  if (typeof text !== "string" || !text.trim()) {
    return null;
  }

  const normalized = text.trim().replace(/[.,!?]/g, "");

  for (const option of SQUIRREL_TYPE_PATTERNS) {
    if (
      option.pattern.test(normalized) ||
      option.shortPattern.test(normalized)
    ) {
      return option.label;
    }
  }

  return null;
}

export function getSpeciesClarificationMessage(species: unknown): string | null {
  if (!requiresSpeciesClarification(species)) {
    return null;
  }

  return "What type of squirrel is it? Please specify: flying squirrel, fox squirrel, eastern grey squirrel, or ground squirrel.";
}
