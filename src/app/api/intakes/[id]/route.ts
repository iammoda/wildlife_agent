import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await context.params;
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
      .eq("id", id)
      .eq("user_id", session.userId)
      .single();

    if (error || !intake) {
      return NextResponse.json(
        { success: false, error: "Intake not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: intake,
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
    const session = await requireAuth();
    const body = await request.json();
    const { id } = await context.params;

    const { data: intake, error } = await supabaseAdmin
      .from("intakes")
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", session.userId)
      .select()
      .single();

    if (error || !intake) {
      return NextResponse.json(
        { success: false, error: "Failed to update intake" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: intake,
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
    const session = await requireAuth();
    const { id } = await context.params;
    const { error } = await supabaseAdmin
      .from("intakes")
      .delete()
      .eq("id", id)
      .eq("user_id", session.userId);

    if (error) {
      return NextResponse.json(
        { success: false, error: "Failed to delete intake" },
        { status: 500 }
      );
    }

    return NextResponse.json({
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
