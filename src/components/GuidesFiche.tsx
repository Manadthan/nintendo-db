import Link from "next/link";
import type { GuideFiche } from "@/lib/fiche/fiche";
import { cheminGuide } from "@/lib/guides/page";
import { CouvertureGuide, MentionCouverture } from "./CouvertureGuide";

/**
 * Bloc « Guides (N) » de la fiche (US-27, maquette guides-fiche.png) : guides japonais du jeu, chacun menant à sa
 * page ; rien si le jeu n'a aucun guide. Source des couvertures citée sous la liste (Amazon.co.jp, Google Books).
 */
export function GuidesFiche({ guides }: { guides: GuideFiche[] }) {
  if (guides.length === 0) return null;
  return (
    <section aria-labelledby="guides" className="flex flex-col gap-2.5">
      <div className="flex items-baseline justify-between gap-2">
        <h2 id="guides" className="text-[15px] font-bold">
          Guides ({guides.length})
        </h2>
        <span className="text-xs text-texte-discret">guides japonais</span>
      </div>
      <ul className="flex flex-col overflow-hidden rounded-xl border border-bordure bg-carte">
        {guides.map((g) => (
          <li
            key={g.isbn}
            className="border-t border-separateur first:border-t-0"
          >
            <Link
              href={cheminGuide(g.isbn)}
              className="flex items-center gap-3 px-3.5 py-3"
            >
              <span className="w-12 shrink-0">
                <CouvertureGuide
                  couverture={g.couverture}
                  titre={g.titre}
                  legende=""
                  petite
                />
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span lang="ja" className="text-sm font-semibold">
                  {g.titre}
                </span>
                <span className="text-[13px] text-texte-doux">
                  {[g.editeur, g.annee].filter(Boolean).join(" · ")}
                </span>
              </span>
              <span aria-hidden="true" className="font-bold text-accent">
                ›
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <MentionCouverture
        sources={guides.flatMap((g) =>
          g.couverture ? [g.couverture.source] : [],
        )}
        pluriel
      />
    </section>
  );
}
