import { NextRequest, NextResponse } from "next/server";
import { supabaseAuth } from "@/lib/supabase/server";

export const ACCESS_COOKIE = "sb-access-token";
export const REFRESH_COOKIE = "sb-refresh-token";
export const AUTH_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 90;

export type AuthSession = {
  userId: string;
  userName: string;
  userEmail: string | null;
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export function setAuthCookies(response: NextResponse, tokens: AuthTokens) {
  const options = {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    maxAge: AUTH_COOKIE_MAX_AGE_SECONDS,
  };

  response.cookies.set(ACCESS_COOKIE, tokens.accessToken, options);
  response.cookies.set(REFRESH_COOKIE, tokens.refreshToken, options);
}

function buildAuthSession(user: {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown> | null;
}): AuthSession {
  const name =
    (user.user_metadata?.name as string | undefined) || user.email || "User";
  return {
    userId: user.id,
    userName: name,
    userEmail: user.email ?? null,
  };
}

export async function requireAuth(
  request: NextRequest
): Promise<{ session: AuthSession; tokens?: AuthTokens }> {
  const accessToken = request.cookies.get(ACCESS_COOKIE)?.value;
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;

  if (accessToken) {
    const { data, error } = await supabaseAuth.auth.getUser(accessToken);
    if (!error && data.user) {
      return { session: buildAuthSession(data.user) };
    }
  }

  if (!refreshToken) {
    throw new Error("Unauthorized");
  }

  const { data, error } = await supabaseAuth.auth.refreshSession({
    refresh_token: refreshToken,
  });

  if (error || !data.session || !data.user) {
    throw new Error("Unauthorized");
  }

  return {
    session: buildAuthSession(data.user),
    tokens: {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
    },
  };
}
