import { srcsetAmiibo } from "@/lib/amiibo/fiche";

/**
 * Photo d'un amiibo (US-29), copiée chez nous en WebP 300 / 600 à fond transparent (ADR-21 point 2), posée sur une
 * carte carrée (ou à la forme d'une boîte dans la grille du catalogue, à côté des jaquettes) ; sans photo, une
 * vignette neutre au nom de l'amiibo.
 */
export function ImageAmiibo({
  base,
  alt,
  sizes,
  prioritaire = false,
  forme = "carree",
}: {
  base: string | null;
  alt: string;
  sizes: string;
  prioritaire?: boolean;
  /** « boite » : proportions d'une boîte de jeu (grille du catalogue) ; « petite » : vignette de la liste. */
  forme?: "carree" | "boite" | "petite";
}) {
  const cadre =
    forme === "boite"
      ? "aspect-[27/38] rounded-md p-[5%]"
      : forme === "petite"
        ? "aspect-square rounded-md p-[4%]"
        : "aspect-square rounded-xl p-[5%]";
  return (
    <div
      className={`flex w-full items-center justify-center overflow-hidden border border-bordure bg-carte ${cadre}`}
    >
      {base ? (
        // eslint-disable-next-line @next/next/no-img-element -- images déjà en WebP 300/600 (ADR-21 point 2), pas de relais
        <img
          srcSet={srcsetAmiibo(base)}
          sizes={sizes}
          alt={alt}
          loading={prioritaire ? "eager" : "lazy"}
          decoding="async"
          fetchPriority={prioritaire ? "high" : undefined}
          className="h-full w-full object-contain"
        />
      ) : (
        <span
          role="img"
          aria-label={`${alt} — photo indisponible`}
          className="text-center text-xs text-texte-discret"
        >
          {forme === "petite" ? "" : "amiibo"}
        </span>
      )}
    </div>
  );
}
