import { NextRequest, NextResponse } from "next/server";
import { requireAuth, setAuthCookies } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/server";
import { incrementIntakeNumber } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    const { session, tokens } = await requireAuth(request);
    const jsonResponse = (body: unknown, init?: ResponseInit) => {
      const response = NextResponse.json(body, init);
      if (tokens) {
        setAuthCookies(response, tokens);
      }
      return response;
    };
    const { data: settings } = await supabaseAdmin
      .from("user_settings")
      .select("last_intake_number")
      .eq("user_id", session.userId)
      .single();

    let nextNumber = "";
    if (settings?.last_intake_number) {
      nextNumber = incrementIntakeNumber(settings.last_intake_number);
    }

    return jsonResponse({
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
