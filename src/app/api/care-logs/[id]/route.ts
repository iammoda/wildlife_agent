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
    const body = await request.json();
    const { id } = await context.params;

    const { data: log, error } = await supabaseAdmin
      .from("daily_care_logs")
      .update({
        log_date: body.log_date,
        weight: body.weight,
        food_fed: body.food_fed,
        amount: body.amount,
        meds_and_comments: body.meds_and_comments,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", session.userId)
      .select()
      .single();

    if (error || !log) {
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
