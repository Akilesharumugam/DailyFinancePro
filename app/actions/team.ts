"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { requireViewer } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { CompanyRole } from "@/lib/types";

const allowedRoles: CompanyRole[] = ["manager", "collection_agent", "accountant", "viewer"];

export async function inviteMember(formData: FormData) {
  if (!isSupabaseConfigured()) redirect("/team?message=Invitation simulated in demo mode");
  const viewer = await requireViewer();
  if (!["owner", "manager"].includes(viewer.activeCompany.role)) redirect("/team?error=Only owners and managers can invite members");

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const role = String(formData.get("role") ?? "viewer") as CompanyRole;
  if (!allowedRoles.includes(role)) redirect("/team?error=Invalid role");
  if (viewer.activeCompany.role === "manager" && role === "manager") redirect("/team?error=Only owners can add managers");

  const admin = createAdminClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${appUrl}/auth/callback?next=/dashboard`,
  });
  if (error || !data.user) redirect(`/team?error=${encodeURIComponent(error?.message ?? "Could not invite user")}`);

  const { error: membershipError } = await admin.from("company_memberships").upsert({
    company_id: viewer.activeCompany.companyId,
    user_id: data.user.id,
    role,
    status: "invited",
    invited_by: viewer.id,
  });
  if (membershipError) redirect(`/team?error=${encodeURIComponent(membershipError.message)}`);

  // Validate caller session was real; keeps this action from becoming an open admin endpoint.
  const supabase = await createClient();
  await supabase.from("audit_logs").insert({
    company_id: viewer.activeCompany.companyId,
    actor_id: viewer.id,
    action: "member.invited",
    entity_type: "company_membership",
    metadata: { email, role },
  });
  redirect("/team?message=Invitation sent");
}
