import { NextRequest, NextResponse } from "next/server";
import { openai } from "@/lib/openai";
import { requireAuth, setAuthCookies } from "@/lib/auth";
import { INTAKE_MERGE_PROMPT } from "@/lib/prompts";
import {
  REQUIRED_INTAKE_FIELDS,
  isRequiredIntakeFieldMissing,
} from "@/lib/constants";
import { ParsedIntake } from "@/lib/types";
import {
  isGenericSquirrelSpecies,
  resolveSpecificSquirrelSpecies,
} from "@/lib/species";

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

export async function POST(request: NextRequest) {
  try {
    const { tokens } = await requireAuth(request);
    const jsonResponse = (body: unknown, init?: ResponseInit) => {
      const response = NextResponse.json(body, init);
      if (tokens) {
        setAuthCookies(response, tokens);
      }
      return response;
    };
    const { existingIntake, additionalText } = await request.json();

    if (!existingIntake || !additionalText) {
      return jsonResponse(
        { success: false, error: "Missing existingIntake or additionalText" },
        { status: 400 }
      );
    }

    const prompt = injectDateTime(INTAKE_MERGE_PROMPT)
      .replace(
      "{existingIntake}",
      JSON.stringify(existingIntake, null, 2)
    )
      .replace("{additionalText}", additionalText);

    const response = await openai.chat.completions.create({
      model: "gpt-4.1",
      messages: [
        { role: "system", content: prompt },
        { role: "user", content: additionalText },
      ],
      response_format: { type: "json_object" },
      max_tokens: 2048,
    });

    const content = response.choices[0]?.message?.content || "{}";
    let merged: ParsedIntake;

    try {
      merged = JSON.parse(content);
    } catch {
      return jsonResponse(
        { success: false, error: "Failed to parse merged response" },
        { status: 500 }
      );
    }

    if (
      isGenericSquirrelSpecies(existingIntake?.species) &&
      !merged.species
    ) {
      merged.species = existingIntake.species;
    }

    const explicitSquirrelSpecies = resolveSpecificSquirrelSpecies(
      additionalText
    );
    if (explicitSquirrelSpecies) {
      merged.species = explicitSquirrelSpecies;
    }

    const missingFields = REQUIRED_INTAKE_FIELDS.filter((field) => {
      const value = merged[field.key as keyof typeof merged];
      return isRequiredIntakeFieldMissing(field.key, value);
    }).map((field) => field.label);

    return jsonResponse({
      success: true,
      data: {
        parsed: merged,
        missingFields,
        isComplete: missingFields.length === 0,
      },
    });
  } catch (error) {
    console.error("Merge intake error:", error);

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to merge intake data" },
      { status: 500 }
    );
  }
}
