import type { Metadata } from "next";
import Link from "next/link";
import {
  ActionsInvitation,
  BoutonSupprimerCollectionneur,
  FormulaireInvitation,
} from "@/components/Collectionneurs";
import {
  listerCollectionneurs,
  type Collectionneur,
} from "@/lib/admin/collectionneurs";
import { exigerProprietaire } from "@/lib/auth/proprietaire";
import { etatInvitation } from "@/lib/invitations/invitations";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = {
  title: "Collectionneurs · Administration · Nintendo DB",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const date = (iso: string) =>
  new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

/** Comptes des collectionneurs : e-mails et collections de tous, lisibles seulement avec la clé secrète (ADR-16). */
async function chargerCollectionneurs(): Promise<Collectionneur[]> {
  const admin = createSupabaseAdminClient();
  const [profils, comptes] = await Promise.all([
    admin.from("profils").select("user_id, pseudo, role, cree_le"),
    admin.auth.admin.listUsers({ perPage: 1000 }),
  ]);
  if (profils.error) throw new Error(profils.error.message);
  if (comptes.error) throw new Error(comptes.error.message);
  const ids = profils.data
    .filter((p) => p.role === "collectionneur")
    .map((p) => p.user_id);
  // Par pages de 1 000 : l'API n'en rend pas plus par requête (#157).
  const possessions: { user_id: string; game_id: string }[] = [];
  for (let de = 0; ids.length > 0; de += 1000) {
    const { data, error } = await admin
      .from("possessions")
      .select("user_id, game_id")
      .in("user_id", ids)
      .order("user_id")
      .order("game_id")
      .order("region")
      .range(de, de + 999);
    if (error) throw new Error(error.message);
    possessions.push(...data);
    if (data.length < 1000) break;
  }
  return listerCollectionneurs(profils.data, comptes.data.users, possessions);
}

/** Collectionneurs invités (US-19) : inviter par un lien à partager, suivre les invitations, supprimer un compte. */
export default async function PageCollectionneurs() {
  const supabase = await exigerProprietaire();
  const { data: invitations, error } = await supabase
    .from("invitations")
    .select("id, nom, expire_le, utilisee_le")
    .is("utilisee_le", null)
    .order("cree_le", { ascending: false });
  if (error) throw new Error(`Invitations illisibles : ${error.message}`);
  const maintenant = new Date();

  let collectionneurs: Collectionneur[] = [];
  let erreurComptes: string | null = null;
  try {
    collectionneurs = await chargerCollectionneurs();
  } catch (e) {
    erreurComptes = (e as Error).message;
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-6 px-4 py-6">
      <Link href="/admin" className="text-sm font-semibold text-accent">
        ‹ Administration
      </Link>
      <h1 className="font-titre text-[26px] font-bold tracking-tight">
        Collectionneurs
      </h1>

      <section
        aria-label="Inviter"
        className="flex flex-col gap-3 rounded-xl border border-bordure bg-carte p-4"
      >
        <h2 className="font-titre text-lg font-bold">
          Inviter un collectionneur
        </h2>
        <p className="text-sm text-texte-doux">
          Le site n&apos;envoie aucun e-mail : vous envoyez vous-même le lien
          (SMS, messagerie).
        </p>
        <FormulaireInvitation />
      </section>

      <section
        aria-label="Invitations en attente"
        className="flex flex-col gap-3"
      >
        <h2 className="font-titre text-lg font-bold">Invitations en attente</h2>
        {invitations.length === 0 && (
          <p className="text-sm text-texte-doux">Aucune.</p>
        )}
        {invitations.map((i) => {
          const expiree = etatInvitation(i, maintenant) === "expiree";
          return (
            <article
              key={i.id}
              className="flex flex-col gap-2 rounded-xl border border-bordure bg-carte p-3"
            >
              <p className="text-sm">
                <strong>{i.nom}</strong>{" "}
                <span className={expiree ? "text-erreur" : "text-texte-doux"}>
                  · {expiree ? "expirée le" : "expire le"} {date(i.expire_le)}
                </span>
              </p>
              <ActionsInvitation id={i.id} nom={i.nom} />
            </article>
          );
        })}
      </section>

      <section
        aria-label="Collectionneurs inscrits"
        className="flex flex-col gap-3"
      >
        <h2 className="font-titre text-lg font-bold">
          Collectionneurs inscrits
        </h2>
        {erreurComptes && (
          <div
            role="alert"
            className="rounded-[10px] border border-erreur-bordure bg-erreur-fond px-3 py-2.5 text-sm text-erreur"
          >
            Comptes illisibles : {erreurComptes}
          </div>
        )}
        {!erreurComptes && collectionneurs.length === 0 && (
          <p className="text-sm text-texte-doux">Aucun pour l&apos;instant.</p>
        )}
        {collectionneurs.map((c) => (
          <article
            key={c.userId}
            className="flex items-center justify-between gap-3 rounded-xl border border-bordure bg-carte p-3"
          >
            <div className="min-w-0 text-sm">
              <p className="font-semibold">{c.pseudo}</p>
              <p className="truncate text-texte-doux">{c.email}</p>
              <p className="text-texte-discret">
                Inscrit le {date(c.inscritLe)} · {c.jeux} jeu
                {c.jeux > 1 ? "x" : ""}
              </p>
            </div>
            <BoutonSupprimerCollectionneur
              userId={c.userId}
              pseudo={c.pseudo}
            />
          </article>
        ))}
      </section>
    </main>
  );
}
