"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

function value(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export async function signIn(formData: FormData) {
  if (!isSupabaseConfigured()) redirect("/dashboard");
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: value(formData, "email"),
    password: value(formData, "password"),
  });
  if (error) redirect(`/login?error=${encodeURIComponent(error.message)}`);
  redirect("/dashboard");
}

export async function registerCompany(formData: FormData) {
  if (!isSupabaseConfigured()) redirect("/dashboard");
  const supabase = await createClient();
  const email = value(formData, "email");
  const password = value(formData, "password");
  const fullName = value(formData, "full_name");
  const companyName = value(formData, "company_name");
  const slug = value(formData, "company_slug").toLowerCase().replace(/[^a-z0-9-]/g, "-");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, pending_company_name: companyName, pending_company_slug: slug },
      emailRedirectTo: `${appUrl}/auth/callback?next=/onboarding`,
    },
  });
  if (error) redirect(`/login?mode=register&error=${encodeURIComponent(error.message)}`);
  if (data.session) {
    const { error: rpcError } = await supabase.rpc("create_company", { company_name: companyName, company_slug: slug });
    if (rpcError) redirect(`/login?mode=register&error=${encodeURIComponent(rpcError.message)}`);
    redirect("/dashboard");
  }
  redirect("/login?message=Check your email to confirm the account, then sign in to create your company.");
}

export async function requestPasswordReset(formData: FormData) {
  if (!isSupabaseConfigured()) {
    redirect("/login?mode=forgot&error=Password%20reset%20requires%20Supabase%20configuration.");
  }
  const email = value(formData, "email");
  if (!email) redirect("/login?mode=forgot&error=Enter%20your%20email%20address.");

  const supabase = await createClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${appUrl}/auth/callback?next=/settings`,
  });
  if (error) redirect(`/login?mode=forgot&error=${encodeURIComponent(error.message)}`);
  redirect("/login?message=Check%20your%20email%20for%20a%20password%20reset%20link.");
}

export async function signOut() {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  const store = await cookies();
  store.delete("dfp_company");
  redirect("/login");
}

export async function selectCompany(formData: FormData) {
  const companyId = value(formData, "company_id");
  const store = await cookies();
  store.set("dfp_company", companyId, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/" });
  revalidatePath("/", "layout");
  redirect("/dashboard");
}
