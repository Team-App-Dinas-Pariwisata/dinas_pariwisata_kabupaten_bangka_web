import { LoginForm } from "@/components/portal/LoginForm";

export default function LoginPage() {
  return (
    <main className="auth-page">
      <div className="auth-visual">
        <a href="/" className="auth-back">← Beranda</a>
        <div className="auth-visual-copy">
          <p>APPEKRAF KABUPATEN BANGKA</p>
          <h2>Satu portal untuk verifikasi pengajuan dan pengelolaan informasi kreatif.</h2>
          <span>Admin mengelola akun pengguna. Pengguna memverifikasi pengajuan Pelaku Ekraf, SDM Pariwisata, serta Komunitas/Asosiasi/Lembaga dan mengelola Berita, Acara, Laporan, serta Pengaturan.</span>
        </div>
      </div>
      <LoginForm />
    </main>
  );
}
