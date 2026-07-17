import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/dashboard";
  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (user) {
        const admin = createAdminClient();
        await admin.from("company_memberships").update({ status: "active" }).eq("user_id", user.id).eq("status", "invited");
        if (next === "/onboarding") {
          const companyName = String(user.user_metadata.pending_company_name ?? "");
          const companySlug = String(user.user_metadata.pending_company_slug ?? "");
          if (companyName && companySlug) {
            const { data: existing } = await supabase.from("company_memberships").select("company_id").limit(1);
            if (!existing?.length) await supabase.rpc("create_company", { company_name: companyName, company_slug: companySlug });
          }
          return NextResponse.redirect(new URL("/dashboard", url.origin));
        }
      }
      return NextResponse.redirect(new URL(next, url.origin));
    }
  }
  return NextResponse.redirect(new URL("/login?error=Could not confirm authentication", url.origin));
}
