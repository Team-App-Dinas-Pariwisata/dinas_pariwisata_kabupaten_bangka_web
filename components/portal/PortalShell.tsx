"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { PortalIcon, type PortalIconName } from "./PortalIcon";

type Props = {
  children: ReactNode;
  role: "admin" | "pengguna";
  userName: string;
};

type ChildItem = { href: string; label: string };
type MenuItem = {
  key: string;
  href?: string;
  label: string;
  icon: PortalIconName;
  children?: ChildItem[];
};

const userMenu: MenuItem[] = [
  { key: "dashboard", href: "/dashboard", label: "Dashboard", icon: "home" },
  {
    key: "pengajuan",
    label: "Pengajuan",
    icon: "clipboard",
    children: [
      { href: "/dashboard/pengajuan/pelaku-ekraf", label: "Pengajuan Pelaku Ekraf" },
      { href: "/dashboard/pengajuan/sdm-pariwisata", label: "Pengajuan Pelaku SDM Pariwisata" },
      { href: "/dashboard/pengajuan/komunitas", label: "Pengajuan Komunitas/Asosiasi/Lembaga" },
    ],
  },
  { key: "berita", href: "/dashboard/berita", label: "Berita", icon: "news" },
  { key: "acara", href: "/dashboard/acara", label: "Acara", icon: "calendar" },
  { key: "tempat-wisata", href: "/dashboard/wisata/tempat-wisata", label: "Tempat Wisata", icon: "database" },
  { key: "hotel", href: "/dashboard/wisata/hotel", label: "Hotel", icon: "box" },
  { key: "kuliner", href: "/dashboard/wisata/kuliner", label: "Kuliner", icon: "tag" },
  { key: "satwa-endemik", href: "/dashboard/wisata/satwa-endemik", label: "Satwa Endemik", icon: "eye" },
  { key: "laporan", href: "/dashboard/laporan", label: "Laporan", icon: "report" },
  { key: "pengaturan", href: "/dashboard/pengaturan", label: "Pengaturan", icon: "settings" },
];

const adminMenu: MenuItem[] = [
  { key: "pengguna", href: "/admin/pengguna", label: "Kelola Pengguna", icon: "users" },
];

export function PortalShell({ children, role, userName }: Props) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [submissionOpen, setSubmissionOpen] = useState(pathname.startsWith("/dashboard/pengajuan"));
  const menu = role === "admin" ? adminMenu : userMenu;

  useEffect(() => {
    if (pathname.startsWith("/dashboard/pengajuan")) setSubmissionOpen(true);
  }, [pathname]);

  const isActive = (href: string) => href === "/dashboard" ? pathname === href : pathname.startsWith(href);

  return (
    <div className="portal-app">
      <aside className={`portal-sidebar ${mobileOpen ? "is-open" : ""}`}>
        <div className="portal-brand">
          <span className="portal-brand-mark">B</span>
          <span><strong>SI PARIK BANGKA</strong><small>Kabupaten Bangka</small></span>
        </div>
        <div className="portal-menu-title">MENU UTAMA</div>
        <nav className="portal-menu">
          {menu.map((item) => {
            const childActive = item.children?.some((child) => pathname.startsWith(child.href)) ?? false;
            if (item.children) {
              const open = item.key === "pengajuan" && submissionOpen;
              return (
                <div className={`portal-menu-group portal-dropdown-group ${childActive ? "has-active-child" : ""}`} key={item.key}>
                  <button
                    type="button"
                    className={`portal-menu-link portal-menu-dropdown ${childActive ? "active" : ""}`}
                    onClick={() => setSubmissionOpen((value) => !value)}
                    aria-expanded={open}
                  >
                    <PortalIcon name={item.icon} />
                    <span>{item.label}</span>
                    <PortalIcon className={`portal-menu-chevron ${open ? "open" : ""}`} name="chevron" />
                  </button>
                  {open && (
                    <div className="portal-submenu portal-submenu-dropdown">
                      {item.children.map((child) => (
                        <Link
                          className={pathname.startsWith(child.href) ? "active" : ""}
                          href={child.href}
                          key={child.href}
                          onClick={() => setMobileOpen(false)}
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <div className="portal-menu-group" key={item.key}>
                <Link className={`portal-menu-link ${item.href && isActive(item.href) ? "active" : ""}`} href={item.href ?? "#"} onClick={() => setMobileOpen(false)}>
                  <PortalIcon name={item.icon} />
                  <span>{item.label}</span>
                </Link>
              </div>
            );
          })}
        </nav>
        <form action="/api/auth/logout" method="post" className="portal-logout-form">
          <button className="portal-menu-link" type="submit"><PortalIcon name="logout" /><span>Keluar</span></button>
        </form>
      </aside>

      {mobileOpen && <button className="portal-backdrop" onClick={() => setMobileOpen(false)} aria-label="Tutup menu" />}

      <div className="portal-main">
        <header className="portal-topbar">
          <button className="portal-mobile-menu" type="button" onClick={() => setMobileOpen(true)} aria-label="Buka menu"><PortalIcon name="menu" /></button>
          <div className="portal-topbar-spacer" />
          <button className="portal-bell" type="button" aria-label="Notifikasi"><PortalIcon name="bell" /></button>
          <div className="portal-user-chip"><span>{userName.slice(0, 1).toUpperCase()}</span><div><strong>{userName}</strong><small>{role === "admin" ? "Administrator" : "Pengguna"}</small></div></div>
        </header>
        <div className="portal-content">{children}</div>
      </div>
    </div>
  );
}
