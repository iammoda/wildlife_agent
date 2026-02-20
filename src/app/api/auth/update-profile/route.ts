import { NextRequest, NextResponse } from "next/server";
import { requireAuth, setAuthCookies } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  let tokens:
    | {
        accessToken: string;
        refreshToken: string;
      }
    | undefined;
  let userId: string;

  try {
    const authResult = await requireAuth(request);
    tokens = authResult.tokens;
    userId = authResult.session.userId;
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

  const body = await request.json().catch(() => ({}));
  const name = typeof body.name === "string" ? body.name.trim() : "";

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
      user_metadata: { ...existingMetadata, name },
    });

  if (updateError || !updatedUser.user) {
    return jsonResponse(
      { success: false, error: updateError?.message || "Update failed" },
      { status: 400 }
    );
  }

  const response = jsonResponse({
    success: true,
    data: {
      id: updatedUser.user.id,
      name: (updatedUser.user.user_metadata?.name as string | undefined) ||
        updatedUser.user.email ||
        "User",
      email: updatedUser.user.email,
    },
  });

  return response;
}
