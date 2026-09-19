"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { PortalIcon, type PortalIconName } from "./PortalIcon";
import { submissionConfigs, type SubmissionField, type SubmissionType } from "@/lib/submission-config";
import { startPortalLoading, stopPortalLoading } from "./PortalPreloader";

type Recent = { id:number; jenis:"ekraf"|"sdm"|"komunitas"; no_registrasi:string|null; nama:string; detail:string; status:string; created_at:string };
type Summary = { total:number; menunggu:number; disetujui:number; ditolak:number; ekraf:number; sdm:number; komunitas:number; berita:number; acara:number };
type FullRow = Record<string, unknown> & { id: number; status_label?: string; created_at?: string; no_registrasi?: string };

const MAX_DASHBOARD_ROWS = 10;

const cards:{key:keyof Pick<Summary,"total"|"menunggu"|"disetujui"|"ditolak">;label:string;caption:string;icon:PortalIconName}[]=[
 {key:"total",label:"Total Pengajuan",caption:"Tiga jenis pengajuan",icon:"clipboard"},
 {key:"menunggu",label:"Menunggu Verifikasi",caption:"Perlu ditinjau petugas",icon:"clock"},
 {key:"disetujui",label:"Disetujui",caption:"Lolos verifikasi",icon:"check"},
 {key:"ditolak",label:"Ditolak",caption:"Tidak lolos verifikasi",icon:"x"},
];

function formatDate(v:string){const d=new Date(v.replace(" ","T"));return Number.isNaN(d.getTime())?v:new Intl.DateTimeFormat("id-ID",{dateStyle:"medium"}).format(d);}

function formatDateFull(value: unknown, withTime = false) {
  if (!value) return "—";
  const date = new Date(String(value).replace(" ", "T"));
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat("id-ID", withTime ? { dateStyle: "medium", timeStyle: "short" } : { dateStyle: "medium" }).format(date);
}

function fieldValue(row: FullRow, field: SubmissionField) {
  const aliases: Record<string, string> = {
    subsektor_id: "subsektor_label",
    kecamatan_id: "kecamatan_label",
    kelurahan_id: "kelurahan_label",
    komunitas_id: "komunitas_label",
    kecamatan_usaha_id: "kecamatan_usaha_label",
    kelurahan_usaha_id: "kelurahan_usaha_label",
  };
  const alias = aliases[field.key];
  const value = alias && row[alias] ? row[alias] : row[field.key];
  if (value === null || value === undefined || value === "") return "—";
  if (field.type === "checkbox") return Number(value) === 1 ? "Ya" : "Tidak";
  if (field.type === "date") return formatDateFull(value);
  if (field.key.includes("tanggal_") || field.key.endsWith("_at")) return formatDateFull(value, true);
  if (field.key === "omzet_per_tahun") return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Number(value));
  return String(value);
}

function statusClass(status: string) {
  return status.toLowerCase().replaceAll(" ", "-");
}

const jenisLinks: Record<string, string> = {
  ekraf: "/dashboard/pengajuan/pelaku-ekraf",
  sdm: "/dashboard/pengajuan/sdm-pariwisata",
  komunitas: "/dashboard/pengajuan/komunitas",
};

export function DashboardOverview(){
 const [data,setData]=useState<Summary|null>(null);
 const [rows,setRows]=useState<Recent[]>([]);
 const [totalRecent,setTotalRecent]=useState(0);
 const [error,setError]=useState("");
 const [loadingDelete,setLoadingDelete]=useState<number|null>(null);
 const [note,setNote]=useState("");
 const [saving,setSaving]=useState(false);
 const [selected,setSelected]=useState<FullRow|null>(null);
 const [selectedJenis,setSelectedJenis]=useState<SubmissionType>("ekraf");
 const [detailStep,setDetailStep]=useState(0);
 const [loadingReview,setLoadingReview]=useState<string|null>(null);
 const [search, setSearch] = useState("");

 const load = useCallback(async (searchQuery = "") => {
  const queryParam = searchQuery.trim() ? `&search=${encodeURIComponent(searchQuery.trim())}` : "";
  const r = await fetch(`/api/dashboard/summary?page=1&pageSize=${MAX_DASHBOARD_ROWS}${queryParam}`, { cache: "no-store" });
  const p = await r.json();
  if (!r.ok) throw new Error(p.message || "Gagal memuat dashboard");
  setData(p.data);
  setRows(p.data.recent || []);
  setTotalRecent(p.pagination?.total ?? 0);
 }, []);

 useEffect(() => {
  const timer = setTimeout(() => {
   load(search).catch((e) => setError(e.message));
  }, 250);
  return () => clearTimeout(timer);
 }, [search, load]);

 const openReview = useCallback(async (row: Recent) => {
  const reviewKey = `${row.jenis}-${row.id}`;
  setLoadingReview(reviewKey);
  setError("");
  try {
   const r = await fetch(`/api/submissions?type=${row.jenis}`, { cache: "no-store" });
   const p = await r.json();
   if (!r.ok) throw new Error(p.message || "Gagal memuat detail pengajuan.");
   const allRows: FullRow[] = p.data ?? [];
   const fullRecord = allRows.find((item) => Number(item.id) === row.id);
   if (!fullRecord) throw new Error("Data pengajuan tidak ditemukan.");
   setSelected(fullRecord);
   setSelectedJenis(row.jenis);
   setDetailStep(0);
   setNote(String(fullRecord.catatan_verifikasi ?? fullRecord.alasan_penolakan ?? ""));
  } catch (e) {
   setError(e instanceof Error ? e.message : "Gagal memuat detail pengajuan.");
  } finally {
   setLoadingReview(null);
  }
 }, []);

 // Open review directly by submission type & id (from notification click)
 const openReviewById = useCallback(async (jenis: "ekraf" | "sdm" | "komunitas", id: number) => {
  const reviewKey = `${jenis}-${id}`;
  setLoadingReview(reviewKey);
  setError("");
  startPortalLoading("Memuat data tinjauan…");
  try {
   const r = await fetch(`/api/submissions?type=${jenis}`, { cache: "no-store" });
   const p = await r.json();
   if (!r.ok) throw new Error(p.message || "Gagal memuat detail pengajuan.");
   const allRows: FullRow[] = p.data ?? [];
   const fullRecord = allRows.find((item) => Number(item.id) === id);
   if (!fullRecord) throw new Error("Data pengajuan tidak ditemukan.");
   setSelected(fullRecord);
   setSelectedJenis(jenis);
   setDetailStep(0);
   setNote(String(fullRecord.catatan_verifikasi ?? fullRecord.alasan_penolakan ?? ""));
  } catch (e) {
   setError(e instanceof Error ? e.message : "Gagal memuat detail pengajuan.");
  } finally {
   setLoadingReview(null);
   stopPortalLoading();
  }
 }, []);

  // Listen for custom event from notification bell or URL query parameters
  useEffect(() => {
   function handleOpenReview(e: Event) {
    const detail = (e as CustomEvent).detail as { jenis: "ekraf" | "sdm" | "komunitas"; id: number } | undefined;
    if (detail?.jenis && detail?.id) {
     void openReviewById(detail.jenis, detail.id);
    }
   }
   window.addEventListener("openSubmissionReview", handleOpenReview);

   // Check URL parameters when redirected from another page
   if (typeof window !== "undefined") {
    const params = new URLSearchParams(window.location.search);
    const reviewType = params.get("reviewType") as "ekraf" | "sdm" | "komunitas" | null;
    const reviewId = Number(params.get("reviewId"));
    if (reviewType && ["ekraf", "sdm", "komunitas"].includes(reviewType) && Number.isInteger(reviewId) && reviewId > 0) {
     void openReviewById(reviewType, reviewId);
     window.history.replaceState({}, "", "/dashboard");
    }
   }

   return () => window.removeEventListener("openSubmissionReview", handleOpenReview);
  }, [openReviewById]);

 async function remove(row:Recent){
  if(!confirm(`Hapus pengajuan ${row.nama}?`)) return;
  setLoadingDelete(row.id);
  startPortalLoading("Sedang menghapus pengajuan…");
  try{
   const r=await fetch("/api/submissions",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({type:row.jenis,id:row.id})});
   const p=await r.json();
   if(!r.ok) throw new Error(p.message);
   await load();
  }catch(e){setError(e instanceof Error?e.message:"Gagal menghapus");}
  finally{
   setLoadingDelete(null);
   stopPortalLoading();
  }
 }


 async function verify(action:"approve"|"reject"){
  if(!selected) return;
  if(action==="reject" && !note.trim()){
   setError("Alasan penolakan wajib diisi sebelum pengajuan ditolak.");
   return;
  }
  setSaving(true);
  try{
   const r=await fetch("/api/submissions",{
    method:"PATCH",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({type:selectedJenis,id:selected.id,action,note})
   });
   const p=await r.json();
   if(!r.ok) throw new Error(p.message||"Gagal menyimpan verifikasi.");
   setSelected(null);
   setNote("");
   load();
  }catch(e){setError(e instanceof Error?e.message:"Gagal menyimpan.");}
  finally{setSaving(false);}
 }

 const config = selected ? submissionConfigs[selectedJenis] : null;
 const currentStatus = selected ? String(selected.status_label ?? "Menunggu") : "";

 const visibleRows = useMemo(() => {
   const q = search.trim().toLowerCase();
   if (!q) return rows;
   return rows.filter((row) => {
     const jenisLabel = row.jenis === "ekraf" ? "pelaku ekraf" : row.jenis === "sdm" ? "sdm pariwisata" : "komunitas";
     return (
       (row.no_registrasi || "").toLowerCase().includes(q) ||
       (row.nama || "").toLowerCase().includes(q) ||
       (row.detail || "").toLowerCase().includes(q) ||
       (row.status || "").toLowerCase().includes(q) ||
       jenisLabel.includes(q)
     );
   });
 }, [rows, search]);

 return <section>
  <div className="portal-page-head"><div><p className="portal-breadcrumb">Dashboard</p><h1>Dashboard Pengelolaan Data</h1><p>Pantau pengajuan yang masuk, berita, dan acara SI PARIK BANGKA Kabupaten Bangka.</p></div></div>
  {error&&!selected&&<div className="portal-alert error">{error}</div>}
  <div className="portal-stat-row">{cards.map(c=><div className="portal-stat-card" key={c.key}><span className="stat-icon"><PortalIcon name={c.icon}/></span><div><small>{c.label}</small><strong>{data?.[c.key]??"—"}</strong><p>{c.caption}</p></div></div>)}</div>
  <div className="portal-panel">
   <div className="portal-panel-head">
     <div>
       <h2>Pengajuan yang perlu ditinjau</h2>
       <p>
         Menunggu atau Perlu Perbaikan.
         {search
           ? ` Menampilkan hasil pencarian "${search}".`
           : totalRecent > MAX_DASHBOARD_ROWS
           ? ` Menampilkan ${MAX_DASHBOARD_ROWS} dari ${totalRecent} pengajuan.`
           : ""}
       </p>
     </div>
   </div>

   <div className="dm-toolbar">
     <label>
       <PortalIcon name="search" />
       <input
         type="text"
         value={search}
         onChange={(e) => setSearch(e.target.value)}
         placeholder="Cari pengajuan (registrasi, nama, usaha, atau jenis)…"
         aria-label="Cari pengajuan"
       />
     </label>
     {search && (
       <button
         type="button"
         onClick={() => setSearch("")}
         style={{
           background: "none",
           border: "1px solid #e0e6e9",
           borderRadius: "8px",
           padding: "6px 12px",
           cursor: "pointer",
           color: "#536d7b",
           fontSize: "12px",
           display: "inline-flex",
           alignItems: "center",
           gap: "4px",
         }}
         title="Reset pencarian"
       >
         ✕ Reset
       </button>
     )}
     <span>{search ? `${visibleRows.length} data ditemukan` : `${visibleRows.length} data`}</span>
   </div>

   <div className="dm-table-wrap embedded"><table className="dm-table"><thead><tr><th>No. Registrasi</th><th>Jenis</th><th>Nama</th><th>Detail</th><th>Status</th><th>Tanggal</th><th>Aksi</th></tr></thead>
   <tbody>{visibleRows.length===0?<tr><td colSpan={7} className="dm-empty">{search ? `Tidak ada pengajuan yang cocok dengan "${search}".` : "Tidak ada pengajuan."}</td></tr>:visibleRows.map(row=>{
    const reviewKey = `${row.jenis}-${row.id}`;
    const isLoadingThis = loadingReview === reviewKey;
    return <tr key={reviewKey}><td><button className="table-link" type="button" disabled={isLoadingThis} onClick={()=>openReview(row)}>{isLoadingThis ? "Memuat…" : (row.no_registrasi||"—")}</button></td><td>{row.jenis==="ekraf"?"Pelaku Ekraf":row.jenis==="sdm"?"SDM Pariwisata":"Komunitas"}</td><td>{row.nama}</td><td>{row.detail}</td><td><span className="portal-status">{row.status}</span></td><td>{formatDate(row.created_at)}</td><td><div className="submission-actions"><button className="review-button" type="button" disabled={isLoadingThis} onClick={()=>openReview(row)}><PortalIcon name="eye"/> {isLoadingThis ? "Memuat…" : "Tinjau"}</button><button className="verify-reject" onClick={()=>remove(row)} disabled={loadingDelete===row.id}><PortalIcon name="x"/> Hapus</button></div></td></tr>;
   })}</tbody></table></div>

   {/* Link ke halaman lengkap, gantikan pagination */}
   {totalRecent > MAX_DASHBOARD_ROWS && !search && (
    <div className="dashboard-view-all-row">
     <a href="/dashboard/pengajuan/pelaku-ekraf" className="dashboard-view-all-link">
      <PortalIcon name="clipboard" /> Lihat semua pengajuan →
     </a>
    </div>
   )}
  </div>

  {selected && config && (
   <div className="portal-modal-layer" role="dialog" aria-modal="true">
    <button className="portal-modal-backdrop" type="button" onClick={()=>setSelected(null)} aria-label="Tutup"/>
    <div className="portal-modal verification-modal">
     <div className="portal-modal-head">
      <div><p>{selected.no_registrasi||"Pengajuan"}</p><h2>{selectedJenis === "komunitas" ? String(selected.nama_organisasi ?? "—") : String(selected.nama_lengkap ?? "—")}</h2></div>
      <button type="button" onClick={()=>setSelected(null)}><PortalIcon name="x"/></button>
     </div>

     <div className="verification-status-row">
      <span>Status saat ini</span>
      <span className={`portal-status ${statusClass(currentStatus)}`}>{currentStatus}</span>
      <small>Dikirim {formatDateFull(selected.created_at, true)}</small>
     </div>

     <div className="verification-steps" role="tablist" aria-label="Tahapan data pengajuan">
      {config.steps.map((step,index)=>(
       <button key={step.shortTitle} type="button" className={detailStep===index?"active":""} onClick={()=>setDetailStep(index)}>
        <span>{index+1}</span>{step.shortTitle}
       </button>
      ))}
     </div>

     <div className="verification-section">
      <div className="verification-section-head">
       <p>Tahap {detailStep+1}</p>
       <h3>{config.steps[detailStep]?.title || "Detail Pengajuan"}</h3>
       <span>{config.steps[detailStep]?.description || "Periksa data pengajuan."}</span>
      </div>
      <div className="verification-grid">
       {(config.steps[detailStep]?.fields || []).filter((field) => field.key !== "konfirmasi_kebenaran").map((field)=>{
        const value = fieldValue(selected, field);
        const isFile = field.type === "file" && value !== "—";
        const fileLinkLabel = field.fileKind === "document" ? "Buka dokumen ↗" : "Buka gambar ↗";
        return <div key={field.key} className={field.type==="textarea"||field.type==="file"||field.type==="checkbox"?"wide":""}>
          <span>{field.label}</span>
          {isFile ? <a href={value} target="_blank" rel="noreferrer">{fileLinkLabel}</a> : <strong>{value}</strong>}
        </div>;
       })}
      </div>
     </div>

     <div className="verification-decision">
      <label className="portal-field full">
       <span>Catatan Verifikasi / Alasan Penolakan</span>
       <textarea rows={3} value={note} onChange={e=>setNote(e.target.value)} placeholder="Tambahkan catatan. Wajib diisi apabila pengajuan ditolak."/>
      </label>
      {error && <div className="portal-alert error">{error}</div>}
      <div className="verification-actions">
       <button className="verify-reject" type="button" disabled={saving} onClick={()=>verify("reject")}><PortalIcon name="x"/>Tolak Pengajuan</button>
       <button className="verify-approve" type="button" disabled={saving} onClick={()=>verify("approve")}><PortalIcon name="check"/>{saving?"Menyimpan…":"Setujui Pengajuan"}</button>
      </div>
     </div>
    </div>
   </div>
  )}

 </section>
}