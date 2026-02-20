import { NextRequest, NextResponse } from "next/server";
import { requireAuth, setAuthCookies } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/server";
import { DISPOSITION_UNDER_CARE } from "@/lib/constants";

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
    const { data: intakes } = await supabaseAdmin
      .from("intakes")
      .select("*, dispositions(disposition_code)")
      .eq("user_id", session.userId);

    if (!intakes) {
      return jsonResponse({
        success: true,
        data: {
          total_intakes: 0,
          animals_under_care: 0,
          intakes_this_week: 0,
          intakes_this_month: 0,
        },
      });
    }

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const totalIntakes = intakes.length;
    const animalsUnderCare = intakes.filter((i: any) => {
      const disp = i.dispositions;
      return (
        !disp || disp.disposition_code === DISPOSITION_UNDER_CARE || !disp.disposition_code
      );
    }).length;
    const intakesThisWeek = intakes.filter(
      (i: any) => new Date(i.intake_date) >= weekAgo
    ).length;
    const intakesThisMonth = intakes.filter(
      (i: any) => new Date(i.intake_date) >= monthAgo
    ).length;

    return jsonResponse({
      success: true,
      data: {
        total_intakes: totalIntakes,
        animals_under_care: animalsUnderCare,
        intakes_this_week: intakesThisWeek,
        intakes_this_month: intakesThisMonth,
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
