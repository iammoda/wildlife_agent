import { requiresSpeciesClarification } from "@/lib/species";

export const SEX_OPTIONS = ["Unknown", "Male", "Female"] as const;

export const INTAKE_REASON_OPTIONS = [
  "Unknown",
  "Injured",
  "Orphaned",
  "Sick",
  "Nuisance",
  "Other",
] as const;

export const DISPOSITION_UNDER_CASE = "UNDER_CASE";
export const DISPOSITION_RELEASED = "RELEASED";
export const DISPOSITION_TRANSFERRED = "TRANSFERRED";
export const DISPOSITION_DECEASED = "DECEASED";
export const DISPOSITION_EUTHANIZED = "EUTHANIZED";
export const DISPOSITION_PERM_NON_RELEASABLE = "PERM_NON_RELEASABLE";

export const DEFAULT_DISPOSITION = DISPOSITION_UNDER_CASE;

export const DISPOSITION_CODES = {
  [DISPOSITION_UNDER_CASE]: {
    shortTitle: "Under Case",
    isPositive: true,
  },
  [DISPOSITION_RELEASED]: {
    shortTitle: "Released",
    isPositive: true,
  },
  [DISPOSITION_TRANSFERRED]: {
    shortTitle: "Transferred",
    isPositive: true,
  },
  [DISPOSITION_DECEASED]: {
    shortTitle: "Deceased",
    isPositive: false,
  },
  [DISPOSITION_EUTHANIZED]: {
    shortTitle: "Euthanized",
    isPositive: false,
  },
  [DISPOSITION_PERM_NON_RELEASABLE]: {
    shortTitle: "Permanently Non Releasable",
    isPositive: true,
  },
} as const;

export const DISPOSITION_OPTIONS = [
  DISPOSITION_UNDER_CASE,
  DISPOSITION_RELEASED,
  DISPOSITION_TRANSFERRED,
  DISPOSITION_DECEASED,
  DISPOSITION_EUTHANIZED,
  DISPOSITION_PERM_NON_RELEASABLE,
] as const;

export const DISPOSITION_LABELS = DISPOSITION_OPTIONS.map(
  (code) => DISPOSITION_CODES[code].shortTitle
);

const DISPOSITION_ALIASES: Record<string, (typeof DISPOSITION_OPTIONS)[number]> =
  {
    // Current canonical values
    under_case: DISPOSITION_UNDER_CASE,
    released: DISPOSITION_RELEASED,
    transferred: DISPOSITION_TRANSFERRED,
    deceased: DISPOSITION_DECEASED,
    euthanized: DISPOSITION_EUTHANIZED,
    perm_non_releasable: DISPOSITION_PERM_NON_RELEASABLE,
    // Legacy codes
    uc: DISPOSITION_UNDER_CASE,
    rel: DISPOSITION_RELEASED,
    trn: DISPOSITION_TRANSFERRED,
    doa: DISPOSITION_DECEASED,
    euth: DISPOSITION_EUTHANIZED,
    // Spoken/typed variants
    undercare: DISPOSITION_UNDER_CASE,
    under_care: DISPOSITION_UNDER_CASE,
    under_case_status: DISPOSITION_UNDER_CASE,
    undercase: DISPOSITION_UNDER_CASE,
    permanent_non_releasable: DISPOSITION_PERM_NON_RELEASABLE,
    permanently_non_releasable: DISPOSITION_PERM_NON_RELEASABLE,
    permanently_nonreleasable: DISPOSITION_PERM_NON_RELEASABLE,
    permanently_non_releasable_status: DISPOSITION_PERM_NON_RELEASABLE,
    permanent_nonreleasable: DISPOSITION_PERM_NON_RELEASABLE,
    non_releasable: DISPOSITION_PERM_NON_RELEASABLE,
    nonreleasable: DISPOSITION_PERM_NON_RELEASABLE,
    pnr: DISPOSITION_PERM_NON_RELEASABLE,
  };

function canonicalizeDispositionValue(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function normalizeDisposition(
  value: unknown
): (typeof DISPOSITION_OPTIONS)[number] {
  if (typeof value !== "string" || !value.trim()) {
    return DEFAULT_DISPOSITION;
  }

  const key = canonicalizeDispositionValue(value);
  const mapped = DISPOSITION_ALIASES[key];
  if (mapped) return mapped;

  const uppercaseRaw = value.trim().toUpperCase();
  if (
    (DISPOSITION_OPTIONS as readonly string[]).includes(uppercaseRaw)
  ) {
    return uppercaseRaw as (typeof DISPOSITION_OPTIONS)[number];
  }

  return DEFAULT_DISPOSITION;
}

export function getDispositionInfo(value: unknown) {
  const code = normalizeDisposition(value);
  return {
    code,
    ...DISPOSITION_CODES[code],
  };
}

export function isCurrentlyInCare(value: unknown): boolean {
  const code = normalizeDisposition(value);
  return (
    code === DISPOSITION_UNDER_CASE ||
    code === DISPOSITION_PERM_NON_RELEASABLE
  );
}

/**
 * Required fields for a complete intake record.
 * Used for validation in parse-intake API and UI display.
 */
export const REQUIRED_INTAKE_FIELDS = [
  { key: "species", label: "Species" },
  { key: "intake_reason", label: "Intake Reason" },
  { key: "found_location", label: "Found Location" },
  { key: "finder_name", label: "Finder Name" },
  { key: "finder_phone", label: "Finder Phone" },
] as const;

export function isRequiredIntakeFieldMissing(
  fieldKey: string,
  value: unknown
): boolean {
  if (fieldKey === "species") {
    if (typeof value !== "string" || !value.trim()) {
      return true;
    }

    return requiresSpeciesClarification(value);
  }

  return value === null || value === undefined || value === "";
}

/**
 * Voice commands that trigger saving the pending intake.
 * Matched case-insensitively against transcribed text.
 */
export const VOICE_SAVE_COMMANDS = [
  "save",
  "save intake",
  "save it",
  "confirm",
  "submit",
  "done",
  "that's it",
  "looks good",
];

/**
 * Voice commands that cancel/clear the pending intake.
 * Matched case-insensitively against transcribed text.
 */
export const VOICE_CANCEL_COMMANDS = [
  "cancel",
  "cancel intake",
  "start over",
  "never mind",
  "nevermind",
  "forget it",
  "clear",
  "reset",
];

/**
 * Maximum voice recording duration in seconds.
 * Recording auto-stops when this limit is reached.
 */
export const MAX_RECORDING_SECONDS = 60;
