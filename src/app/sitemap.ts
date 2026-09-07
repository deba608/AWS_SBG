import type { MetadataRoute } from "next";
import { SITE } from "@/lib/constants";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = SITE.url;
  return [
    {
      url: `${base}/`,
      lastModified: new Date("2026-09-07"),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${base}/events/aws-student-community-day-suiit-2026`,
      lastModified: new Date("2026-09-07"),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${base}/events`,
      lastModified: new Date("2026-09-07"),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${base}/team`,
      lastModified: new Date("2026-09-07"),
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];
}
