import { describe, expect, it } from "vitest";
import { revive } from "@/lib/cache";

describe("revive (datas que voltam do cache)", () => {
  it("transforma texto ISO em Date e mantém Date como está", () => {
    const d = new Date("2026-11-25T12:00:00.000Z");
    const out = revive({ a: d, b: "2026-11-25T12:00:00.000Z", c: [{ d: "2026-01-02T03:04:05Z" }], e: "texto", f: 3, g: null });
    expect(out.a).toBe(d);
    expect(out.b).toBeInstanceOf(Date);
    expect((out.c[0].d as unknown as Date).getTime()).toBe(Date.parse("2026-01-02T03:04:05Z"));
    expect(out.e).toBe("texto"); expect(out.f).toBe(3); expect(out.g).toBeNull();
  });
  it("funciona depois de passar por JSON, como no cache", () => {
    const back = revive(JSON.parse(JSON.stringify({ when: new Date("2026-03-01T00:00:00.000Z") })));
    expect(back.when).toBeInstanceOf(Date);
  });
});
