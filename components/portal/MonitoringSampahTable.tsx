"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { PortalIcon } from "./PortalIcon";
import { SortableTableHeader, TablePagination, type SortDirection } from "./DataTableControls";

export default function MonitoringSampahTable({rows}:{rows:any[]}) {
 const [query,setQuery]=useState("");
 const [sortKey,setSortKey]=useState("created_at");
 const [direction,setDirection]=useState<SortDirection>("desc");
 const [page,setPage]=useState(1);
 const [pageSize,setPageSize]=useState(10);

 const filtered=useMemo(()=>rows.filter(r=>JSON.stringify(r).toLowerCase().includes(query.toLowerCase())).sort((a,b)=>{
   const av=a[sortKey]??"", bv=b[sortKey]??"";
   return direction==="asc" ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
 }),[rows,query,sortKey,direction]);

 const changeSort=(key:string)=> {
   if(sortKey===key) setDirection(direction==="asc"?"desc":"asc");
   else {setSortKey(key); setDirection("asc");}
   setPage(1);
 };
 const items=filtered.slice((page-1)*pageSize,page*pageSize);

 const cols=[
  ["nama_pelapor","PELAPOR"],["lokasi_nama","LOKASI"],["deteksi_utama","JENIS SAMPAH"],
  ["confidence","CONFIDENCE"],["status","STATUS"],["created_at","WAKTU"]
 ];

 return <>
 <div className="dm-toolbar">
   <label><PortalIcon name="search"/><input value={query} onChange={e=>{setQuery(e.target.value);setPage(1)}} placeholder="Cari monitoring sampah..."/></label>
   <span>{filtered.length} data</span>
 </div>
 <div className="dm-table-wrap">
  <table className="dm-table">
   <thead><tr>{cols.map(([k,l])=><SortableTableHeader key={k} label={l} sortKey={k} activeKey={sortKey} direction={direction} onSort={changeSort}/>)}<th>Aksi</th></tr></thead>
   <tbody>{items.map(r=><tr key={r.id}>
    <td>{r.nama_pelapor}</td>
    <td>{r.lokasi_nama}</td>
    <td>{r.deteksi_utama||"—"}</td>
    <td>{r.confidence?`${(Number(r.confidence)*100).toFixed(1)}%`:"—"}</td>
    <td><span className={`portal-status ${String(r.status).toLowerCase()}`}>{r.status}</span></td>
    <td>{new Date(r.created_at).toLocaleString("id-ID")}</td>
    <td className="dm-actions">

  <Link
    href={`/dashboard/monitoring-sampah/${r.id}`}
    className="dm-action"
    title="Lihat Detail"
  >
    <PortalIcon name="eye"/>
  </Link>


  <button
    className="dm-action danger"
    type="button"
    title="Hapus"
  >
    <PortalIcon name="trash"/>
  </button>

</td>
   </tr>)}</tbody>
  </table>
 </div>
 <TablePagination totalItems={filtered.length} page={page} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={setPageSize}/>
 </>
}