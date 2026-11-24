// Lecture d'une réponse NDL Search (API OpenSearch, ADR-19 point 6). Module pur, sans import : lu aussi par
// scripts/guides.mjs. Le flux RSS de NDL est un XML régulier : un bloc <item> par livre.

export type LivreNdl = {
  titre: string;
  editeur: string | null;
  parution: string | null;
  pages: string | null;
  isbn: string | null;
  ndc: string[];
  lien: string | null;
};

const ENTITES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
};
const texte = (s: string) =>
  s
    .replace(/&(amp|lt|gt|quot|apos);/g, (_, e: string) => ENTITES[e] ?? "")
    .replace(/&#(\d+);/g, (_, n: string) => String.fromCodePoint(Number(n)))
    .trim();

/** Valeurs d'une balise dans un bloc, avec un attribut xsi:type facultatif (« dcndl:ISBN », « dcndl:NDC10 »…). */
function valeurs(bloc: string, balise: string, type?: RegExp): string[] {
  const re = new RegExp(`<${balise}(\\s[^>]*)?>([^<]*)</${balise}>`, "g");
  return [...bloc.matchAll(re)]
    .filter(([, attributs]) => !type || type.test(attributs ?? ""))
    .map(([, , v]) => texte(v ?? ""))
    .filter(Boolean);
}

/** Livres d'une réponse OpenSearch de NDL Search. */
export function lireNdl(xml: string): LivreNdl[] {
  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map(
    ([, bloc = ""]) => ({
      titre: valeurs(bloc, "dc:title")[0] ?? valeurs(bloc, "title")[0] ?? "",
      editeur: valeurs(bloc, "dc:publisher")[0] ?? null,
      parution:
        valeurs(bloc, "dcterms:issued")[0] ??
        valeurs(bloc, "dc:date")[0] ??
        null,
      pages: valeurs(bloc, "dc:extent")[0] ?? null,
      isbn: valeurs(bloc, "dc:identifier", /ISBN/)[0] ?? null,
      ndc: valeurs(bloc, "dc:subject", /NDC/),
      lien: valeurs(bloc, "link")[0] ?? null,
    }),
  );
}
