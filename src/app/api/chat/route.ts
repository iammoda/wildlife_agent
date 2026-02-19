import { NextRequest, NextResponse } from "next/server";
import { openai } from "@/lib/openai";
import { requireAuth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/server";
import {
  CARE_LOG_PARSING_PROMPT,
  INTENT_CLASSIFICATION_PROMPT,
  GENERAL_QUESTION_PROMPT,
} from "@/lib/prompts";
import {
  ClassifiedIntent,
  ChatResponse,
  IntentType,
  ParsedCareLog,
} from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const { message } = await request.json();

    if (!message) {
      return NextResponse.json(
        { success: false, error: "No message provided" },
        { status: 400 }
      );
    }

    const intentResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: INTENT_CLASSIFICATION_PROMPT },
        { role: "user", content: message },
      ],
      response_format: { type: "json_object" },
      max_tokens: 512,
    });

    const intentContent = intentResponse.choices[0]?.message?.content || "{}";
    let intent: ClassifiedIntent;

    try {
      intent = JSON.parse(intentContent);
    } catch {
      intent = { type: "general_question", params: {}, confidence: 0.5 };
    }

    const response = await handleIntent(intent, message, session.userId!);

    return NextResponse.json({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error("Chat error:", error);

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to process message" },
      { status: 500 }
    );
  }
}

async function handleIntent(
  intent: ClassifiedIntent,
  originalMessage: string,
  userId: string
): Promise<ChatResponse> {
  switch (intent.type as IntentType) {
    case "new_intake":
      return {
        message:
          "I can help you record a new intake. Please describe the animal, how it was found, and any other details you have. You can also upload a photo of an intake form.",
      };
    case "find_animal":
      return await handleFindAnimal(intent.params, userId);
    case "add_care_log":
      return await handleAddCareLog(intent.params, originalMessage, userId);
    case "view_care_logs":
      return await handleViewCareLogs(intent.params, userId);
    case "statistics":
      return await handleStatistics(intent.params, userId);
    case "help":
      return {
        message: `I can help you with:
• **Record new intakes** - Say "new intake" or describe the animal
• **Add care logs** - Say "fed [intake number]..." with details
• **Find animals** - Say "show me [intake number]"
• **View statistics** - Ask "how many squirrels this year?"
• **Upload forms** - Click the camera icon to scan a paper form
What would you like to do?`,
      };
    case "general_question":
    default:
      return await handleGeneralQuestion(originalMessage);
  }
}

async function handleFindAnimal(
  params: Record<string, unknown>,
  userId: string
): Promise<ChatResponse> {
  const intakeNumber = params.intake_number as string;

  if (!intakeNumber) {
    return {
      message: "Please provide an intake number to look up.",
    };
  }

  const { data: intake, error } = await supabaseAdmin
    .from("intakes")
    .select(
      `
      *,
      patient_exams (*),
      daily_care_logs (*),
      dispositions (*)
    `
    )
    .eq("user_id", userId)
    .ilike("intake_number", `%${intakeNumber}%`)
    .single();

  if (error || !intake) {
    return {
      message: `I couldn't find an intake matching "${intakeNumber}". Please check the number and try again.`,
    };
  }

  return {
    message: `Here's the record for ${intake.intake_number}:`,
    embedded: {
      type: "animal_record_full",
      data: intake,
    },
  };
}

async function handleAddCareLog(
  params: Record<string, unknown>,
  originalMessage: string,
  userId: string
): Promise<ChatResponse> {
  const providedIntakeNumber = params.intake_number as string | undefined;
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: CARE_LOG_PARSING_PROMPT },
      { role: "user", content: originalMessage },
    ],
    response_format: { type: "json_object" },
    max_tokens: 1024,
  });

  const content = response.choices[0]?.message?.content || "{}";
  let parsed: ParsedCareLog;

  try {
    parsed = JSON.parse(content);
  } catch {
    return {
      message:
        "I couldn't parse that care log. Please include the intake number and care details like weight, food, and medications.",
    };
  }

  if ((parsed as { error?: string }).error) {
    return {
      message:
        (parsed as { error?: string }).error ||
        "Please provide the intake number for this care log.",
    };
  }

  const intakeNumber = parsed.intake_number || providedIntakeNumber;
  if (!intakeNumber) {
    return {
      message:
        "Please provide the intake number for this care log so I can save it.",
    };
  }

  const { data: intake, error: lookupError } = await supabaseAdmin
    .from("intakes")
    .select("id, intake_number")
    .eq("user_id", userId)
    .ilike("intake_number", `%${intakeNumber}%`)
    .single();

  if (lookupError || !intake) {
    return {
      message: `I couldn't find an intake matching "${intakeNumber}". Please check the number and try again.`,
    };
  }

  const logDate = parsed.log_date || new Date().toISOString();

  const { data: log, error } = await supabaseAdmin
    .from("daily_care_logs")
    .insert({
      user_id: userId,
      intake_id: intake.id,
      log_date: logDate,
      weight: parsed.weight,
      food_fed: parsed.food_fed,
      amount: parsed.amount,
      meds_and_comments: parsed.meds_and_comments,
    })
    .select()
    .single();

  if (error || !log) {
    return {
      message: "Failed to save the care log. Please try again.",
    };
  }

  return {
    message: `Care log added for patient ${intake.intake_number}.`,
    embedded: {
      type: "care_logs",
      data: [log],
    },
  };
}

async function handleViewCareLogs(
  params: Record<string, unknown>,
  userId: string
): Promise<ChatResponse> {
  const intakeNumber = params.intake_number as string;

  if (!intakeNumber) {
    return {
      message: "Please provide an intake number to view care logs.",
    };
  }

  const { data: intake } = await supabaseAdmin
    .from("intakes")
    .select("id, intake_number")
    .eq("user_id", userId)
    .ilike("intake_number", `%${intakeNumber}%`)
    .single();

  if (!intake) {
    return {
      message: `I couldn't find an intake matching "${intakeNumber}".`,
    };
  }

  const { data: logs } = await supabaseAdmin
    .from("daily_care_logs")
    .select("*")
    .eq("intake_id", intake.id)
    .order("log_date", { ascending: false })
    .limit(10);

  if (!logs || logs.length === 0) {
    return {
      message: `No care logs found for ${intake.intake_number}.`,
    };
  }

  return {
    message: `Here are the recent care logs for ${intake.intake_number}:`,
    embedded: {
      type: "care_logs",
      data: logs,
    },
  };
}

async function handleStatistics(
  params: Record<string, unknown>,
  userId: string
): Promise<ChatResponse> {
  const metric = (params.metric as string) || "count";
  const speciesFilter = params.species_filter as string | undefined;

  let query = supabaseAdmin
    .from("intakes")
    .select("*, dispositions(*)")
    .eq("user_id", userId);

  if (speciesFilter) {
    query = query.ilike("species", `%${speciesFilter}%`);
  }

  const { data: intakes } = await query;

  if (!intakes || intakes.length === 0) {
    return {
      message: speciesFilter
        ? `No intakes found matching "${speciesFilter}".`
        : "No intakes found.",
    };
  }

  const total = intakes.length;
  const totalAnimals = intakes.reduce(
    (sum: number, i: any) => sum + (i.quantity || 1),
    0
  );
  const underCare = intakes.filter(
    (i: any) => !i.dispositions || i.dispositions.disposition_code === "P"
  ).length;
  const released = intakes.filter(
    (i: any) => i.dispositions?.disposition_code === "R"
  ).length;
  const title = speciesFilter
    ? `Statistics for ${speciesFilter}`
    : "Overall Statistics";

  return {
    message: "Here are your statistics:",
    embedded: {
      type: "statistics",
      data: {
        title,
        summary: `${totalAnimals} animals across ${total} intakes`,
        items: [
          { label: "Total Intakes", value: total.toString() },
          { label: "Total Animals", value: totalAnimals.toString() },
          { label: "Under Care", value: underCare.toString() },
          { label: "Released", value: released.toString() },
        ],
      },
    },
  };
}

async function handleGeneralQuestion(message: string): Promise<ChatResponse> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: GENERAL_QUESTION_PROMPT },
      { role: "user", content: message },
    ],
    max_tokens: 1024,
  });

  const answer =
    response.choices[0]?.message?.content ||
    "I'm not sure how to help with that.";

  return { message: answer };
}
