import { NextResponse } from "next/server";
import { handle, HttpError } from "@/lib/errors";
import { rateLimit } from "@/lib/rate-limit";
import { verifyEmail } from "@/modules/auth-tokens.service";

export const POST = handle(async (req: Request) => {
  const ip = req.headers.get("x-forwarded-for") ?? "local";
  if (!(await rateLimit(`verify:${ip}`, 20, 15 * 60_000))) throw new HttpError(429, "Muitas tentativas. Aguarde alguns minutos.");
  return NextResponse.json(await verifyEmail(await req.json()));
});
