import { supabaseAdmin } from "@/lib/supabase/server";
import { normalizeDisposition } from "@/lib/constants";

export const INTAKE_UPDATABLE_FIELDS = [
  "intake_number",
  "intake_date",
  "species",
  "quantity",
  "sex",
  "intake_reason",
  "found_location",
  "finder_name",
  "finder_phone",
  "finder_email",
  "finder_address",
  "found_date",
  "how_description",
  "food_offered",
  "donation_amount",
  "notes",
  "disposition",
  "disposition_date",
] as const;

export const EXAM_UPDATABLE_FIELDS = [
  "weight",
  "age",
  "distress_code",
  "distress_subcode",
  "exam_notes",
  "treatment_notes",
] as const;

const UPDATE_FIELD_KEY_ALIASES: Record<string, string> = {
  name: "finder_name",
  contact_name: "finder_name",
  finder_contact_name: "finder_name",
  phone: "finder_phone",
  phone_number: "finder_phone",
  telephone: "finder_phone",
  contact_phone: "finder_phone",
  contact_phone_number: "finder_phone",
  contact_number: "finder_phone",
  finder_phone_number: "finder_phone",
  finder_telephone: "finder_phone",
  email: "finder_email",
  email_address: "finder_email",
  contact_email: "finder_email",
  finder_email_address: "finder_email",
  address: "finder_address",
  mailing_address: "finder_address",
  contact_address: "finder_address",
  exam_note: "exam_notes",
  treatment_note: "treatment_notes",
};

function canonicalizeUpdateFieldKey(key: string): string {
  return key
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function normalizeUpdateFieldKey(key: string): string {
  const canonicalKey = canonicalizeUpdateFieldKey(key);
  return UPDATE_FIELD_KEY_ALIASES[canonicalKey] ?? canonicalKey;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function splitIntakeAndExamUpdates(payload: Record<string, unknown>) {
  const intakeUpdates: Record<string, unknown> = {};
  const examUpdates: Record<string, unknown> = {};
  const allowedFields = new Set<string>([
    ...INTAKE_UPDATABLE_FIELDS,
    ...EXAM_UPDATABLE_FIELDS,
  ]);
  const invalidFields: string[] = [];

  for (const [key, value] of Object.entries(payload)) {
    const normalizedKey = normalizeUpdateFieldKey(key);

    if (!allowedFields.has(normalizedKey)) {
      invalidFields.push(key);
      continue;
    }

    if ((INTAKE_UPDATABLE_FIELDS as readonly string[]).includes(normalizedKey)) {
      if (normalizedKey === "disposition") {
        intakeUpdates[normalizedKey] = normalizeDisposition(value);
      } else {
        intakeUpdates[normalizedKey] = value;
      }
      continue;
    }

    if (normalizedKey === "exam_notes") {
      examUpdates.treatment_notes = value;
    } else {
      examUpdates[normalizedKey] = value;
    }
  }

  return { intakeUpdates, examUpdates, invalidFields };
}

export async function getLatestExamForIntake(intakeId: string, userId: string) {
  return await supabaseAdmin
    .from("patient_exams")
    .select("id, weight, age, distress_code, distress_subcode, treatment_notes, created_at")
    .eq("intake_id", intakeId)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
}

export async function upsertLatestExamForIntake({
  intakeId,
  userId,
  examUpdates,
}: {
  intakeId: string;
  userId: string;
  examUpdates: Record<string, unknown>;
}) {
  if (Object.keys(examUpdates).length === 0) {
    return { error: null };
  }

  const { data: latestExam, error: latestExamError } =
    await getLatestExamForIntake(intakeId, userId);

  if (latestExamError) {
    return { error: latestExamError };
  }

  if (latestExam?.id) {
    const { error } = await supabaseAdmin
      .from("patient_exams")
      .update(examUpdates)
      .eq("id", latestExam.id)
      .eq("user_id", userId);
    return { error };
  }

  const { error } = await supabaseAdmin.from("patient_exams").insert({
    user_id: userId,
    intake_id: intakeId,
    ...examUpdates,
  });
  return { error };
}

export async function hydrateIntakeWithLatestExam({
  intake,
  intakeId,
  userId,
}: {
  intake: Record<string, unknown>;
  intakeId: string;
  userId: string;
}) {
  const { data: latestExam, error } = await getLatestExamForIntake(
    intakeId,
    userId
  );
  if (error) {
    return { data: null, error };
  }

  return {
    data: {
      ...intake,
      weight: latestExam?.weight ?? null,
      age: latestExam?.age ?? null,
      distress_code: latestExam?.distress_code ?? null,
      distress_subcode: latestExam?.distress_subcode ?? null,
      exam_notes: latestExam?.treatment_notes ?? null,
    },
    error: null,
  };
}

export async function applyIntakeAndExamUpdates({
  intakeId,
  userId,
  payload,
}: {
  intakeId: string;
  userId: string;
  payload: Record<string, unknown>;
}) {
  const { intakeUpdates, examUpdates, invalidFields } =
    splitIntakeAndExamUpdates(payload);

  if (invalidFields.length > 0) {
    return {
      success: false as const,
      status: 400,
      error: "Invalid fields in update payload",
      invalidFields,
    };
  }

  if (
    Object.keys(intakeUpdates).length === 0 &&
    Object.keys(examUpdates).length === 0
  ) {
    return {
      success: false as const,
      status: 400,
      error: "No updatable fields provided",
    };
  }

  if (Object.keys(intakeUpdates).length > 0) {
    const { error } = await supabaseAdmin
      .from("intakes")
      .update({
        ...intakeUpdates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", intakeId)
      .eq("user_id", userId);

    if (error) {
      return {
        success: false as const,
        status: 500,
        error: "Failed to update intake fields",
      };
    }
  }

  const { error: examError } = await upsertLatestExamForIntake({
    intakeId,
    userId,
    examUpdates,
  });

  if (examError) {
    return {
      success: false as const,
      status: 500,
      error: "Failed to update intake exam data",
    };
  }

  const { data: intake, error: intakeFetchError } = await supabaseAdmin
    .from("intakes")
    .select("*")
    .eq("id", intakeId)
    .eq("user_id", userId)
    .single();

  if (intakeFetchError || !intake) {
    return {
      success: false as const,
      status: 500,
      error: "Failed to load updated intake",
    };
  }

  const { data: hydrated, error: hydrateError } = await hydrateIntakeWithLatestExam(
    { intake, intakeId, userId }
  );

  if (hydrateError || !hydrated) {
    return {
      success: false as const,
      status: 500,
      error: "Failed to load updated intake exam data",
    };
  }

  return {
    success: true as const,
    data: hydrated,
    changedFields: [
      ...Object.keys(intakeUpdates),
      ...Object.keys(examUpdates).map((key) =>
        key === "treatment_notes" ? "exam_notes" : key
      ),
    ],
  };
}
