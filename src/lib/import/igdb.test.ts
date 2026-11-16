import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import {
  creerClientIgdb,
  rapprocher,
  urlImageIgdb,
  versInfosIgdb,
  type ResultatIgdb,
} from "./igdb";

const fixture = (nom: string): ResultatIgdb[] =>
  JSON.parse(
    readFileSync(join(__dirname, `__fixtures__/igdb/${nom}.json`), "utf8"),
  ).reponse;

describe("rapprocher (R1) — réponses IGDB réelles", () => {
  it("retient le jeu au titre exact, pas les DLC ni les packs", () => {
    const r = rapprocher(["Mario Kart 8"], fixture("mario-kart-8"));
    expect(r).toMatchObject({
      statut: "sur",
      jeu: { id: 2350, name: "Mario Kart 8" },
    });
  });

  it("ne confond pas un jeu et sa suite ou sa compilation", () => {
    expect(rapprocher(["NES Remix"], fixture("nes-remix")).jeu?.id).toBe(6401); // pas « NES Remix 2 » ni « Pack »
    expect(
      rapprocher(["Star Fox Zero"], fixture("star-fox-zero")).jeu?.id,
    ).toBe(11196); // pas « + Star Fox Guard »
  });

  it("reconnaît un titre régional (NA ou PAL) ou un autre nom connu d'IGDB", () => {
    const kirby = [
      "Kirby and the Rainbow Curse",
      "Kirby and the Rainbow Paintbrush",
    ];
    expect(
      rapprocher(kirby, fixture("kirby-and-the-rainbow-paintbrush")),
    ).toMatchObject({ statut: "sur", jeu: { id: 7338 } });
    expect(
      rapprocher(["Art Academy: Atelier"], fixture("art-academy-atelier")),
    ).toMatchObject({ statut: "sur", jeu: { id: 21839 } });
  });

  it("marque « à vérifier » un titre seulement proche", () => {
    const r = rapprocher(["Wii Karaoke U"], fixture("wii-karaoke-u"));
    expect(r).toMatchObject({
      statut: "a-verifier",
      jeu: { id: 3107, name: "Wii Karaoke U by Joysound" },
    });
  });

  it("marque « introuvable » sans résultat proche, en gardant les candidats pour un choix à la main", () => {
    const r = rapprocher(["Jeu inconnu"], fixture("bayonetta-2"));
    expect(r.statut).toBe("introuvable");
    expect(r.jeu).toBeNull();
    expect(r.candidats.map((c) => c.id)).toContain(2135);
  });
});

describe("versInfosIgdb (R2) — titres et jaquettes par région", () => {
  it("lit le titre japonais et les jaquettes japonaise et européenne", () => {
    const fatalFrame = rapprocher(
      ["Fatal Frame: Maiden of Black Water"],
      fixture("project-zero-maiden-of-black-water"),
    ).jeu!;
    expect(versInfosIgdb(fatalFrame)).toEqual({
      igdbId: 51149,
      titreJaponais: "零 濡鴉ノ巫女",
      titreRomanise: "Fatal Frame: Maiden of Black Water",
      jaquettes: { JAP: "coc4a5", US: "co2zcv", PAL: "coc1qm" },
    });
  });

  it("prend la jaquette principale pour l'Amérique du Nord, et null quand IGDB n'a pas la région", () => {
    const kirby = rapprocher(
      ["Kirby and the Rainbow Curse"],
      fixture("kirby-and-the-rainbow-paintbrush"),
    ).jeu!;
    expect(versInfosIgdb(kirby)).toEqual({
      igdbId: 7338,
      titreJaponais: "タッチ！カービィ スーパーレインボー",
      titreRomanise: "Kirby and the Rainbow Curse",
      jaquettes: { JAP: null, US: "co1wcc", PAL: "cob8mp" },
    });
  });
});

describe("versInfosIgdb — forme romanisée", () => {
  it("préfère la romanisation connue d'IGDB au titre principal", () => {
    const zelda = rapprocher(
      ["Hyrule Warriors"],
      fixture("hyrule-warriors"),
    ).jeu!;
    expect(versInfosIgdb(zelda).titreRomanise).toBe("Zelda Musou");
  });
});

describe("urlImageIgdb", () => {
  it("donne l'adresse d'une jaquette en grande taille (528 × 748)", () => {
    expect(urlImageIgdb("co213q")).toBe(
      "https://images.igdb.com/igdb/image/upload/t_cover_big_2x/co213q.jpg",
    );
  });
});

describe("creerClientIgdb", () => {
  const reponse = (corps: unknown, ok = true, status = 200) =>
    ({
      ok,
      status,
      json: async () => corps,
      text: async () => JSON.stringify(corps),
    }) as Response;

  it("demande un jeton Twitch une seule fois, puis interroge IGDB sur la plateforme demandée", async () => {
    const appels: { url: string; init?: RequestInit }[] = [];
    const fetch = vi.fn(async (url: string, init?: RequestInit) => {
      appels.push({ url, init });
      return url.startsWith("https://id.twitch.tv")
        ? reponse({ access_token: "jeton", expires_in: 3600 })
        : reponse(fixture("splatoon"));
    });
    const client = creerClientIgdb({
      clientId: "id",
      clientSecret: "secret",
      fetch,
      pause: async () => {},
    });

    expect((await client.chercher("Splatoon", 41))[0]?.name).toBe("Splatoon");
    await client.chercher('Titre "entre guillemets"', 41);

    expect(
      appels.filter((a) => a.url.startsWith("https://id.twitch.tv")),
    ).toHaveLength(1);
    const igdb = appels.filter(
      (a) => a.url === "https://api.igdb.com/v4/games",
    );
    expect(igdb).toHaveLength(2);
    expect(igdb[0]!.init?.headers).toMatchObject({
      "Client-ID": "id",
      Authorization: "Bearer jeton",
    });
    expect(String(igdb[0]!.init?.body)).toContain("where platforms = (41)");
    expect(String(igdb[1]!.init?.body)).toContain(
      'search "Titre \\"entre guillemets\\""',
    );
  });

  it("lit plusieurs jeux par leurs identifiants en une seule requête", async () => {
    const corps: string[] = [];
    const fetch = vi.fn(async (url: string, init?: RequestInit) => {
      if (url.startsWith("https://id.twitch.tv"))
        return reponse({ access_token: "jeton", expires_in: 3600 });
      corps.push(String(init?.body));
      return reponse([]);
    });
    const client = creerClientIgdb({
      clientId: "id",
      clientSecret: "secret",
      fetch,
      pause: async () => {},
    });
    await client.parIds([2350, 7335]);
    expect(await client.parIds([])).toEqual([]);
    expect(corps).toHaveLength(1);
    expect(corps[0]).toContain("where id = (2350,7335); limit 2;");
  });

  it("échoue clairement si Twitch refuse les identifiants, sans les révéler", async () => {
    const fetch = vi.fn(async () =>
      reponse({ message: "invalid client secret" }, false, 403),
    );
    const client = creerClientIgdb({
      clientId: "id",
      clientSecret: "secret-a-ne-pas-montrer",
      fetch,
      pause: async () => {},
    });
    const erreur = await client.chercher("Splatoon", 41).catch((e: Error) => e);
    expect(String(erreur)).toMatch(/Twitch/);
    expect(String(erreur)).not.toContain("secret-a-ne-pas-montrer");
  });
});
