import Link from "next/link";
import { EnTete } from "@/components/EnTete";

export default function Introuvable() {
  return (
    <>
      <EnTete />
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-3 px-4 py-10">
        <h1 className="font-titre text-2xl font-bold">Page introuvable</h1>
        <p className="text-sm text-texte-doux">
          Ce jeu ou cette page n&apos;existe pas (ou plus) sur Nintendo DB.
        </p>
        <Link href="/" className="text-sm font-semibold text-accent">
          Retour au catalogue
        </Link>
      </main>
    </>
  );
}
