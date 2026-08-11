"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { PortalIcon } from "@/components/portal/PortalIcon";

type Props = {
  children: ReactNode;
  userName: string;
  userEmail: string;
  avatarUrl?: string | null;
};

const links = [
  { href: "/akun", label: "Ringkasan Akun", icon: "home" as const },
  { href: "/akun/pengajuan/pelaku-ekraf", label: "Pengajuan Pelaku Ekraf", icon: "clipboard" as const },
  { href: "/akun/pengajuan/sdm-pariwisata", label: "Pengajuan SDM Pariwisata", icon: "users" as const },
  { href: "/akun/pengajuan/komunitas", label: "Pengajuan Komunitas", icon: "database" as const },
];

export function ApplicantShell({ children, userName, userEmail, avatarUrl }: Props) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="applicant-app">
      <aside className={`applicant-sidebar ${mobileOpen ? "is-open" : ""}`}>
        <Link href="/" className="applicant-brand" onClick={() => setMobileOpen(false)}>
          <img src="/logo-si-parik-preloader.png" alt="SI PARIK BANGKA" />
          <span><strong>SI PARIK BANGKA</strong><small>Akun Pengaju</small></span>
        </Link>

        <div className="applicant-nav-label">LAYANAN PENGAJU</div>
        <nav className="applicant-nav">
          {links.map((item) => {
            const active = item.href === "/akun" ? pathname === "/akun" : pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href} className={active ? "active" : ""} onClick={() => setMobileOpen(false)}>
                <PortalIcon name={item.icon} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="applicant-sidebar-help">
          <span>Butuh bantuan?</span>
          <p>Pastikan data dan dokumen yang dikirim benar agar proses verifikasi lebih cepat.</p>
          <Link href="/">Lihat portal publik</Link>
        </div>
      </aside>

      {mobileOpen && <button className="applicant-backdrop" aria-label="Tutup menu" onClick={() => setMobileOpen(false)} />}

      <div className="applicant-main">
        <header className="applicant-topbar">
          <button type="button" className="applicant-mobile-menu" aria-label="Buka menu" onClick={() => setMobileOpen(true)}>
            <PortalIcon name="menu" />
          </button>
          <div className="applicant-topbar-title"><span>Akun Pengaju</span><strong>SI PARIK BANGKA</strong></div>
          <div className="applicant-user">
            {avatarUrl ? <img src={avatarUrl} alt="" referrerPolicy="no-referrer" /> : <span>{userName.slice(0, 1).toUpperCase()}</span>}
            <div><strong>{userName}</strong><small>{userEmail}</small></div>
          </div>
          <form action="/api/auth/logout" method="post">
            <button type="submit" className="applicant-logout"><PortalIcon name="logout" /><span>Keluar</span></button>
          </form>
        </header>
        <main className="applicant-content">{children}</main>
      </div>
    </div>
  );
}
