import { NextRequest, NextResponse } from "next/server";
import { requireAuth, setAuthCookies } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/server";
import { incrementIntakeNumber } from "@/lib/utils";

async function getNextIntakeNumber(
  userId: string,
  fallbackIntakeNumber: string
): Promise<string> {
  const { data: settings } = await supabaseAdmin
    .from("user_settings")
    .select("last_intake_number")
    .eq("user_id", userId)
    .maybeSingle();

  if (settings?.last_intake_number) {
    return incrementIntakeNumber(settings.last_intake_number);
  }

  const { data: latestIntake } = await supabaseAdmin
    .from("intakes")
    .select("intake_number")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return incrementIntakeNumber(
    latestIntake?.intake_number || fallbackIntakeNumber
  );
}

function isUniqueViolation(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const code = (error as { code?: string }).code;
  return code === "23505";
}

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
      return jsonResponse(
        { success: false, error: "Failed to fetch intakes" },
        { status: 500 }
      );
    }

    return jsonResponse({
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
    const { session, tokens } = await requireAuth(request);
    const jsonResponse = (body: unknown, init?: ResponseInit) => {
      const response = NextResponse.json(body, init);
      if (tokens) {
        setAuthCookies(response, tokens);
      }
      return response;
    };
    const body = await request.json();

    if (!body.intake_number || !body.species) {
      return jsonResponse(
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
      return jsonResponse(
        { success: false, error: "Intake number already exists" },
        { status: 400 }
      );
    }

    const maxRetries = 3;
    let retryCount = 0;
    let intakeNumber = body.intake_number;
    let intake: any = null;
    let error: any = null;

    while (retryCount < maxRetries) {
      const result = await supabaseAdmin
        .from("intakes")
        .insert({
          user_id: session.userId,
          intake_number: intakeNumber,
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

      intake = result.data;
      error = result.error;

      if (!error && intake) {
        break;
      }

      if (!isUniqueViolation(error)) {
        break;
      }

      retryCount += 1;
      if (retryCount >= maxRetries) {
        break;
      }

      intakeNumber = await getNextIntakeNumber(session.userId, intakeNumber);
    }

    if (error) {
      if (isUniqueViolation(error)) {
        return jsonResponse(
          {
            success: false,
            error:
              "Intake number conflict detected. Please retry to generate the next available number.",
          },
          { status: 409 }
        );
      }
      console.error("Error creating intake:", error);
      return jsonResponse(
        { success: false, error: "Failed to create intake" },
        { status: 500 }
      );
    }

    await supabaseAdmin
      .from("user_settings")
      .update({
        last_intake_number: intake.intake_number,
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

    return jsonResponse({
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
