export interface User {
  id: string;
  name: string;
  email?: string | null;
  profileName?: string | null;
  accountSetupCompleted: boolean;
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
  | "edit_intake"
  | "update_intake"
  | "delete_intake"
  | "list_animals_in_care"
  | "list_all_intakes"
  | "update_care_log"
  | "delete_care_log"
  | "statistics"
  | "help"
  | "general_question"
  | "quick_status"
  | "confirm_pending";

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
      type: "intake_edit";
      data: Intake;
    }
  | {
      type: "animal_record" | "animal_record_full";
      data: Intake | IntakeWithRelations;
    }
  | {
      type: "care_logs";
      data: {
        logs: DailyCareLog[];
        totalCount: number;
      };
    }
  | {
      type: "care_log_updated";
      data: DailyCareLog;
    }
  | {
      type: "care_log_created";
      data: {
        log: DailyCareLog;
        intakeNumber: string;
        species: string;
      };
    }
  | {
      type: "animals_list";
      data: {
        items: IntakeWithRelations[];
        totalCount: number;
        mode: "under_care" | "all_intakes";
        statusFilter?: string;
      };
    }
  | {
      type: "quick_status";
      data: {
        items: QuickStatusItem[];
        totalUnderCare: number;
      };
    }
  | {
      type: "deleted_confirmation";
      data: {
        status: "confirm" | "deleted";
        recordType: "intake" | "care_log";
        id?: string;
        name: string;
      };
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
      type: "species_clarification";
      data: {
        question: string;
        options: string[];
      };
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
  finder_email?: string | null;
  finder_address?: string | null;
  found_date?: string | null;
  weight?: string | null;
  age?: string | null;
  distress_code?: string | null;
  distress_subcode?: string | null;
  food_offered?: string | null;
  donation_amount?: string | null;
  notes?: string | null;
  disposition?: string | null;
  disposition_date?: string | null;
  exam_notes?: string | null;
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
  user_id?: string;
  intake_number: string;
  species: string;
  intake_date: string | Date;
  quantity: number;
  sex: string;
  intake_reason?: string | null;
  found_location?: string | null;
  finder_name?: string | null;
  finder_phone?: string | null;
  finder_email?: string | null;
  finder_address?: string | null;
  found_date?: string | null;
  food_offered?: string | null;
  donation_amount?: string | null;
  how_description?: string | null;
  distress_code?: string | null;
  distress_subcode?: string | null;
  disposition?: string | IntakeDisposition | null;
  disposition_date?: string | null;
  notes?: string | null;
  exam_notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface IntakeDisposition {
  disposition_code: string;
}

export interface IntakeWithRelations extends Intake {
  dispositions?: IntakeDisposition | IntakeDisposition[] | null;
}

export interface DailyCareLog {
  id: string;
  user_id?: string | null;
  intake_id?: string | null;
  log_date: string | Date;
  weight?: string | null;
  food_fed?: string | null;
  amount?: string | null;
  meds_and_comments?: string | null;
  created_at?: string | null;
}

export interface QuickStatusItem {
  intakeNumber: string;
  species: string;
  lastFedAt: string | null;
  lastWeight: string | null;
  weightTrend: "up" | "down" | "stable" | "unknown";
  hoursAgo: number | null;
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

export interface ChatContext {
  recentIntakeNumber?: string;
  recentIntakeId?: string;
  recentSpecies?: string;
  lastIntent?: IntentType;
  pendingCareLogData?: ParsedCareLog;
  pendingCareLogAction?: "add" | "update";
  pendingCareLogTargetDate?: string;
  updatedAt?: string;
}
