import { NextRequest, NextResponse } from "next/server";
import { getPublicDirectoryList, isPublicDirectoryType } from "@/lib/public-directory";
export const runtime="nodejs";
function safeLimit(value:string|null){const n=Number(value??24);return Number.isFinite(n)?Math.min(60,Math.max(1,Math.floor(n))):24}
export async function GET(request:NextRequest){
 const requested=request.nextUrl.searchParams.get("type");if(requested&&!isPublicDirectoryType(requested))return NextResponse.json({message:"Jenis direktori tidak valid."},{status:400});
 try{const data=await getPublicDirectoryList({type:requested&&isPublicDirectoryType(requested)?requested:null,query:String(request.nextUrl.searchParams.get("q")??""),featuredOnly:request.nextUrl.searchParams.get("unggulan")==="1",limit:safeLimit(request.nextUrl.searchParams.get("limit"))});return NextResponse.json({data});}
 catch(error){console.error("Public directory error:",error);return NextResponse.json({message:"Direktori terverifikasi belum dapat dimuat."},{status:500});}
}
