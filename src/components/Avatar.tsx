import type { ReactNode } from "react";
import { AVATARS, type IdAvatar } from "@/lib/profil/avatars";

/** Trous et détails : de la couleur du fond de l'icône (`--fond-icone`, posé par les badges, US-24). */
const FOND = "var(--fond-icone, var(--color-accent-doux))";

/** Icônes dessinées pour le site (ADR-16 point 6), grille 24 × 24, couleur du texte courant ; reprises par les badges. */
export const DESSINS: Record<IdAvatar, ReactNode> = {
  manette: (
    <>
      <rect x="2" y="7" width="20" height="11" rx="5.5" />
      <path d="M6 11h1.5V9.5h1.5V11h1.5v1.5H9V14H7.5v-1.5H6z" fill={FOND} />
      <circle cx="16" cy="11" r="1.3" fill={FOND} />
      <circle cx="18.5" cy="13.5" r="1.3" fill={FOND} />
    </>
  ),
  cartouche: (
    <>
      <path d="M5 3h11l3 3v15H5z" />
      <rect x="7.5" y="6" width="9" height="7" rx="1" fill={FOND} />
      <path d="M8 17h8v2H8z" fill={FOND} />
    </>
  ),
  champignon: (
    <>
      <path d="M2.5 12.5C2.5 7 6.8 3 12 3s9.5 4 9.5 9.5z" />
      <circle cx="8" cy="8.5" r="2" fill={FOND} />
      <circle cx="15.5" cy="7.5" r="1.6" fill={FOND} />
      <path d="M8 13h8v5a3 3 0 0 1-3 3h-2a3 3 0 0 1-3-3z" />
    </>
  ),
  etoile: (
    <path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z" />
  ),
  envahisseur: (
    <path d="M7 4h2v2h6V4h2v2h1v2h1v2h2v6h-2v-2h-1v3h-3v2h-2v-2h-2v2H9v-2H6v-3H5v2H3v-6h2V8h1V6h1zm1 6v2h2v-2zm6 0v2h2v-2z" />
  ),
  trophee: (
    <>
      <path d="M6 3h12v5a6 6 0 0 1-12 0z" />
      <path
        d="M6 5H3v2a4 4 0 0 0 4 4M18 5h3v2a4 4 0 0 1-4 4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path d="M10.5 13.5h3V17h-3zM7 18h10v3H7z" />
    </>
  ),
  fusee: (
    <>
      <path d="M12 2c3 2.5 4.5 6 4.5 10v4h-9v-4C7.5 8 9 4.5 12 2z" />
      <circle cx="12" cy="9.5" r="2" fill={FOND} />
      <path d="M7.5 12 4 16v3l3.5-2zM16.5 12l3.5 4v3l-3.5-2zM10 17h4l-.8 4.5h-2.4z" />
    </>
  ),
  tortue: (
    <>
      <path d="M3.5 15a7.5 7 0 0 1 15 0z" />
      <path
        d="M8 10.5l3-3 3 3-3 3zM5.5 14l2-2 1.5 2zM16.5 14l-2-2-1.5 2z"
        fill={FOND}
      />
      <circle cx="20" cy="13" r="2.5" />
      <path d="M5 15h3v4H5zM14 15h3v4h-3z" />
    </>
  ),
  eclair: <path d="M13.5 2 4.5 13.5H11L9.5 22l10-12.5H13z" />,
  diamant: (
    <>
      <path d="M6 3h12l4 6-10 13L2 9z" />
      <path
        d="M2 9h20M9 3l3 6 3-6M12 9v13"
        fill="none"
        stroke={FOND}
        strokeWidth="1.3"
      />
    </>
  ),
  flamme: (
    <>
      <path d="M12 2c1 3.5 6.5 6.5 6.5 12a6.5 6.5 0 0 1-13 0c0-3 1.6-4.8 3-6 .2 2 1 3.2 2 3.5C10 8.5 11 5 12 2z" />
      <path
        d="M12 13c1.5 1.7 3 2.6 3 4.5a3 3 0 0 1-6 0c0-1.9 1.5-2.8 3-4.5z"
        fill={FOND}
      />
    </>
  ),
  de: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="4" />
      {[
        [8, 8],
        [16, 8],
        [12, 12],
        [8, 16],
        [16, 16],
      ].map(([cx, cy]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="1.7" fill={FOND} />
      ))}
    </>
  ),
};

/** Avatar rond d'un compte (US-22) : icône du site, nom lu par les lecteurs d'écran si `nomme`. */
export function Avatar({
  id,
  taille = 64,
  nomme = false,
}: {
  id: IdAvatar;
  taille?: number;
  nomme?: boolean;
}) {
  const nom = AVATARS.find((a) => a.id === id)?.nom ?? id;
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full bg-accent-doux text-accent"
      style={{ width: taille, height: taille }}
      {...(nomme
        ? { role: "img", "aria-label": `Avatar : ${nom}` }
        : { "aria-hidden": true })}
    >
      <svg
        viewBox="0 0 24 24"
        width={taille * 0.58}
        height={taille * 0.58}
        fill="currentColor"
        aria-hidden="true"
      >
        {DESSINS[id]}
      </svg>
    </span>
  );
}

/** Choix de l'avatar (page Bienvenue, Mon profil) : boutons radio dessinés en ronds. */
export function ChoixAvatar({ valeur }: { valeur: IdAvatar }) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-1.5 text-[13px] font-semibold text-texte-doux">
        Avatar
      </legend>
      <div className="grid grid-cols-6 gap-2">
        {AVATARS.map((a) => (
          <label
            key={a.id}
            className="relative flex justify-center"
            title={a.nom}
          >
            <input
              type="radio"
              name="avatar"
              value={a.id}
              defaultChecked={a.id === valeur}
              aria-label={a.nom}
              className="peer absolute inset-0 cursor-pointer opacity-0"
            />
            <span className="rounded-full ring-accent ring-offset-2 ring-offset-carte peer-checked:ring-[3px] peer-focus-visible:ring-2">
              <Avatar id={a.id} taille={44} />
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
