import type { MetadataRoute } from "next";
import { SITE } from "@/lib/constants";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = SITE.url;
  const lastModified = new Date();
  return [
    {
      url: `${base}/`,
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${base}/events/awsscd26`,
      lastModified,
      changeFrequency: "daily",
      priority: 0.9,
      images: [`${base}/opengraph-image`],
    },
    {
      url: `${base}/events`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${base}/passes`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${base}/team`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];
}
