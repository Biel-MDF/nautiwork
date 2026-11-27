import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/app-url";

// Áreas logadas e a API não interessam a buscadores.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/candidate", "/company", "/admin", "/support", "/api", "/reset-password", "/verify-email", "/validar-projeto", "/checkin", "/visitante"] },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
