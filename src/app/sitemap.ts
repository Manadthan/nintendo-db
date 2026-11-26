import type { MetadataRoute } from "next";
import { listerAmiibo } from "@/lib/amiibo/charger";
import { listerFiches } from "@/lib/fiche/charger";
import { listerGuides } from "@/lib/guides/charger";
import { entreesSitemap } from "@/lib/referencement/referencement";

// Plan du site (référencement) : régénéré comme les pages publiques, au plus toutes les 5 minutes (ADR-02).
export const revalidate = 300;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [fiches, guides, amiibo] = await Promise.all([
    listerFiches(),
    listerGuides(),
    listerAmiibo(),
  ]);
  return entreesSitemap(fiches, guides, amiibo);
}
