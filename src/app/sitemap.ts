import type { MetadataRoute } from "next";
import { getSetups } from "@/db/queries";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const setups = await getSetups();
  return [
    { url: SITE_URL, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/products`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE_URL}/compare`, changeFrequency: "monthly", priority: 0.5 },
    ...setups.map((s) => ({
      url: `${SITE_URL}/setups/${s.id}`,
      lastModified: s.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
