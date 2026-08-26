import { NextRequest, NextResponse } from "next/server";
import { getPublicTourismBySlug, getPublicTourismList, type TourismKind } from "@/lib/public-tourism";
const valid=(v:string|null):v is TourismKind=>v==="tempat-wisata"||v==="kuliner"||v==="hotel"||v==="satwa-endemik";
export async function GET(request:NextRequest){
 const kind=request.nextUrl.searchParams.get("kind");if(!valid(kind))return NextResponse.json({message:"Jenis wisata tidak valid."},{status:400});
 try{const slug=String(request.nextUrl.searchParams.get("slug")||"").trim();if(slug){const item=await getPublicTourismBySlug(kind,slug);if(!item)return NextResponse.json({message:"Data tidak ditemukan."},{status:404});return NextResponse.json({data:item});}
 const page=Number(request.nextUrl.searchParams.get("page")||1);const size=Number(request.nextUrl.searchParams.get("pageSize")||12);return NextResponse.json({data:await getPublicTourismList(kind,page,size)});
 }catch(error){console.error("mobile tourism",error);return NextResponse.json({message:"Data wisata belum dapat dimuat."},{status:500});}
}
