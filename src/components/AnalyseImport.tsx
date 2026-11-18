"use client";

import { useState } from "react";
import {
  analyserListe,
  enregistrerLot,
  exclureJeux,
  reactiverJeu,
  supprimerJeux,
  terminerImport,
} from "@/app/actions/import";
import {
  decouperEnLots,
  lignesAEnregistrer,
  resumer,
  resumerEnregistrement,
  type Apercu,
  type LigneApercu,
  type ResultatEnregistrement,
  type ResumeEnregistrement,
} from "@/lib/import/apercu";
import { valeur } from "@/lib/import/resultat";
import { REGIONS } from "@/lib/catalogue/types";

type Etat =
  | { etape: "attente" }
  | { etape: "wikipedia" }
  | { etape: "fini" }
  | { etape: "enregistrement"; fait: number; total: number }
  | { etape: "enregistre"; resume: ResumeEnregistrement }
  | { etape: "erreur"; message: string };

/**
 * Import (US-10, ADR-03) : aperçu (Wikipédia et GameTDB), qui n'écrit rien ; puis, sur
 * confirmation, enregistrement par lots de 10 avec copie des jaquettes, et résumé.
 */
export function AnalyseImport({
  consoleSlug,
  consoleNom,
  sources = "la liste Wikipédia et la base GameTDB",
  caseEnBoite = false,
}: {
  consoleSlug: string;
  consoleNom: string;
  /** Sources lues par l'analyse, pour le message d'attente (Wii : GameTDB seul). */
  sources?: string;
  /** Case « en boîte » sur chaque nouveau jeu (Switch 2 : la liste Wikipédia ne distingue pas le téléchargement). */
  caseEnBoite?: boolean;
}) {
  const [etat, setEtat] = useState<Etat>({ etape: "attente" });
  const [apercu, setApercu] = useState<Apercu | null>(null);
  // Recopier les jaquettes déjà en place (sauf ajouts à la main), après un changement de taille d'image (#48).
  const [recopier, setRecopier] = useState(false);
  // Import des nouveautés (SPEC v1.11) : par défaut, seuls les jeux nouveaux ou modifiés sont enregistrés.
  const [tout, setTout] = useState(false);
  // Nouveaux jeux décochés « en boîte » : exclus (mémorisés) à l'enregistrement, pas importés (ADR-03 point 7).
  const [sansBoite, setSansBoite] = useState<Set<string>>(new Set());
  const basculerBoite = (slug: string) =>
    setSansBoite((avant) => {
      const apres = new Set(avant);
      if (!apres.delete(slug)) apres.add(slug);
      return apres;
    });

  async function analyser() {
    setApercu(null);
    setSansBoite(new Set());
    try {
      setEtat({ etape: "wikipedia" });
      const resultat = valeur(await analyserListe(consoleSlug));
      setApercu(resultat);

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
    const choisis = lignesAEnregistrer(apercu, tout || recopier).filter(
      (l) => !sansBoite.has(l.slug),
    );
    const exclus = apercu.lignes
      .filter((l) => sansBoite.has(l.slug))
      .map((l) => ({ slug: l.slug, titre: l.titre }));
    const total = choisis.length;
    const aSupprimer = apercu.aSupprimer.length;
    if (
      !window.confirm(
        `Enregistrer ${total} jeux dans la base du site ? Tes corrections manuelles seront gardées.` +
          (exclus.length
            ? `\n\n${exclus.length} jeu(x) sans boîte ne seront plus proposés : ${exclus.map((e) => e.titre).join(", ")}.`
            : "") +
          (aSupprimer
            ? `\n\n${aSupprimer} jeu(x) sans boîte Nintendo seront supprimés : ${apercu.aSupprimer.join(", ")}.`
            : ""),
      )
    ) {
      return;
    }
    const resultats: ResultatEnregistrement[] = [];
    try {
      if (exclus.length) valeur(await exclureJeux(consoleSlug, exclus));
      for (const [i, lot] of decouperEnLots(choisis, 10).entries()) {
        setEtat({ etape: "enregistrement", fait: i * 10, total });
        resultats.push(
          ...valeur(
            await enregistrerLot(
              consoleSlug,
              lot.map((l) => ({ wikipedia: l.wikipedia })),
              recopier,
            ),
          ),
        );
      }
      const supprimes = aSupprimer
        ? valeur(await supprimerJeux(consoleSlug, apercu.aSupprimer))
        : [];
      const resume = resumerEnregistrement(resultats, supprimes);
      valeur(await terminerImport(consoleSlug, resume));
      setEtat({ etape: "enregistre", resume });
    } catch (e) {
      setEtat({
        etape: "erreur",
        message: e instanceof Error ? e.message : "Erreur inconnue",
      });
    }
  }

  async function reactiver(slug: string) {
    try {
      valeur(await reactiverJeu(consoleSlug, slug));
      await analyser();
    } catch (e) {
      setEtat({
        etape: "erreur",
        message: e instanceof Error ? e.message : "Erreur inconnue",
      });
    }
  }

  const enCours = ["wikipedia", "enregistrement"].includes(etat.etape);
  const resume = apercu ? resumer(apercu) : null;
  const aEnregistrer = apercu
    ? lignesAEnregistrer(apercu, tout || recopier)
    : [];
  const inchanges = apercu
    ? apercu.lignes.filter((l) => l.etat === "inchange")
    : [];

  return (
    <div className="flex flex-col gap-4">
      <button
        type="button"
        onClick={analyser}
        disabled={enCours}
        className="h-12 rounded-xl bg-accent text-base font-semibold text-inverse disabled:opacity-60"
      >
        {enCours ? "Analyse en cours…" : `Analyser la ${consoleNom}`}
      </button>

      <p role="status" className="text-sm text-texte-doux">
        {etat.etape === "wikipedia" && `Lecture de ${sources}…`}
        {etat.etape === "fini" &&
          "Analyse terminée. Rien n'a encore été enregistré."}
        {etat.etape === "enregistrement" &&
          `Enregistrement et copie des jaquettes : ${etat.fait} / ${etat.total} jeux`}
      </p>

      {etat.etape === "erreur" && (
        <div
          role="alert"
          className="rounded-[10px] border border-erreur-bordure bg-erreur-fond px-3 py-2.5 text-sm text-erreur"
        >
          {etat.message}
        </div>
      )}

      {etat.etape === "fini" && apercu && (
        <label className="flex min-h-11 items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={tout}
            onChange={(e) => setTout(e.target.checked)}
            className="size-5 accent-accent"
          />
          Tout réenregistrer, y compris les {inchanges.length} jeux inchangés
        </label>
      )}

      {etat.etape === "fini" && apercu && (
        <label className="flex min-h-11 items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={recopier}
            onChange={(e) => setRecopier(e.target.checked)}
            className="size-5 accent-accent"
          />
          Recopier toutes les jaquettes (sauf photos et images ajoutées à la
          main)
        </label>
      )}

      {etat.etape === "fini" && apercu && (
        <button
          type="button"
          onClick={enregistrer}
          disabled={!aEnregistrer.length && !apercu.aSupprimer.length}
          className="h-12 rounded-xl border-2 border-accent bg-carte text-base font-semibold text-accent disabled:opacity-60"
        >
          {aEnregistrer.length || apercu.aSupprimer.length
            ? `Enregistrer ${tout || recopier ? "tout" : "les nouveautés"} (${aEnregistrer.length} jeux)`
            : "Rien de nouveau à enregistrer"}
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
            <div role="alert" className="text-erreur">
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
                GameTDB n&apos;a pas de scan pour ces régions : à remplacer à la
                main.
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
              ["Nouveaux", resume.ajoutes],
              ["Modifiés", resume.misAJour],
              ["Inchangés", resume.inchanges],
              ["Ignorés", resume.ignores],
              ["À supprimer", resume.aSupprimer],
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

          {apercu.lignes.length > inchanges.length && (
            <ListeJeux
              libelle="Jeux nouveaux ou modifiés"
              lignes={apercu.lignes.filter((l) => l.etat !== "inchange")}
              enBoite={
                caseEnBoite ? { sansBoite, basculer: basculerBoite } : undefined
              }
            />
          )}

          {inchanges.length > 0 && (
            <details className="rounded-xl border border-bordure bg-carte p-3 text-sm">
              <summary className="cursor-pointer font-semibold">
                Jeux inchangés ({inchanges.length})
              </summary>
              <p className="mt-2 mb-2 text-texte-doux">
                Déjà à jour dans la base : ils ne sont pas réenregistrés.
              </p>
              <ListeJeux libelle="Jeux inchangés" lignes={inchanges} />
            </details>
          )}

          {apercu.aSupprimer.length > 0 && (
            <p
              role="alert"
              className="rounded-xl border border-erreur-bordure bg-erreur-fond p-3 text-sm text-erreur"
            >
              {apercu.aSupprimer.length} jeu(x) en base n&apos;ont plus de boîte
              Nintendo et seront supprimés à l&apos;enregistrement :{" "}
              {apercu.aSupprimer.join(", ")}.
            </p>
          )}

          {apercu.exclus.length > 0 && (
            <details className="rounded-xl border border-bordure bg-carte p-3 text-sm">
              <summary className="cursor-pointer font-semibold">
                Jeux exclus, sans boîte ({apercu.exclus.length})
              </summary>
              <p className="mt-2 text-texte-doux">
                Décochés « en boîte » lors d&apos;un import précédent : ils ne
                sont plus proposés.
              </p>
              <ul className="mt-1 flex flex-col">
                {apercu.exclus.map((e) => (
                  <li
                    key={e.slug}
                    className="flex min-h-11 items-center justify-between gap-2"
                  >
                    <span>{e.titre}</span>
                    <button
                      type="button"
                      onClick={() => reactiver(e.slug)}
                      disabled={enCours}
                      className="h-9 shrink-0 rounded-lg border border-champ px-3 text-xs font-semibold"
                    >
                      Réactiver
                    </button>
                  </li>
                ))}
              </ul>
            </details>
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
            {apercu.aVenir.length > 0 && (
              <>
                <p className="mt-2 text-texte-doux">
                  {apercu.aVenir.length} jeux pas encore sortis (importés une
                  fois sortis) :
                </p>
                <ul className="mt-1 list-disc pl-5 text-texte-doux">
                  {apercu.aVenir.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              </>
            )}
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

const ETATS: Record<LigneApercu["etat"], string> = {
  nouveau: "nouveau",
  modifie: "modifié",
  inchange: "inchangé",
};

/** Jeux de l'aperçu : titre, état par rapport à la base, ce qui change, régions sorties. */
function ListeJeux({
  libelle,
  lignes,
  enBoite,
}: {
  libelle: string;
  lignes: LigneApercu[];
  /** Case « en boîte » sur les nouveaux jeux (Switch 2). */
  enBoite?: { sansBoite: Set<string>; basculer: (slug: string) => void };
}) {
  return (
    <ul
      aria-label={libelle}
      className="flex flex-col overflow-hidden rounded-xl border border-bordure bg-carte"
    >
      {lignes.map((ligne) => (
        <li
          key={ligne.slug}
          className="flex flex-col gap-1.5 border-t border-separateur px-3 py-2.5 first:border-t-0"
        >
          <div className="flex items-start justify-between gap-2">
            <span className="text-sm font-semibold">{ligne.titre}</span>
            <span className="shrink-0 text-xs text-texte-discret">
              {ETATS[ligne.etat]}
            </span>
          </div>
          {enBoite && ligne.etat === "nouveau" && (
            <label className="flex min-h-11 items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={!enBoite.sansBoite.has(ligne.slug)}
                onChange={() => enBoite.basculer(ligne.slug)}
                className="size-5 accent-accent"
              />
              En boîte (décocher si téléchargement seul)
            </label>
          )}
          {ligne.changements.length > 0 && (
            <p className="text-xs text-texte-doux">
              {ligne.changements.join(", ")}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
            {REGIONS.map((region) => (
              <span
                key={region}
                className={`rounded px-1.5 py-0.5 font-bold ${
                  ligne.regions[region]
                    ? "bg-accent-doux text-accent-fonce"
                    : "bg-surface text-texte-discret"
                }`}
              >
                {region}
              </span>
            ))}
          </div>
        </li>
      ))}
    </ul>
  );
}
