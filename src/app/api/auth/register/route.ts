import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  await request.json().catch(() => ({}));
  return NextResponse.json(
    {
      success: false,
      error:
        "Account creation is invite-only. Use the activation link from your invitation email.",
    },
    { status: 403 }
  );
}
