"use client";

import { useState } from "react";
import {
  analyserAnnonces,
  enregistrerAnnonces,
  type ApercuAnnonces,
  type ResumeAnnonces,
} from "@/app/actions/annonces";
import { formaterDate } from "@/lib/catalogue/catalogue";
import { REGIONS } from "@/lib/catalogue/types";
import { cleAnnonce, type LigneAnnonce } from "@/lib/import/import-annonces";
import { valeur } from "@/lib/import/resultat";

const ETATS: Record<LigneAnnonce["etat"], string> = {
  nouveau: "Nouveaux",
  modifie: "Date ou région qui change",
  inchange: "Inchangés",
  ecarte: "Écartés",
};
const CONSOLES: Record<string, string> = {
  switch: "Switch",
  "switch-2": "Switch 2",
};

/**
 * Import des annonces (US-33) : aperçu (n'écrit rien), case « en boîte » par jeu, menu « même jeu que » pour une
 * annonce japonaise que l'import ne sait pas relier ; puis enregistrement et résumé.
 */
export function ImportAnnonces() {
  const [apercu, setApercu] = useState<ApercuAnnonces | null>(null);
  const [liaisons, setLiaisons] = useState<Record<string, string>>({});
  const [sansBoite, setSansBoite] = useState<Set<string>>(new Set());
  const [occupe, setOccupe] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [resume, setResume] = useState<ResumeAnnonces | null>(null);

  async function executer<T>(message: string, action: () => Promise<T>) {
    setOccupe(message);
    setErreur(null);
    try {
      return await action();
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Erreur inconnue");
    } finally {
      setOccupe(null);
    }
  }

  const analyser = (avec: Record<string, string>) =>
    executer("Lecture des annonces…", async () => {
      setApercu(valeur(await analyserAnnonces(avec)));
      setResume(null);
    });

  const lier = (japon: string, cible: string) => {
    const avec = { ...liaisons };
    if (cible) avec[japon] = cible;
    else delete avec[japon];
    setLiaisons(avec);
    void analyser(avec);
  };

  const basculer = (cle: string) =>
    setSansBoite((avant) => {
      const apres = new Set(avant);
      if (apres.has(cle)) apres.delete(cle);
      else apres.add(cle);
      return apres;
    });

  const aEcrire = (apercu?.lignes ?? []).filter(
    (l) => l.etat === "nouveau" || l.etat === "modifie",
  );
  const garder = aEcrire.filter((l) => !sansBoite.has(l.cle)).map((l) => l.cle);
  const ecarter = aEcrire.filter((l) => sansBoite.has(l.cle)).map((l) => l.cle);

  const enregistrer = () =>
    executer("Enregistrement…", async () => {
      setResume(valeur(await enregistrerAnnonces(liaisons, garder, ecarter)));
      setApercu(null);
      setSansBoite(new Set());
    });

  return (
    <div className="flex flex-col gap-4">
      <button
        type="button"
        onClick={() => void analyser(liaisons)}
        disabled={!!occupe}
        className="h-12 rounded-xl bg-accent text-base font-semibold text-inverse disabled:opacity-60"
      >
        Analyser les annonces
      </button>
      {occupe && (
        <p role="status" className="text-sm text-texte-doux">
          {occupe}
        </p>
      )}
      {erreur && (
        <p
          role="alert"
          className="rounded-[10px] border border-erreur-bordure bg-erreur-fond px-3 py-2.5 text-sm text-erreur"
        >
          {erreur}
        </p>
      )}

      {resume && (
        <section className="flex flex-col gap-1 rounded-xl border border-bordure bg-carte p-4 text-sm">
          <h2 className="font-titre text-lg font-bold">
            Annonces enregistrées
          </h2>
          <p>Ajoutés : {resume.ajoutes.join(", ") || "aucun"}</p>
          <p>Mis à jour : {resume.misAJour.join(", ") || "aucun"}</p>
          <p>Écartés (pas en boîte) : {resume.ecartes.join(", ") || "aucun"}</p>
          <p>Jaquettes copiées : {resume.jaquettes}</p>
          {resume.erreurs.length > 0 && (
            <ul role="alert" className="list-disc pl-5 text-erreur">
              {resume.erreurs.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          )}
        </section>
      )}

      {apercu && (
        <>
          <p className="text-sm text-texte-doux">
            Annonces lues le {formaterDate(apercu.luLe, "jour")} : Japon{" "}
            {apercu.sources.japon ?? 0}, Europe {apercu.sources.europe ?? 0}, US{" "}
            {apercu.sources.etatsUnis ?? 0}.
          </p>
          {(Object.keys(ETATS) as LigneAnnonce["etat"][]).map((etat) => {
            const lignes = apercu.lignes.filter((l) => l.etat === etat);
            if (!lignes.length) return null;
            return (
              <section key={etat} className="flex flex-col gap-2">
                <h2 className="font-titre text-lg font-bold">
                  {ETATS[etat]} ({lignes.length})
                </h2>
                <ul className="flex flex-col gap-2">
                  {lignes.map((l) => (
                    <Ligne
                      key={l.cle}
                      ligne={l}
                      enBoite={!sansBoite.has(l.cle)}
                      basculer={() => basculer(l.cle)}
                      liaison={liaisons[l.cle] ?? ""}
                      lier={(cible) => lier(l.cle, cible)}
                      delier={
                        l.annonces.JAP &&
                        liaisons[cleAnnonce(l.annonces.JAP)] !== undefined
                          ? () => lier(cleAnnonce(l.annonces.JAP!), "")
                          : null
                      }
                      occupe={!!occupe}
                    />
                  ))}
                </ul>
              </section>
            );
          })}
          <button
            type="button"
            onClick={() => void enregistrer()}
            disabled={!!occupe || !aEcrire.length}
            className="h-12 rounded-xl border-2 border-accent bg-carte text-base font-semibold text-accent disabled:opacity-60"
          >
            {aEcrire.length
              ? `Enregistrer ${garder.length} jeu${garder.length > 1 ? "x" : ""}`
              : "Rien à enregistrer"}
          </button>
        </>
      )}
    </div>
  );
}

function Ligne({
  ligne,
  enBoite,
  basculer,
  liaison,
  lier,
  delier,
  occupe,
}: {
  ligne: LigneAnnonce;
  enBoite: boolean;
  basculer: () => void;
  liaison: string;
  lier: (cible: string) => void;
  /** Version japonaise reliée par le menu « même jeu que » : la séparer de nouveau. */
  delier: (() => void) | null;
  occupe: boolean;
}) {
  const aEcrire = ligne.etat === "nouveau" || ligne.etat === "modifie";
  return (
    <li className="flex flex-col gap-1.5 rounded-xl border border-bordure bg-carte p-3 text-sm">
      <p className="font-semibold">
        {ligne.titre}{" "}
        <span className="font-normal text-texte-discret">
          · {CONSOLES[ligne.console]}
        </span>
      </p>
      <ul className="text-texte-doux">
        {REGIONS.filter((r) => ligne.annonces[r]).map((r) => {
          const a = ligne.annonces[r]!;
          return (
            <li key={r}>
              {r} : {formaterDate(a.date, a.precision)}
              {r === "JAP" && a.titre !== ligne.titre ? ` — ${a.titre}` : ""}
            </li>
          );
        })}
      </ul>
      {ligne.changements.length > 0 && (
        <p className="text-texte-discret">
          Change : {ligne.changements.join(", ")}
        </p>
      )}
      {ligne.raison && <p className="text-texte-discret">{ligne.raison}</p>}
      {Object.keys(ligne.jaquettes).length > 0 && (
        <p className="text-texte-discret">Jaquette : boîte US officielle</p>
      )}
      {ligne.candidats.length > 0 && (
        <label className="flex flex-col gap-1">
          <span>Même jeu que</span>
          <select
            value={liaison}
            onChange={(e) => lier(e.target.value)}
            disabled={occupe}
            className="h-11 min-w-0 rounded-[10px] border border-bordure bg-champ px-2"
          >
            <option value="">Aucun (jeu à part)</option>
            {ligne.candidats.map((c) => (
              <option key={c.cle} value={c.cle}>
                {c.titre}
              </option>
            ))}
          </select>
        </label>
      )}
      {delier && (
        <button
          type="button"
          onClick={delier}
          disabled={occupe}
          className="min-h-11 self-start text-accent underline"
        >
          Séparer la version japonaise
        </button>
      )}
      {aEcrire && (
        <label className="flex min-h-11 items-center gap-2">
          <input
            type="checkbox"
            checked={enBoite}
            onChange={basculer}
            className="size-5 accent-accent"
          />
          En boîte
        </label>
      )}
    </li>
  );
}
