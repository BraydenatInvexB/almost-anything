import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/complete-profile";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const destination = next.startsWith("/") ? next : "/complete-profile";
      return NextResponse.redirect(`${origin}${destination}`);
    }
  }

  const nextParam = searchParams.get("next");
  if (nextParam?.startsWith("/admin")) {
    return NextResponse.redirect(`${origin}/admin/accept-invite?error=auth_callback_failed`);
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
