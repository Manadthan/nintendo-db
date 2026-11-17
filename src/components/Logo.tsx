/**
 * Logo du site (US-15, MAQUETTES v0.5) : une cartouche générique grise, étiquette bleue « DB » et touche jaune.
 * Forme dessinée pour le site : aucun texte ni logo de Nintendo. Décor : le nom du site est écrit à côté.
 */
export function Logo({ taille = 28 }: { taille?: number }) {
  return (
    <svg
      viewBox="0 0 64 64"
      width={taille}
      height={taille}
      aria-hidden="true"
      className="shrink-0"
    >
      <path
        d="M12 8h34l6 6v40a3 3 0 0 1-3 3H15a3 3 0 0 1-3-3V11a3 3 0 0 1 3-3z"
        fill="#c9ccd3"
      />
      <path d="M16 11.5h26M16 14.5h26" stroke="#0000002a" strokeWidth="1.4" />
      <rect x="16" y="19" width="32" height="25" rx="2.5" fill="#2541b2" />
      <rect x="16" y="19" width="32" height="5" rx="2.5" fill="#e8b820" />
      <rect x="16" y="22" width="32" height="2" fill="#e8b820" />
      <path
        d="M22.5 28v11h3.2a5.5 5.5 0 0 0 0-11zM34.5 28v11h4.3a2.8 2.8 0 0 0 0-5.6h-4.3h3.8a2.7 2.7 0 0 0 0-5.4z"
        fill="none"
        stroke="#fff"
        strokeWidth="2.6"
        strokeLinejoin="round"
      />
      <path
        d="M28.5 48.5l3.5 3.5 3.5-3.5"
        fill="none"
        stroke="#0000003a"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
