// Accueil provisoire (issue #4) : en-tête et bandeau de docs/MAQUETTES.md, écran 1.
// Le catalogue Wii U arrive à l'étape 3 (US-02).
export default function Accueil() {
  return (
    <>
      <header className="flex h-14 items-center justify-between border-b border-bordure bg-carte px-4">
        <span className="font-titre text-[19px] font-bold tracking-tight">Nintendo DB</span>
        <nav aria-label="Navigation principale" className="flex gap-1 text-sm">
          <span aria-current="page" className="flex h-11 items-center px-2.5 font-semibold">
            Catalogue
          </span>
          <span className="flex h-11 items-center px-2.5 text-texte-doux">À propos</span>
        </nav>
      </header>

      <main>
        <section className="flex flex-col gap-1.5 border-b border-bordure bg-carte px-4 pt-[22px] pb-5">
          <p className="text-xs font-semibold tracking-wide text-accent uppercase">
            Pour les collectionneurs
          </p>
          <h1 className="font-titre text-[26px] leading-tight font-bold tracking-tight">
            Les jeux Nintendo en boîte, version par version
          </h1>
          <p className="text-sm leading-relaxed text-texte-doux">
            Wii U : chaque jeu édité par Nintendo, avec ses jaquettes, titres et dates au Japon, en
            Amérique du Nord et en Europe.
          </p>
        </section>

        <p className="px-4 py-6 text-sm text-texte-discret">Le catalogue arrive bientôt.</p>
      </main>
    </>
  );
}
