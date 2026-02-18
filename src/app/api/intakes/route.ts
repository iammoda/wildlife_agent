import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function GET() {
  try {
    const session = await requireAuth();
    const { data: intakes, error } = await supabaseAdmin
      .from("intakes")
      .select(
        `
        *,
        dispositions (disposition_code)
      `
      )
      .eq("user_id", session.userId)
      .order("intake_date", { ascending: false });

    if (error) {
      console.error("Error fetching intakes:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch intakes" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: intakes,
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

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await request.json();

    if (!body.intake_number || !body.species) {
      return NextResponse.json(
        { success: false, error: "Intake number and species are required" },
        { status: 400 }
      );
    }

    const { data: existing } = await supabaseAdmin
      .from("intakes")
      .select("id")
      .eq("user_id", session.userId)
      .eq("intake_number", body.intake_number)
      .single();

    if (existing) {
      return NextResponse.json(
        { success: false, error: "Intake number already exists" },
        { status: 400 }
      );
    }

    const { data: intake, error } = await supabaseAdmin
      .from("intakes")
      .insert({
        user_id: session.userId,
        intake_number: body.intake_number,
        intake_date: body.intake_date || new Date().toISOString(),
        species: body.species,
        quantity: body.quantity || 1,
        sex: body.sex || "Unknown",
        finder_name: body.finder_name,
        finder_phone: body.finder_phone,
        finder_email: body.finder_email,
        finder_address: body.finder_address,
        found_date: body.found_date,
        found_location: body.found_location,
        intake_reason: body.intake_reason,
        how_description: body.how_description,
        food_offered: body.food_offered,
        donation_amount: body.donation_amount,
        notes: body.notes,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating intake:", error);
      return NextResponse.json(
        { success: false, error: "Failed to create intake" },
        { status: 500 }
      );
    }

    await supabaseAdmin
      .from("user_settings")
      .update({
        last_intake_number: body.intake_number,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", session.userId);

    if (body.weight || body.age || body.distress_code || body.exam_notes) {
      await supabaseAdmin.from("patient_exams").insert({
        user_id: session.userId,
        intake_id: intake.id,
        weight: body.weight,
        age: body.age,
        distress_code: body.distress_code,
        distress_subcode: body.distress_subcode,
        treatment_notes: body.exam_notes,
      });
    }

    return NextResponse.json({
      success: true,
      data: intake,
    });
  } catch (error) {
    console.error("Create intake error:", error);

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
