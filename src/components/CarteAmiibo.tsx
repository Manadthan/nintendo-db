import { cheminAmiibo, LIBELLES_TYPE } from "@/lib/amiibo/fiche";
import { formaterDate } from "@/lib/catalogue/catalogue";
import type { VersionAffichee } from "@/lib/catalogue/types";
import { ImageAmiibo } from "./ImageAmiibo";

/** Adresse de la fiche de l'amiibo d'une carte ; `v.amiibo` doit être présent. */
export const lienAmiibo = (v: VersionAffichee) =>
  cheminAmiibo(v.amiibo?.slug ?? v.jeu.slug);

/** Étiquettes « Amiibo » et type sous le nom (maquette amiibo-catalogue.png). */
export function EtiquettesAmiibo({
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
        Amiibo
      </span>
      {v.amiibo && (
        <span
          className={`flex items-center rounded border border-champ bg-carte font-semibold ${taille}`}
        >
          {LIBELLES_TYPE[v.amiibo.type]}
        </span>
      )}
    </>
  );
}

/** « 12 novembre 2026 · Kirby Air Riders » : date du marché choisi et série amiibo. */
export const legendeAmiibo = (v: VersionAffichee) =>
  [formaterDate(v.sortie.date, v.sortie.precision), v.amiibo?.serieAmiibo]
    .filter(Boolean)
    .join(" · ");

/** Photo de l'amiibo d'une carte du catalogue. */
export function ImageCarteAmiibo({
  v,
  sizes,
  forme = "boite",
}: {
  v: VersionAffichee;
  sizes: string;
  forme?: "boite" | "petite" | "carree";
}) {
  return (
    <ImageAmiibo
      base={v.amiibo?.image ?? null}
      alt={`Amiibo ${v.sortie.titre ?? ""}`}
      sizes={sizes}
      forme={forme}
    />
  );
}

/** Marque verte d'un amiibo possédé (US-30, jeton `possede`), sur la photo dans la grille et la frise. */
export function MarquePossede({
  surPhoto = false,
  compact = false,
}: {
  surPhoto?: boolean;
  compact?: boolean;
}) {
  return (
    <span
      className={`flex items-center rounded bg-possede font-bold text-inverse ${
        compact ? "h-4 px-1 text-[9px]" : "h-5 px-1.5 text-[11px]"
      } ${surPhoto ? (compact ? "absolute top-1 right-1 shadow-sm" : "absolute top-1.5 right-1.5 shadow-sm") : ""}`}
    >
      ✓ Je l&apos;ai
    </span>
  );
}

/** Marque rose d'un amiibo ou guide en liste de souhaits (jeton `souhait`). */
export function MarqueSouhait({
  surPhoto = false,
  compact = false,
}: {
  surPhoto?: boolean;
  compact?: boolean;
}) {
  return (
    <span
      className={`flex items-center rounded bg-souhait font-bold text-inverse ${
        compact ? "h-4 px-1 text-[9px]" : "h-5 px-1.5 text-[11px]"
      } ${surPhoto ? (compact ? "absolute top-1 right-1 shadow-sm" : "absolute top-1.5 right-1.5 shadow-sm") : ""}`}
    >
      ★ Souhait
    </span>
  );
}
