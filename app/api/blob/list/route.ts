import { NextResponse } from "next/server";
import { listBlobFiles } from "@/lib/blob/index";

export async function GET() {
  try {
    const blobs = await listBlobFiles();
    return NextResponse.json({ blobs });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Error al listar blobs" }, { status: 500 });
  }
} 