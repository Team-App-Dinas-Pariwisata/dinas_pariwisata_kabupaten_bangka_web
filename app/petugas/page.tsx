import { redirect } from "next/navigation";
import { LoginForm } from "@/components/portal/LoginForm";
import { getPageUser } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function LoginPage() {
  const user = await getPageUser();
  if (user?.role === "admin") redirect("/admin/pengguna");
  if (user?.role === "pengguna") redirect("/dashboard");

  return (
    <main className="auth-page">
      <div className="auth-visual">
        <a href="/" className="auth-back">← Beranda</a>
        <div className="auth-visual-copy">
          <p>SI PARIK BANGKA KABUPATEN BANGKA</p>
          <h2>Satu portal untuk verifikasi pengajuan dan pengelolaan informasi kreatif.</h2>
          <span>Admin mengelola akun pengguna. Pengguna memverifikasi pengajuan Pelaku Ekraf, SDM Pariwisata, serta Komunitas/Asosiasi/Lembaga dan mengelola Berita, Acara, Laporan, serta Pengaturan.</span>
        </div>
      </div>
      <LoginForm />
    </main>
  );
}
