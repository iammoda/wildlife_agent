import { NextRequest, NextResponse } from "next/server";
import { openai } from "@/lib/openai";
import { requireAuth, setAuthCookies } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/server";
import { CARE_LOG_PARSING_PROMPT } from "@/lib/prompts";
import { ParsedCareLog } from "@/lib/types";

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
    const { session, tokens } = await requireAuth(request);
    const jsonResponse = (body: unknown, init?: ResponseInit) => {
      const response = NextResponse.json(body, init);
      if (tokens) {
        setAuthCookies(response, tokens);
      }
      return response;
    };
    const { text } = await request.json();

    if (!text) {
      return jsonResponse(
        { success: false, error: "No text provided" },
        { status: 400 }
      );
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4.1",
      messages: [
        { role: "system", content: injectDateTime(CARE_LOG_PARSING_PROMPT) },
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
      return jsonResponse(
        { success: false, error: "Failed to parse response" },
        { status: 500 }
      );
    }

    if ((parsed as { error?: string }).error) {
      return jsonResponse({
        success: false,
        error: (parsed as { error?: string }).error,
      });
    }

    if (!parsed.intake_number) {
      return jsonResponse({
        success: false,
        error:
          "No intake number found in message. Please specify which intake.",
      });
    }

    const { data: intake, error: lookupError } = await supabaseAdmin
      .from("intakes")
      .select("id, intake_number")
      .eq("user_id", session.userId)
      .ilike("intake_number", `%${parsed.intake_number}%`)
      .single();

    if (lookupError || !intake) {
      return jsonResponse({
        success: false,
        error: `Could not find intake matching "${parsed.intake_number}". Please check the number.`,
      });
    }

    if (!parsed.log_date) {
      parsed.log_date = new Date().toISOString();
    }

    parsed.intake_id = intake.id;
    parsed.intake_number = intake.intake_number;

    return jsonResponse({
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
