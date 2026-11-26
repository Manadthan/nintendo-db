/**
 * Prix eBay d'un jeu (US-25, DESIGN ADR-17) : une recherche par marché pour chaque version sortie, puis le calcul de
 * prix.ts. Les accès au réseau (eBay, BCE) sont passés en paramètre : testé sans réseau, appelé par la route.
 */
import { REGIONS, type Region } from "@/lib/catalogue/types";
import {
  MARCHES,
  prixRegion,
  requete,
  type Annonce,
  type Marche,
  type PrixRegion,
  type Taux,
} from "./prix";

export type Sources = {
  /** `categorie` : catégorie eBay ; par défaut « Video Games », `null` pour toutes (amiibo). */
  chercher: (
    marche: Marche,
    q: string,
    categorie?: string | null,
  ) => Promise<Annonce[]>;
  taux: () => Promise<Taux>;
};

/** Ce qu'il faut savoir du jeu : sa console et, par région, s'il y est sorti et sous quel titre. */
export type JeuPrix = {
  console: string;
  sorties: Record<
    Region,
    { sortie: boolean; titre: string | null; titreRomanise: string | null }
  >;
};

export type ReponsePrix = {
  /** Versions sorties seulement. */
  regions: Partial<Record<Region, PrixRegion>>;
  /** Date du calcul (ISO), pour « mis à jour il y a 2 h ». */
  calculeLe: string;
};

/**
 * Titre cherché sur eBay : celui de la région ; pour la version JAP, le titre anglais (US, sinon PAL), car on la
 * cherche sur eBay US où les annonces sont en anglais ; sinon le titre romanisé.
 */
export function titreCherche(jeu: JeuPrix, region: Region): string | null {
  const s = jeu.sorties;
  if (region === "JAP")
    return s.US.titre ?? s.PAL.titre ?? s.JAP.titreRomanise ?? s.JAP.titre;
  return s[region].titre;
}

/** Au plus 4 recherches en parallèle (JAP, US, PAL France, PAL Royaume-Uni) ; une erreur fait tout échouer. */
export async function calculerPrix(
  jeu: JeuPrix,
  sources: Sources,
  maintenant = new Date(),
): Promise<ReponsePrix> {
  const versions = REGIONS.flatMap((region) => {
    const titre = jeu.sorties[region].sortie ? titreCherche(jeu, region) : null;
    return titre ? [{ region, titre }] : [];
  });
  const [taux, ...annonces] = await Promise.all([
    sources.taux(),
    ...versions.map(({ region, titre }) =>
      Promise.all(
        MARCHES[region].map((m) =>
          sources.chercher(m, requete(titre, jeu.console, region)),
        ),
      ).then((l) => l.flat()),
    ),
  ]);
  const regions: ReponsePrix["regions"] = {};
  versions.forEach(({ region, titre }, i) => {
    regions[region] = prixRegion(
      annonces[i] ?? [],
      titre,
      jeu.console,
      region,
      taux,
    );
  });
  return { regions, calculeLe: maintenant.toISOString() };
}
