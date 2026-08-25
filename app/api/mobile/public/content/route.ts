import { NextRequest, NextResponse } from "next/server";
import { getPublicEventBySlug, getPublicEventList, getPublicNewsBySlug, getPublicNewsList } from "@/lib/public-content";
export async function GET(request:NextRequest){
 const type=request.nextUrl.searchParams.get("type");if(type!=="news"&&type!=="event")return NextResponse.json({message:"Jenis konten tidak valid."},{status:400});
 try{const slug=String(request.nextUrl.searchParams.get("slug")||"").trim();if(slug){const item=type==="news"?await getPublicNewsBySlug(slug):await getPublicEventBySlug(slug);if(!item)return NextResponse.json({message:"Data tidak ditemukan."},{status:404});return NextResponse.json({data:item});}
 const page=Number(request.nextUrl.searchParams.get("page")||1);const size=Number(request.nextUrl.searchParams.get("pageSize")||12);const data=type==="news"?await getPublicNewsList(page,size):await getPublicEventList(page,size);return NextResponse.json({data});
 }catch(error){console.error("mobile public content",error);return NextResponse.json({message:"Konten publik belum dapat dimuat."},{status:500});}
}
