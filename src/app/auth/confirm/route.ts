import { NextRequest, NextResponse } from "next/server";
import { clearAuthCookies, setAuthCookies } from "@/lib/auth";
import { supabaseAdmin, supabaseAuth } from "@/lib/supabase/server";

const ACTIVATION_ERROR_MESSAGE =
  "This activation link is invalid or has expired. Ask for a new invitation email.";

function redirectToLoginWithError(request: NextRequest, message: string) {
  const url = new URL("/login", request.url);
  url.searchParams.set("error", message);
  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const type = request.nextUrl.searchParams.get("type");

  if (!tokenHash || type !== "invite") {
    return redirectToLoginWithError(request, ACTIVATION_ERROR_MESSAGE);
  }

  const { data, error } = await supabaseAuth.auth.verifyOtp({
    token_hash: tokenHash,
    type: "invite",
  });

  if (error || !data.session || !data.user) {
    const response = redirectToLoginWithError(request, ACTIVATION_ERROR_MESSAGE);
    clearAuthCookies(response);
    return response;
  }

  const existingMetadata =
    typeof data.user.user_metadata === "object" && data.user.user_metadata !== null
      ? data.user.user_metadata
      : {};

  const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
    data.user.id,
    {
      user_metadata: {
        ...existingMetadata,
        account_setup_completed: false,
      },
    }
  );

  if (updateError) {
    const response = redirectToLoginWithError(
      request,
      "We couldn't start account setup. Ask for a new activation email."
    );
    clearAuthCookies(response);
    return response;
  }

  const { data: refreshedData } = await supabaseAuth.auth.refreshSession({
    refresh_token: data.session.refresh_token,
  });

  const session = refreshedData.session || data.session;
  const response = NextResponse.redirect(new URL("/activate-account", request.url));
  setAuthCookies(response, {
    accessToken: session.access_token,
    refreshToken: session.refresh_token,
  });
  return response;
}
