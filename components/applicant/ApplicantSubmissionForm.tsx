"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { submissionConfigs, type SubmissionField, type SubmissionLookup, type SubmissionType } from "@/lib/submission-config";
import { PortalIcon } from "@/components/portal/PortalIcon";

type LookupOption = { value: number | string; label: string; kecamatan_id?: number };
type LookupData = Record<SubmissionLookup, LookupOption[]>;
type FieldValue = string | boolean | File | null;

type Props = {
  type: SubmissionType;
  userName: string;
  userEmail: string;
};

function initialValues(type: SubmissionType, userName: string, userEmail: string) {
  const out: Record<string, FieldValue> = {};
  for (const step of submissionConfigs[type].steps) {
    for (const field of step.fields) {
      if (field.type === "checkbox") out[field.key] = false;
      else if (field.type === "select" && field.options?.length) out[field.key] = field.options[0].value;
      else if (field.key === "nama_lengkap") out[field.key] = userName;
      else if (field.key === "email") out[field.key] = userEmail;
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

export function ApplicantSubmissionForm({ type, userName, userEmail }: Props) {
  const config = submissionConfigs[type];
  const [stepIndex, setStepIndex] = useState(0);
  const [values, setValues] = useState<Record<string, FieldValue>>(() => initialValues(type, userName, userEmail));
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
      const response = await fetch("/api/akun/submissions", { method: "POST", body });
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
      <section className="applicant-form-success">
        <span><PortalIcon name="check" /></span>
        <p>PENGAJUAN BERHASIL DIKIRIM</p>
        <h1>Data Anda sudah masuk ke proses verifikasi.</h1>
        <p>Simpan nomor registrasi ini. Status pengajuan juga dapat dipantau dari halaman Ringkasan Akun.</p>
        <div><small>Nomor Registrasi</small><strong>{registration}</strong></div>
        <Link href="/akun" className="applicant-primary">Kembali ke Ringkasan Akun</Link>
      </section>
    );
  }

  return (
    <section className="applicant-form-page">
      <div className="applicant-form-head">
        <div>
          <Link href="/akun">← Ringkasan Akun</Link>
          <p>FORM PENGAJUAN</p>
          <h1>{config.title}</h1>
          <span>{config.subtitle} Data tersimpan atas akun Google <strong>{userEmail}</strong>.</span>
        </div>
        <div className="applicant-form-progress"><span>Tahap {stepIndex + 1} dari {config.steps.length}</span><strong>{Math.round(progress)}%</strong></div>
      </div>

      <div className="applicant-form-layout">
        <aside className="applicant-stepper">
          {config.steps.map((step, index) => (
            <button key={step.title} type="button" className={`${index === stepIndex ? "active" : ""} ${index < stepIndex ? "done" : ""}`} onClick={() => index <= stepIndex && setStepIndex(index)}>
              <span>{index < stepIndex ? <PortalIcon name="check" /> : index + 1}</span>
              <div><strong>{step.shortTitle}</strong><small>{step.title}</small></div>
            </button>
          ))}
        </aside>

        <form className="applicant-form-card" onSubmit={submit}>
          <div className="applicant-current-step">
            <p>TAHAP {stepIndex + 1}</p>
            <h2>{currentStep.title}</h2>
            <span>{currentStep.description}</span>
            <div><i style={{ width: `${progress}%` }} /></div>
          </div>

          {loadingLookups && <div className="applicant-form-info">Memuat pilihan data wilayah dan subsektor…</div>}
          {error && <div className="applicant-form-error">{error}</div>}

          <div className="applicant-fields">
            {currentStep.fields.map((field) => {
              const value = values[field.key];
              const fieldOptions = optionsFor(field);
              const wide = field.type === "textarea" || field.type === "file" || field.type === "checkbox";
              return (
                <label key={field.key} className={`${wide ? "wide" : ""} ${field.type === "checkbox" ? "check-field" : ""}`}>
                  {field.type !== "checkbox" && <span>{field.label}{field.required ? <b> *</b> : null}</span>}
                  {field.type === "textarea" ? (
                    <textarea rows={4} value={String(value ?? "")} onChange={(e) => setValue(field.key, e.target.value)} placeholder={field.placeholder} />
                  ) : field.type === "select" ? (
                    <select value={String(value ?? "")} onChange={(e) => setValue(field.key, e.target.value)} disabled={loadingLookups && Boolean(field.lookup)}>
                      <option value="">Pilih {field.label.toLowerCase()}</option>
                      {fieldOptions.map((option) => <option key={String(option.value)} value={String(option.value)}>{option.label}</option>)}
                    </select>
                  ) : field.type === "checkbox" ? (
                    <span className="applicant-checkline"><input type="checkbox" checked={Boolean(value)} onChange={(e) => setValue(field.key, e.target.checked)} /><span>{field.label}{field.required ? <b> *</b> : null}</span></span>
                  ) : field.type === "file" ? (
                    <span className="applicant-filebox">
                      <input type="file" accept={field.accept} onChange={(e: ChangeEvent<HTMLInputElement>) => setValue(field.key, e.target.files?.[0] ?? null)} />
                      <PortalIcon name="plus" />
                      <strong>{value instanceof File ? value.name : "Pilih dokumen"}</strong>
                      <small>Gambar atau PDF · maksimal 5 MB · tersimpan di Cloudflare R2</small>
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
                  {field.help && <small className="field-help">{field.help}</small>}
                </label>
              );
            })}
          </div>

          <div className="applicant-form-actions">
            <button type="button" className="applicant-secondary" onClick={previousStep} disabled={stepIndex === 0}>Kembali</button>
            {stepIndex < config.steps.length - 1 ? (
              <button type="button" className="applicant-primary" onClick={nextStep}>Lanjut ke Tahap {stepIndex + 2} →</button>
            ) : (
              <button type="submit" className="applicant-primary" disabled={submitting}>{submitting ? "Mengirim…" : "Kirim Pengajuan"}</button>
            )}
          </div>
        </form>
      </div>
    </section>
  );
}
