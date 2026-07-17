import type { LucideIcon } from "lucide-react";

export function PageHeader({ title, description, actions }: { title: string; description: string; actions?: React.ReactNode }) {
  return <div className="page-header"><div><h1>{title}</h1><p>{description}</p></div>{actions && <div className="header-actions">{actions}</div>}</div>;
}

export function Metric({ label, value, detail, tone, icon: Icon }: { label: string; value: string; detail: string; tone: string; icon: LucideIcon }) {
  return <article className={`metric ${tone}`}><span className="metric-icon"><Icon /></span><div><span>{label}</span><strong>{value}</strong><small>{detail}</small></div></article>;
}

export function Status({ children, tone = "green" }: { children: React.ReactNode; tone?: "green" | "orange" | "red" | "blue" | "gray" }) {
  return <span className={`status ${tone}`}>{children}</span>;
}
