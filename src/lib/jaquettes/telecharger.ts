import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

/** 8 Mo au plus : une photo ou un scan de jaquette, jamais plus. */
export const POIDS_MAX_IMAGE = 8 * 1024 * 1024;
const REDIRECTIONS_MAX = 3;
const DELAI_MS = 10_000;

/**
 * Adresse IP qui ne doit jamais être contactée par le serveur (protection SSRF) : boucle locale, réseaux privés,
 * lien local (dont les métadonnées des hébergeurs, 169.254.169.254), CGNAT, multidiffusion, réservées.
 */
export function adresseInterdite(ip: string): boolean {
  const v4 = ip.startsWith("::ffff:") ? ip.slice(7) : ip;
  if (isIP(v4) === 4) {
    const [a, b] = v4.split(".").map(Number) as [number, number];
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 198 && (b === 18 || b === 19)) ||
      a >= 224
    );
  }
  const v6 = ip.toLowerCase();
  return (
    v6 === "::" ||
    v6 === "::1" ||
    v6.startsWith("fc") ||
    v6.startsWith("fd") ||
    v6.startsWith("fe8") ||
    v6.startsWith("fe9") ||
    v6.startsWith("fea") ||
    v6.startsWith("feb") ||
    v6.startsWith("ff")
  );
}

type Dependances = {
  resoudre?: (hote: string) => Promise<string[]>;
  fetch?: typeof globalThis.fetch;
};

const resoudreDns = async (hote: string) =>
  (await lookup(hote, { all: true })).map((a) => a.address);

async function verifierAdresse(
  url: URL,
  resoudre: (hote: string) => Promise<string[]>,
) {
  if (url.protocol !== "https:" && url.protocol !== "http:")
    throw new Error(
      "Adresse refusée : seules les adresses http(s) sont acceptées.",
    );
  if (url.username || url.password)
    throw new Error("Adresse refusée : identifiants dans l'adresse.");
  const hote = url.hostname.replace(/^\[|\]$/g, "");
  const adresses = isIP(hote) ? [hote] : await resoudre(hote);
  if (!adresses.length || adresses.some(adresseInterdite))
    throw new Error("Adresse refusée : elle mène à un réseau interne.");
}

/**
 * Télécharge une image donnée par son adresse (US-12) : http(s) seulement, adresse publique vérifiée à chaque
 * redirection (3 au plus), 10 s et 8 Mo au plus, réponse de type image. Le contenu sera ré-encodé en WebP.
 */
export async function telechargerImageExterne(
  adresse: string,
  { resoudre = resoudreDns, fetch = globalThis.fetch }: Dependances = {},
): Promise<Buffer> {
  let url: URL;
  try {
    url = new URL(adresse.trim());
  } catch {
    throw new Error("Adresse invalide.");
  }
  for (let saut = 0; ; saut++) {
    await verifierAdresse(url, resoudre);
    const reponse = await fetch(url, {
      redirect: "manual",
      signal: AbortSignal.timeout(DELAI_MS),
      headers: { Accept: "image/*" },
    });
    if (reponse.status >= 300 && reponse.status < 400) {
      const suivante = reponse.headers.get("location");
      if (!suivante || saut >= REDIRECTIONS_MAX)
        throw new Error("Trop de redirections.");
      url = new URL(suivante, url);
      continue;
    }
    if (!reponse.ok)
      throw new Error(`Image introuvable (HTTP ${reponse.status}).`);
    if (!reponse.headers.get("content-type")?.startsWith("image/"))
      throw new Error("Cette adresse ne mène pas à une image.");
    const annonce = Number(reponse.headers.get("content-length") ?? 0);
    if (annonce > POIDS_MAX_IMAGE)
      throw new Error("Image trop lourde (8 Mo au plus).");

    // Lecture limitée : on s'arrête dès que la taille maximale est dépassée.
    const morceaux: Uint8Array[] = [];
    let total = 0;
    const lecteur = reponse.body?.getReader();
    if (!lecteur) throw new Error("Réponse vide.");
    for (;;) {
      const { done, value } = await lecteur.read();
      if (done) break;
      total += value.byteLength;
      if (total > POIDS_MAX_IMAGE) {
        await lecteur.cancel();
        throw new Error("Image trop lourde (8 Mo au plus).");
      }
      morceaux.push(value);
    }
    return Buffer.concat(morceaux);
  }
}
