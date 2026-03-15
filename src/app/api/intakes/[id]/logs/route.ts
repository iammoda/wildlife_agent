import { NextRequest, NextResponse } from "next/server";
import { requireAuth, setAuthCookies } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/server";

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
    const { data: logs, error } = await supabaseAdmin
      .from("daily_care_logs")
      .select("*")
      .eq("intake_id", id)
      .eq("user_id", session.userId)
      .order("log_date", { ascending: false });

    if (error) {
      return jsonResponse(
        { success: false, error: "Failed to fetch care logs" },
        { status: 500 }
      );
    }

    return jsonResponse({
      success: true,
      data: logs,
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

export async function POST(
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
    const body = await request.json();
    const { id } = await context.params;

    const { data: log, error } = await supabaseAdmin
      .from("daily_care_logs")
      .insert({
        user_id: session.userId,
        intake_id: id,
        log_date: body.log_date || new Date().toISOString(),
        weight: body.weight,
        food_fed: body.food_fed,
        amount: body.amount,
        meds_and_comments: body.meds_and_comments,
        stool: body.stool || null,
        aspiration: body.aspiration || false,
        aspiration_notes: body.aspiration ? body.aspiration_notes || null : null,
        medications: body.medications || [],
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating care log:", error);
      return jsonResponse(
        { success: false, error: "Failed to create care log" },
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

    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
