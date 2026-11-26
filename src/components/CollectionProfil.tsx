import Link from "next/link";
import { REGIONS } from "@/lib/catalogue/types";
import { classeProportions } from "@/lib/jaquettes/proportions";
import type { Ajout, resumeCollection } from "@/lib/profil/collection";

const pluriel = (n: number, mot: string, motPluriel = `${mot}s`) =>
  `${n} ${n > 1 ? motPluriel : mot}`;

/** « Ma collection » de Mon profil (US-22), « Collection » du profil public (US-23) : jeux, versions, badges, avancement par console, versions par région. */
export function MaCollection({
  resume,
  badges,
  publique = false,
}: {
  resume: ReturnType<typeof resumeCollection> & {
    /** Amiibo possédés et total du catalogue (US-30). */
    amiibo: { possedes: number; total: number };
  };
  /** Nombre de badges gagnés (US-24). */
  badges: number;
  /** Profil public (US-23) : « Collection », sans invitation à cocher. */
  publique?: boolean;
}) {
  const titre = publique ? "Collection" : "Ma collection";
  return (
    <section
      aria-label={titre}
      className="flex flex-col gap-3 rounded-xl border border-bordure bg-carte p-4"
    >
      <h2 className="font-titre text-lg font-bold">{titre}</h2>
      <p className="grid grid-cols-3 text-center">
        <span className="flex flex-col">
          <strong className="font-titre text-3xl">{resume.jeux}</strong>
          <span className="text-sm text-texte-doux">
            {resume.jeux > 1 ? "jeux" : "jeu"}
          </span>
        </span>
        <span className="flex flex-col">
          <strong className="font-titre text-3xl">{resume.versions}</strong>
          <span className="text-sm text-texte-doux">
            {resume.versions > 1 ? "versions" : "version"}
          </span>
        </span>
        <span className="flex flex-col">
          <strong className="font-titre text-3xl">{badges}</strong>
          <span className="text-sm text-texte-doux">
            {badges > 1 ? "badges" : "badge"}
          </span>
        </span>
      </p>
      {resume.jeux === 0 && publique ? (
        <p className="text-sm text-texte-doux">
          Collection vide pour l&apos;instant.
        </p>
      ) : resume.jeux === 0 ? (
        <p className="text-sm text-texte-doux">
          Votre collection est vide : cochez « Je l&apos;ai » sur la fiche
          d&apos;un jeu pour la commencer.{" "}
          <Link href="/" className="font-semibold text-accent">
            Voir le catalogue
          </Link>
        </p>
      ) : (
        <>
          <ul className="flex flex-col gap-2">
            {resume.consoles.map((c) => (
              <li
                key={c.slug}
                aria-label={`${c.nom} : ${pluriel(c.possedes, "jeu", "jeux")} sur ${c.total}`}
                className="grid grid-cols-[minmax(0,7.5rem)_1fr_auto] items-center gap-3 text-sm"
              >
                <span className="truncate">{c.nom}</span>
                <span
                  aria-hidden="true"
                  className="h-1.5 overflow-hidden rounded-full bg-surface"
                >
                  <span
                    className="block h-full bg-accent"
                    style={{ width: `${Math.max(c.pourcent, 2)}%` }}
                  />
                </span>
                <span className="tabular-nums text-texte-doux">
                  {c.possedes} / {c.total}
                </span>
              </li>
            ))}
          </ul>
          <ul className="grid grid-cols-3 gap-2 text-center">
            {REGIONS.map((r) => (
              <li
                key={r}
                aria-label={`${r} : ${pluriel(resume.regions[r], "version")}`}
                className="flex flex-col rounded-[10px] border border-bordure py-2"
              >
                <strong className="font-titre text-xl">
                  {resume.regions[r]}
                </strong>
                <span className="text-xs text-texte-doux">{r}</span>
              </li>
            ))}
          </ul>
        </>
      )}
      {resume.amiibo.total > 0 && (
        <p
          aria-label={`Amiibo : ${resume.amiibo.possedes} sur ${resume.amiibo.total}`}
          className="grid grid-cols-[minmax(0,7.5rem)_1fr_auto] items-center gap-3 border-t border-separateur pt-3 text-sm"
        >
          <span className="font-semibold">Amiibo</span>
          <span
            aria-hidden="true"
            className="h-1.5 overflow-hidden rounded-full bg-surface"
          >
            <span
              className="block h-full bg-accent"
              style={{
                width: `${Math.max((resume.amiibo.possedes / resume.amiibo.total) * 100, 2)}%`,
              }}
            />
          </span>
          <span className="tabular-nums text-texte-doux">
            {resume.amiibo.possedes} / {resume.amiibo.total}
          </span>
        </p>
      )}
    </section>
  );
}

/** Proportions de l'image d'un ajout : la boîte de la console du jeu ; la photo carrée d'un amiibo (US-30). */
const proportions = (a: Ajout) =>
  a.console ? classeProportions(a.console.slug) : "aspect-square";

/** « Derniers ajouts » de Mon profil (US-22) : les versions et amiibo (US-30) cochés le plus récemment. */
export function DerniersAjouts({ ajouts }: { ajouts: Ajout[] }) {
  if (ajouts.length === 0) return null;
  return (
    <section
      aria-label="Derniers ajouts"
      className="flex flex-col gap-3 rounded-xl border border-bordure bg-carte p-4"
    >
      <h2 className="font-titre text-lg font-bold">Derniers ajouts</h2>
      <ul className="grid grid-cols-3 gap-3">
        {ajouts.map((a) => (
          <li key={a.cle}>
            <Link href={a.href} className="flex flex-col gap-1 text-xs">
              {a.jaquetteSrcset ? (
                // eslint-disable-next-line @next/next/no-img-element -- images déjà en WebP 300/600 (ADR-04)
                <img
                  srcSet={a.jaquetteSrcset}
                  sizes="110px"
                  alt=""
                  loading="lazy"
                  className={`${proportions(a)} w-full rounded-md border border-vignette-bordure bg-vignette object-contain`}
                />
              ) : (
                <span
                  aria-hidden="true"
                  className={`${proportions(a)} block w-full rounded-md border border-vignette-bordure bg-vignette`}
                />
              )}
              <span className="line-clamp-2 leading-snug">{a.titre}</span>
              <span className="w-fit rounded border border-possede px-1 text-[10px] font-semibold text-possede">
                {a.region ?? "Amiibo"}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
