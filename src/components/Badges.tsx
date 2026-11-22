import type { CSSProperties, ReactNode } from "react";
import { DESSINS } from "@/components/Avatar";
import type { Badge, Categorie } from "@/lib/badges/badges";

/** Couleur de chaque catégorie (jetons de globals.css) : or, bleu, vert, rouge. */
const COULEURS: Record<Categorie, { fond: string; texte: string }> = {
  total: {
    fond: "var(--color-mc-moyen)",
    texte: "var(--color-mc-texte-moyen)",
  },
  console: { fond: "var(--color-accent)", texte: "var(--color-inverse)" },
  serie: { fond: "var(--color-possede)", texte: "var(--color-inverse)" },
  region: { fond: "var(--color-mc-faible)", texte: "var(--color-mc-texte)" },
};

const DRAPEAU = (
  <>
    <path d="M5 2h2v20H5z" />
    <path d="M7 3h12l-2.5 4.5L19 12H7z" />
  </>
);
const GLOBE = (
  <>
    <circle cx="12" cy="12" r="9.5" />
    <path
      d="M2.5 12h19M12 2.5c3 3 3 16 0 19M12 2.5c-3 3-3 16 0 19"
      fill="none"
      stroke="var(--fond-icone)"
      strokeWidth="1.4"
    />
  </>
);

function dessin(b: Badge): ReactNode {
  if (b.categorie === "total") return DESSINS.trophee;
  if (b.categorie === "console") return DESSINS.manette;
  if (b.categorie === "serie") return DESSINS.etoile;
  return b.id.startsWith("region-monde") ? GLOBE : DRAPEAU;
}

/** Icône ronde d'un badge (US-24) : couleur de sa catégorie si gagné, grise sinon. */
export function IconeBadge({
  badge,
  taille,
}: {
  badge: Badge;
  taille: number;
}) {
  const { fond, texte } = badge.gagne
    ? COULEURS[badge.categorie]
    : { fond: "var(--color-surface)", texte: "var(--color-texte-discret)" };
  return (
    <span
      aria-hidden="true"
      className="inline-flex shrink-0 items-center justify-center rounded-full"
      style={
        {
          width: taille,
          height: taille,
          background: fond,
          color: texte,
          "--fond-icone": fond,
        } as CSSProperties
      }
    >
      <svg
        viewBox="0 0 24 24"
        width={taille * 0.55}
        height={taille * 0.55}
        fill="currentColor"
      >
        {dessin(badge)}
      </svg>
    </span>
  );
}

/** Badges gagnés puis prochains badges de Mon profil (US-24). */
export function Badges({
  gagnes,
  prochains,
}: {
  gagnes: Badge[];
  prochains: Badge[];
}) {
  return (
    <section
      aria-label="Badges"
      className="flex flex-col gap-3 rounded-xl border border-bordure bg-carte p-4"
    >
      <h2 className="font-titre text-lg font-bold">Badges gagnés</h2>
      {gagnes.length === 0 ? (
        <p className="text-sm text-texte-doux">
          Aucun badge pour l&apos;instant : le premier, « Débutant », arrive à
          10 jeux.
        </p>
      ) : (
        <ul className="grid grid-cols-4 gap-x-2 gap-y-3">
          {gagnes.map((b) => (
            <li key={b.id}>
              <details className="group text-center">
                <summary className="flex cursor-pointer list-none flex-col items-center gap-1 text-xs leading-tight [&::-webkit-details-marker]:hidden">
                  <IconeBadge badge={b} taille={52} />
                  <span>{b.nom}</span>
                </summary>
                <p className="mt-1 text-[11px] leading-snug text-texte-doux">
                  {b.explication}
                </p>
              </details>
            </li>
          ))}
        </ul>
      )}
      {prochains.length > 0 && (
        <>
          <h2 className="mt-2 font-titre text-lg font-bold">
            Prochains badges
          </h2>
          <ul className="flex flex-col gap-3">
            {prochains.map((b) => (
              <li
                key={b.id}
                aria-label={`${b.nom} : ${b.actuel} / ${b.objectif} ${b.unite}`}
                className="flex items-center gap-3"
              >
                <IconeBadge badge={b} taille={36} />
                <div className="flex min-w-0 flex-1 flex-col gap-1 text-sm">
                  <p className="truncate">
                    <strong>{b.nom}</strong>{" "}
                    <span className="text-texte-doux">
                      · {b.actuel} / {b.objectif} {b.unite}
                    </span>
                  </p>
                  <span
                    aria-hidden="true"
                    className="h-1.5 overflow-hidden rounded-full bg-surface"
                  >
                    <span
                      className="block h-full bg-possede"
                      style={{
                        width: `${Math.round((100 * b.actuel) / b.objectif)}%`,
                      }}
                    />
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
