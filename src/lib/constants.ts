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
