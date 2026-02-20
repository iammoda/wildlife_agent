import { NextRequest, NextResponse } from "next/server";
import { requireAuth, setAuthCookies } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/server";
import {
  applyIntakeAndExamUpdates,
  isRecord,
} from "@/lib/intake-persistence";

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
      return jsonResponse(
        { success: false, error: "Intake not found" },
        { status: 404 }
      );
    }

    return jsonResponse({
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

    if (!isRecord(body)) {
      return jsonResponse(
        { success: false, error: "Request body must be a JSON object" },
        { status: 400 }
      );
    }

    const { data: existingIntake, error: existingIntakeError } =
      await supabaseAdmin
        .from("intakes")
        .select("id")
        .eq("id", id)
        .eq("user_id", session.userId)
        .single();

    if (existingIntakeError || !existingIntake) {
      return jsonResponse(
        { success: false, error: "Intake not found" },
        { status: 404 }
      );
    }

    const updateResult = await applyIntakeAndExamUpdates({
      intakeId: id,
      userId: session.userId,
      payload: body,
    });

    if (!updateResult.success) {
      const status = updateResult.status ?? 500;
      const responseBody: Record<string, unknown> = {
        success: false,
        error: updateResult.error || "Failed to update intake",
      };
      if (updateResult.invalidFields?.length) {
        responseBody.invalid_fields = updateResult.invalidFields;
      }
      return jsonResponse(
        responseBody,
        { status }
      );
    }

    return jsonResponse({
      success: true,
      data: updateResult.data,
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
      .from("intakes")
      .delete()
      .eq("id", id)
      .eq("user_id", session.userId);

    if (error) {
      return jsonResponse(
        { success: false, error: "Failed to delete intake" },
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
