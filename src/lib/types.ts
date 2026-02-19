export interface User {
  id: string;
  name: string;
  email?: string | null;
}

export interface SummaryStats {
  total_intakes: number;
  animals_under_care: number;
  intakes_this_week: number;
  intakes_this_month?: number;
}

export type IntentType =
  | "new_intake"
  | "find_animal"
  | "add_care_log"
  | "view_care_logs"
  | "statistics"
  | "help"
  | "general_question";

export interface ClassifiedIntent {
  type: IntentType;
  params: Record<string, unknown>;
  confidence: number;
}

export type EmbeddedContent =
  | {
      type: "intake_confirmation";
      data: ParsedIntake;
    }
  | {
      type: "animal_record" | "animal_record_full";
      data: Intake | IntakeWithRelations;
    }
  | {
      type: "care_logs";
      data: DailyCareLog[];
    }
  | {
      type: "statistics";
      data: StatisticsResult;
    }
  | {
      type: "chart";
      data: ChartData;
    }
  | {
      type: "processing";
      message?: string;
    }
  | {
      type: "error";
      message: string;
    };

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  embedded?: EmbeddedContent;
}

export interface ParsedIntake {
  intake_number?: string | null;
  intake_date?: string | null;
  species?: string | null;
  quantity?: number | null;
  sex?: string | null;
  intake_reason?: string | null;
  found_location?: string | null;
  finder_name?: string | null;
  finder_phone?: string | null;
  weight?: string | null;
  age?: string | null;
  distress_code?: string | null;
  distress_subcode?: string | null;
  how_description?: string | null;
  confidence?: number | null;
}

/**
 * Response from /api/parse-intake endpoint.
 * Includes validation results for required fields.
 */
export interface ParseIntakeResponse {
  /** The parsed intake data */
  parsed: ParsedIntake;
  /** Labels of missing required fields (e.g., ["Species", "Finder Phone"]) */
  missingFields: string[];
  /** True if all required fields are present */
  isComplete: boolean;
}

export interface ParsedCareLog {
  intake_number?: string | null;
  intake_id?: string | null;
  log_date?: string | null;
  weight?: string | null;
  food_fed?: string | null;
  amount?: string | null;
  meds_and_comments?: string | null;
}

export interface Intake {
  id: string;
  intake_number: string;
  species: string;
  intake_date: string | Date;
  quantity: number;
  sex: string;
  intake_reason?: string | null;
  found_location?: string | null;
  finder_name?: string | null;
  finder_phone?: string | null;
  notes?: string | null;
}

export interface IntakeDisposition {
  disposition_code: string;
}

export interface IntakeWithRelations extends Intake {
  disposition?: IntakeDisposition | null;
}

export interface DailyCareLog {
  id: string;
  log_date: string | Date;
  weight?: string | null;
  food_fed?: string | null;
  amount?: string | null;
  meds_and_comments?: string | null;
}

export interface StatisticsItem {
  label: string;
  value: string | number;
  subvalue?: string;
}

export interface StatisticsResult {
  title: string;
  summary?: string;
  items: StatisticsItem[];
}

export interface ChartData {
  title: string;
  type: "bar" | "line" | "pie";
  data: Array<Record<string, string | number>>;
  xKey?: string;
  yKey?: string;
  nameKey?: string;
  valueKey?: string;
}

export interface ChatResponse {
  message: string;
  embedded?: EmbeddedContent;
}
