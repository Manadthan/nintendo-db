import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { seDeconnecter } from "@/app/actions/auth";
import { Avatar } from "@/components/Avatar";
import { EnTete } from "@/components/EnTete";
import { InterrupteurPublic, ModifierProfil } from "@/components/Profil";
import { PAGE_CONNEXION } from "@/lib/auth/routes";
import { avatarOuDefaut } from "@/lib/profil/avatars";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Mon profil · Nintendo DB",
  robots: { index: false, follow: false },
};

const moisAnnee = (iso: string) =>
  new Date(iso).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

/** Mon profil (US-22) : pseudo, avatar, visibilité ; statistiques et derniers ajouts : PR suivante (3b). */
export default async function PageProfil() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(PAGE_CONNEXION);
  const { data: profil, error } = await supabase
    .from("profils")
    .select("pseudo, avatar, public, role, cree_le")
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) throw new Error(`Profil illisible : ${error.message}`);
  if (!profil) throw new Error("Ce compte n'a pas de profil.");
  const avatar = avatarOuDefaut(profil.avatar);
  const proprietaire = profil.role === "proprietaire";

  return (
    <>
      <EnTete />
      <main className="mx-auto flex w-full max-w-md flex-col gap-4 px-4 pt-6 pb-8">
        <section
          aria-label="Profil"
          className="flex flex-col gap-4 rounded-xl border border-bordure bg-carte p-4"
        >
          <div className="flex items-center gap-4">
            <Avatar id={avatar} taille={72} nomme />
            <div className="min-w-0">
              <h1 className="truncate font-titre text-[26px] leading-tight font-bold tracking-tight">
                {profil.pseudo}
              </h1>
              <p className="text-sm text-texte-doux">
                {proprietaire ? "Propriétaire du site" : "Collectionneur"}{" "}
                depuis {moisAnnee(profil.cree_le)}
              </p>
            </div>
          </div>
          <InterrupteurPublic public={profil.public} />
        </section>
        <ModifierProfil pseudo={profil.pseudo} avatar={avatar} />
        {proprietaire && (
          <Link
            href="/admin"
            className="flex items-center justify-between rounded-xl border border-bordure bg-carte p-4 text-sm font-semibold"
          >
            Administration
            <span aria-hidden="true">›</span>
          </Link>
        )}
        <form action={seDeconnecter}>
          <button
            type="submit"
            className="h-11 w-full rounded-[10px] border border-bordure bg-carte px-3 text-sm font-semibold"
          >
            Se déconnecter
          </button>
        </form>
      </main>
    </>
  );
}
