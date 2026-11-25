"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import {
  adresseRetourCatalogue,
  noterRetourParLien,
} from "@/lib/catalogue/defilement";

const sansAbonnement = () => () => {};

/** « ‹ Retour au catalogue » : retrouve recherche, marché, filtres et tri (SPEC v1.45) ; l'accueil seul avant lecture. */
export function RetourCatalogue() {
  const retour = useSyncExternalStore(
    sansAbonnement,
    adresseRetourCatalogue,
    () => "/",
  );
  return (
    <Link
      href={retour}
      onClick={noterRetourParLien}
      className="flex h-11 items-center gap-1 self-start text-sm font-medium"
    >
      <span aria-hidden="true">‹</span> Retour au catalogue
    </Link>
  );
}
