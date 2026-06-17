import { NextResponse } from "next/server";

export function ok<T>(data: T, meta?: Record<string, unknown>) {
  return NextResponse.json({ ok: true, data, ...(meta ? { meta } : {}) });
}

export function notFound(message = "No encontrado") {
  return NextResponse.json({ ok: false, error: message }, { status: 404 });
}

export function serverError(message = "Error interno") {
  return NextResponse.json({ ok: false, error: message }, { status: 500 });
}
