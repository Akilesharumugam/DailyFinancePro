import Link from "next/link";
import { Building2, CheckCircle2, KeyRound, Layers3, ShieldCheck, Users } from "lucide-react";
import { registerCompany, signIn } from "@/app/actions/auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";

type Props = { searchParams: Promise<{ error?: string; message?: string; mode?: string }> };

export default async function LoginPage({ searchParams }: Props) {
  const query = await searchParams;
  const register = query.mode === "register";
  const configured = isSupabaseConfigured();
  return (
    <main className="login-page">
      <section className="login-story">
        <div className="brand brand-light"><span className="brand-mark">DF</span><span>DailyFinance Pro</span></div>
        <div className="story-copy">
          <h1>Run every collection with clarity.</h1>
          <p>A secure workspace for chit fund owners, managers, accountants, and field collection teams.</p>
          <div className="story-list">
            <span><ShieldCheck />Company data isolated by database policies</span>
            <span><Users />Role-based access for your full team</span>
            <span><Layers3 />Customers, chits, collections, and reports together</span>
          </div>
        </div>
        <div className="security-note"><CheckCircle2 />Protected by Supabase Auth and Postgres RLS</div>
      </section>
      <section className="login-panel">
        <div className="login-card">
          <div className="mobile-brand brand"><span className="brand-mark">DF</span><span>DailyFinance Pro</span></div>
          <div className="login-heading">
            <div className="heading-icon">{register ? <Building2 /> : <KeyRound />}</div>
            <div><h2>{register ? "Create your company" : "Welcome back"}</h2><p>{register ? "Set up the owner account and first workspace." : "Sign in to your company workspace."}</p></div>
          </div>
          {query.error && <p className="form-message error">{query.error}</p>}
          {query.message && <p className="form-message success">{query.message}</p>}
          <form action={register ? registerCompany : signIn} className="auth-form">
            {register && <>
              <label>Full name<input name="full_name" placeholder="Vijay Murugan" required /></label>
              <div className="form-grid"><label>Company name<input name="company_name" placeholder="Vasu Finance" required /></label><label>Company URL code<input name="company_slug" placeholder="vasu-finance" pattern="[a-zA-Z0-9-]+" required /></label></div>
            </>}
            <label>Email address<input type="email" name="email" placeholder="you@company.com" autoComplete="email" required /></label>
            <label>Password<input type="password" name="password" placeholder={register ? "At least 8 characters" : "Enter your password"} minLength={8} autoComplete={register ? "new-password" : "current-password"} required /></label>
            <button className="primary-button" type="submit">{register ? "Create company account" : "Sign in"}</button>
          </form>
          {!configured && <div className="demo-box"><strong>Preview mode</strong><p>Supabase keys are not configured yet. Open the complete dashboard with sample data.</p><Link href="/dashboard" className="secondary-button">Open demo dashboard</Link></div>}
          <p className="switch-auth">{register ? "Already have an account?" : "Starting a new company?"} <Link href={register ? "/login" : "/login?mode=register"}>{register ? "Sign in" : "Create company"}</Link></p>
        </div>
      </section>
    </main>
  );
}
