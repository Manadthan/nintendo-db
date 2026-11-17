"use client";

import { useState } from "react";
import {
  analyserListe,
  enregistrerLot,
  rapprocherLot,
  supprimerJeux,
  terminerImport,
  type RapprochementLeger,
} from "@/app/actions/import";
import {
  decouperEnLots,
  resumer,
  resumerEnregistrement,
  type Apercu,
  type ResultatEnregistrement,
  type ResumeEnregistrement,
} from "@/lib/import/apercu";
import { REGIONS } from "@/lib/catalogue/types";

type Etat =
  | { etape: "attente" }
  | { etape: "wikipedia" }
  | { etape: "igdb"; fait: number; total: number }
  | { etape: "fini" }
  | { etape: "enregistrement"; fait: number; total: number }
  | { etape: "enregistre"; resume: ResumeEnregistrement }
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

/**
 * Import (US-10, ADR-03) : aperçu (Wikipédia, puis IGDB par lots de 10), qui n'écrit rien ; puis, sur
 * confirmation, enregistrement par lots de 10 avec copie des jaquettes, et résumé.
 */
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

  async function enregistrer() {
    if (!apercu) return;
    const total = apercu.lignes.length;
    const aSupprimer = apercu.aSupprimer.length;
    if (
      !window.confirm(
        `Enregistrer ${total} jeux dans la base du site ? Tes corrections manuelles seront gardées.` +
          (aSupprimer
            ? `\n\n${aSupprimer} jeu(x) sans boîte Nintendo seront supprimés : ${apercu.aSupprimer.join(", ")}.`
            : ""),
      )
    ) {
      return;
    }
    const resultats: ResultatEnregistrement[] = [];
    try {
      for (const [i, lot] of decouperEnLots(apercu.lignes, 10).entries()) {
        setEtat({ etape: "enregistrement", fait: i * 10, total });
        resultats.push(
          ...(await enregistrerLot(
            consoleSlug,
            lot.map((l) => ({
              wikipedia: l.wikipedia,
              // Choix fait à la main, sinon le jeu IGDB proposé (sûr ou à vérifier).
              igdbId:
                l.slug in choix
                  ? choix[l.slug]!
                  : (igdb[l.slug]?.jeu?.id ?? null),
            })),
          )),
        );
      }
      const supprimes = aSupprimer
        ? await supprimerJeux(consoleSlug, apercu.aSupprimer)
        : [];
      const resume = resumerEnregistrement(resultats, supprimes);
      await terminerImport(consoleSlug, resume);
      setEtat({ etape: "enregistre", resume });
    } catch (e) {
      setEtat({
        etape: "erreur",
        message: e instanceof Error ? e.message : "Erreur inconnue",
      });
    }
  }

  const enCours = ["wikipedia", "igdb", "enregistrement"].includes(etat.etape);
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
        {etat.etape === "wikipedia" &&
          "Lecture de la liste Wikipédia et de la base GameTDB…"}
        {etat.etape === "igdb" &&
          `Rapprochement IGDB : ${etat.fait} / ${etat.total} jeux`}
        {etat.etape === "fini" &&
          "Analyse terminée. Rien n'a encore été enregistré."}
        {etat.etape === "enregistrement" &&
          `Enregistrement et copie des jaquettes : ${etat.fait} / ${etat.total} jeux`}
      </p>

      {etat.etape === "erreur" && (
        <div
          role="alert"
          className="rounded-[10px] border border-[#f1c4c4] bg-[#fff5f5] px-3 py-2.5 text-sm text-[#b42318]"
        >
          {etat.message}
        </div>
      )}

      {etat.etape === "fini" && apercu && (
        <button
          type="button"
          onClick={enregistrer}
          className="h-12 rounded-xl border-2 border-accent bg-carte text-base font-semibold text-accent"
        >
          Enregistrer l&apos;import ({apercu.lignes.length} jeux)
        </button>
      )}

      {etat.etape === "enregistre" && (
        <section
          aria-label="Import enregistré"
          className="flex flex-col gap-2 rounded-xl border border-bordure bg-carte p-4 text-sm"
        >
          <h2 className="font-titre text-lg font-bold">Import enregistré</h2>
          <p>
            {etat.resume.ajoutes} jeux ajoutés, {etat.resume.misAJour} mis à
            jour, {etat.resume.jaquettes} jaquettes copiées. Le catalogue se met
            à jour dans quelques instants.
          </p>
          {etat.resume.erreurs.length > 0 && (
            <div role="alert" className="text-[#b42318]">
              <p className="font-semibold">
                {etat.resume.erreurs.length} jeu(x) en erreur :
              </p>
              <ul className="list-disc pl-5">
                {etat.resume.erreurs.map((e) => (
                  <li key={e.titre}>
                    {e.titre} — {e.erreur}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {etat.resume.supprimes.length > 0 && (
            <p>
              Supprimés (sans boîte Nintendo) :{" "}
              {etat.resume.supprimes.join(", ")}.
            </p>
          )}
          {etat.resume.sansScan.length > 0 && (
            <details>
              <summary className="cursor-pointer font-semibold">
                Sans scan de boîte ({etat.resume.sansScan.length})
              </summary>
              <p className="mt-1 text-texte-doux">
                GameTDB n&apos;a pas de scan pour ces régions : image IGDB à la
                place, à remplacer à la main.
              </p>
              <ul className="list-disc pl-5 text-texte-doux">
                {etat.resume.sansScan.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </details>
          )}
          {etat.resume.ecarts.length > 0 && (
            <details>
              <summary className="cursor-pointer font-semibold">
                Corrections manuelles gardées ({etat.resume.ecarts.length})
              </summary>
              <ul className="mt-1 list-disc pl-5 text-texte-doux">
                {etat.resume.ecarts.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            </details>
          )}
        </section>
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

          {apercu.aSupprimer.length > 0 && (
            <p
              role="alert"
              className="rounded-xl border border-[#f1c4c4] bg-[#fff5f5] p-3 text-sm text-[#b42318]"
            >
              {apercu.aSupprimer.length} jeu(x) en base n&apos;ont plus de boîte
              Nintendo et seront supprimés à l&apos;enregistrement :{" "}
              {apercu.aSupprimer.join(", ")}.
            </p>
          )}

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
            <p className="mt-2 text-texte-doux">
              {apercu.ecartes.length} jeux de la liste sans boîte Nintendo
              (GameTDB) :
            </p>
            <ul className="mt-1 list-disc pl-5 text-texte-doux">
              {apercu.ecartes.map((e) => (
                <li key={e.titre}>
                  {e.titre} — {e.raison}
                </li>
              ))}
            </ul>
          </details>
        </>
      )}
    </div>
  );
}
