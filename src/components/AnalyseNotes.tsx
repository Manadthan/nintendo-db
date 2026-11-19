"use client";

import { useState } from "react";
import {
  analyserLotNotes,
  enregistrerNotes,
  listerJeuxANoter,
  type JeuNote,
} from "@/app/actions/metacritic";
import { decouperEnLots } from "@/lib/import/apercu";
import type { NoteLue } from "@/lib/import/metacritic";
import { valeur } from "@/lib/import/resultat";

type Ligne = JeuNote & { lu: NoteLue };
type Etat =
  | { etape: "attente" }
  | { etape: "analyse"; fait: number; total: number }
  | { etape: "fini" }
  | { etape: "enregistre"; ecrites: number }
  | { etape: "erreur"; message: string };

const pause = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Wikipédia limite le débit : un lot refusé est réessayé une fois, une minute plus tard. */
async function analyserAvecPatience(consoleSlug: string, articles: string[]) {
  const r = await analyserLotNotes(consoleSlug, articles);
  if (r.ok || !r.erreur.includes("limite le débit")) return valeur(r);
  await pause(60_000);
  return valeur(await analyserLotNotes(consoleSlug, articles));
}

/**
 * Notes Metacritic d'une console (US-17, ADR-08) : lecture des articles Wikipédia par lots de 20, aperçu (trouvées,
 * ambiguës, sans note), puis enregistrement des seules notes trouvées. Les notes saisies à la main restent.
 */
export function AnalyseNotes({
  consoleSlug,
  consoleNom,
}: {
  consoleSlug: string;
  consoleNom: string;
}) {
  const [etat, setEtat] = useState<Etat>({ etape: "attente" });
  const [lignes, setLignes] = useState<Ligne[]>([]);

  async function analyser() {
    setLignes([]);
    try {
      const jeux = valeur(await listerJeuxANoter(consoleSlug));
      const articles = [
        ...new Set(jeux.flatMap((j) => (j.article ? [j.article] : []))),
      ];
      const lus: Record<string, NoteLue> = {};
      for (const [i, lot] of decouperEnLots(articles, 20).entries()) {
        setEtat({ etape: "analyse", fait: i * 20, total: articles.length });
        Object.assign(lus, await analyserAvecPatience(consoleSlug, lot));
        await pause(1500);
      }
      setLignes(
        jeux.map((j) => ({
          ...j,
          lu: (j.article && lus[j.article]) || {
            statut: "sans-note",
            raison: "aucun titre à chercher",
          },
        })),
      );
      setEtat({ etape: "fini" });
    } catch (e) {
      setEtat({
        etape: "erreur",
        message: e instanceof Error ? e.message : "Erreur inconnue",
      });
    }
  }

  const trouvees = lignes.filter(
    (
      l,
    ): l is Ligne & {
      lu: { statut: "note"; note: number; url: string | null };
    } => l.lu.statut === "note" && !l.verrouillee,
  );
  const changees = trouvees.filter((l) => l.lu.note !== l.note);
  const ambigues = lignes.filter((l) => l.lu.statut === "ambigu");
  const sansNote = lignes.filter((l) => l.lu.statut === "sans-note");
  const manuelles = lignes.filter((l) => l.verrouillee);

  async function enregistrer() {
    try {
      let ecrites = 0;
      for (const lot of decouperEnLots(changees, 50))
        ecrites += valeur(
          await enregistrerNotes(
            lot.map((l) => ({ id: l.id, note: l.lu.note, url: l.lu.url })),
          ),
        );
      setEtat({ etape: "enregistre", ecrites });
    } catch (e) {
      setEtat({
        etape: "erreur",
        message: e instanceof Error ? e.message : "Erreur inconnue",
      });
    }
  }

  const enCours = etat.etape === "analyse";
  return (
    <div className="flex flex-col gap-4">
      <button
        type="button"
        onClick={analyser}
        disabled={enCours}
        className="h-12 rounded-xl bg-accent text-base font-semibold text-inverse disabled:opacity-60"
      >
        {enCours ? "Lecture de Wikipédia…" : `Chercher les notes ${consoleNom}`}
      </button>
      <p role="status" className="text-sm text-texte-doux">
        {etat.etape === "analyse" &&
          `Articles lus : ${etat.fait} / ${etat.total}`}
        {etat.etape === "fini" && "Rien n'a encore été enregistré."}
        {etat.etape === "enregistre" &&
          `${etat.ecrites} notes enregistrées. Le site se met à jour dans quelques instants.`}
      </p>
      {etat.etape === "erreur" && (
        <div
          role="alert"
          className="rounded-[10px] border border-erreur-bordure bg-erreur-fond px-3 py-2.5 text-sm text-erreur"
        >
          {etat.message}
        </div>
      )}

      {etat.etape === "fini" && (
        <>
          <dl aria-label="Résumé" className="grid grid-cols-2 gap-2">
            {[
              ["Trouvées", trouvees.length],
              ["Nouvelles ou changées", changees.length],
              ["Ambiguës", ambigues.length],
              ["Sans note", sansNote.length],
            ].map(([libelle, n]) => (
              <div
                key={libelle}
                className="rounded-xl border border-bordure bg-carte p-3"
              >
                <dt className="text-xs text-texte-discret">{libelle}</dt>
                <dd className="font-titre text-2xl font-bold">{n}</dd>
              </div>
            ))}
          </dl>
          <button
            type="button"
            onClick={enregistrer}
            disabled={!changees.length}
            className="h-12 rounded-xl border-2 border-accent bg-carte text-base font-semibold text-accent disabled:opacity-60"
          >
            {changees.length
              ? `Enregistrer ${changees.length} notes`
              : "Rien de nouveau à enregistrer"}
          </button>
          <Liste
            titre={`Nouvelles ou changées (${changees.length})`}
            ouverte
            lignes={changees.map(
              (l) => `${l.titre} : ${l.note ?? "—"} → ${l.lu.note}`,
            )}
          />
          <Liste
            titre={`Ambiguës, à saisir à la main (${ambigues.length})`}
            ouverte
            lignes={ambigues.map(
              (l) => `${l.titre} — ${"raison" in l.lu ? l.lu.raison : ""}`,
            )}
          />
          <Liste
            titre={`Sans note (${sansNote.length})`}
            lignes={sansNote.map(
              (l) => `${l.titre} — ${"raison" in l.lu ? l.lu.raison : ""}`,
            )}
          />
          <Liste
            titre={`Saisies à la main, gardées (${manuelles.length})`}
            lignes={manuelles.map((l) => `${l.titre} : ${l.note ?? "—"}`)}
          />
        </>
      )}
    </div>
  );
}

function Liste({
  titre,
  lignes,
  ouverte = false,
}: {
  titre: string;
  lignes: string[];
  ouverte?: boolean;
}) {
  if (!lignes.length) return null;
  return (
    <details
      open={ouverte}
      className="rounded-xl border border-bordure bg-carte p-3 text-sm"
    >
      <summary className="cursor-pointer font-semibold">{titre}</summary>
      <ul className="mt-2 list-disc pl-5 text-texte-doux">
        {lignes.map((l) => (
          <li key={l}>{l}</li>
        ))}
      </ul>
    </details>
  );
}
