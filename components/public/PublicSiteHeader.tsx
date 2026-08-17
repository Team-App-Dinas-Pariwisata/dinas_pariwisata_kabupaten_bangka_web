import Link from "next/link";

const pelakuItems = [
  { label: "Pelaku Ekraf", href: "/akun/pengajuan/pelaku-ekraf" },
  { label: "Pelaku SDM Pariwisata", href: "/akun/pengajuan/sdm-pariwisata" },
  { label: "Komunitas/Lembaga/Asosiasi", href: "/akun/pengajuan/komunitas" },
];

const wisataItems = [
  { label: "Tempat Wisata", href: "/wisata/tempat-wisata" },
  { label: "Kuliner", href: "/wisata/kuliner" },
  { label: "Hotel", href: "/wisata/hotel" },
  { label: "Satwa Endemik", href: "/wisata/satwa-endemik" },
  { label: "Pencarian", href: "/pencarian" },
];

type NavIconName = "home" | "news" | "calendar" | "grid" | "users" | "map" | "info";

function NavIcon({ name }: { name: NavIconName }) {
  const common = {
    width: 16,
    height: 16,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.9,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  switch (name) {
    case "home":
      return <svg {...common}><path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10.5V20h13v-9.5"/><path d="M9.5 20v-6h5v6"/></svg>;
    case "news":
      return <svg {...common}><path d="M5 4.5h11.5A2.5 2.5 0 0 1 19 7v13H6.5A2.5 2.5 0 0 1 4 17.5v-12A1 1 0 0 1 5 4.5Z"/><path d="M19 8h1a1 1 0 0 1 1 1v8.5A2.5 2.5 0 0 1 18.5 20"/><path d="M7.5 9h7"/><path d="M7.5 13h7"/><path d="M7.5 17h4"/></svg>;
    case "calendar":
      return <svg {...common}><rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M7.5 3v4"/><path d="M16.5 3v4"/><path d="M3.5 9.5h17"/><path d="M8 13h.01"/><path d="M12 13h.01"/><path d="M16 13h.01"/><path d="M8 17h.01"/><path d="M12 17h.01"/></svg>;
    case "grid":
      return <svg {...common}><rect x="3.5" y="3.5" width="7" height="7" rx="1.3"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.3"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.3"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.3"/></svg>;
    case "users":
      return <svg {...common}><path d="M16 20v-1.5a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4V20"/><circle cx="9.5" cy="7" r="3.5"/><path d="M16 4.5a3.5 3.5 0 0 1 0 6.8"/><path d="M17.5 14.8A4 4 0 0 1 21 18.5V20"/></svg>;
    case "map":
      return <svg {...common}><path d="M12 21s6.5-5.6 6.5-11.5a6.5 6.5 0 1 0-13 0C5.5 15.4 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.2"/></svg>;
    case "info":
      return <svg {...common}><circle cx="12" cy="12" r="9"/><path d="M12 10.5V16"/><path d="M12 7.5h.01"/></svg>;
  }
}

function DesktopDropdown({ label, icon, items }: { label: string; icon: NavIconName; items: { label: string; href: string }[] }) {
  return (
    <details className="public-nav-dropdown">
      <summary><NavIcon name={icon}/><span>{label}</span><span className="public-nav-chevron" aria-hidden="true" /></summary>
      <div className="public-nav-dropdown-menu">
        {items.map((item) => <Link href={item.href} key={item.href}>{item.label}</Link>)}
      </div>
    </details>
  );
}

function MobileDropdown({ label, icon, items }: { label: string; icon: NavIconName; items: { label: string; href: string }[] }) {
  return (
    <details className="public-mobile-dropdown">
      <summary><span className="public-mobile-label"><NavIcon name={icon}/>{label}</span><span className="public-mobile-chevron" aria-hidden="true" /></summary>
      <div>
        {items.map((item) => <Link href={item.href} key={item.href}>{item.label}</Link>)}
      </div>
    </details>
  );
}

export default function PublicSiteHeader({ overlay = false }: { overlay?: boolean }) {
  return (
    <header className={`public-site-header${overlay ? " is-overlay" : ""}`}>
      <div className="public-container public-site-header-inner">
        <Link href="/" className="public-brand public-brand-official" aria-label="Dinas Pariwisata dan Kebudayaan Kabupaten Bangka">
          <span className="public-brand-logo-shell">
            <img
              className="public-brand-logo"
              src="/branding/logo-si-parik-navbar.png"
              alt="SI PARIK BANGKA — Portal Ekonomi Kreatif Kabupaten Bangka"
            />
          </span>
        </Link>

        <nav className="public-nav" aria-label="Navigasi publik">
          <Link href="/"><NavIcon name="home"/><span>Beranda</span></Link>
          <Link href="/berita"><NavIcon name="news"/><span>Berita</span></Link>
          <Link href="/acara"><NavIcon name="calendar"/><span>Acara</span></Link>
          <DesktopDropdown label="Pelaku Ekraf" icon="users" items={pelakuItems} />
          <DesktopDropdown label="Wisata" icon="map" items={wisataItems} />
        </nav>


        <details className="public-mobile-menu">
          <summary aria-label="Buka navigasi"><span></span><span></span><span></span></summary>
          <div className="public-mobile-menu-panel">
            <Link href="/"><NavIcon name="home"/><span>Beranda</span></Link>
            <Link href="/berita"><NavIcon name="news"/><span>Berita</span></Link>
            <Link href="/acara"><NavIcon name="calendar"/><span>Acara</span></Link>
            <MobileDropdown label="Pelaku Ekraf" icon="users" items={pelakuItems} />
            <MobileDropdown label="Wisata" icon="map" items={wisataItems} />
          </div>
        </details>
      </div>
    </header>
  );
}
