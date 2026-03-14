import { NextRequest, NextResponse } from "next/server";
import { requireAuth, setAuthCookies } from "@/lib/auth";
import { supabaseAdmin, supabaseAuth } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  let tokens:
    | {
        accessToken: string;
        refreshToken: string;
      }
    | undefined;
  let userId: string;
  let existingName: string | null;
  let email: string | null;
  let accountSetupCompleted: boolean;

  try {
    const authResult = await requireAuth(request, { allowIncompleteSetup: true });
    tokens = authResult.tokens;
    userId = authResult.session.userId;
    existingName = authResult.session.userProfileName;
    email = authResult.session.userEmail;
    accountSetupCompleted = authResult.session.accountSetupCompleted;
  } catch {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const jsonResponse = (body: unknown, init?: ResponseInit) => {
    const response = NextResponse.json(body, init);
    if (tokens) {
      setAuthCookies(response, tokens);
    }
    return response;
  };

  if (accountSetupCompleted) {
    return jsonResponse(
      {
        success: false,
        error: "This account has already been activated.",
      },
      { status: 409 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const confirmPassword =
    typeof body.confirmPassword === "string" ? body.confirmPassword : "";

  if (!email) {
    return jsonResponse(
      { success: false, error: "Unable to determine invited email address." },
      { status: 400 }
    );
  }

  if (!name) {
    return jsonResponse(
      { success: false, error: "Name is required" },
      { status: 400 }
    );
  }

  if (name.length > 60) {
    return jsonResponse(
      { success: false, error: "Name must be 60 characters or fewer" },
      { status: 400 }
    );
  }

  if (password.length < 8) {
    return jsonResponse(
      { success: false, error: "Password must be at least 8 characters" },
      { status: 400 }
    );
  }

  if (password !== confirmPassword) {
    return jsonResponse(
      { success: false, error: "Passwords do not match" },
      { status: 400 }
    );
  }

  const { data: currentUser, error: fetchError } =
    await supabaseAdmin.auth.admin.getUserById(userId);

  if (fetchError || !currentUser.user) {
    return jsonResponse(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const existingMetadata =
    typeof currentUser.user.user_metadata === "object" &&
    currentUser.user.user_metadata !== null
      ? currentUser.user.user_metadata
      : {};

  const { data: updatedUser, error: updateError } =
    await supabaseAdmin.auth.admin.updateUserById(userId, {
      password,
      user_metadata: {
        ...existingMetadata,
        name,
        account_setup_completed: true,
      },
    });

  if (updateError || !updatedUser.user) {
    return jsonResponse(
      {
        success: false,
        error: updateError?.message || "Failed to activate account",
      },
      { status: 400 }
    );
  }

  const { data: signInData, error: signInError } =
    await supabaseAuth.auth.signInWithPassword({
      email,
      password,
    });

  if (signInError || !signInData.session) {
    return jsonResponse(
      {
        success: false,
        error:
          signInError?.message ||
          "Account was activated, but a new session could not be created.",
      },
      { status: 400 }
    );
  }

  tokens = {
    accessToken: signInData.session.access_token,
    refreshToken: signInData.session.refresh_token,
  };

  return jsonResponse({
    success: true,
    data: {
      id: updatedUser.user.id,
      email: updatedUser.user.email,
      name,
      profileName: name || existingName,
      accountSetupCompleted: true,
    },
  });
}
