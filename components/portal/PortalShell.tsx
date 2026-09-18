"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { PortalIcon, type PortalIconName } from "./PortalIcon";
import StaffFloatingChat from "./StaffFloatingChat";
import PortalPreloader from "./PortalPreloader";

type Props = {
  children: ReactNode;
  role: "admin" | "petugas";
  userName: string;
  isLiveServer?: boolean;
};

type ChildItem = { href: string; label: string };
type MenuItem = {
  key: string;
  href?: string;
  label: string;
  icon: PortalIconName;
  children?: ChildItem[];
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
  { key: "monitoring-sampah", href: "/dashboard/monitoring-sampah", label: "Monitoring Sampah", icon: "database" },
  { key: "pengaturan", href: "/dashboard/pengaturan", label: "Pengaturan", icon: "settings" },
];

const adminMenu: MenuItem[] = [
  { key: "petugas", href: "/admin/petugas", label: "Kelola Petugas", icon: "users" },
  { key: "notifikasi", href: "/admin/notifikasi", label: "Semua Notifikasi", icon: "bell" },
  { key: "pengaturan", href: "/admin/pengaturan", label: "Pengaturan Fitur", icon: "settings" },
  { key: "whatsapp", href: "/admin/whatsapp", label: "Koneksi WhatsApp", icon: "whatsapp" },
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

export function PortalShell({ children, role, userName, isLiveServer }: Props) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [submissionOpen, setSubmissionOpen] = useState(pathname.startsWith("/dashboard/pengajuan"));
  const [isLive, setIsLive] = useState(isLiveServer ?? false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const hostname = window.location.hostname;
      if (hostname && (!["localhost", "127.0.0.1", "0.0.0.0"].includes(hostname) || hostname.includes("siparik.bangka.go.id"))) {
        setIsLive(true);
      }
    }
  }, []);

  const menu = role === "admin"
    ? adminMenu.filter((item) => !(isLive && item.key === "whatsapp"))
    : userMenu.filter((item) => !(isLive && item.key === "monitoring-sampah"));

  // Notification state
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (pathname.startsWith("/dashboard/pengajuan")) setSubmissionOpen(true);
  }, [pathname]);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data.data ?? []);
      setUnreadCount(data.unreadCount ?? 0);
    } catch {
      // silently fail
    }
  }, []);

  // Initial fetch and polling every 30 seconds
  useEffect(() => {
    void fetchNotifications();
    const timer = window.setInterval(() => void fetchNotifications(), 30000);
    return () => window.clearInterval(timer);
  }, [fetchNotifications]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    if (notifOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [notifOpen]);

  // Mark single notification as read and dispatch event to open review
  async function handleNotifClick(notif: NotificationItem) {
    // Mark as read
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

    // If has reference, dispatch custom event to open submission review
    if (notif.referensi_tipe && notif.referensi_id) {
      window.dispatchEvent(
        new CustomEvent("openSubmissionReview", {
          detail: {
            jenis: notif.referensi_tipe,
            id: notif.referensi_id,
          },
        }),
      );
      setNotifOpen(false);
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

  useEffect(() => {
    let stopped = false;

    const heartbeat = async () => {
      if (stopped || document.visibilityState === "hidden") return;
      try {
        await fetch("/api/chat/presence", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: "{}",
          cache: "no-store",
        });
      } catch {
        // Presence hanya membantu pemilihan tab chat guest dan tidak boleh mengganggu portal.
      }
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") void heartbeat();
    };

    void heartbeat();
    const timer = window.setInterval(() => void heartbeat(), 20000);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      stopped = true;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  const isActive = (href: string) => href === "/dashboard" ? pathname === href : pathname.startsWith(href);

  return (
    <div className="portal-app">
      <PortalPreloader />
      <aside className={`portal-sidebar ${mobileOpen ? "is-open" : ""}`}>
        <div className="portal-brand">
          <img className="portal-brand-logo" src="/logo-si-parik-preloader.png" alt="Logo SI PARIK BANGKA" />
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

          {/* Notification Bell */}
          <div className="portal-notif-wrapper" ref={notifRef}>
            <button
              className="portal-bell"
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
                    notifications.map((notif) => (
                      <button
                        key={notif.id}
                        type="button"
                        className={`portal-notif-item ${notif.is_read ? "" : "unread"}`}
                        onClick={() => void handleNotifClick(notif)}
                      >
                        <div className="portal-notif-item-icon">
                          <PortalIcon
                            name={
                              notif.jenis === "pengajuan_baru"
                                ? "clipboard"
                                : notif.jenis === "pengajuan_diperbaiki"
                                ? "edit"
                                : "check"
                            }
                          />
                        </div>
                        <div className="portal-notif-item-body">
                          <strong>{notif.judul}</strong>
                          <span>{notif.pesan}</span>
                          <small>{formatNotifDate(notif.created_at)}</small>
                        </div>
                        {!notif.is_read && <span className="portal-notif-dot" />}
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="portal-user-chip"><span>{userName.slice(0, 1).toUpperCase()}</span><div><strong>{userName}</strong><small>{role === "admin" ? "Administrator" : "Petugas"}</small></div></div>
        </header>
        <div className="portal-content">{children}</div>
      </div>
      <StaffFloatingChat />
    </div>
  );
}
