import { NextRequest, NextResponse } from "next/server";
import { openai } from "@/lib/openai";
import { requireAuth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/server";
import { INTAKE_PARSING_PROMPT } from "@/lib/prompts";
import { incrementIntakeNumber } from "@/lib/utils";
import { ParsedIntake } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const { text } = await request.json();

    if (!text) {
      return NextResponse.json(
        { success: false, error: "No text provided" },
        { status: 400 }
      );
    }

    const { data: settings } = await supabaseAdmin
      .from("user_settings")
      .select("last_intake_number")
      .eq("user_id", session.userId)
      .single();

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: INTAKE_PARSING_PROMPT },
        { role: "user", content: text },
      ],
      response_format: { type: "json_object" },
      max_tokens: 2048,
    });

    const content = response.choices[0]?.message?.content || "{}";
    let parsed: ParsedIntake;

    try {
      parsed = JSON.parse(content);
    } catch {
      return NextResponse.json(
        { success: false, error: "Failed to parse response" },
        { status: 500 }
      );
    }

    if (!parsed.intake_number) {
      if (settings?.last_intake_number) {
        parsed.intake_number = incrementIntakeNumber(
          settings.last_intake_number
        );
      } else {
        parsed.intake_number = "";
      }
    }

    if (!parsed.intake_date) {
      parsed.intake_date = new Date().toISOString();
    }

    return NextResponse.json({
      success: true,
      data: parsed,
    });
  } catch (error) {
    console.error("Parse intake error:", error);

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to parse intake" },
      { status: 500 }
    );
  }
}
