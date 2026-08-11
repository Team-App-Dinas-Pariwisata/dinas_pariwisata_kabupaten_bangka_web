"use client";

import { useState, type FormEvent } from "react";

export function LoginForm() {
  const [role, setRole] = useState<"admin" | "pengguna">("pengguna");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, email, password }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Login gagal.");
      window.location.href = result.redirectTo;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login gagal.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="auth-card" onSubmit={submit}>
      <div className="auth-brand"><span>B</span><div><strong>SI PARIK BANGKA</strong><small>Kabupaten Bangka</small></div></div>
      <p className="auth-eyebrow">PORTAL PENGELOLAAN DATA</p>
      <h1>Masuk ke dashboard</h1>
      <p className="auth-copy">Pilih jenis akun, lalu gunakan email dan kata sandi yang terdaftar pada database.</p>

      <div className="auth-role-tabs" role="tablist" aria-label="Jenis akun">
        <button type="button" className={role === "pengguna" ? "active" : ""} onClick={() => setRole("pengguna")}>Pengguna</button>
        <button type="button" className={role === "admin" ? "active" : ""} onClick={() => setRole("admin")}>Admin</button>
      </div>

      <label className="auth-field"><span>Email</span><input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nama@bangka.go.id" required /></label>
      <label className="auth-field"><span>Kata sandi</span><input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Masukkan kata sandi" required /></label>

      {error && <div className="auth-error">{error}</div>}
      <button className="auth-submit" type="submit" disabled={loading}>{loading ? "Memeriksa..." : `Masuk sebagai ${role === "admin" ? "Admin" : "Pengguna"}`}</button>
      <a className="auth-home-link" href="/">← Kembali ke halaman utama</a>
    </form>
  );
}
