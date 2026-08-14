"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { submissionConfigs, type SubmissionField, type SubmissionLookup, type SubmissionType } from "@/lib/submission-config";
import { PortalIcon } from "@/components/portal/PortalIcon";

type LookupOption = { value: number | string; label: string; kecamatan_id?: number };
type LookupData = Record<SubmissionLookup, LookupOption[]>;
type FieldValue = string | boolean | File | null;
type ExistingFiles = Record<string, string>;

type Props = {
  type: SubmissionType;
  userName: string;
  userEmail: string;
  submissionId?: number;
};

type SubmissionDetail = Record<string, unknown> & {
  id: number;
  no_registrasi?: string | null;
  status_label?: string | null;
  can_edit?: boolean;
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

function valuesFromSubmission(type: SubmissionType, data: SubmissionDetail, userName: string, userEmail: string) {
  const out = initialValues(type, userName, userEmail);
  const files: ExistingFiles = {};

  for (const step of submissionConfigs[type].steps) {
    for (const field of step.fields) {
      if (field.key === "konfirmasi_kebenaran") {
        out[field.key] = false; // wajib dikonfirmasi ulang setiap menyimpan perubahan
        continue;
      }

      const raw = data[field.key];
      if (field.type === "file") {
        out[field.key] = null;
        if (typeof raw === "string" && raw.trim()) files[field.key] = raw;
        continue;
      }
      if (field.type === "checkbox") {
        out[field.key] = raw === true || raw === 1 || raw === "1";
        continue;
      }
      out[field.key] = raw === null || raw === undefined ? "" : String(raw);
    }
  }

  return { values: out, files };
}

function hasValue(value: FieldValue) {
  if (typeof value === "boolean") return value;
  if (value instanceof File) return value.size > 0;
  return String(value ?? "").trim().length > 0;
}

export function ApplicantSubmissionForm({ type, userName, userEmail, submissionId }: Props) {
  const config = submissionConfigs[type];
  const editMode = Number.isInteger(submissionId) && Number(submissionId) > 0;
  const [stepIndex, setStepIndex] = useState(0);
  const [values, setValues] = useState<Record<string, FieldValue>>(() => initialValues(type, userName, userEmail));
  const [existingFiles, setExistingFiles] = useState<ExistingFiles>({});
  const [lookups, setLookups] = useState<LookupData>({ subsektor: [], kecamatan: [], kelurahan: [], komunitas: [] });
  const [loadingLookups, setLoadingLookups] = useState(true);
  const [loadingSubmission, setLoadingSubmission] = useState(editMode);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [registration, setRegistration] = useState("");
  const [currentRegistration, setCurrentRegistration] = useState("");
  const [currentStatus, setCurrentStatus] = useState("");
  const [verificationNote, setVerificationNote] = useState("");
  const [editable, setEditable] = useState(true);

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

  useEffect(() => {
    if (!editMode || !submissionId) return;
    let active = true;
    setLoadingSubmission(true);

    fetch(`/api/akun/submissions?type=${encodeURIComponent(type)}&id=${submissionId}`, { cache: "no-store" })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.message || "Data pengajuan gagal dimuat.");
        return payload.data as SubmissionDetail;
      })
      .then((data) => {
        if (!active) return;
        const prepared = valuesFromSubmission(type, data, userName, userEmail);
        setValues(prepared.values);
        setExistingFiles(prepared.files);
        setCurrentRegistration(String(data.no_registrasi ?? ""));
        setCurrentStatus(String(data.status_label ?? "Menunggu"));
        setVerificationNote(String(data.catatan_verifikasi ?? "").trim());
        setEditable(data.can_edit !== false);
      })
      .catch((err) => {
        if (active) {
          setEditable(false);
          setError(err instanceof Error ? err.message : "Data pengajuan gagal dimuat.");
        }
      })
      .finally(() => { if (active) setLoadingSubmission(false); });

    return () => { active = false; };
  }, [editMode, submissionId, type, userName, userEmail]);

  const currentStep = config.steps[stepIndex];
  const progress = ((stepIndex + 1) / config.steps.length) * 100;
  const viewOnly = editMode && !loadingSubmission && !editable && currentStatus.trim().toLowerCase() === "disetujui";
  const currentMissing = useMemo(
    () => currentStep.fields.filter((field) => {
      if (!field.required) return false;
      if (field.type === "file") return !hasValue(values[field.key]) && !existingFiles[field.key];
      return !hasValue(values[field.key]);
    }),
    [currentStep.fields, values, existingFiles],
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
    if (!viewOnly && currentMissing.length) {
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
    if (!editable || loadingSubmission) return;
    if (currentMissing.length) {
      setError(`Lengkapi field wajib: ${currentMissing.map((field) => field.label).join(", ")}.`);
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const body = new FormData();
      body.set("type", type);
      if (editMode && submissionId) body.set("id", String(submissionId));

      for (const [key, value] of Object.entries(values)) {
        if (value instanceof File) body.set(key, value);
        else if (typeof value === "boolean") body.set(key, value ? "1" : "0");
        else if (value !== null) body.set(key, String(value)); // string kosong dikirim agar field opsional dapat dikosongkan saat edit
      }

      const response = await fetch("/api/akun/submissions", {
        method: editMode ? "PATCH" : "POST",
        body,
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || (editMode ? "Perubahan pengajuan gagal disimpan." : "Pengajuan gagal dikirim."));
      setRegistration(String(payload.data?.no_registrasi ?? currentRegistration ?? ""));
      setCurrentStatus(String(payload.data?.status ?? "Menunggu"));
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(err instanceof Error ? err.message : (editMode ? "Perubahan pengajuan gagal disimpan." : "Pengajuan gagal dikirim."));
    } finally {
      setSubmitting(false);
    }
  }

  if (registration) {
    return (
      <section className="applicant-form-success">
        <span><PortalIcon name="check" /></span>
        <p>{editMode ? "PERUBAHAN BERHASIL DISIMPAN" : "PENGAJUAN BERHASIL DIKIRIM"}</p>
        <h1>{editMode ? "Pengajuan Anda sudah diperbarui." : "Data Anda sudah masuk ke proses verifikasi."}</h1>
        <p>{editMode ? "Status dikembalikan ke Menunggu agar petugas dapat memeriksa perubahan terbaru." : "Simpan nomor registrasi ini. Status pengajuan juga dapat dipantau dari halaman Ringkasan Akun."}</p>
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
          <p>{viewOnly ? "DETAIL PENGAJUAN" : editMode ? "EDIT PENGAJUAN" : "FORM PENGAJUAN"}</p>
          <h1>{viewOnly ? `Lihat ${config.title.replace("Pengajuan ", "")}` : editMode ? `Edit ${config.title.replace("Pengajuan ", "")}` : config.title}</h1>
          <span>
            {viewOnly
              ? <>Pengajuan ini tetap dapat dilihat dari akun Anda. Nomor registrasi <strong>{currentRegistration || "—"}</strong>.</>
              : editMode
                ? <>Perbarui data yang diperlukan. Nomor registrasi <strong>{currentRegistration || "—"}</strong> tetap digunakan.</>
                : <>{config.subtitle} Data tersimpan atas akun Google <strong>{userEmail}</strong>.</>}
          </span>
        </div>
        <div className="applicant-form-progress"><span>Tahap {stepIndex + 1} dari {config.steps.length}</span><strong>{Math.round(progress)}%</strong></div>
      </div>

      {editMode && (
        <div className="applicant-edit-notice">
          <div>
            <strong>Status saat ini: {currentStatus || "Memuat…"}</strong>
            {viewOnly ? (
              <span>Pengajuan yang sudah disetujui tetap dapat Anda lihat. Data tidak dapat diubah setelah verifikasi final.</span>
            ) : (
              <span>Setelah perubahan disimpan, pengajuan akan kembali berstatus <b>Menunggu</b> untuk diverifikasi ulang.</span>
            )}
            {verificationNote && <span className="applicant-verification-note"><b>Catatan petugas:</b> {verificationNote}</span>}
          </div>
          <Link href="/akun">{viewOnly ? "Kembali" : "Batal edit"}</Link>
        </div>
      )}

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

          {loadingSubmission && <div className="applicant-form-info">Memuat data pengajuan Anda…</div>}
          {loadingLookups && <div className="applicant-form-info">Memuat pilihan data wilayah dan subsektor…</div>}
          {error && <div className="applicant-form-error">{error}</div>}

          <fieldset className="applicant-edit-fieldset" disabled={loadingSubmission || !editable || submitting}>
            <div className="applicant-fields">
              {currentStep.fields.map((field) => {
                const value = values[field.key];
                const fieldOptions = optionsFor(field);
                const wide = field.type === "textarea" || field.type === "file" || field.type === "checkbox";
                const existingFile = existingFiles[field.key];
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
                      <span className={`applicant-filebox ${field.fileKind === "document" ? "document-file" : "image-file"}`}>
                        <input type="file" accept={field.accept} onChange={(e: ChangeEvent<HTMLInputElement>) => setValue(field.key, e.target.files?.[0] ?? null)} />
                        <PortalIcon name="plus" />
                        <strong>{value instanceof File ? value.name : existingFile ? "Ganti file jika diperlukan" : field.fileKind === "document" ? "Pilih dokumen" : "Pilih gambar"}</strong>
                        <small>{field.fileKind === "document" ? "Dokumen PDF, JPG/JPEG, atau PNG" : "Gambar JPG/JPEG atau PNG"} · maksimal 5 MB · Cloudflare R2</small>
                        {existingFile && !(value instanceof File) && (
                          <a className="applicant-existing-file" href={existingFile} target="_blank" rel="noreferrer" onClick={(event) => event.stopPropagation()}>
                            <PortalIcon name="eye" /> Lihat file saat ini
                          </a>
                        )}
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
          </fieldset>

          <div className="applicant-form-actions">
            <button type="button" className="applicant-secondary" onClick={previousStep} disabled={stepIndex === 0 || loadingSubmission}>Kembali</button>
            {stepIndex < config.steps.length - 1 ? (
              <button type="button" className="applicant-primary" onClick={nextStep} disabled={loadingSubmission}>Lanjut ke Tahap {stepIndex + 2} →</button>
            ) : viewOnly ? (
              <Link href="/akun" className="applicant-primary">Selesai · Kembali ke Ringkasan</Link>
            ) : (
              <button type="submit" className="applicant-primary" disabled={submitting || loadingSubmission || !editable}>{submitting ? (editMode ? "Menyimpan…" : "Mengirim…") : (editMode ? "Simpan Perubahan" : "Kirim Pengajuan")}</button>
            )}
          </div>
        </form>
      </div>
    </section>
  );
}
