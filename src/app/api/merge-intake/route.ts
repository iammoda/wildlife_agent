import { NextRequest, NextResponse } from "next/server";
import { openai } from "@/lib/openai";
import { requireAuth } from "@/lib/auth";
import { INTAKE_MERGE_PROMPT } from "@/lib/prompts";
import { REQUIRED_INTAKE_FIELDS } from "@/lib/constants";
import { ParsedIntake } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    await requireAuth();
    const { existingIntake, additionalText } = await request.json();

    if (!existingIntake || !additionalText) {
      return NextResponse.json(
        { success: false, error: "Missing existingIntake or additionalText" },
        { status: 400 }
      );
    }

    const prompt = INTAKE_MERGE_PROMPT.replace(
      "{existingIntake}",
      JSON.stringify(existingIntake, null, 2)
    ).replace("{additionalText}", additionalText);

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
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
      return NextResponse.json(
        { success: false, error: "Failed to parse merged response" },
        { status: 500 }
      );
    }

    const missingFields = REQUIRED_INTAKE_FIELDS.filter((field) => {
      const value = merged[field.key as keyof typeof merged];
      return value === null || value === undefined || value === "";
    }).map((field) => field.label);

    return NextResponse.json({
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
