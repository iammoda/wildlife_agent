export const SEX_OPTIONS = ["Unknown", "Male", "Female"] as const;

export const INTAKE_REASON_OPTIONS = [
  "Unknown",
  "Injured",
  "Orphaned",
  "Sick",
  "Nuisance",
  "Other",
] as const;

export const DISPOSITION_CODES = {
  UC: {
    shortTitle: "Under Care",
    isPositive: true,
  },
  REL: {
    shortTitle: "Released",
    isPositive: true,
  },
  TRN: {
    shortTitle: "Transferred",
    isPositive: true,
  },
  DOA: {
    shortTitle: "DOA",
    isPositive: false,
  },
  EUTH: {
    shortTitle: "Euthanized",
    isPositive: false,
  },
} as const;

export const DISPOSITION_UNDER_CARE = "UC";
export const DISPOSITION_RELEASED = "REL";

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
