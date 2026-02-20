import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { openai } from "@/lib/openai";
import { requireAuth, setAuthCookies } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/server";
import {
  CARE_LOG_PARSING_PROMPT,
  INTENT_CLASSIFICATION_PROMPT,
  GENERAL_QUESTION_PROMPT,
  INTAKE_PARSING_PROMPT,
  INTAKE_UPDATE_PARSING_PROMPT,
} from "@/lib/prompts";
import {
  formatWeight,
  incrementIntakeNumber,
  parseWeightToGrams,
} from "@/lib/utils";
import {
  ClassifiedIntent,
  ChatResponse,
  ChatContext,
  IntentType,
  ParsedCareLog,
  ParsedIntake,
  QuickStatusItem,
} from "@/lib/types";
import {
  DISPOSITION_UNDER_CARE,
  DISPOSITION_RELEASED,
} from "@/lib/constants";

const CONTEXT_COOKIE_NAME = "wildlife_chat_context";
const CONTEXT_MAX_AGE_SECONDS = 30 * 60;

function isValidDate(dateStr: string): boolean {
  const date = new Date(dateStr);
  return !Number.isNaN(date.getTime());
}

function injectDateTime(prompt: string): string {
  const dateTimeStr = new Date().toLocaleString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
  return prompt.replace("{CURRENT_DATETIME}", dateTimeStr);
}

type ParsedCareLogWithError = ParsedCareLog & { error?: string };

function hasCareLogDetails(parsed: ParsedCareLog): boolean {
  return Boolean(
    parsed.weight ||
      parsed.food_fed ||
      parsed.amount ||
      parsed.meds_and_comments
  );
}

function isLikelyCareLogFollowUp(message: string): boolean {
  const normalized = message.toLowerCase().trim();
  if (!normalized) return false;
  if (/^(yes|yeah|yep|no|nope|cancel|stop)$/i.test(normalized)) {
    return false;
  }
  return /\b(\d+|number|intake|care|log|feed|fed|formula|weight|gram|grams|ml|cc|med|medication|update|change|today|yesterday)\b/i.test(
    normalized
  );
}

async function parseCareLogFromMessage(
  message: string
): Promise<ParsedCareLogWithError | null> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: injectDateTime(CARE_LOG_PARSING_PROMPT) },
      { role: "user", content: message },
    ],
    response_format: { type: "json_object" },
    max_tokens: 1024,
  });

  const content = response.choices[0]?.message?.content || "{}";
  try {
    return JSON.parse(content);
  } catch {
    return null;
  }
}

async function getChatContext(): Promise<ChatContext> {
  const cookieStore = await cookies();
  const contextCookie = cookieStore.get(CONTEXT_COOKIE_NAME);
  if (!contextCookie) return {};
  try {
    const context = JSON.parse(contextCookie.value) as ChatContext;
    if (context.updatedAt) {
      const ageMs = Date.now() - new Date(context.updatedAt).getTime();
      if (ageMs > CONTEXT_MAX_AGE_SECONDS * 1000) return {};
    }
    return context;
  } catch {
    return {};
  }
}

function setChatContext(response: NextResponse, context: ChatContext): void {
  response.cookies.set(
    CONTEXT_COOKIE_NAME,
    JSON.stringify({
      ...context,
      updatedAt: new Date().toISOString(),
    }),
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: CONTEXT_MAX_AGE_SECONDS,
    }
  );
}

interface HandlerResult {
  response: ChatResponse;
  newContext?: Partial<ChatContext>;
}

interface IntakeReference {
  intake_number?: string;
  species_reference?: string;
  latest?: boolean;
}

async function findIntakeByNumber(
  intakeNumber: string,
  userId: string,
  selectClause: string = "*"
): Promise<any | null> {
  const normalizedInput = intakeNumber.trim();

  const { data: exactMatch } = await supabaseAdmin
    .from("intakes")
    .select(selectClause)
    .eq("user_id", userId)
    .eq("intake_number", normalizedInput)
    .single();

  if (exactMatch) {
    return exactMatch;
  }

  const isJustNumber = /^\d+$/.test(normalizedInput);
  if (isJustNumber) {
    const sequenceNumber = normalizedInput.padStart(3, "0");
    const currentYear = new Date().getFullYear();
    const currentYearPattern = `${currentYear}-${sequenceNumber}`;

    const { data: currentYearMatch } = await supabaseAdmin
      .from("intakes")
      .select(selectClause)
      .eq("user_id", userId)
      .eq("intake_number", currentYearPattern)
      .single();

    if (currentYearMatch) {
      return currentYearMatch;
    }

    const { data: anyYearMatch } = await supabaseAdmin
      .from("intakes")
      .select(selectClause)
      .eq("user_id", userId)
      .like("intake_number", `%-${sequenceNumber}`)
      .order("intake_date", { ascending: false })
      .limit(1)
      .single();

    if (anyYearMatch) {
      return anyYearMatch;
    }
  }

  const yearNumberMatch = normalizedInput.match(/^(\d{4})-(\d+)$/);
  if (yearNumberMatch) {
    const year = yearNumberMatch[1];
    const sequence = yearNumberMatch[2].padStart(3, "0");
    const fullNumber = `${year}-${sequence}`;

    const { data: formattedMatch } = await supabaseAdmin
      .from("intakes")
      .select(selectClause)
      .eq("user_id", userId)
      .eq("intake_number", fullNumber)
      .single();

    if (formattedMatch) {
      return formattedMatch;
    }
  }

  const fallbackNumber = normalizedInput.padStart(3, "0");
  const { data: partialMatch } = await supabaseAdmin
    .from("intakes")
    .select(selectClause)
    .eq("user_id", userId)
    .like("intake_number", `%-${fallbackNumber}`)
    .order("intake_date", { ascending: false })
    .limit(1)
    .single();

  return partialMatch || null;
}

async function resolveIntakeReference(
  params: Record<string, unknown>,
  userId: string,
  context: ChatContext,
  selectClause: string = "*"
): Promise<{ intake: any | null; ambiguous: boolean; candidates?: any[] }> {
  const reference = params as IntakeReference;
  const intakeNumber = reference.intake_number;
  const speciesRef = reference.species_reference;
  const latest = reference.latest;

  if (intakeNumber) {
    const intake = await findIntakeByNumber(intakeNumber, userId, selectClause);
    return { intake, ambiguous: false };
  }

  if (latest) {
    const { data: latestIntake } = await supabaseAdmin
      .from("intakes")
      .select(selectClause)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();
    return { intake: latestIntake, ambiguous: false };
  }

  if (speciesRef) {
    const { data: speciesMatches } = await supabaseAdmin
      .from("intakes")
      .select(selectClause)
      .eq("user_id", userId)
      .ilike("species", `%${speciesRef}%`)
      .order("created_at", { ascending: false });

    if (!speciesMatches || speciesMatches.length === 0) {
      return { intake: null, ambiguous: false };
    }
    if (speciesMatches.length === 1) {
      return { intake: speciesMatches[0], ambiguous: false };
    }
    return { intake: null, ambiguous: true, candidates: speciesMatches };
  }

  if (context.recentIntakeId) {
    const { data: contextIntake } = await supabaseAdmin
      .from("intakes")
      .select(selectClause)
      .eq("id", context.recentIntakeId)
      .eq("user_id", userId)
      .single();
    return { intake: contextIntake, ambiguous: false };
  }

  return { intake: null, ambiguous: false };
}

export async function POST(request: NextRequest) {
  try {
    const { session, tokens } = await requireAuth(request);
    const jsonResponse = (body: unknown, init?: ResponseInit) => {
      const response = NextResponse.json(body, init);
      if (tokens) {
        setAuthCookies(response, tokens);
      }
      return response;
    };
    const { message } = await request.json();

    if (!message) {
      return jsonResponse(
        { success: false, error: "No message provided" },
        { status: 400 }
      );
    }

    const context = await getChatContext();

    const intentResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: injectDateTime(INTENT_CLASSIFICATION_PROMPT),
        },
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

    const { response, newContext } = await handleIntent(
      intent,
      message,
      session.userId!,
      context
    );

    const jsonResp = jsonResponse({
      success: true,
      data: response,
    });

    if (newContext) {
      setChatContext(jsonResp, { ...context, ...newContext });
    }

    return jsonResp;
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
  userId: string,
  context: ChatContext
): Promise<HandlerResult> {
  if (context.pendingCareLogAction) {
    const shouldContinuePendingCareLog =
      intent.type === "add_care_log" ||
      intent.type === "update_care_log" ||
      intent.type === "find_animal" ||
      (intent.type === "general_question" &&
        isLikelyCareLogFollowUp(originalMessage));

    if (shouldContinuePendingCareLog) {
      if (context.pendingCareLogAction === "add") {
        return await handleAddCareLog(
          intent.params,
          originalMessage,
          userId,
          context
        );
      }
      return await handleUpdateCareLog(
        intent.params,
        originalMessage,
        userId,
        context
      );
    }
  }

  switch (intent.type as IntentType) {
    case "new_intake":
      return await handleNewIntake(originalMessage, userId);
    case "find_animal":
      return await handleFindAnimal(intent.params, userId, context);
    case "add_care_log":
      return await handleAddCareLog(
        intent.params,
        originalMessage,
        userId,
        context
      );
    case "view_care_logs":
      return await handleViewCareLogs(intent.params, userId, context);
    case "edit_intake":
      return await handleEditIntake(intent.params, userId, context);
    case "update_intake":
      return await handleUpdateIntake(
        intent.params,
        originalMessage,
        userId,
        context
      );
    case "delete_intake":
      return await handleDeleteIntake(intent.params, userId, context);
    case "list_animals_in_care":
      return await handleListAnimalsInCare(userId);
    case "update_care_log":
      return await handleUpdateCareLog(
        intent.params,
        originalMessage,
        userId,
        context
      );
    case "delete_care_log":
      return await handleDeleteCareLog(intent.params, userId, context);
    case "quick_status":
      return await handleQuickStatus(userId);
    case "confirm_pending":
      return await handleConfirmPending(context, userId);
    case "statistics":
      return await handleStatistics(intent.params, userId);
    case "help":
      return {
        response: {
          message: `I can help you with:
• **Record new intakes** - Say "new intake" or describe the animal
• **Add care logs** - Say "fed [intake number]..." with details
• **Find animals** - Say "show me [intake number]"
• **Edit intakes** - Say "edit intake [intake number]"
• **Update intakes** - Say "change finder phone on intake [number]"
• **Delete intakes** - Say "delete intake [intake number]"
• **List animals under care** - Say "show current intakes"
• **Update care logs** - Say "update care log for [number]"
• **Delete care logs** - Say "delete care log for [number]"
• **Quick status** - Say "status" or "daily check"
• **View statistics** - Ask "how many squirrels this year?"
• **Upload forms** - Click the camera icon to scan a paper form
What would you like to do?`,
        },
      };
    case "general_question":
    default:
      return await handleGeneralQuestion(originalMessage);
  }
}

async function handleNewIntake(
  originalMessage: string,
  userId: string
): Promise<HandlerResult> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: injectDateTime(INTAKE_PARSING_PROMPT) },
      { role: "user", content: originalMessage },
    ],
    response_format: { type: "json_object" },
    max_tokens: 2048,
  });

  const content = response.choices[0]?.message?.content || "{}";
  let parsed: ParsedIntake;

  try {
    parsed = JSON.parse(content);
  } catch {
    return {
      response: {
        message:
          "I couldn't parse that intake. Please describe the animal, how it was found, and any details you have.",
      },
    };
  }

  if (!parsed.species) {
    return {
      response: {
        message:
          "I can help you record a new intake. What species is the animal? Please include how it was found and any other details.",
      },
    };
  }

  if (!parsed.intake_number) {
    const { data: settings } = await supabaseAdmin
      .from("user_settings")
      .select("last_intake_number")
      .eq("user_id", userId)
      .single();

    if (settings?.last_intake_number) {
      parsed.intake_number = incrementIntakeNumber(settings.last_intake_number);
    } else {
      const year = new Date().getFullYear();
      parsed.intake_number = `${year}-001`;
    }
  }

  if (!parsed.intake_date) {
    parsed.intake_date = new Date().toISOString();
  }

  return {
    response: {
      message: "Here's what I captured. Review and save when ready:",
      embedded: {
        type: "intake_confirmation",
        data: parsed,
      },
    },
    newContext: {
      lastIntent: "new_intake",
    },
  };
}

async function handleFindAnimal(
  params: Record<string, unknown>,
  userId: string,
  context: ChatContext
): Promise<HandlerResult> {
  const { intake, ambiguous, candidates } = await resolveIntakeReference(
    params,
    userId,
    context,
    `
      *,
      patient_exams (*),
      daily_care_logs (*),
      dispositions (*)
    `
  );

  if (ambiguous && candidates) {
    const options = candidates
      .slice(0, 5)
      .map((item) => `${item.intake_number} (${item.species})`)
      .join(", ");
    return {
      response: {
        message: `I found multiple matches: ${options}. Which one did you mean?`,
      },
    };
  }

  if (!intake) {
    return {
      response: {
        message:
          "I couldn't find that intake. Try 'show current intakes' to see all animals under care.",
      },
    };
  }

  return {
    response: {
      message: `Here's the record for ${intake.intake_number}:`,
      embedded: {
        type: "animal_record_full",
        data: intake,
      },
    },
    newContext: {
      recentIntakeNumber: intake.intake_number,
      recentIntakeId: intake.id,
      recentSpecies: intake.species,
      lastIntent: "find_animal",
    },
  };
}

async function handleAddCareLog(
  params: Record<string, unknown>,
  originalMessage: string,
  userId: string,
  context: ChatContext
): Promise<HandlerResult> {
  let parsed = await parseCareLogFromMessage(originalMessage);
  if (!parsed) {
    return {
      response: {
        message:
          "I couldn't parse that care log. Please include weight, food, and any medications.",
      },
    };
  }

  const paramsRef = params as IntakeReference;
  const intakeNumber = parsed.intake_number || (params.intake_number as string);
  const hasExplicitReference = Boolean(
    intakeNumber || paramsRef.species_reference || paramsRef.latest
  );

  let intake: any | null = null;
  if (hasExplicitReference) {
    if (intakeNumber) {
      intake = await findIntakeByNumber(
        intakeNumber,
        userId,
        "id, intake_number, species"
      );
    } else {
      const resolved = await resolveIntakeReference(
        params,
        userId,
        context,
        "id, intake_number, species"
      );
      if (resolved.ambiguous && resolved.candidates) {
        const options = resolved.candidates
          .slice(0, 5)
          .map((item) => `${item.intake_number} (${item.species})`)
          .join(", ");
        return {
          response: {
            message: `I found multiple matches: ${options}. Which one did you mean?`,
          },
        };
      }
      intake = resolved.intake;
    }
  } else if (context.pendingCareLogAction === "add" && context.recentIntakeId) {
    const { data: pendingIntake } = await supabaseAdmin
      .from("intakes")
      .select("id, intake_number, species")
      .eq("id", context.recentIntakeId)
      .eq("user_id", userId)
      .single();

    intake = pendingIntake;
  }

  if ((parsed as ParsedCareLogWithError).error && intake?.intake_number) {
    const reparse = await parseCareLogFromMessage(
      `intake ${intake.intake_number}. ${originalMessage}`
    );
    if (!reparse) {
      return {
        response: {
          message:
            "I couldn't parse that care log. Please include weight, food, and any medications.",
        },
      };
    }
    parsed = reparse;
  }

  if ((parsed as ParsedCareLogWithError).error && intake) {
    const parseError =
      (parsed as ParsedCareLogWithError).error?.trim() || "";
    if (!/no intake number specified/i.test(parseError)) {
      return {
        response: {
          message:
            parseError ||
            "Please include care details like weight, food, amount, or notes.",
        },
      };
    }
    parsed = {};
  }

  if (!intake) {
    if (context.recentIntakeNumber && context.recentSpecies) {
      const hasDetails = hasCareLogDetails(parsed);
      return {
        response: {
          message: hasDetails
            ? `Did you mean intake ${context.recentIntakeNumber} (${context.recentSpecies})? Say "yes" or specify another intake number.`
            : `I can add a care log for intake ${context.recentIntakeNumber} (${context.recentSpecies}). Please provide weight, food/formula, amount, medications, or notes.`,
        },
        newContext: {
          ...context,
          pendingCareLogData: hasDetails ? parsed : undefined,
          pendingCareLogAction: "add",
          lastIntent: "add_care_log",
        },
      };
    }

    return {
      response: {
        message:
          "Please specify which intake this care log is for. For example: 'fed intake 1, weight 200g'",
      },
      newContext: {
        pendingCareLogAction: "add",
        lastIntent: "add_care_log",
      },
    };
  }

  if (!hasCareLogDetails(parsed)) {
    return {
      response: {
        message: `What details should I add to the care log for intake ${intake.intake_number}? Include any weight, food/formula, amount, medications, and notes.`,
      },
      newContext: {
        recentIntakeNumber: intake.intake_number,
        recentIntakeId: intake.id,
        recentSpecies: intake.species,
        pendingCareLogAction: "add",
        lastIntent: "add_care_log",
      },
    };
  }

  if (parsed.log_date && !isValidDate(parsed.log_date)) {
    return {
      response: {
        message:
          "Invalid date format for care log. Please use a valid date.",
      },
    };
  }

  const logDate = parsed.log_date || new Date().toISOString();
  let normalizedWeight = parsed.weight;
  if (parsed.weight) {
    const grams = parseWeightToGrams(parsed.weight);
    if (grams !== null) {
      normalizedWeight = formatWeight(grams);
    }
  }

  const { data: log, error } = await supabaseAdmin
    .from("daily_care_logs")
    .insert({
      user_id: userId,
      intake_id: intake.id,
      log_date: logDate,
      weight: normalizedWeight,
      food_fed: parsed.food_fed,
      amount: parsed.amount,
      meds_and_comments: parsed.meds_and_comments,
    })
    .select()
    .single();

  if (error || !log) {
    return {
      response: {
        message: "Failed to save the care log. Please try again.",
      },
    };
  }

  let weightWarning = "";
  if (normalizedWeight) {
    const { data: previousLogs } = await supabaseAdmin
      .from("daily_care_logs")
      .select("weight, log_date")
      .eq("intake_id", intake.id)
      .neq("id", log.id)
      .order("log_date", { ascending: false })
      .limit(1);

    if (previousLogs && previousLogs.length > 0 && previousLogs[0].weight) {
      const prevWeight = parseWeightToGrams(previousLogs[0].weight);
      const newWeight = parseWeightToGrams(normalizedWeight);

      if (prevWeight !== null && newWeight !== null && prevWeight > 0) {
        const changePercent = ((newWeight - prevWeight) / prevWeight) * 100;
        if (Math.abs(changePercent) > 50) {
          const direction = changePercent > 0 ? "increase" : "decrease";
          weightWarning = `Warning: Weight ${direction} of ${Math.abs(
            changePercent
          ).toFixed(0)}% from previous (${previousLogs[0].weight}).`;
        }
      }
    }
  }

  return {
    response: {
      message:
        weightWarning || `Care log saved for intake ${intake.intake_number}.`,
      embedded: {
        type: "care_log_created",
        data: {
          log,
          intakeNumber: intake.intake_number,
          species: intake.species,
        },
      },
    },
    newContext: {
      recentIntakeNumber: intake.intake_number,
      recentIntakeId: intake.id,
      recentSpecies: intake.species,
      lastIntent: "add_care_log",
      pendingCareLogData: undefined,
      pendingCareLogAction: undefined,
      pendingCareLogTargetDate: undefined,
    },
  };
}

async function handleViewCareLogs(
  params: Record<string, unknown>,
  userId: string,
  context: ChatContext
): Promise<HandlerResult> {
  const { intake, ambiguous, candidates } = await resolveIntakeReference(
    params,
    userId,
    context,
    "id, intake_number, species"
  );

  if (ambiguous && candidates) {
    const options = candidates
      .slice(0, 5)
      .map((item) => `${item.intake_number} (${item.species})`)
      .join(", ");
    return {
      response: {
        message: `I found multiple matches: ${options}. Which one did you mean?`,
      },
    };
  }

  if (!intake) {
    return {
      response: {
        message:
          "Please specify which intake's care logs you'd like to see. For example: 'show care logs for 1' or 'feeding history for intake 1'",
      },
    };
  }

  const { data: logs } = await supabaseAdmin
    .from("daily_care_logs")
    .select("*")
    .eq("intake_id", intake.id)
    .eq("user_id", userId)
    .order("log_date", { ascending: false })
    .limit(10);

  if (!logs || logs.length === 0) {
    return {
      response: {
        message: `No care logs found for ${intake.intake_number}.`,
      },
    };
  }

  return {
    response: {
      message: `Here are the recent care logs for ${intake.intake_number}:`,
      embedded: {
        type: "care_logs",
        data: logs,
      },
    },
    newContext: {
      recentIntakeNumber: intake.intake_number,
      recentIntakeId: intake.id,
      recentSpecies: intake.species,
      lastIntent: "view_care_logs",
    },
  };
}

async function handleEditIntake(
  params: Record<string, unknown>,
  userId: string,
  context: ChatContext
): Promise<HandlerResult> {
  const { intake, ambiguous, candidates } = await resolveIntakeReference(
    params,
    userId,
    context
  );

  if (ambiguous && candidates) {
    const options = candidates
      .slice(0, 5)
      .map((item) => `${item.intake_number} (${item.species})`)
      .join(", ");
    return {
      response: {
        message: `I found multiple matches: ${options}. Which one did you mean?`,
      },
    };
  }

  if (!intake) {
    return {
      response: {
        message: "Please specify which intake number you want to edit.",
      },
    };
  }

  return {
    response: {
      message: `Here's intake ${intake.intake_number}. Click Edit to make changes:`,
      embedded: {
        type: "intake_edit",
        data: intake,
      },
    },
    newContext: {
      recentIntakeNumber: intake.intake_number,
      recentIntakeId: intake.id,
      recentSpecies: intake.species,
      lastIntent: "edit_intake",
    },
  };
}

async function handleUpdateIntake(
  params: Record<string, unknown>,
  originalMessage: string,
  userId: string,
  context: ChatContext
): Promise<HandlerResult> {
  const field = params.field as string | undefined;
  const value = params.value as string | undefined;
  const updatesParam = params.updates as Record<string, unknown> | undefined;

  const { intake, ambiguous, candidates } = await resolveIntakeReference(
    params,
    userId,
    context,
    "id, intake_number, species"
  );

  if (ambiguous && candidates) {
    const options = candidates
      .slice(0, 5)
      .map((item) => `${item.intake_number} (${item.species})`)
      .join(", ");
    return {
      response: {
        message: `I found multiple matches: ${options}. Which one did you mean?`,
      },
    };
  }

  if (!intake) {
    return {
      response: {
        message: "Please specify which intake number you want to update.",
      },
    };
  }

  let fieldsToUpdate: Record<string, unknown> = updatesParam || {};

  if (field && value && Object.keys(fieldsToUpdate).length === 0) {
    fieldsToUpdate = { [field]: value };
  }

  if (Object.keys(fieldsToUpdate).length === 0) {
    const parseResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: injectDateTime(INTAKE_UPDATE_PARSING_PROMPT),
        },
        { role: "user", content: originalMessage },
      ],
      response_format: { type: "json_object" },
      max_tokens: 512,
    });
    const parsedContent =
      parseResponse.choices[0]?.message?.content || "{}";
    try {
      const parsed = JSON.parse(parsedContent) as {
        updates?: Record<string, unknown>;
      };
      fieldsToUpdate = parsed.updates || {};
    } catch {
      fieldsToUpdate = {};
    }
  }

  if (Object.keys(fieldsToUpdate).length === 0) {
    return {
      response: {
        message: `What would you like to change on intake ${intake.intake_number}? For example: "change the finder phone to 555-123-4567".`,
      },
    };
  }

  const { data: updated, error } = await supabaseAdmin
    .from("intakes")
    .update({
      ...fieldsToUpdate,
      updated_at: new Date().toISOString(),
    })
    .eq("id", intake.id)
    .eq("user_id", userId)
    .select()
    .single();

  if (error || !updated) {
    return {
      response: {
        message: "Failed to update the intake. Please try again.",
      },
    };
  }

  const changedFields = Object.keys(fieldsToUpdate).join(", ");
  return {
    response: {
      message: `Updated ${changedFields} for intake ${updated.intake_number}.`,
      embedded: {
        type: "animal_record",
        data: updated,
      },
    },
    newContext: {
      recentIntakeNumber: updated.intake_number,
      recentIntakeId: updated.id,
      recentSpecies: updated.species,
      lastIntent: "update_intake",
    },
  };
}

async function handleDeleteIntake(
  params: Record<string, unknown>,
  userId: string,
  context: ChatContext
): Promise<HandlerResult> {
  const { intake, ambiguous, candidates } = await resolveIntakeReference(
    params,
    userId,
    context,
    "id, intake_number, species"
  );

  if (ambiguous && candidates) {
    const options = candidates
      .slice(0, 5)
      .map((item) => `${item.intake_number} (${item.species})`)
      .join(", ");
    return {
      response: {
        message: `I found multiple matches: ${options}. Which one did you mean?`,
      },
    };
  }

  if (!intake) {
    return {
      response: {
        message: "Please specify which intake number you want to delete.",
      },
    };
  }

  return {
    response: {
      message: `Are you sure you want to delete intake ${intake.intake_number} (${intake.species})? This cannot be undone.`,
      embedded: {
        type: "deleted_confirmation",
        data: {
          status: "confirm",
          recordType: "intake",
          id: intake.id,
          name: `${intake.intake_number} - ${intake.species}`,
        },
      },
    },
    newContext: {
      recentIntakeNumber: intake.intake_number,
      recentIntakeId: intake.id,
      recentSpecies: intake.species,
      lastIntent: "delete_intake",
    },
  };
}

async function handleListAnimalsInCare(
  userId: string
): Promise<HandlerResult> {
  const { data: intakes } = await supabaseAdmin
    .from("intakes")
    .select(
      "id, intake_number, species, intake_reason, intake_date, quantity, sex, dispositions (disposition_code)"
    )
    .eq("user_id", userId)
    .order("intake_date", { ascending: false });

  if (!intakes || intakes.length === 0) {
    return {
      response: {
        message:
          "You don't have any intakes yet. Say 'new intake' to record your first animal.",
      },
    };
  }

  const underCare = intakes.filter((intake: any) => {
    const disposition = Array.isArray(intake.dispositions)
      ? intake.dispositions[0]
      : intake.dispositions;
    return (
      !disposition ||
      !disposition.disposition_code ||
      disposition.disposition_code === DISPOSITION_UNDER_CARE
    );
  });

  if (underCare.length === 0) {
    return {
      response: {
        message:
          "No animals currently under care. All intakes have been released or disposed.",
      },
    };
  }

  return {
    response: {
      message: `You have ${underCare.length} animal${
        underCare.length === 1 ? "" : "s"
      } currently under care:`,
      embedded: {
        type: "animals_list",
        data: underCare,
      },
    },
    newContext: {
      lastIntent: "list_animals_in_care",
    },
  };
}

async function handleUpdateCareLog(
  params: Record<string, unknown>,
  originalMessage: string,
  userId: string,
  context: ChatContext
): Promise<HandlerResult> {
  const logDate = params.log_date as string | undefined;
  const updatesParam = params.updates as Record<string, unknown> | undefined;

  const { intake, ambiguous, candidates } = await resolveIntakeReference(
    params,
    userId,
    context,
    "id, intake_number, species"
  );

  if (ambiguous && candidates) {
    const options = candidates
      .slice(0, 5)
      .map((item) => `${item.intake_number} (${item.species})`)
      .join(", ");
    return {
      response: {
        message: `I found multiple matches: ${options}. Which one did you mean?`,
      },
    };
  }

  if (!intake) {
    return {
      response: {
        message:
          "Please specify which intake's care log you'd like to update. For example: 'update care log for 1' or 'change weight on care log 1'",
      },
      newContext: {
        pendingCareLogAction: "update",
        lastIntent: "update_care_log",
      },
    };
  }

  let parsed: ParsedCareLog = {};
  if (!updatesParam || Object.keys(updatesParam).length === 0) {
    const parseInput = `intake ${intake.intake_number}. ${originalMessage}`;
    const parsedResult = await parseCareLogFromMessage(parseInput);
    if (!parsedResult) {
      return {
        response: {
          message:
            "I couldn't parse the care log update. Please include the fields you want to change.",
        },
      };
    }
    parsed = parsedResult;

    if ((parsed as ParsedCareLogWithError).error) {
      const parseError =
        (parsed as ParsedCareLogWithError).error?.trim() || "";
      if (!/no intake number specified/i.test(parseError)) {
        return {
          response: {
            message:
              parseError ||
              "Please include the fields you want to update for this care log.",
          },
        };
      }
      parsed = {};
    }
  }

  const effectiveLogDate =
    logDate ||
    parsed.log_date ||
    (context.pendingCareLogAction === "update"
      ? context.pendingCareLogTargetDate
      : undefined);
  if (effectiveLogDate && !isValidDate(effectiveLogDate)) {
    return {
      response: {
        message:
          "Invalid date format. Please provide a valid date for the care log.",
      },
    };
  }

  let logsQuery = supabaseAdmin
    .from("daily_care_logs")
    .select("*")
    .eq("intake_id", intake.id)
    .eq("user_id", userId)
    .order("log_date", { ascending: false });

  if (effectiveLogDate) {
    const targetDate = new Date(effectiveLogDate);
    const dayStart = new Date(targetDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(targetDate);
    dayEnd.setHours(23, 59, 59, 999);

    logsQuery = logsQuery
      .gte("log_date", dayStart.toISOString())
      .lte("log_date", dayEnd.toISOString());
  }

  logsQuery = logsQuery.limit(1);
  const { data: logs, error: logsError } = await logsQuery;

  if (logsError) {
    console.error("Error fetching care logs:", logsError);
    return {
      response: {
        message: "Failed to fetch care logs. Please try again.",
      },
    };
  }

  if (!logs || logs.length === 0) {
    if (effectiveLogDate) {
      return {
        response: {
          message: `No care logs found for intake ${intake.intake_number} on ${new Date(
            effectiveLogDate
          ).toLocaleDateString()}. Try "show care logs for ${
            intake.intake_number
          }" to see all logs.`,
        },
        newContext: {
          recentIntakeNumber: intake.intake_number,
          recentIntakeId: intake.id,
          recentSpecies: intake.species,
          pendingCareLogAction: undefined,
          pendingCareLogTargetDate: undefined,
          lastIntent: "update_care_log",
        },
      };
    }
    return {
      response: {
        message: `No care logs found for intake ${intake.intake_number}. Say "add care log for ${intake.intake_number}" to create one.`,
      },
      newContext: {
        recentIntakeNumber: intake.intake_number,
        recentIntakeId: intake.id,
        recentSpecies: intake.species,
        pendingCareLogAction: undefined,
        pendingCareLogTargetDate: undefined,
        lastIntent: "update_care_log",
      },
    };
  }

  const updates: Record<string, unknown> = updatesParam || {};
  if (!updatesParam || Object.keys(updatesParam).length === 0) {
    if (parsed.weight) updates.weight = parsed.weight;
    if (parsed.food_fed) updates.food_fed = parsed.food_fed;
    if (parsed.amount) updates.amount = parsed.amount;
    if (parsed.meds_and_comments) updates.meds_and_comments = parsed.meds_and_comments;
  }

  if (Object.keys(updates).length === 0) {
    return {
      response: {
        message: `What would you like to update on the care log for ${intake.intake_number}?`,
      },
      newContext: {
        recentIntakeNumber: intake.intake_number,
        recentIntakeId: intake.id,
        recentSpecies: intake.species,
        pendingCareLogAction: "update",
        pendingCareLogTargetDate: effectiveLogDate,
        lastIntent: "update_care_log",
      },
    };
  }

  const { data: updated, error } = await supabaseAdmin
    .from("daily_care_logs")
    .update(updates)
    .eq("id", logs[0].id)
    .eq("user_id", userId)
    .select()
    .single();

  if (error || !updated) {
    return {
      response: {
        message: "Failed to update the care log. Please try again.",
      },
    };
  }

  return {
    response: {
      message: `Care log updated for intake ${intake.intake_number}.`,
      embedded: {
        type: "care_log_updated",
        data: updated,
      },
    },
    newContext: {
      recentIntakeNumber: intake.intake_number,
      recentIntakeId: intake.id,
      recentSpecies: intake.species,
      lastIntent: "update_care_log",
      pendingCareLogAction: undefined,
      pendingCareLogTargetDate: undefined,
    },
  };
}

async function handleDeleteCareLog(
  params: Record<string, unknown>,
  userId: string,
  context: ChatContext
): Promise<HandlerResult> {
  const logDate = params.log_date as string | undefined;
  if (logDate && !isValidDate(logDate)) {
    return {
      response: {
        message:
          "Invalid date format. Please provide a valid date for the care log.",
      },
    };
  }

  const { intake, ambiguous, candidates } = await resolveIntakeReference(
    params,
    userId,
    context,
    "id, intake_number, species"
  );

  if (ambiguous && candidates) {
    const options = candidates
      .slice(0, 5)
      .map((item) => `${item.intake_number} (${item.species})`)
      .join(", ");
    return {
      response: {
        message: `I found multiple matches: ${options}. Which one did you mean?`,
      },
    };
  }

  if (!intake) {
    return {
      response: {
        message:
          "Please specify which intake's care log you'd like to delete. For example: 'delete care log for 1'",
      },
    };
  }

  let logsQuery = supabaseAdmin
    .from("daily_care_logs")
    .select("id, log_date")
    .eq("intake_id", intake.id)
    .eq("user_id", userId)
    .order("log_date", { ascending: false });

  if (logDate) {
    const targetDate = new Date(logDate);
    const dayStart = new Date(targetDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(targetDate);
    dayEnd.setHours(23, 59, 59, 999);

    logsQuery = logsQuery
      .gte("log_date", dayStart.toISOString())
      .lte("log_date", dayEnd.toISOString());
  }

  logsQuery = logsQuery.limit(1);

  const { data: logs } = await logsQuery;

  if (!logs || logs.length === 0) {
    return {
      response: {
        message: `No care logs found for intake ${intake.intake_number}.`,
      },
    };
  }

  return {
    response: {
      message: `Are you sure you want to delete the most recent care log for ${intake.intake_number}? This cannot be undone.`,
      embedded: {
        type: "deleted_confirmation",
        data: {
          status: "confirm",
          recordType: "care_log",
          id: logs[0].id,
          name: `Care log for ${intake.intake_number}`,
        },
      },
    },
    newContext: {
      recentIntakeNumber: intake.intake_number,
      recentIntakeId: intake.id,
      recentSpecies: intake.species,
      lastIntent: "delete_care_log",
    },
  };
}

async function handleConfirmPending(
  context: ChatContext,
  userId: string
): Promise<HandlerResult> {
  if (context.pendingCareLogData && context.recentIntakeId) {
    const parsed = context.pendingCareLogData;
    if (parsed.log_date && !isValidDate(parsed.log_date)) {
      return {
        response: {
          message:
            "Invalid date format for care log. Please use a valid date.",
        },
      };
    }
    const logDate = parsed.log_date || new Date().toISOString();
    let normalizedWeight = parsed.weight;
    if (parsed.weight) {
      const grams = parseWeightToGrams(parsed.weight);
      if (grams !== null) {
        normalizedWeight = formatWeight(grams);
      }
    }

    const { data: log, error } = await supabaseAdmin
      .from("daily_care_logs")
      .insert({
        user_id: userId,
        intake_id: context.recentIntakeId,
        log_date: logDate,
        weight: normalizedWeight,
        food_fed: parsed.food_fed,
        amount: parsed.amount,
        meds_and_comments: parsed.meds_and_comments,
      })
      .select()
      .single();

    if (error || !log) {
      return {
        response: {
          message: "Failed to save the care log. Please try again.",
        },
      };
    }

    return {
      response: {
        message: `Care log saved for intake ${context.recentIntakeNumber || ""}.`,
        embedded: {
          type: "care_log_created",
          data: {
            log,
            intakeNumber: context.recentIntakeNumber || "",
            species: context.recentSpecies || "",
          },
        },
      },
      newContext: {
        recentIntakeNumber: context.recentIntakeNumber,
        recentIntakeId: context.recentIntakeId,
        recentSpecies: context.recentSpecies,
        lastIntent: "add_care_log",
        pendingCareLogData: undefined,
        pendingCareLogAction: undefined,
        pendingCareLogTargetDate: undefined,
      },
    };
  }

  return {
    response: {
      message: "I'm not sure what you're confirming. What would you like to do?",
    },
  };
}

async function handleQuickStatus(userId: string): Promise<HandlerResult> {
  const { data: intakes } = await supabaseAdmin
    .from("intakes")
    .select(
      `
      id,
      intake_number,
      species,
      daily_care_logs (
        log_date,
        weight
      ),
      dispositions (
        disposition_code
      )
    `
    )
    .eq("user_id", userId)
    .order("intake_date", { ascending: false });

  if (!intakes || intakes.length === 0) {
    return {
      response: {
        message:
          "You don't have any intakes yet. Say 'new intake' to record your first animal.",
      },
    };
  }

  const underCare = intakes.filter((intake: any) => {
    const disposition = Array.isArray(intake.dispositions)
      ? intake.dispositions[0]
      : intake.dispositions;
    return (
      !disposition ||
      !disposition.disposition_code ||
      disposition.disposition_code === DISPOSITION_UNDER_CARE
    );
  });

  if (underCare.length === 0) {
    return {
      response: {
        message:
          "No animals currently under care. All intakes have been released or disposed.",
      },
    };
  }

  const now = new Date();
  const items: QuickStatusItem[] = underCare.map((intake: any) => {
    const logs = intake.daily_care_logs || [];
    const sortedLogs = logs.sort(
      (a: any, b: any) =>
        new Date(b.log_date).getTime() - new Date(a.log_date).getTime()
    );

    const latestLog = sortedLogs[0];
    const previousLog = sortedLogs[1];

    let weightTrend: QuickStatusItem["weightTrend"] = "unknown";
    if (latestLog?.weight && previousLog?.weight) {
      const latest = parseWeightToGrams(latestLog.weight);
      const previous = parseWeightToGrams(previousLog.weight);
      if (latest !== null && previous !== null) {
        if (latest > previous * 1.02) weightTrend = "up";
        else if (latest < previous * 0.98) weightTrend = "down";
        else weightTrend = "stable";
      }
    }

    let hoursAgo: number | null = null;
    if (latestLog?.log_date) {
      const logDate = new Date(latestLog.log_date);
      hoursAgo = Math.round(
        (now.getTime() - logDate.getTime()) / (1000 * 60 * 60)
      );
    }

    return {
      intakeNumber: intake.intake_number,
      species: intake.species,
      lastFedAt: latestLog?.log_date || null,
      lastWeight: latestLog?.weight || null,
      weightTrend,
      hoursAgo,
    };
  });

  items.sort((a, b) => {
    if (a.hoursAgo === null) return 1;
    if (b.hoursAgo === null) return -1;
    return b.hoursAgo - a.hoursAgo;
  });

  return {
    response: {
      message: "",
      embedded: {
        type: "quick_status",
        data: {
          items,
          totalUnderCare: underCare.length,
        },
      },
    },
    newContext: {
      lastIntent: "quick_status",
    },
  };
}

async function handleStatistics(
  params: Record<string, unknown>,
  userId: string
): Promise<HandlerResult> {
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
      response: {
        message: speciesFilter
          ? `No intakes found matching "${speciesFilter}".`
          : "No intakes found.",
      },
    };
  }

  const total = intakes.length;
  const totalAnimals = intakes.reduce(
    (sum: number, i: any) => sum + (i.quantity || 1),
    0
  );
  const underCare = intakes.filter(
    (i: any) =>
      !i.dispositions ||
      i.dispositions.disposition_code === DISPOSITION_UNDER_CARE
  ).length;
  const released = intakes.filter(
    (i: any) =>
      i.dispositions?.disposition_code === DISPOSITION_RELEASED
  ).length;
  const title = speciesFilter
    ? `Statistics for ${speciesFilter}`
    : "Overall Statistics";

  return {
    response: {
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
    },
    newContext: {
      lastIntent: "statistics",
    },
  };
}

async function handleGeneralQuestion(message: string): Promise<HandlerResult> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: injectDateTime(GENERAL_QUESTION_PROMPT) },
      { role: "user", content: message },
    ],
    max_tokens: 1024,
  });

  const answer =
    response.choices[0]?.message?.content ||
    "I'm not sure how to help with that.";

  return {
    response: { message: answer },
    newContext: { lastIntent: "general_question" },
  };
}
