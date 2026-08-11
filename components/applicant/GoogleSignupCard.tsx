type Props = {
  googleReady: boolean;
  error?: string;
};

const errorMessages: Record<string, string> = {
  config: "Google OAuth belum dikonfigurasi. Isi GOOGLE_CLIENT_ID dan GOOGLE_CLIENT_SECRET di .env.local.",
  cancelled: "Proses masuk dengan Google dibatalkan.",
  google: "Google tidak dapat menyelesaikan proses autentikasi. Silakan coba lagi.",
  state: "Sesi autentikasi tidak valid atau sudah kedaluwarsa. Silakan mulai ulang.",
  unverified_email: "Email Google belum terverifikasi sehingga akun belum dapat dibuat.",
  internal_email: "Email tersebut sudah dipakai oleh akun petugas/admin. Gunakan akun Google lain untuk akun pengaju.",
  inactive: "Akun pengaju ini sedang dinonaktifkan. Hubungi pengelola SI PARIK BANGKA.",
  account_mismatch: "Akun Google tidak cocok dengan akun pengaju yang sudah terdaftar.",
  server: "Pembuatan akun belum berhasil. Pastikan migration database dan konfigurasi Google OAuth sudah benar.",
};

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.4-.18-2.07H12v3.92h5.38a4.6 4.6 0 0 1-1.99 3.02v2.54h3.23c1.89-1.74 2.98-4.3 2.98-7.41Z"/>
      <path fill="#34A853" d="M12 22c2.7 0 4.96-.9 6.62-2.36l-3.23-2.54c-.9.6-2.04.96-3.39.96-2.6 0-4.81-1.76-5.6-4.13H3.06v2.62A10 10 0 0 0 12 22Z"/>
      <path fill="#FBBC05" d="M6.4 13.93A6.02 6.02 0 0 1 6.08 12c0-.67.12-1.32.32-1.93V7.45H3.06A10 10 0 0 0 2 12c0 1.61.38 3.14 1.06 4.55l3.34-2.62Z"/>
      <path fill="#EA4335" d="M12 5.94c1.47 0 2.78.5 3.82 1.49l2.87-2.87A9.64 9.64 0 0 0 12 2a10 10 0 0 0-8.94 5.45l3.34 2.62C7.19 7.7 9.4 5.94 12 5.94Z"/>
    </svg>
  );
}

export function GoogleSignupCard({ googleReady, error }: Props) {
  return (
    <section className="applicant-auth-card">
      <a href="/" className="applicant-auth-logo"><img src="/logo-si-parik-preloader.png" alt="SI PARIK BANGKA" /></a>
      <p className="applicant-auth-kicker">AKUN PENGAJU SI PARIK BANGKA</p>
      <h1>Buat akun dan ajukan data dengan Google.</h1>
      <p className="applicant-auth-copy">Tidak perlu membuat kata sandi baru. Akun pengaju dibuat otomatis setelah Google mengonfirmasi nama dan email Anda.</p>

      {error && <div className="applicant-auth-error">{errorMessages[error] || errorMessages.server}</div>}

      {googleReady ? (
        <a className="google-signup-button" href="/api/auth/google/start">
          <GoogleMark />
          <span>Lanjutkan dengan Google</span>
        </a>
      ) : (
        <button className="google-signup-button" type="button" disabled>
          <GoogleMark />
          <span>Google OAuth belum dikonfigurasi</span>
        </button>
      )}

      <div className="applicant-auth-points">
        <div><span>1</span><p><strong>Masuk dengan Google</strong><small>Nama dan email terverifikasi menjadi identitas akun.</small></p></div>
        <div><span>2</span><p><strong>Pilih jenis pengajuan</strong><small>Pelaku Ekraf, SDM Pariwisata, atau Komunitas/Asosiasi/Lembaga.</small></p></div>
        <div><span>3</span><p><strong>Pantau status</strong><small>Nomor registrasi dan status pengajuan tersimpan di akun Anda.</small></p></div>
      </div>

      <div className="applicant-auth-footer">
        <span>Petugas SI PARIK BANGKA?</span>
        <a href="/login">Masuk ke Portal Petugas</a>
      </div>
    </section>
  );
}
