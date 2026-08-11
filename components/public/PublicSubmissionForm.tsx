"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { submissionConfigs, type SubmissionField, type SubmissionLookup, type SubmissionType } from "@/lib/submission-config";

type LookupOption = { value: number | string; label: string; kecamatan_id?: number };
type LookupData = Record<SubmissionLookup, LookupOption[]>;
type FieldValue = string | boolean | File | null;

type Props = { type: SubmissionType };

function initialValues(type: SubmissionType) {
  const out: Record<string, FieldValue> = {};
  for (const step of submissionConfigs[type].steps) {
    for (const field of step.fields) {
      if (field.type === "checkbox") out[field.key] = false;
      else if (field.type === "select" && field.options?.length) out[field.key] = field.options[0].value;
      else out[field.key] = "";
    }
  }
  return out;
}

function hasValue(value: FieldValue) {
  if (typeof value === "boolean") return value;
  if (value instanceof File) return value.size > 0;
  return String(value ?? "").trim().length > 0;
}

export function PublicSubmissionForm({ type }: Props) {
  const config = submissionConfigs[type];
  const [stepIndex, setStepIndex] = useState(0);
  const [values, setValues] = useState<Record<string, FieldValue>>(() => initialValues(type));
  const [lookups, setLookups] = useState<LookupData>({ subsektor: [], kecamatan: [], kelurahan: [], komunitas: [] });
  const [loadingLookups, setLoadingLookups] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [registration, setRegistration] = useState("");

  useEffect(() => {
    let active = true;
    fetch("/api/public/lookups", { cache: "no-store" })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.message || "Pilihan data gagal dimuat.");
        return payload.data as LookupData;
      })
      .then((data) => { if (active) setLookups(data); })
      .catch((err) => { if (active) setError(err instanceof Error ? err.message : "Pilihan data gagal dimuat."); })
      .finally(() => { if (active) setLoadingLookups(false); });
    return () => { active = false; };
  }, []);

  const currentStep = config.steps[stepIndex];
  const progress = ((stepIndex + 1) / config.steps.length) * 100;

  const currentMissing = useMemo(
    () => currentStep.fields.filter((field) => field.required && !hasValue(values[field.key])),
    [currentStep.fields, values],
  );

  function setValue(key: string, value: FieldValue) {
    setValues((old) => ({ ...old, [key]: value }));
    setError("");
  }

  function optionsFor(field: SubmissionField) {
    if (field.options) return field.options;
    if (!field.lookup) return [];
    const options = lookups[field.lookup] ?? [];
    if (field.lookup === "kelurahan" && field.dependsOn) {
      const parent = Number(values[field.dependsOn] || 0);
      return options.filter((option) => Number(option.kecamatan_id) === parent);
    }
    return options;
  }

  function nextStep() {
    if (currentMissing.length) {
      setError(`Lengkapi field wajib: ${currentMissing.map((field) => field.label).join(", ")}.`);
      return;
    }
    setError("");
    setStepIndex((index) => Math.min(index + 1, config.steps.length - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function previousStep() {
    setError("");
    setStepIndex((index) => Math.max(index - 1, 0));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (currentMissing.length) {
      setError(`Lengkapi field wajib: ${currentMissing.map((field) => field.label).join(", ")}.`);
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const body = new FormData();
      body.set("type", type);
      for (const [key, value] of Object.entries(values)) {
        if (value instanceof File) body.set(key, value);
        else if (typeof value === "boolean") body.set(key, value ? "1" : "0");
        else if (value !== null && String(value).length) body.set(key, String(value));
      }
      const response = await fetch("/api/public/submissions", { method: "POST", body });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || "Pengajuan gagal dikirim.");
      setRegistration(String(payload.data?.no_registrasi ?? ""));
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Pengajuan gagal dikirim.");
    } finally {
      setSubmitting(false);
    }
  }

  if (registration) {
    return (
      <main className="submission-page">
        <div className="submission-page-bg" aria-hidden="true" />
        <div className="submission-shell success-shell">
          <Link className="submission-back" href="/">← Kembali ke Beranda</Link>
          <section className="submission-success-card">
            <span className="submission-success-icon">✓</span>
            <p className="submission-kicker">Pengajuan berhasil</p>
            <h1>Data Anda sudah kami terima.</h1>
            <p>Petugas akan meninjau data sebelum disetujui atau ditolak. Simpan nomor registrasi berikut untuk referensi Anda.</p>
            <div className="registration-code"><span>Nomor Registrasi</span><strong>{registration}</strong></div>
            <Link className="submission-primary-link" href="/">Selesai & Kembali ke Beranda</Link>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="submission-page">
      <div className="submission-page-bg" aria-hidden="true" />
      <div className="submission-shell">
        <header className="submission-header">
          <Link className="submission-back" href="/">← Beranda</Link>
          <div className="submission-brand"><span>B</span><div><strong>SI PARIK BANGKA</strong><small>Kabupaten Bangka</small></div></div>
          <Link className="submission-login-link" href="/login">Portal Petugas</Link>
        </header>

        <section className="submission-intro">
          <p className="submission-kicker">Layanan Pengajuan Online</p>
          <h1>{config.title}</h1>
          <p>{config.subtitle} Data pengajuan akan masuk langsung ke database dan menunggu verifikasi petugas.</p>
        </section>

        <div className="submission-layout">
          <aside className="submission-stepper" aria-label="Tahapan pengajuan">
            <div className="submission-stepper-progress"><span style={{ width: `${progress}%` }} /></div>
            {config.steps.map((step, index) => (
              <button
                type="button"
                key={step.shortTitle}
                className={`${index === stepIndex ? "active" : ""} ${index < stepIndex ? "done" : ""}`}
                onClick={() => index < stepIndex && setStepIndex(index)}
                disabled={index > stepIndex}
              >
                <span>{index < stepIndex ? "✓" : index + 1}</span>
                <div><strong>{step.shortTitle}</strong><small>{step.title}</small></div>
              </button>
            ))}
            <div className="submission-help-card">
              <strong>Dokumen pendukung</strong>
              <p>Foto menerima JPG/JPEG atau PNG. Dokumen menerima PDF, JPG/JPEG, atau PNG. Maksimal 5 MB per file dan tersimpan di Cloudflare R2.</p>
            </div>
          </aside>

          <form className="submission-form-card" onSubmit={submit}>
            <div className="submission-form-head">
              <div><span>Tahap {stepIndex + 1} dari {config.steps.length}</span><h2>{currentStep.title}</h2><p>{currentStep.description}</p></div>
              <span className="submission-progress-label">{Math.round(progress)}%</span>
            </div>

            {loadingLookups && <div className="submission-info">Memuat data kecamatan, kelurahan, subsektor, dan komunitas…</div>}
            {error && <div className="portal-alert error submission-error">{error}</div>}

            <div className="submission-fields">
              {currentStep.fields.map((field) => {
                const value = values[field.key];
                const fieldOptions = optionsFor(field);
                const isWide = field.type === "textarea" || field.type === "file" || field.type === "checkbox";
                return (
                  <label className={`submission-field ${isWide ? "wide" : ""} ${field.type === "checkbox" ? "checkbox-field" : ""}`} key={field.key}>
                    {field.type !== "checkbox" && <span>{field.label}{field.required ? <b> *</b> : null}</span>}
                    {field.type === "textarea" ? (
                      <textarea rows={4} value={String(value ?? "")} onChange={(e) => setValue(field.key, e.target.value)} placeholder={field.placeholder} />
                    ) : field.type === "select" ? (
                      <select value={String(value ?? "")} onChange={(e) => setValue(field.key, e.target.value)} disabled={loadingLookups && Boolean(field.lookup)}>
                        <option value="">Pilih {field.label.toLowerCase()}</option>
                        {fieldOptions.map((option) => <option key={String(option.value)} value={String(option.value)}>{option.label}</option>)}
                      </select>
                    ) : field.type === "checkbox" ? (
                      <span className="submission-checkline"><input type="checkbox" checked={Boolean(value)} onChange={(e) => setValue(field.key, e.target.checked)} /><span>{field.label}{field.required ? <b> *</b> : null}</span></span>
                    ) : field.type === "file" ? (
                      <span className={`submission-filebox ${field.fileKind === "document" ? "document-file" : "image-file"}`}>
                        <input type="file" accept={field.accept} onChange={(e: ChangeEvent<HTMLInputElement>) => setValue(field.key, e.target.files?.[0] ?? null)} />
                        <span>{value instanceof File ? value.name : field.fileKind === "document" ? "Pilih dokumen PDF/JPG/PNG" : "Pilih gambar JPG/PNG"}</span>
                        <small>Maksimal 5 MB · {field.fileKind === "document" ? "PDF, JPG/JPEG, PNG" : "JPG/JPEG, PNG"} → Cloudflare R2</small>
                      </span>
                    ) : (
                      <input
                        type={field.type === "year" ? "number" : field.type ?? "text"}
                        value={String(value ?? "")}
                        onChange={(e) => setValue(field.key, e.target.value)}
                        placeholder={field.placeholder}
                        min={field.type === "year" ? "1900" : undefined}
                        max={field.type === "year" ? String(new Date().getFullYear()) : undefined}
                        step={field.key === "latitude" || field.key === "longitude" ? "any" : undefined}
                        inputMode={field.key === "nik" || field.type === "tel" ? "numeric" : undefined}
                      />
                    )}
                    {field.help && <small className="submission-field-help">{field.help}</small>}
                  </label>
                );
              })}
            </div>

            <div className="submission-actions-row">
              <button type="button" className="submission-secondary" onClick={previousStep} disabled={stepIndex === 0}>Kembali</button>
              {stepIndex < config.steps.length - 1 ? (
                <button type="button" className="submission-primary" onClick={nextStep}>Lanjut ke Tahap {stepIndex + 2} →</button>
              ) : (
                <button type="submit" className="submission-primary" disabled={submitting}>{submitting ? "Mengirim Pengajuan…" : "Kirim Pengajuan"}</button>
              )}
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
