import { NextRequest, NextResponse } from "next/server";
import { supabaseAuth } from "@/lib/supabase/server";

export const ACCESS_COOKIE = "sb-access-token";
export const REFRESH_COOKIE = "sb-refresh-token";
export const AUTH_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 90;

export type AuthSession = {
  userId: string;
  userName: string;
  userEmail: string | null;
  userProfileName: string | null;
  accountSetupCompleted: boolean;
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

type AuthenticatedUser = {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown> | null;
};

type RequireAuthOptions = {
  allowIncompleteSetup?: boolean;
};

class AuthError extends Error {
  constructor(
    message: string,
    public readonly code: "unauthorized" | "account_setup_incomplete"
  ) {
    super(message);
  }
}

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

export function clearAuthCookies(response: NextResponse) {
  const options = {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 0,
  };

  response.cookies.set(ACCESS_COOKIE, "", options);
  response.cookies.set(REFRESH_COOKIE, "", options);
}

function parseProfileName(user: AuthenticatedUser) {
  const profileName = user.user_metadata?.name;
  return typeof profileName === "string" && profileName.trim()
    ? profileName.trim()
    : null;
}

export function isAccountSetupCompleted(user: AuthenticatedUser) {
  return user.user_metadata?.account_setup_completed !== false;
}

export function buildAuthSession(user: AuthenticatedUser): AuthSession {
  const profileName = parseProfileName(user);
  const name = profileName || user.email || "User";
  return {
    userId: user.id,
    userName: name,
    userEmail: user.email ?? null,
    userProfileName: profileName,
    accountSetupCompleted: isAccountSetupCompleted(user),
  };
}

export async function requireAuth(
  request: NextRequest,
  options: RequireAuthOptions = {}
): Promise<{ session: AuthSession; tokens?: AuthTokens }> {
  const accessToken = request.cookies.get(ACCESS_COOKIE)?.value;
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;

  if (accessToken) {
    const { data, error } = await supabaseAuth.auth.getUser(accessToken);
    if (!error && data.user) {
      const session = buildAuthSession(data.user);
      if (!options.allowIncompleteSetup && !session.accountSetupCompleted) {
        throw new AuthError(
          "Account setup incomplete",
          "account_setup_incomplete"
        );
      }
      return { session };
    }
  }

  if (!refreshToken) {
    throw new AuthError("Unauthorized", "unauthorized");
  }

  const { data, error } = await supabaseAuth.auth.refreshSession({
    refresh_token: refreshToken,
  });

  if (error || !data.session || !data.user) {
    throw new AuthError("Unauthorized", "unauthorized");
  }

  const session = buildAuthSession(data.user);
  if (!options.allowIncompleteSetup && !session.accountSetupCompleted) {
    throw new AuthError("Account setup incomplete", "account_setup_incomplete");
  }

  return {
    session,
    tokens: {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
    },
  };
}

export function isAuthError(
  error: unknown
): error is AuthError {
  return error instanceof AuthError;
}
