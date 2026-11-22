"use client";

import Link from "next/link";
import { useConnecte } from "@/lib/auth/session-navigateur";

/**
 * Icône de compte de l'en-tête (US-09, SPEC v1.15) : visiteur → page de connexion ; compte connecté → /admin,
 * icône pleine : le propriétaire y reste, un collectionneur est envoyé à son profil par le proxy (US-20, US-22).
 * Le rôle n'est donc jamais lu dans le navigateur (pages publiques préparées à l'avance, ADR-02).
 */
export function BoutonCompte() {
  const connecte = useConnecte() === true;
  const libelle = connecte ? "Mon compte (connecté)" : "Se connecter";
  return (
    <Link
      href={connecte ? "/admin" : "/admin/connexion"}
      prefetch={false}
      aria-label={libelle}
      title={libelle}
      className={`flex size-11 shrink-0 items-center justify-center rounded-full ${
        connecte ? "text-accent" : "text-texte-doux"
      }`}
    >
      <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
        <circle
          cx="12"
          cy="8"
          r="4"
          fill={connecte ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="2"
        />
        <path
          d="M4 20c0-3.6 3.6-6 8-6s8 2.4 8 6"
          fill={connecte ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    </Link>
  );
}
