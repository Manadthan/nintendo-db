"use client";

import { useEffect, useState } from "react";
import { REGIONS, type Region } from "@/lib/catalogue/types";
import type { ReponsePrix } from "@/lib/prix/calcul";
import {
  anciennete,
  libelleAnnonces,
  libelleMarches,
} from "@/lib/prix/affichage";

type Etat =
  | { etape: "chargement" }
  | { etape: "pret"; prix: ReponsePrix }
  | { etape: "masque" };

/**
 * Bloc « Prix eBay » de la fiche d'un jeu (US-25, ADR-17) ou d'un amiibo (US-29) : demandé à la route après
 * l'affichage (la page reste statique), une ligne par région, la version choisie surlignée. eBay indisponible : le
 * bloc entier disparaît.
 */
export function PrixEbay({
  adresse,
  objet = "jeu",
  sorties,
  noms,
  region,
}: {
  /** Route du prix : `/api/prix/{console}/{jeu}` ou `/api/prix/amiibo/{slug}`. */
  adresse: string;
  /** Ce que les annonces confondent : boîte complète ou jeu seul ; amiibo neuf ou d'occasion. */
  objet?: "jeu" | "amiibo";
  sorties: Record<Region, boolean>;
  noms: Record<Region, string>;
  region: Region;
}) {
  const [etat, setEtat] = useState<Etat>({ etape: "chargement" });

  useEffect(() => {
    const abandon = new AbortController();
    fetch(adresse, { signal: abandon.signal })
      .then((r) =>
        r.ok
          ? (r.json() as Promise<ReponsePrix>)
          : Promise.reject(new Error(`HTTP ${r.status}`)),
      )
      .then((prix) => setEtat({ etape: "pret", prix }))
      .catch(() => {
        if (!abandon.signal.aborted) setEtat({ etape: "masque" });
      });
    return () => abandon.abort();
  }, [adresse]);

  if (etat.etape === "masque" || !REGIONS.some((r) => sorties[r])) return null;

  return (
    <section
      aria-labelledby="prix-ebay"
      aria-busy={etat.etape === "chargement"}
      className="flex flex-col gap-2.5"
    >
      <h2 id="prix-ebay" className="text-[15px] font-bold">
        Prix eBay
      </h2>
      <ul className="flex flex-col overflow-hidden rounded-xl border border-bordure bg-carte">
        {REGIONS.map((r) => {
          const p = etat.etape === "pret" ? etat.prix.regions[r] : undefined;
          return (
            <li
              key={r}
              aria-current={r === region ? "true" : undefined}
              className={`flex items-center gap-3 border-t border-separateur px-3.5 py-2 first:border-t-0 ${r === region ? "bg-accent-doux" : ""}`}
            >
              <span className="w-[8.5rem] shrink-0 text-sm font-semibold">
                {noms[r]}
              </span>
              <div className="flex min-h-11 min-w-0 flex-1 flex-col justify-center gap-0.5">
                {!sorties[r] ? (
                  <span className="text-[13px] text-texte-discret">
                    Non sorti
                  </span>
                ) : etat.etape === "chargement" ? (
                  <>
                    <span
                      aria-hidden="true"
                      className="h-3.5 w-3/5 rounded-md bg-surface"
                    />
                    <span className="text-xs text-texte-discret">
                      Chargement du prix…
                    </span>
                  </>
                ) : !p ? (
                  <span className="text-[13px] text-texte-discret">—</span>
                ) : p.etat === "prix" ? (
                  <>
                    <span className="text-[17px] font-bold tabular-nums">
                      {p.euros} €
                    </span>
                    <span className="text-xs text-texte-discret">
                      {libelleAnnonces(p.annonces)} ·{" "}
                      {libelleMarches(p.marches)}
                    </span>
                  </>
                ) : (
                  <span className="text-[13px] text-texte-discret">
                    Pas assez d&apos;annonces ({p.annonces})
                  </span>
                )}
              </div>
              {p && (
                <a
                  href={p.lien}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Ventes eBay : version ${noms[r]}`}
                  className="flex min-h-11 shrink-0 items-center text-[13px] font-semibold text-accent"
                >
                  eBay ›
                </a>
              )}
            </li>
          );
        })}
      </ul>
      {etat.etape === "pret" && (
        <p className="text-xs leading-relaxed text-texte-discret">
          Prix{" "}
          <strong className="font-semibold text-texte-doux">demandé</strong> :
          médiane des annonces en cours (pas des ventes),{" "}
          {objet === "amiibo"
            ? "neuf ou d'occasion confondus"
            : "boîte complète ou jeu seul confondus"}
          . Dollars et livres convertis en euros au taux du jour (BCE).{" "}
          {anciennete(etat.prix.calculeLe, new Date())}.
        </p>
      )}
    </section>
  );
}
