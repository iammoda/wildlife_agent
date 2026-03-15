/**
 * Trend Analysis Engine
 *
 * Pure deterministic functions for analyzing animal care log trends.
 * No database access, no AI calls — receives data and returns alerts/summaries.
 */

import { parseWeightToGrams } from "@/lib/utils";
import type {
  DailyCareLog,
  DailyBriefingAlert,
  CareLogTrendSummary,
  MedicationEntry,
} from "@/lib/types";

// ---------------------------------------------------------------------------
// Types used internally
// ---------------------------------------------------------------------------

export interface AnimalWithLogs {
  intakeNumber: string;
  species: string;
  logs: DailyCareLog[]; // should be sorted newest-first
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseAmount(amount: string | null | undefined): number | null {
  if (!amount) return null;
  const match = amount
    .toLowerCase()
    .trim()
    .match(/^([\d.]+)/);
  if (!match) return null;
  const value = parseFloat(match[1]);
  return Number.isNaN(value) ? null : value;
}

function sortLogsNewestFirst(logs: DailyCareLog[]): DailyCareLog[] {
  return [...logs].sort(
    (a, b) =>
      new Date(b.log_date).getTime() - new Date(a.log_date).getTime()
  );
}

// ---------------------------------------------------------------------------
// Detection functions — each returns alerts for a single animal
// ---------------------------------------------------------------------------

function detectWeightTrends(
  logs: DailyCareLog[],
  intakeNumber: string,
  species: string
): DailyBriefingAlert[] {
  const alerts: DailyBriefingAlert[] = [];
  const weightsWithValues: { grams: number; display: string }[] = [];

  for (const log of logs) {
    if (log.weight) {
      const grams = parseWeightToGrams(log.weight);
      if (grams !== null) {
        weightsWithValues.push({ grams, display: log.weight });
      }
    }
  }

  if (weightsWithValues.length < 2) return alerts;

  // Logs are newest-first, so weightsWithValues[0] is the latest
  const latest = weightsWithValues[0];
  const previous = weightsWithValues[1];

  if (latest.grams < previous.grams) {
    // Check for consecutive decline (2+)
    let consecutiveDeclines = 1;
    for (let i = 1; i < weightsWithValues.length - 1; i++) {
      if (weightsWithValues[i].grams < weightsWithValues[i + 1].grams) {
        consecutiveDeclines++;
      } else {
        break;
      }
    }

    const recentWeights = weightsWithValues
      .slice(0, Math.min(consecutiveDeclines + 1, 4))
      .reverse()
      .map((w) => w.display);

    alerts.push({
      intakeNumber,
      species,
      alertType: "weight_declining",
      severity: consecutiveDeclines >= 2 ? "warning" : "warning",
      message:
        consecutiveDeclines >= 2
          ? `Weight declining: ${recentWeights.join(" \u2192 ")}`
          : `Weight dropped: ${previous.display} \u2192 ${latest.display}`,
    });
  } else if (latest.grams > previous.grams) {
    alerts.push({
      intakeNumber,
      species,
      alertType: "weight_increasing",
      severity: "positive",
      message: `Weight increasing: ${previous.display} \u2192 ${latest.display}`,
    });
  }

  return alerts;
}

function detectNotEating(
  logs: DailyCareLog[],
  intakeNumber: string,
  species: string
): DailyBriefingAlert[] {
  if (logs.length === 0) return [];

  // Check if latest log(s) have no food
  let missedCount = 0;
  for (const log of logs) {
    if (!log.food_fed || log.food_fed.trim() === "") {
      missedCount++;
    } else {
      break; // stop at first log that has food
    }
  }

  if (missedCount >= 1) {
    return [
      {
        intakeNumber,
        species,
        alertType: "not_eating",
        severity: "warning",
        message:
          missedCount === 1
            ? "Not eating: no food recorded in last feeding"
            : `Not eating: no food recorded in last ${missedCount} feedings`,
      },
    ];
  }

  return [];
}

function detectFeedingAmountTrends(
  logs: DailyCareLog[],
  intakeNumber: string,
  species: string
): DailyBriefingAlert[] {
  const alerts: DailyBriefingAlert[] = [];
  const amounts: number[] = [];

  for (const log of logs) {
    const amt = parseAmount(log.amount);
    if (amt !== null) {
      amounts.push(amt);
    }
  }

  if (amounts.length < 2) return alerts;

  // amounts[0] is latest (newest-first)
  if (amounts[0] < amounts[1]) {
    alerts.push({
      intakeNumber,
      species,
      alertType: "feeding_decreasing",
      severity: "warning",
      message: "Feeding amount decreased from previous log",
    });
  } else if (amounts[0] > amounts[1]) {
    alerts.push({
      intakeNumber,
      species,
      alertType: "feeding_increasing",
      severity: "positive",
      message: "Feeding amount increased from previous log",
    });
  }

  return alerts;
}

function detectStoolConcerns(
  logs: DailyCareLog[],
  intakeNumber: string,
  species: string
): DailyBriefingAlert[] {
  const alerts: DailyBriefingAlert[] = [];
  if (logs.length === 0) return alerts;

  const latest = logs[0];

  // Check for diarrhea on the latest log
  if (latest.stool === "diarrhea") {
    alerts.push({
      intakeNumber,
      species,
      alertType: "diarrhea",
      severity: "warning",
      message: "Diarrhea noted last feeding",
    });
    return alerts;
  }

  // Check for no stool — only flag if stool field is explicitly "none"
  // or if we can detect it from meds_and_comments
  if (latest.stool === "none") {
    alerts.push({
      intakeNumber,
      species,
      alertType: "no_stool",
      severity: "warning",
      message: "No stool last feeding",
    });
    return alerts;
  }

  // Fallback: check meds_and_comments for stool keywords (for legacy logs
  // that don't have the structured stool field)
  if (!latest.stool && latest.meds_and_comments) {
    const comments = latest.meds_and_comments.toLowerCase();
    const noStoolPatterns = [
      "no poop",
      "no stool",
      "no bm",
      "no bowel",
      "didn't poop",
      "didnt poop",
      "hasn't pooped",
      "hasnt pooped",
    ];
    const diarrheaPatterns = [
      "diarrhea",
      "loose stool",
      "watery stool",
      "runny poop",
      "runny stool",
    ];

    if (diarrheaPatterns.some((p) => comments.includes(p))) {
      alerts.push({
        intakeNumber,
        species,
        alertType: "diarrhea",
        severity: "warning",
        message: "Diarrhea noted last feeding",
      });
    } else if (noStoolPatterns.some((p) => comments.includes(p))) {
      alerts.push({
        intakeNumber,
        species,
        alertType: "no_stool",
        severity: "warning",
        message: "No stool last feeding",
      });
    }
  }

  return alerts;
}

function detectAspiration(
  logs: DailyCareLog[],
  intakeNumber: string,
  species: string
): DailyBriefingAlert[] {
  if (logs.length === 0) return [];

  const latest = logs[0];

  if (latest.aspiration) {
    return [
      {
        intakeNumber,
        species,
        alertType: "aspiration",
        severity: "critical",
        message: latest.aspiration_notes
          ? `Aspiration: ${latest.aspiration_notes}`
          : "Aspiration occurred during last feeding",
      },
    ];
  }

  // Fallback: check meds_and_comments for legacy logs
  if (!latest.aspiration && latest.meds_and_comments) {
    const comments = latest.meds_and_comments.toLowerCase();
    if (
      comments.includes("aspirat") ||
      comments.includes("fluid in lung") ||
      comments.includes("inhaled formula")
    ) {
      return [
        {
          intakeNumber,
          species,
          alertType: "aspiration",
          severity: "critical",
          message: "Possible aspiration noted in last feeding",
        },
      ];
    }
  }

  return [];
}

function detectOverdue(
  logs: DailyCareLog[],
  intakeNumber: string,
  species: string
): DailyBriefingAlert[] {
  if (logs.length === 0) return [];

  const latestLogDate = new Date(logs[0].log_date);
  const now = new Date();
  const hoursAgo = (now.getTime() - latestLogDate.getTime()) / (1000 * 60 * 60);

  if (hoursAgo >= 3) {
    return [
      {
        intakeNumber,
        species,
        alertType: "overdue",
        severity: "warning",
        message: `Overdue: last log ${Math.round(hoursAgo)}h ago`,
      },
    ];
  }

  return [];
}

function detectNoLogs(
  logs: DailyCareLog[],
  intakeNumber: string,
  species: string
): DailyBriefingAlert[] {
  if (logs.length === 0) {
    return [
      {
        intakeNumber,
        species,
        alertType: "no_logs",
        severity: "info",
        message: "No care logs recorded yet",
      },
    ];
  }
  return [];
}

// ---------------------------------------------------------------------------
// Main exports
// ---------------------------------------------------------------------------

/**
 * Compile a daily briefing for all animals under care.
 * Returns alerts sorted by severity: critical > warning > info > positive.
 */
export function compileDailyBriefing(
  animals: AnimalWithLogs[]
): DailyBriefingAlert[] {
  const allAlerts: DailyBriefingAlert[] = [];

  for (const animal of animals) {
    const sorted = sortLogsNewestFirst(animal.logs);

    allAlerts.push(
      ...detectAspiration(sorted, animal.intakeNumber, animal.species),
      ...detectWeightTrends(sorted, animal.intakeNumber, animal.species),
      ...detectNotEating(sorted, animal.intakeNumber, animal.species),
      ...detectFeedingAmountTrends(sorted, animal.intakeNumber, animal.species),
      ...detectStoolConcerns(sorted, animal.intakeNumber, animal.species),
      ...detectOverdue(sorted, animal.intakeNumber, animal.species),
      ...detectNoLogs(sorted, animal.intakeNumber, animal.species)
    );
  }

  // Sort by severity priority
  const severityOrder: Record<DailyBriefingAlert["severity"], number> = {
    critical: 0,
    warning: 1,
    info: 2,
    positive: 3,
  };

  allAlerts.sort((a, b) => {
    const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
    if (severityDiff !== 0) return severityDiff;
    return a.intakeNumber.localeCompare(b.intakeNumber);
  });

  return allAlerts;
}

/**
 * Generate a one-line trend summary for a care log that was just saved.
 * Used in the CareLogConfirmation card.
 */
export function generateCareLogSummary(
  currentLog: DailyCareLog,
  previousLogs: DailyCareLog[]
): CareLogTrendSummary {
  const allLogs = sortLogsNewestFirst([currentLog, ...previousLogs]);

  // --- Weight trend ---
  let weightTrend: CareLogTrendSummary["weightTrend"] = "unknown";
  const weightValues: string[] = [];

  const weightsWithValues: { grams: number; display: string }[] = [];
  for (const log of allLogs) {
    if (log.weight) {
      const grams = parseWeightToGrams(log.weight);
      if (grams !== null) {
        weightsWithValues.push({ grams, display: log.weight });
      }
    }
  }

  if (weightsWithValues.length >= 2) {
    const latest = weightsWithValues[0].grams;
    const previous = weightsWithValues[1].grams;

    if (latest > previous * 1.02) {
      weightTrend = "up";
    } else if (latest < previous * 0.98) {
      weightTrend = "down";
    } else {
      weightTrend = "stable";
    }

    // Collect up to 3 recent weight values for display (oldest to newest)
    const recentWeights = weightsWithValues.slice(0, 3).reverse();
    for (const w of recentWeights) {
      weightValues.push(w.display);
    }
  } else if (weightsWithValues.length === 1) {
    weightValues.push(weightsWithValues[0].display);
  }

  // --- Eating status ---
  let eatingWell: boolean | null = null;
  if (currentLog.food_fed && currentLog.food_fed.trim() !== "") {
    eatingWell = true;
  } else if (allLogs.length > 0) {
    eatingWell = false;
  }

  // --- Stool status ---
  let stoolStatus: CareLogTrendSummary["stoolStatus"] = "unknown";
  if (currentLog.stool === "normal") {
    stoolStatus = "normal";
  } else if (currentLog.stool === "diarrhea") {
    stoolStatus = "concern";
  } else if (currentLog.stool === "none") {
    stoolStatus = "none";
  } else if (currentLog.meds_and_comments) {
    // Fallback: check comments for stool keywords
    const comments = currentLog.meds_and_comments.toLowerCase();
    const normalPatterns = [
      "good poop",
      "normal stool",
      "normal poop",
      "good stool",
      "good bm",
      "pooped",
      "had stool",
      "had bm",
    ];
    const concernPatterns = [
      "diarrhea",
      "loose stool",
      "watery",
      "no poop",
      "no stool",
      "no bm",
      "didn't poop",
      "didnt poop",
    ];

    if (concernPatterns.some((p) => comments.includes(p))) {
      stoolStatus = "concern";
    } else if (normalPatterns.some((p) => comments.includes(p))) {
      stoolStatus = "normal";
    }
  }

  // --- Aspiration ---
  const aspirationFlag = currentLog.aspiration === true;

  return {
    weightTrend,
    weightValues: weightValues.length > 0 ? weightValues : undefined,
    eatingWell,
    stoolStatus,
    aspirationFlag,
  };
}
