import { NextResponse } from "next/server";
import { ZodError } from "zod";
import * as Sentry from "@sentry/nextjs";

export class HttpError extends Error {
  constructor(public status: number, message: string, public fields?: Record<string, string[]>) { super(message); }
}

export function handle<A extends unknown[]>(fn: (...a: A) => Promise<Response>) {
  return async (...a: A) => {
    try { return await fn(...a); }
    catch (e) {
      if (e instanceof HttpError) return NextResponse.json(e.fields ? { error: e.message, fields: e.fields } : { error: e.message }, { status: e.status });
      if (e instanceof ZodError)
        return NextResponse.json({ error: "Dados inválidos", fields: e.flatten().fieldErrors }, { status: 400 });
      // Erro inesperado: vai para o log e para o Sentry (quando configurado).
      console.error(e);
      Sentry.captureException(e);
      return NextResponse.json({ error: "Erro interno. Tente novamente." }, { status: 500 });
    }
  };
}
