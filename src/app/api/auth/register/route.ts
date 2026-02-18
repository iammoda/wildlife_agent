import { NextRequest, NextResponse } from "next/server";
import { supabaseAuth } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const email = typeof body.email === "string" ? body.email : "";
  const password = typeof body.password === "string" ? body.password : "";
  const name = typeof body.name === "string" ? body.name : "";

  if (!email || !password) {
    return NextResponse.json(
      { success: false, error: "Email and password are required" },
      { status: 400 }
    );
  }

  const { data, error } = await supabaseAuth.auth.signUp({
    email,
    password,
    options: {
      data: { name },
    },
  });

  if (error || !data.user) {
    return NextResponse.json(
      { success: false, error: error?.message || "Registration failed" },
      { status: 400 }
    );
  }

  const response = NextResponse.json({
    success: true,
    data: {
      id: data.user.id,
      name: (data.user.user_metadata?.name as string | undefined) || email,
      email: data.user.email,
      needsConfirmation: !data.session,
    },
  });

  if (data.session) {
    response.cookies.set("sb-access-token", data.session.access_token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });
    response.cookies.set("sb-refresh-token", data.session.refresh_token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });
  }

  return response;
}
