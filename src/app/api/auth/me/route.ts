import { NextRequest, NextResponse } from "next/server";
import { requireAuth, setAuthCookies } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const { session, tokens } = await requireAuth(request, {
      allowIncompleteSetup: true,
    });
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

    if (tokens) {
      setAuthCookies(response, tokens);
    }

    return response;
  } catch {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }
}
