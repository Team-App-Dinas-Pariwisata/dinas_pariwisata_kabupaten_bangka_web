"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { PortalIcon } from "@/components/portal/PortalIcon";
import PortalPreloader, { startPortalLoading } from "@/components/portal/PortalPreloader";

type Props = {
  children: ReactNode;
  userName: string;
  userEmail: string;
  avatarUrl?: string | null;
};

type NotificationItem = {
  id: number;
  judul: string;
  pesan: string;
  jenis: string;
  referensi_tipe: "ekraf" | "sdm" | "komunitas" | null;
  referensi_id: number | null;
  pengirim_nama: string | null;
  is_read: number;
  created_at: string;
};

const links = [
  { href: "/akun", label: "Ringkasan Akun", icon: "home" as const },
  { href: "/akun/pengajuan/pelaku-ekraf", label: "Pengajuan Pelaku Ekraf", icon: "clipboard" as const },
  { href: "/akun/pengajuan/sdm-pariwisata", label: "Pengajuan SDM Pariwisata", icon: "users" as const },
  { href: "/akun/pengajuan/komunitas", label: "Pengajuan Komunitas", icon: "database" as const },
];

function formatNotifDate(value: string) {
  const date = new Date(value.replace(" ", "T"));
  if (Number.isNaN(date.getTime())) return value;
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Baru saja";
  if (minutes < 60) return `${minutes} menit lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} hari lalu`;
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(date);
}

export function ApplicantShell({ children, userName, userEmail, avatarUrl }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Notification state
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const notifRef = useRef<HTMLDivElement>(null);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data.data ?? []);
      setUnreadCount(data.unreadCount ?? 0);
    } catch {
      // silent fail
    }
  }, []);

  useEffect(() => {
    void fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    if (notifOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [notifOpen]);

  // Mark single notification as read and navigate to review/edit
  async function handleNotifClick(notif: NotificationItem) {
    if (!notif.is_read) {
      try {
        await fetch("/api/notifications", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: notif.id }),
        });
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, is_read: 1 } : n)),
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch {
        // ignore
      }
    }

    setNotifOpen(false);

    if (notif.referensi_tipe && notif.referensi_id) {
      if (pathname === "/akun") {
        window.dispatchEvent(
          new CustomEvent("openApplicantSubmissionReview", {
            detail: {
              jenis: notif.referensi_tipe,
              id: notif.referensi_id,
            },
          }),
        );
      } else {
        startPortalLoading("Membuka dashboard pengajuan…");
        router.push(`/akun?reviewType=${notif.referensi_tipe}&reviewId=${notif.referensi_id}`);
      }
    }
  }

  // Mark all as read
  async function handleMarkAllRead() {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
      setUnreadCount(0);
    } catch {
      // ignore
    }
  }

  return (
    <div className="applicant-app">
      <PortalPreloader />
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

          {/* Notification Bell */}
          <div className="portal-notif-wrapper" ref={notifRef}>
            <button
              className="portal-bell applicant-bell"
              type="button"
              aria-label="Notifikasi"
              onClick={() => {
                setNotifOpen((v) => !v);
                if (!notifOpen) void fetchNotifications();
              }}
            >
              <PortalIcon name="bell" />
              {unreadCount > 0 && (
                <span className="portal-bell-badge">{unreadCount > 99 ? "99+" : unreadCount}</span>
              )}
            </button>

            {notifOpen && (
              <div className="portal-notif-dropdown">
                <div className="portal-notif-header">
                  <strong>Notifikasi</strong>
                  {unreadCount > 0 && (
                    <button type="button" className="portal-notif-mark-all" onClick={handleMarkAllRead}>
                      Tandai semua dibaca
                    </button>
                  )}
                </div>
                <div className="portal-notif-list">
                  {notifications.length === 0 ? (
                    <div className="portal-notif-empty">Belum ada notifikasi.</div>
                  ) : (
                    notifications.map((notif) => {
                      const isApproved = notif.judul.toLowerCase().includes("disetujui");
                      const isRevision = notif.judul.toLowerCase().includes("revisi") || notif.judul.toLowerCase().includes("tolak");
                      return (
                        <button
                          key={notif.id}
                          type="button"
                          className={`portal-notif-item ${notif.is_read ? "" : "unread"}`}
                          onClick={() => void handleNotifClick(notif)}
                        >
                          <span className="portal-notif-item-icon">
                            <PortalIcon
                              name={
                                isApproved ? "check" : isRevision ? "edit" : "clipboard"
                              }
                            />
                          </span>
                          <div className="portal-notif-item-content">
                            <div className="portal-notif-item-top">
                              <span className="portal-notif-item-title">{notif.judul}</span>
                              <span className="portal-notif-item-time">{formatNotifDate(notif.created_at)}</span>
                            </div>
                            <p className="portal-notif-item-desc">{notif.pesan}</p>
                            {notif.referensi_tipe && notif.referensi_id && (
                              <span className="portal-notif-item-hint">
                                {isApproved ? "Klik untuk melihat data pengajuan →" : "Klik untuk merevisi pengajuan →"}
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

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
