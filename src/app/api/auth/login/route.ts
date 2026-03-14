import { NextRequest, NextResponse } from "next/server";
import { buildAuthSession, isAccountSetupCompleted, setAuthCookies } from "@/lib/auth";
import { supabaseAuth } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const email = typeof body.email === "string" ? body.email : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!email || !password) {
    return NextResponse.json(
      { success: false, error: "Email and password are required" },
      { status: 400 }
    );
  }

  const { data, error } = await supabaseAuth.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.session || !data.user) {
    return NextResponse.json(
      { success: false, error: error?.message || "Invalid credentials" },
      { status: 401 }
    );
  }

  if (!isAccountSetupCompleted(data.user)) {
    return NextResponse.json(
      {
        success: false,
        error:
          "Finish activating your account from the invitation email before signing in.",
      },
      { status: 403 }
    );
  }

  const session = buildAuthSession(data.user);

  const response = NextResponse.json({
    success: true,
    data: {
      id: session.userId,
      name: session.userName,
      email: session.userEmail,
      profileName: session.userProfileName,
      accountSetupCompleted: session.accountSetupCompleted,
    },
  });

  setAuthCookies(response, {
    accessToken: data.session.access_token,
    refreshToken: data.session.refresh_token,
  });

  return response;
}
