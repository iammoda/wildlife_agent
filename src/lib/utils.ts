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
