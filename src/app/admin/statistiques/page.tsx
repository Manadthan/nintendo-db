import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { CLASSES_NOTE, niveauNote } from "@/lib/catalogue/metacritic";
import { REGIONS } from "@/lib/catalogue/types";
import { chargerStatistiques } from "@/lib/statistiques/charger";
import {
  etatCatalogue,
  maCollection,
  notesMetacritic,
  parRegion,
  type JeuNote,
  type Manque,
} from "@/lib/statistiques/statistiques";

export const metadata: Metadata = {
  title: "Statistiques · Administration · Nintendo DB",
  robots: { index: false, follow: false },
};

// Chiffres toujours à jour : calculés à chaque ouverture (ADR-11).
export const dynamic = "force-dynamic";

const NOMS_REGIONS = { JAP: "JAP", US: "US", PAL: "PAL" } as const;

function Bloc({ titre, children }: { titre: string; children: ReactNode }) {
  return (
    <section
      aria-label={titre}
      className="flex flex-col gap-2 rounded-xl border border-bordure bg-carte p-4"
    >
      <h2 className="font-titre text-lg font-bold">{titre}</h2>
      {children}
    </section>
  );
}

function Barre({ pourcent }: { pourcent: number }) {
  return (
    <div
      aria-hidden="true"
      className="h-1.5 overflow-hidden rounded-full bg-surface"
    >
      <div className="h-full bg-possede" style={{ width: `${pourcent}%` }} />
    </div>
  );
}

function Note({ note }: { note: number }) {
  return (
    <span
      className={`inline-flex min-w-8 justify-center rounded-md px-1 py-0.5 text-[13px] font-bold ${CLASSES_NOTE[niveauNote(note)]}`}
    >
      {note}
    </span>
  );
}

function ListeNotes({ titre, jeux }: { titre: string; jeux: JeuNote[] }) {
  if (!jeux.length) return null;
  return (
    <>
      <h3 className="mt-2 text-[13px] font-semibold">{titre}</h3>
      <ul aria-label={titre}>
        {jeux.map((j) => (
          <li
            key={j.id}
            className="flex items-center justify-between gap-2 border-t border-separateur py-1.5 text-sm"
          >
            <span>
              {j.titre}{" "}
              <span className="text-xs text-texte-discret">· {j.console}</span>
            </span>
            <Note note={j.note} />
          </li>
        ))}
      </ul>
    </>
  );
}

/** Statistiques du propriétaire (US-18) : page réservée (proxy /admin, puis exigerProprietaire au chargement). */
export default async function PageStatistiques() {
  const { jeux, consoles, possessions } = await chargerStatistiques();
  const collection = maCollection(jeux, consoles, possessions);
  const regions = parRegion(jeux, possessions);
  const notes = notesMetacritic(jeux, possessions);
  const etat = etatCatalogue(jeux, consoles);

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-4 px-4 py-6">
      <Link
        href="/admin"
        className="flex h-11 items-center gap-1 text-sm font-medium"
      >
        <span aria-hidden="true">‹</span> Administration
      </Link>
      <h1 className="font-titre text-[26px] font-bold tracking-tight">
        Statistiques
      </h1>

      <Bloc titre="Ma collection">
        <p className="flex items-baseline gap-2">
          <span className="text-3xl font-bold">
            {collection.total.possedes}
          </span>
          <span className="text-texte-doux">
            jeu{collection.total.possedes > 1 ? "x" : ""} sur{" "}
            {collection.total.total} · {collection.total.pourcent} %
          </span>
        </p>
        <Barre pourcent={collection.total.pourcent} />
        <ul aria-label="Par console" className="mt-1">
          {collection.consoles.map((c) => (
            <li
              key={c.slug}
              aria-label={`${c.nom} : ${c.possedes} / ${c.total}`}
              className="flex flex-col gap-1 border-t border-separateur py-2"
            >
              <span className="flex justify-between text-sm">
                <span>{c.nom}</span>
                <span className="text-texte-doux">
                  {c.possedes} / {c.total} ·{" "}
                  <b className="text-texte">{c.pourcent} %</b>
                </span>
              </span>
              <Barre pourcent={c.pourcent} />
            </li>
          ))}
        </ul>
      </Bloc>

      <Bloc titre="Par région">
        <ul className="flex gap-2">
          {REGIONS.map((r) => (
            <li
              key={r}
              aria-label={`${NOMS_REGIONS[r]} : ${regions[r]} version${regions[r] > 1 ? "s" : ""}`}
              className="flex flex-1 flex-col items-center rounded-[10px] bg-fond px-1 py-2.5"
            >
              <span className="text-xs text-texte-doux">{NOMS_REGIONS[r]}</span>
              <span className="text-[22px] font-bold">{regions[r]}</span>
              <span className="text-[11px] text-texte-discret">
                version{regions[r] > 1 ? "s" : ""}
              </span>
            </li>
          ))}
        </ul>
        <p className="text-xs text-texte-discret">
          Un jeu possédé en JAP et PAL compte une fois dans « Ma collection »,
          deux fois ici.
        </p>
      </Bloc>

      <Bloc titre="Notes Metacritic">
        {notes.moyenne === null && !notes.meilleursManquants.length ? (
          <p className="text-sm text-texte-doux">Aucune note.</p>
        ) : (
          <>
            {notes.moyenne !== null && (
              <p className="flex items-center gap-2.5 text-sm text-texte-doux">
                Note moyenne de ta collection <Note note={notes.moyenne} />
              </p>
            )}
            <ListeNotes
              titre="Tes mieux notés"
              jeux={notes.meilleursPossedes}
            />
            <ListeNotes
              titre="Les mieux notés qui te manquent"
              jeux={notes.meilleursManquants}
            />
          </>
        )}
      </Bloc>

      <Bloc titre="État du catalogue">
        <p className="flex justify-between text-sm">
          <span>Jeux</span>
          <b>{etat.jeux}</b>
        </p>
        <p className="text-[13px] text-texte-doux">
          À compléter (versions sorties)
        </p>
        <ul aria-label="À compléter">
          <LigneManque
            libelle="Jaquettes manquantes"
            manque={etat.jaquettes}
            adresse={(c) => `/admin/jaquettes?console=${c}&filtre=a-remplacer`}
          />
          <LigneManque
            libelle="Codes produit manquants"
            manque={etat.codes}
            adresse={(c) => `/admin/jeux?console=${c}&filtre=sans-code`}
          />
          <LigneManque
            libelle="Notes Metacritic manquantes"
            manque={etat.notes}
            adresse={(c) => `/admin/notes?console=${c}`}
          />
        </ul>
        <p className="text-xs text-texte-discret">
          Chaque ligne ouvre la liste des jeux concernés, sur la première
          console à compléter ; les autres consoles sont au-dessus de la liste.
        </p>
      </Bloc>
    </main>
  );
}

/** Une ligne « à compléter » : le nombre, et le lien vers la liste quand il en manque. */
function LigneManque({
  libelle,
  manque,
  adresse,
}: {
  libelle: string;
  manque: Manque;
  adresse: (console: string) => string;
}) {
  const contenu = (
    <>
      <span>{libelle}</span>
      <span
        className={
          manque.nombre ? "font-semibold text-erreur" : "text-texte-discret"
        }
      >
        {manque.nombre}
        {manque.console && <span aria-hidden="true"> →</span>}
      </span>
    </>
  );
  return (
    <li className="border-t border-separateur">
      {manque.console ? (
        <Link
          href={adresse(manque.console)}
          aria-label={`${libelle} : ${manque.nombre}`}
          className="flex min-h-11 items-center justify-between text-sm"
        >
          {contenu}
        </Link>
      ) : (
        <span className="flex min-h-11 items-center justify-between text-sm">
          {contenu}
        </span>
      )}
    </li>
  );
}
