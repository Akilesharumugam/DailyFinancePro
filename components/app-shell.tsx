"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Bell, Building2, ChevronDown, HandCoins, LayoutDashboard, Menu, ReceiptIndianRupee, Settings, Users, UsersRound, X } from "lucide-react";
import { useState } from "react";
import { selectCompany, signOut } from "@/app/actions/auth";
import type { Viewer } from "@/lib/types";

const nav = [
  ["/dashboard", "Dashboard", LayoutDashboard],
  ["/customers", "Customers", Users],
  ["/chit-groups", "Chit Groups", Building2],
  ["/collections", "Collections", HandCoins],
  ["/reports", "Reports", BarChart3],
  ["/team", "Team & Roles", UsersRound],
  ["/settings", "Settings", Settings],
] as const;

const roleLabel = { owner: "Owner", manager: "Manager", collection_agent: "Collection Agent", accountant: "Accountant", viewer: "Viewer" };

export function AppShell({ viewer, children }: { viewer: Viewer; children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const initials = viewer.fullName.split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase();
  return (
    <div className="shell">
      {open && <button className="sidebar-scrim" aria-label="Close navigation" onClick={() => setOpen(false)} />}
      <aside className={`sidebar ${open ? "open" : ""}`}>
        <div className="brand brand-light"><span className="brand-mark">DF</span><span>DailyFinance Pro</span><button className="sidebar-close" onClick={() => setOpen(false)} aria-label="Close navigation"><X /></button></div>
        <form action={selectCompany} className="company-switcher">
          <select name="company_id" defaultValue={viewer.activeCompany.companyId} aria-label="Active company">
            {viewer.memberships.map((membership) => <option value={membership.companyId} key={membership.companyId}>{membership.companyName}</option>)}
          </select><ChevronDown /><button type="submit" className="company-switch-button">Switch</button>
        </form>
        <div className="sidebar-user"><span className="avatar small">{initials}</span><div><strong>{viewer.fullName}</strong><span>{roleLabel[viewer.activeCompany.role]}</span></div></div>
        <nav>{nav.map(([href, label, Icon]) => <Link href={href} className={pathname === href ? "active" : ""} key={href} onClick={() => setOpen(false)}><Icon />{label}</Link>)}</nav>
        <div className="sidebar-foot"><span><ReceiptIndianRupee />{viewer.demo ? "Demo workspace" : "Live workspace"}</span><form action={signOut}><button>Sign out</button></form></div>
      </aside>
      <div className="shell-main">
        <header className="topbar">
          <button className="menu-button" onClick={() => setOpen(true)} aria-label="Open navigation"><Menu /></button>
          <div className="topbar-title"><span>{nav.find(([href]) => href === pathname)?.[1] ?? "DailyFinance Pro"}</span><small>Friday, 17 July 2026</small></div>
          <div className="topbar-company"><strong>{viewer.activeCompany.companyName}</strong><span>{roleLabel[viewer.activeCompany.role]}</span></div>
          <button className="icon-button" aria-label="Notifications"><Bell /><i>3</i></button>
          <span className="avatar">{initials}</span>
        </header>
        <main className="content">{children}</main>
      </div>
    </div>
  );
}
