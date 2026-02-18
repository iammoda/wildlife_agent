import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function GET() {
  try {
    const session = await requireAuth();
    const { data: intakes } = await supabaseAdmin
      .from("intakes")
      .select("*, dispositions(disposition_code)")
      .eq("user_id", session.userId);

    if (!intakes) {
      return NextResponse.json({
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
      return !disp || disp.disposition_code === "P" || !disp.disposition_code;
    }).length;
    const intakesThisWeek = intakes.filter(
      (i: any) => new Date(i.intake_date) >= weekAgo
    ).length;
    const intakesThisMonth = intakes.filter(
      (i: any) => new Date(i.intake_date) >= monthAgo
    ).length;

    return NextResponse.json({
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
