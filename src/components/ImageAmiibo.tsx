import { srcsetAmiibo } from "@/lib/amiibo/fiche";

/**
 * Photo d'un amiibo (US-29), copiée chez nous en WebP 300 / 600 à fond transparent (ADR-21 point 2), posée sur une
 * carte carrée ; sans photo, une vignette neutre au nom de l'amiibo.
 */
export function ImageAmiibo({
  base,
  alt,
  sizes,
  prioritaire = false,
}: {
  base: string | null;
  alt: string;
  sizes: string;
  prioritaire?: boolean;
}) {
  return (
    <div className="flex aspect-square w-full items-center justify-center overflow-hidden rounded-xl border border-bordure bg-carte p-[8%]">
      {base ? (
        // eslint-disable-next-line @next/next/no-img-element -- images déjà en WebP 300/600 (ADR-21 point 2), pas de relais
        <img
          srcSet={srcsetAmiibo(base)}
          sizes={sizes}
          alt={alt}
          loading={prioritaire ? "eager" : "lazy"}
          fetchPriority={prioritaire ? "high" : undefined}
          className="h-full w-full object-contain"
        />
      ) : (
        <span
          role="img"
          aria-label={`${alt} — photo indisponible`}
          className="text-center text-xs text-texte-discret"
        >
          amiibo
        </span>
      )}
    </div>
  );
}
