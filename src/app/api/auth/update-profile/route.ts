import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, supabaseAuth } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const accessToken = request.cookies.get("sb-access-token")?.value;
  if (!accessToken) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const name = typeof body.name === "string" ? body.name.trim() : "";

  if (!name) {
    return NextResponse.json(
      { success: false, error: "Name is required" },
      { status: 400 }
    );
  }

  if (name.length > 60) {
    return NextResponse.json(
      { success: false, error: "Name must be 60 characters or fewer" },
      { status: 400 }
    );
  }

  const { data, error } = await supabaseAuth.auth.getUser(accessToken);
  if (error || !data.user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const existingMetadata =
    typeof data.user.user_metadata === "object" && data.user.user_metadata !== null
      ? data.user.user_metadata
      : {};

  const { data: updatedUser, error: updateError } =
    await supabaseAdmin.auth.admin.updateUserById(data.user.id, {
      user_metadata: { ...existingMetadata, name },
    });

  if (updateError || !updatedUser.user) {
    return NextResponse.json(
      { success: false, error: updateError?.message || "Update failed" },
      { status: 400 }
    );
  }

  return NextResponse.json({
    success: true,
    data: {
      id: updatedUser.user.id,
      name: (updatedUser.user.user_metadata?.name as string | undefined) ||
        updatedUser.user.email ||
        "User",
      email: updatedUser.user.email,
    },
  });
}
