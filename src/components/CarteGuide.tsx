import type { VersionAffichee } from "@/lib/catalogue/types";
import { CouvertureGuide } from "./CouvertureGuide";

/** Adresse de la page d'un guide (US-27). */
export const lienGuide = (isbn: string) => `/guides/${isbn}`;

/** Étiquettes « Guide » et console sous le titre d'un guide (maquette guides-catalogue.png). */
export function EtiquettesGuide({
  v,
  compact = false,
}: {
  v: VersionAffichee;
  compact?: boolean;
}) {
  const taille = compact ? "h-4 px-1 text-[9px]" : "h-5 px-1.5 text-[11px]";
  return (
    <>
      <span
        className={`flex items-center rounded border border-accent-doux bg-accent-doux font-semibold text-accent-fonce ${taille}`}
      >
        Guide
      </span>
      <span
        className={`flex items-center rounded bg-texte font-semibold text-inverse ${taille}`}
      >
        {v.jeu.console.nom}
      </span>
    </>
  );
}

/** Couverture d'un guide dans le catalogue ; `v.guide` doit être présent. */
export function CouvertureCarte({
  v,
  petite = false,
}: {
  v: VersionAffichee;
  petite?: boolean;
}) {
  return (
    <CouvertureGuide
      couverture={v.guide?.couverture ?? null}
      titre={v.sortie.titre ?? ""}
      legende={[v.guide?.editeur, v.sortie.date?.slice(0, 4)]
        .filter(Boolean)
        .join(" · ")}
      petite={petite}
    />
  );
}

/** « KADOKAWA · 2023 » sous les étiquettes. */
export const legendeGuide = (v: VersionAffichee) =>
  [v.guide?.editeur, v.sortie.date?.slice(0, 4)].filter(Boolean).join(" · ");
