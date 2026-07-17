import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Building2,
  CheckCircle2,
  KeyRound,
  Layers3,
  Mail,
  ShieldCheck,
  Users,
} from "lucide-react";
import { registerCompany, requestPasswordReset, signIn } from "@/app/actions/auth";
import { PasswordField } from "@/components/password-field";
import { getViewer } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";

type Mode = "signin" | "register" | "forgot";

type Props = {
  searchParams: Promise<{ error?: string; message?: string; mode?: string }>;
};

function resolveMode(mode?: string): Mode {
  if (mode === "register") return "register";
  if (mode === "forgot") return "forgot";
  return "signin";
}

const copy: Record<Mode, { title: string; subtitle: string; submit: string; icon: typeof KeyRound }> = {
  signin: {
    title: "Welcome back",
    subtitle: "Sign in to your company workspace.",
    submit: "Sign in",
    icon: KeyRound,
  },
  register: {
    title: "Create your company",
    subtitle: "Set up the owner account and first workspace.",
    submit: "Create company account",
    icon: Building2,
  },
  forgot: {
    title: "Reset your password",
    subtitle: "We will email you a secure link to choose a new password.",
    submit: "Send reset link",
    icon: Mail,
  },
};

export default async function LoginPage({ searchParams }: Props) {
  const viewer = await getViewer();
  if (viewer && isSupabaseConfigured()) redirect("/dashboard");

  const query = await searchParams;
  const mode = resolveMode(query.mode);
  const configured = isSupabaseConfigured();
  const heading = copy[mode];
  const HeadingIcon = heading.icon;
  const formAction =
    mode === "register" ? registerCompany : mode === "forgot" ? requestPasswordReset : signIn;

  return (
    <main className="login-page">
      <section className="login-story" aria-label="Product overview">
        <div className="brand brand-light">
          <span className="brand-mark">DF</span>
          <span>DailyFinance Pro</span>
        </div>
        <div className="story-copy">
          <h1>Run every collection with clarity.</h1>
          <p>
            A secure workspace for chit fund owners, managers, accountants, and field collection
            teams.
          </p>
          <div className="story-list">
            <span>
              <ShieldCheck />
              Company data isolated by database policies
            </span>
            <span>
              <Users />
              Role-based access for your full team
            </span>
            <span>
              <Layers3 />
              Customers, chits, collections, and reports together
            </span>
          </div>
        </div>
        <div className="security-note">
          <CheckCircle2 />
          Protected by Supabase Auth and Postgres RLS
        </div>
      </section>

      <section className="login-panel">
        <div className="login-card">
          <div className="mobile-brand brand">
            <span className="brand-mark">DF</span>
            <span>DailyFinance Pro</span>
          </div>

          <div className="login-heading">
            <div className="heading-icon">
              <HeadingIcon />
            </div>
            <div>
              <h2>{heading.title}</h2>
              <p>{heading.subtitle}</p>
            </div>
          </div>

          {query.error && (
            <p className="form-message error" role="alert">
              {query.error}
            </p>
          )}
          {query.message && (
            <p className="form-message success" role="status">
              {query.message}
            </p>
          )}

          <form action={formAction} className="auth-form">
            {mode === "register" && (
              <>
                <label>
                  Full name
                  <input name="full_name" placeholder="Vijay Murugan" autoComplete="name" required />
                </label>
                <div className="form-grid">
                  <label>
                    Company name
                    <input name="company_name" placeholder="Vasu Finance" required />
                  </label>
                  <label>
                    Company URL code
                    <input
                      name="company_slug"
                      placeholder="vasu-finance"
                      pattern="[a-zA-Z0-9-]+"
                      title="Letters, numbers, and hyphens only"
                      required
                    />
                  </label>
                </div>
              </>
            )}

            <label>
              Email address
              <input
                type="email"
                name="email"
                placeholder="you@company.com"
                autoComplete="email"
                required
              />
            </label>

            {mode !== "forgot" && (
              <PasswordField
                placeholder={mode === "register" ? "At least 8 characters" : "Enter your password"}
                autoComplete={mode === "register" ? "new-password" : "current-password"}
                action={
                  mode === "signin" ? (
                    <Link href="/login?mode=forgot" className="forgot-link">
                      Forgot password?
                    </Link>
                  ) : undefined
                }
              />
            )}

            <button className="primary-button" type="submit">
              {heading.submit}
            </button>
          </form>

          {!configured && (
            <div className="demo-box">
              <strong>Preview mode</strong>
              <p>
                Supabase keys are not configured yet. Open the complete dashboard with sample data.
              </p>
              <Link href="/dashboard" className="secondary-button">
                Open demo dashboard
              </Link>
            </div>
          )}

          <p className="switch-auth">
            {mode === "register" && (
              <>
                Already have an account? <Link href="/login">Sign in</Link>
              </>
            )}
            {mode === "signin" && (
              <>
                Starting a new company? <Link href="/login?mode=register">Create company</Link>
              </>
            )}
            {mode === "forgot" && (
              <>
                Remembered your password? <Link href="/login">Back to sign in</Link>
              </>
            )}
          </p>
        </div>
      </section>
    </main>
  );
}
