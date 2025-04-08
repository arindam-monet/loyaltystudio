'use client';

import { usePathname } from "next/navigation";
import { Navbar as BaseNavbar } from "@loyaltystudio/ui";

const adminLinks = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/demo-requests", label: "Demo Requests" },
  { href: "/admin/tenants", label: "Tenants" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/settings", label: "Settings" },
];

export default function AdminNavbar() {
  const pathname = usePathname();

  return (
    <BaseNavbar
      variant="admin"
      links={adminLinks}
      activePath={pathname}
      onLinkClick={(href: string) => {
        // Next.js will handle the navigation
      }}
      brandName="Loyalty Studio Admin"
      brandLink="/admin/dashboard"
    />
  );
}
