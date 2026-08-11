import { redirect } from "next/navigation";
import { GoogleSignupCard } from "@/components/applicant/GoogleSignupCard";
import { getPageUser } from "@/lib/auth";
import { googleOAuthReady } from "@/lib/google-oauth";

export const metadata = { title: "Buat Akun Pengaju | SI PARIK BANGKA" };

export default async function ApplicantLoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const user = await getPageUser();
  if (user?.role === "pengaju") redirect("/akun");
  const params = await searchParams;

  return (
    <main className="applicant-auth-page">
      <section className="applicant-auth-visual">
        <a className="applicant-auth-back" href="/">← Kembali ke beranda</a>
        <div>
          <p>LAYANAN PENGAJUAN DIGITAL</p>
          <h2>Satu akun untuk seluruh pengajuan Ekraf dan SDM Pariwisata Bangka.</h2>
          <span>Isi formulir secara bertahap, unggah dokumen pendukung, simpan nomor registrasi, dan pantau proses verifikasi dari akun yang sama.</span>
        </div>
      </section>
      <GoogleSignupCard googleReady={googleOAuthReady()} error={params.error} />
    </main>
  );
}
