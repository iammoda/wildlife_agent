export function generateId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `id_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export function formatDateTime(input: string | Date) {
  const date = typeof input === "string" ? new Date(input) : input;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function formatDate(input: string | Date) {
  const date = typeof input === "string" ? new Date(input) : input;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function incrementIntakeNumber(lastNumber: string) {
  const match = lastNumber.match(/^(\d{4})-(\d{3,})$/);
  const year = new Date().getFullYear();
  if (!match) {
    return `${year}-001`;
  }
  const parsedYear = Number(match[1]);
  const sequence = Number(match[2]);
  if (Number.isNaN(parsedYear) || Number.isNaN(sequence)) {
    return `${year}-001`;
  }
  if (parsedYear !== year) {
    return `${year}-001`;
  }
  const nextSequence = sequence + 1;
  return `${year}-${nextSequence.toString().padStart(match[2].length, "0")}`;
}

export function normalizeIntakeNumber(input: string, year?: number): string {
  const currentYear = year || new Date().getFullYear();
  const trimmed = input.trim();

  if (/^\d{4}-\d{3,}$/.test(trimmed)) {
    return trimmed;
  }

  const yearMatch = trimmed.match(/^(\d{4})-(\d+)$/);
  if (yearMatch) {
    return `${yearMatch[1]}-${yearMatch[2].padStart(3, "0")}`;
  }

  if (/^\d+$/.test(trimmed)) {
    return `${currentYear}-${trimmed.padStart(3, "0")}`;
  }

  return trimmed;
}

export function parseWeightToGrams(
  weightStr: string | null | undefined
): number | null {
  if (!weightStr) return null;

  const normalized = weightStr.toLowerCase().trim();
  const match = normalized.match(
    /^([\d.]+)\s*(g|grams?|oz|ounces?|lbs?|pounds?|kg|kilograms?)?$/i
  );

  if (!match) return null;

  const value = parseFloat(match[1]);
  if (Number.isNaN(value)) return null;

  const unit = match[2]?.toLowerCase() || "g";

  switch (unit) {
    case "g":
    case "gram":
    case "grams":
      return value;
    case "oz":
    case "ounce":
    case "ounces":
      return Math.round(value * 28.35 * 10) / 10;
    case "lb":
    case "lbs":
    case "pound":
    case "pounds":
      return Math.round(value * 453.59 * 10) / 10;
    case "kg":
    case "kilogram":
    case "kilograms":
      return value * 1000;
    default:
      return value;
  }
}

export function formatWeight(grams: number): string {
  if (grams >= 1000) {
    return `${(grams / 1000).toFixed(2)} kg`;
  }
  return `${Math.round(grams)} g`;
}
