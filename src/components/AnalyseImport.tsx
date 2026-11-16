"use client";

import { useState } from "react";
import {
  analyserListe,
  rapprocherLot,
  type RapprochementLeger,
} from "@/app/actions/import";
import { decouperEnLots, resumer, type Apercu } from "@/lib/import/apercu";
import { REGIONS } from "@/lib/catalogue/types";

type Etat =
  | { etape: "attente" }
  | { etape: "wikipedia" }
  | { etape: "igdb"; fait: number; total: number }
  | { etape: "fini" }
  | { etape: "erreur"; message: string };

const STATUTS = {
  sur: { libelle: "sûr", classe: "bg-[#e4e9fb] text-accent-fonce" },
  "a-verifier": {
    libelle: "à vérifier",
    classe: "bg-[#fff1d6] text-[#7a4a00]",
  },
  introuvable: {
    libelle: "introuvable",
    classe: "bg-[#fde4e4] text-[#b42318]",
  },
} as const;

/** Aperçu de l'import (US-10, ADR-03) : Wikipédia, puis IGDB par lots de 10. N'écrit rien en base. */
export function AnalyseImport({
  consoleSlug,
  consoleNom,
}: {
  consoleSlug: string;
  consoleNom: string;
}) {
  const [etat, setEtat] = useState<Etat>({ etape: "attente" });
  const [apercu, setApercu] = useState<Apercu | null>(null);
  const [igdb, setIgdb] = useState<Record<string, RapprochementLeger>>({});
  // Choix fait à la main pour un rapprochement incertain (R1) ; repris par l'enregistrement (#35).
  const [choix, setChoix] = useState<Record<string, number | null>>({});

  async function analyser() {
    setApercu(null);
    setIgdb({});
    setChoix({});
    try {
      setEtat({ etape: "wikipedia" });
      const resultat = await analyserListe(consoleSlug);
      setApercu(resultat);

      const lots = decouperEnLots(resultat.lignes, 10);
      for (const [i, lot] of lots.entries()) {
        setEtat({ etape: "igdb", fait: i * 10, total: resultat.lignes.length });
        const rapprochements = await rapprocherLot(
          consoleSlug,
          lot.map((l) => ({ slug: l.slug, titres: l.titres })),
        );
        setIgdb((avant) => ({
          ...avant,
          ...Object.fromEntries(rapprochements.map((r) => [r.slug, r])),
        }));
      }
      setEtat({ etape: "fini" });
    } catch (e) {
      setEtat({
        etape: "erreur",
        message: e instanceof Error ? e.message : "Erreur inconnue",
      });
    }
  }

  const enCours = etat.etape === "wikipedia" || etat.etape === "igdb";
  const resume = apercu
    ? resumer(
        apercu,
        Object.fromEntries(Object.entries(igdb).map(([s, r]) => [s, r.statut])),
      )
    : null;

  return (
    <div className="flex flex-col gap-4">
      <button
        type="button"
        onClick={analyser}
        disabled={enCours}
        className="h-12 rounded-xl bg-accent text-base font-semibold text-white disabled:opacity-60"
      >
        {enCours ? "Analyse en cours…" : `Analyser la ${consoleNom}`}
      </button>

      <p role="status" className="text-sm text-texte-doux">
        {etat.etape === "wikipedia" && "Lecture de la liste Wikipédia…"}
        {etat.etape === "igdb" &&
          `Rapprochement IGDB : ${etat.fait} / ${etat.total} jeux`}
        {etat.etape === "fini" &&
          "Analyse terminée. Rien n'a encore été enregistré."}
      </p>

      {etat.etape === "erreur" && (
        <div
          role="alert"
          className="rounded-[10px] border border-[#f1c4c4] bg-[#fff5f5] px-3 py-2.5 text-sm text-[#b42318]"
        >
          {etat.message}
        </div>
      )}

      {apercu && resume && (
        <>
          <dl aria-label="Résumé" className="grid grid-cols-2 gap-2">
            {[
              ["À ajouter", resume.ajoutes],
              ["À mettre à jour", resume.misAJour],
              ["Ignorés", resume.ignores],
              ["IGDB à vérifier", resume.aVerifier],
            ].map(([libelle, nombre]) => (
              <div
                key={libelle}
                className="rounded-xl border border-bordure bg-carte p-3"
              >
                <dt className="text-xs text-texte-discret">{libelle}</dt>
                <dd className="font-titre text-2xl font-bold">{nombre}</dd>
              </div>
            ))}
          </dl>

          <ul
            aria-label="Jeux analysés"
            className="flex flex-col overflow-hidden rounded-xl border border-bordure bg-carte"
          >
            {apercu.lignes.map((ligne) => {
              const r = igdb[ligne.slug];
              return (
                <li
                  key={ligne.slug}
                  className="flex flex-col gap-1.5 border-t border-[#eef0f3] px-3 py-2.5 first:border-t-0"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-semibold">{ligne.titre}</span>
                    <span className="shrink-0 text-xs text-texte-discret">
                      {ligne.action === "ajouter"
                        ? "à ajouter"
                        : "à mettre à jour"}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                    {REGIONS.map((region) => (
                      <span
                        key={region}
                        className={`rounded px-1.5 py-0.5 font-bold ${
                          ligne.regions[region]
                            ? "bg-[#e4e9fb] text-accent-fonce"
                            : "bg-[#eceef2] text-texte-discret"
                        }`}
                      >
                        {region}
                      </span>
                    ))}
                    {r && (
                      <span
                        className={`rounded px-1.5 py-0.5 font-semibold ${STATUTS[r.statut].classe}`}
                      >
                        IGDB {STATUTS[r.statut].libelle}
                        {r.jeu && ` : ${r.jeu.name}`}
                      </span>
                    )}
                  </div>
                  {r && r.statut !== "sur" && (
                    <label className="flex flex-col gap-1 text-xs text-texte-doux">
                      Jeu IGDB à retenir
                      <select
                        value={choix[ligne.slug] ?? r.jeu?.id ?? ""}
                        onChange={(e) =>
                          setChoix((avant) => ({
                            ...avant,
                            [ligne.slug]: e.target.value
                              ? Number(e.target.value)
                              : null,
                          }))
                        }
                        className="h-10 rounded-lg border border-[#d6d9e0] bg-carte px-2 text-base"
                      >
                        <option value="">Aucun (pas de jaquette IGDB)</option>
                        {r.candidats.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                </li>
              );
            })}
          </ul>

          <details className="rounded-xl border border-bordure bg-carte p-3 text-sm">
            <summary className="cursor-pointer font-semibold">
              Jeux ignorés ({resume.ignores})
            </summary>
            <p className="mt-2 text-texte-doux">
              {apercu.ignores.autresEditeurs} jeux d&apos;autres éditeurs, et{" "}
              {apercu.ignores.telechargeables.length} jeux Nintendo seulement
              téléchargeables :
            </p>
            <ul className="mt-1 list-disc pl-5 text-texte-doux">
              {apercu.ignores.telechargeables.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </details>
        </>
      )}
    </div>
  );
}
