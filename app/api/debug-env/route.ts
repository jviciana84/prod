import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    IMAP_USER: process.env.IMAP_USER,
    IMAP_PASSWORD: process.env.IMAP_PASSWORD ? "SET" : "NOT SET",
    IMAP_HOST: process.env.IMAP_HOST,
    IMAP_PORT: process.env.IMAP_PORT,
    IMAP_TLS: process.env.IMAP_TLS,
  });
} 