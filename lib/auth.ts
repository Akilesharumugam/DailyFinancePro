import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { CompanyRole, Viewer } from "@/lib/types";

const demoViewer: Viewer = {
  id: "demo-owner",
  email: "owner@vasufinance.example",
  fullName: "Vijay Murugan",
  demo: true,
  memberships: [
    { companyId: "demo-vasu", companyName: "Vasu Finance", companySlug: "vasu-finance", role: "owner" },
    { companyId: "demo-sri", companyName: "Sri Nidhi Chits", companySlug: "sri-nidhi", role: "manager" },
  ],
  activeCompany: { companyId: "demo-vasu", companyName: "Vasu Finance", companySlug: "vasu-finance", role: "owner" },
};

export async function getViewer(): Promise<Viewer | null> {
  if (!isSupabaseConfigured()) {
    const store = await cookies();
    const selected = store.get("dfp_company")?.value;
    const activeCompany = demoViewer.memberships.find((m) => m.companyId === selected) ?? demoViewer.activeCompany;
    return { ...demoViewer, activeCompany };
  }

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) return null;

  const [{ data: profile }, { data: rows }] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("id", userId).single(),
    supabase
      .from("company_memberships")
      .select("company_id, role, companies!inner(name, slug)")
      .eq("user_id", userId)
      .eq("status", "active"),
  ]);

  const memberships = (rows ?? []).map((row: Record<string, unknown>) => {
    const company = row.companies as { name: string; slug: string };
    return {
      companyId: String(row.company_id),
      companyName: company.name,
      companySlug: company.slug,
      role: row.role as CompanyRole,
    };
  });
  if (!memberships.length) return null;

  const store = await cookies();
  const selected = store.get("dfp_company")?.value;
  const activeCompany = memberships.find((m) => m.companyId === selected) ?? memberships[0];
  return {
    id: userId,
    email: String(claimsData.claims.email ?? ""),
    fullName: profile?.full_name ?? String(claimsData.claims.email ?? "User").split("@")[0],
    memberships,
    activeCompany,
    demo: false,
  };
}

export async function requireViewer() {
  const viewer = await getViewer();
  if (!viewer) redirect("/login");
  return viewer;
}
