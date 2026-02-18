import { NextRequest, NextResponse } from "next/server";
import { openai } from "@/lib/openai";
import { requireAuth } from "@/lib/auth";
import { CARE_LOG_PARSING_PROMPT } from "@/lib/prompts";
import { ParsedCareLog } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    await requireAuth();
    const { text } = await request.json();

    if (!text) {
      return NextResponse.json(
        { success: false, error: "No text provided" },
        { status: 400 }
      );
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: CARE_LOG_PARSING_PROMPT },
        { role: "user", content: text },
      ],
      response_format: { type: "json_object" },
      max_tokens: 1024,
    });

    const content = response.choices[0]?.message?.content || "{}";
    let parsed: ParsedCareLog;

    try {
      parsed = JSON.parse(content);
    } catch {
      return NextResponse.json(
        { success: false, error: "Failed to parse response" },
        { status: 500 }
      );
    }

    if (!parsed.log_date) {
      parsed.log_date = new Date().toISOString();
    }

    return NextResponse.json({
      success: true,
      data: parsed,
    });
  } catch (error) {
    console.error("Parse care log error:", error);

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to parse care log" },
      { status: 500 }
    );
  }
}
