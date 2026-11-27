import { NextResponse } from "next/server";
import { handle } from "@/lib/errors";
import { requireRole } from "@/lib/rbac";
import { markNotificationsRead } from "@/modules/account.service";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Últimas 8 notificações, para o sino do topo. */
export const GET = handle(async () => {
  const { userId } = await requireRole("CANDIDATE", "COMPANY", "ADMIN");
  const items = await db.notification.findMany({ where: { userId }, orderBy: [{ read: "asc" }, { createdAt: "desc" }], take: 8,
    select: { id: true, title: true, body: true, link: true, read: true, createdAt: true } });
  return NextResponse.json({ items }, { headers: { "cache-control": "private, no-store" } });
});

// Corpo: { "ids": ["..."] } para marcar algumas, ou { "all": true } para todas.
export const PATCH = handle(async (req: Request) => {
  const { userId } = await requireRole("CANDIDATE", "COMPANY", "ADMIN");
  return NextResponse.json(await markNotificationsRead(userId, await req.json()));
});
