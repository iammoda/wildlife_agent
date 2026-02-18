import { NextRequest, NextResponse } from "next/server";
import { supabaseAuth } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const accessToken = request.cookies.get("sb-access-token")?.value;
  if (!accessToken) {
    return NextResponse.json({ success: false, error: "Unauthorized" });
  }

  const { data, error } = await supabaseAuth.auth.getUser(accessToken);
  if (error || !data.user) {
    return NextResponse.json({ success: false, error: "Unauthorized" });
  }

  return NextResponse.json({
    success: true,
    data: {
      id: data.user.id,
      name: (data.user.user_metadata?.name as string | undefined) ||
        data.user.email ||
        "User",
      email: data.user.email,
    },
  });
}
