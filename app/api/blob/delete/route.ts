import { NextResponse } from "next/server";
import { deleteFromBlob } from "@/lib/blob/index";

export async function POST(request: Request) {
  try {
    const { pathname } = await request.json();
    if (!pathname) {
      return NextResponse.json({ error: "Falta pathname" }, { status: 400 });
    }
    await deleteFromBlob(pathname);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Error al borrar blob" }, { status: 500 });
  }
} 