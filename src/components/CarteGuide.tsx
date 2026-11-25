import type { VersionAffichee } from "@/lib/catalogue/types";
import { CouvertureGuide } from "./CouvertureGuide";

/** Adresse de la page d'un guide (US-27). */
export const lienGuide = (isbn: string) => `/guides/${isbn}`;

/** Étiquettes « Guide » et console sous le titre d'un guide (maquette guides-catalogue.png). */
export function EtiquettesGuide({ v }: { v: VersionAffichee }) {
  return (
    <>
      <span className="flex h-5 items-center rounded border border-accent-doux bg-accent-doux px-1.5 text-[11px] font-semibold text-accent-fonce">
        Guide
      </span>
      <span className="flex h-5 items-center rounded bg-texte px-1.5 text-[11px] font-semibold text-inverse">
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
      googleBooksId={v.guide?.couverture ?? null}
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
