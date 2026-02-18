import { cookies } from "next/headers";
import { supabaseAuth } from "@/lib/supabase/server";

const ACCESS_COOKIE = "sb-access-token";

export type AuthSession = {
  userId: string;
  userName: string;
  userEmail: string | null;
};

export async function getAuthUser() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_COOKIE)?.value;
  if (!accessToken) return null;

  const { data, error } = await supabaseAuth.auth.getUser(accessToken);
  if (error || !data.user) return null;
  return data.user;
}

export async function requireAuth(): Promise<AuthSession> {
  const user = await getAuthUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  const name =
    (user.user_metadata?.name as string | undefined) || user.email || "User";
  return {
    userId: user.id,
    userName: name,
    userEmail: user.email ?? null,
  };
}
