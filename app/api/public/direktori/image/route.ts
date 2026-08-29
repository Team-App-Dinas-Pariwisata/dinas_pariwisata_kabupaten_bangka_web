import { NextRequest, NextResponse } from "next/server";
import { getApprovedDirectoryImageReferences, isPublicDirectoryType } from "@/lib/public-directory";
import { getSubmissionFileFromR2, keyFromR2SubmissionStorageReference, r2MimeFromKey } from "@/lib/r2";
export const runtime="nodejs";export const dynamic="force-dynamic";
function validId(value:string|null){const n=Number(value);return Number.isSafeInteger(n)&&n>0?n:null}
export async function GET(request:NextRequest){
 const type=request.nextUrl.searchParams.get("type"),id=validId(request.nextUrl.searchParams.get("id"));if(!type||!isPublicDirectoryType(type)||!id)return NextResponse.json({message:"Gambar direktori tidak ditemukan."},{status:404});
 try{const refs=await getApprovedDirectoryImageReferences(type,id);const key=refs?.map(ref=>keyFromR2SubmissionStorageReference(ref)).find(Boolean)??null;if(!key)return NextResponse.json({message:"Gambar direktori tidak ditemukan."},{status:404});
 const object=await getSubmissionFileFromR2(key);if(!object)return NextResponse.json({message:"Gambar direktori tidak ditemukan."},{status:404});const contentType=object.contentType||r2MimeFromKey(key);if(!contentType.toLowerCase().startsWith("image/"))return NextResponse.json({message:"File ini bukan gambar publik."},{status:415});
 const headers=new Headers({"Content-Type":contentType,"Cache-Control":"public, max-age=300, s-maxage=900, stale-while-revalidate=3600","X-Content-Type-Options":"nosniff","Content-Disposition":"inline"});if(object.etag)headers.set("ETag",`\"${object.etag}\"`);if(object.lastModified)headers.set("Last-Modified",object.lastModified.toUTCString());if(typeof object.contentLength==="number")headers.set("Content-Length",String(object.contentLength));return new NextResponse(object.body,{status:200,headers});}
 catch(error){console.error("Public directory image error:",error);return NextResponse.json({message:"Gambar direktori belum dapat dimuat."},{status:502});}
}
