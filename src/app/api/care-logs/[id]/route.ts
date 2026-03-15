import { NextRequest, NextResponse } from "next/server";
import { requireAuth, setAuthCookies } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/server";

function isValidDate(dateStr: string): boolean {
  const date = new Date(dateStr);
  return !Number.isNaN(date.getTime());
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { session, tokens } = await requireAuth(request);
    const jsonResponse = (body: unknown, init?: ResponseInit) => {
      const response = NextResponse.json(body, init);
      if (tokens) {
        setAuthCookies(response, tokens);
      }
      return response;
    };
    const { id } = await context.params;
    const { data: log, error } = await supabaseAdmin
      .from("daily_care_logs")
      .select("*")
      .eq("id", id)
      .eq("user_id", session.userId)
      .single();

    if (error || !log) {
      return jsonResponse(
        { success: false, error: "Care log not found" },
        { status: 404 }
      );
    }

    return jsonResponse({
      success: true,
      data: log,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { session, tokens } = await requireAuth(request);
    const jsonResponse = (body: unknown, init?: ResponseInit) => {
      const response = NextResponse.json(body, init);
      if (tokens) {
        setAuthCookies(response, tokens);
      }
      return response;
    };
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return jsonResponse(
        { success: false, error: "Invalid request body" },
        { status: 400 }
      );
    }

    if (!body || typeof body !== "object") {
      return jsonResponse(
        { success: false, error: "Invalid request body" },
        { status: 400 }
      );
    }

    const bodyObj = body as Record<string, unknown>;
    const { id } = await context.params;

    const updates: Record<string, unknown> = {};

    if ("log_date" in bodyObj) {
      const logDate = bodyObj.log_date;
      if (logDate !== null && logDate !== undefined) {
        if (typeof logDate !== "string" || !isValidDate(logDate)) {
          return jsonResponse(
            { success: false, error: "Invalid log_date. Use a valid ISO date." },
            { status: 400 }
          );
        }
      }
      updates.log_date = logDate;
    }

    if ("weight" in bodyObj) updates.weight = bodyObj.weight;
    if ("food_fed" in bodyObj) updates.food_fed = bodyObj.food_fed;
    if ("amount" in bodyObj) updates.amount = bodyObj.amount;
    if ("meds_and_comments" in bodyObj) {
      updates.meds_and_comments = bodyObj.meds_and_comments;
    }
    if ("stool" in bodyObj) updates.stool = bodyObj.stool;
    if ("aspiration" in bodyObj) updates.aspiration = bodyObj.aspiration;
    if ("aspiration_notes" in bodyObj) {
      updates.aspiration_notes = bodyObj.aspiration_notes;
    }
    if ("medications" in bodyObj) updates.medications = bodyObj.medications;

    if (Object.keys(updates).length === 0) {
      return jsonResponse(
        {
          success: false,
          error:
            "No updatable fields provided. Include log_date, weight, food_fed, amount, stool, aspiration, medications, or meds_and_comments.",
        },
        { status: 400 }
      );
    }

    const { data: existingLog, error: existingError } = await supabaseAdmin
      .from("daily_care_logs")
      .select("id")
      .eq("id", id)
      .eq("user_id", session.userId)
      .single();

    if (existingError || !existingLog) {
      return jsonResponse(
        { success: false, error: "Care log not found" },
        { status: 404 }
      );
    }

    const { data: log, error } = await supabaseAdmin
      .from("daily_care_logs")
      .update(updates)
      .eq("id", id)
      .eq("user_id", session.userId)
      .select()
      .single();

    if (error || !log) {
      console.error("Failed to update care log:", {
        error,
        userId: session.userId,
        careLogId: id,
        updates,
      });
      return jsonResponse(
        { success: false, error: "Failed to update care log" },
        { status: 500 }
      );
    }

    return jsonResponse({
      success: true,
      data: log,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    console.error("Care log PUT route error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { session, tokens } = await requireAuth(request);
    const jsonResponse = (body: unknown, init?: ResponseInit) => {
      const response = NextResponse.json(body, init);
      if (tokens) {
        setAuthCookies(response, tokens);
      }
      return response;
    };
    const { id } = await context.params;

    const { error } = await supabaseAdmin
      .from("daily_care_logs")
      .delete()
      .eq("id", id)
      .eq("user_id", session.userId);

    if (error) {
      return jsonResponse(
        { success: false, error: "Failed to delete care log" },
        { status: 500 }
      );
    }

    return jsonResponse({
      success: true,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
