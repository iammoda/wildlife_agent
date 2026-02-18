import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/server";
import { incrementIntakeNumber } from "@/lib/utils";

export async function GET() {
  try {
    const session = await requireAuth();
    const { data: settings } = await supabaseAdmin
      .from("user_settings")
      .select("last_intake_number")
      .eq("user_id", session.userId)
      .single();

    let nextNumber = "";
    if (settings?.last_intake_number) {
      nextNumber = incrementIntakeNumber(settings.last_intake_number);
    }

    return NextResponse.json({
      success: true,
      data: {
        next_number: nextNumber,
        last_number: settings?.last_intake_number || null,
      },
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
