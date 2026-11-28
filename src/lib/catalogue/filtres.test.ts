import { describe, expect, it, vi } from "vitest";
import { trier } from "./catalogue";
import {
  aUneImage,
  estItemAVenir,
  filtrerVisibilite,
  lireFiltres,
  memesFiltres,
  SANS_FILTRE,
  anneesProposees,
  avecFiltres,
  consolesProposees,
  filtrer,
  filtresDepuisParametres,
  developpeursProposes,
  genresProposes,
  nombreActifs,
  SANS_SERIE,
  seriesProposees,
  type ContexteFiltrage,
} from "./filtres";
import type {
  JeuCatalogue,
  PrecisionDate,
  SortieCatalogue,
  VersionAffichee,
} from "./types";

const CTX: ContexteFiltrage = { marche: "TOUS", aujourdhui: "2026-11-28" };

const sortie = (
  date: string | null,
  jaquette: string | null = date
    ? "00000000-0000-0000-0000-000000000001/pal-1"
    : null,
  precision: PrecisionDate | null = date ? "jour" : null,
): SortieCatalogue => ({
  sortie: date !== null || precision === "inconnue",
  titre: date || precision === "inconnue" ? "Titre" : null,
  titreRomanise: null,
  date,
  precision,
  jaquette,
});

const jeu = (
  slug: string,
  dates: [string | null, string | null, string | null],
  genres: string[],
  developpeur: string | null = null,
  series: string[] = [],
): JeuCatalogue => ({
  id: slug,
  slug,
  console: { slug: "wii-u", nom: "Wii U" },
  developpeur,
  metacritic: null,
  editeur: "Nintendo",
  genres,
  series,
  sorties: {
    JAP: sortie(dates[0]),
    US: sortie(dates[1]),
    PAL: sortie(dates[2]),
  },
});

const MK8 = jeu(
  "mario-kart-8",
  ["2014-05-29", "2014-05-30", "2014-05-30"],
  ["Course", "Party", "Karting"],
);
const KARAOKE = jeu(
  "wii-karaoke-u",
  ["2012-12-08", null, null],
  ["Musique", "Karaoké"],
);
const KIRBY = jeu(
  "kirby",
  ["2015-01-22", "2015-02-20", "2015-05-08"],
  ["Action", "Plates-formes"],
);
const SING = jeu("sing-party", [null, "2012-11-18", null], ["Musique"]);

const tous = trier([MK8, KARAOKE, KIRBY, SING], "anciens", "TOUS");
const slugs = (versions: ReturnType<typeof filtrer>) =>
  versions.map((v) => v.jeu.slug);

describe("filtrer (US-06)", () => {
  it("sans filtre, garde tout", () => {
    expect(filtrer(tous, SANS_FILTRE, CTX)).toHaveLength(4);
  });

  it("disponibilité : sorti dans les 3 régions", () => {
    expect(
      slugs(filtrer(tous, { ...SANS_FILTRE, disponibilite: "TOUTES" }, CTX)),
    ).toEqual(["mario-kart-8", "kirby"]);
  });

  it("disponibilité : exclusif à une région", () => {
    expect(
      slugs(filtrer(tous, { ...SANS_FILTRE, disponibilite: "JAP" }, CTX)),
    ).toEqual(["wii-karaoke-u"]);
    expect(
      slugs(filtrer(tous, { ...SANS_FILTRE, disponibilite: "US" }, CTX)),
    ).toEqual(["sing-party"]);
    expect(
      filtrer(tous, { ...SANS_FILTRE, disponibilite: "PAL" }, CTX),
    ).toEqual([]);
  });

  it("année : celle de la version affichée pour le marché choisi", () => {
    // Kirby : 2015 partout ; en « Tous », la version PAL (mai 2015).
    expect(
      slugs(filtrer(tous, { ...SANS_FILTRE, annee: "2015" }, CTX)),
    ).toEqual(["kirby"]);
    expect(
      slugs(filtrer(tous, { ...SANS_FILTRE, annee: "2012" }, CTX)),
    ).toEqual(["sing-party", "wii-karaoke-u"]);
  });

  it("genre : un des genres du jeu", () => {
    expect(
      slugs(filtrer(tous, { ...SANS_FILTRE, genre: "Musique" }, CTX)),
    ).toEqual(["sing-party", "wii-karaoke-u"]);
  });

  it("combine les filtres", () => {
    expect(
      slugs(
        filtrer(
          tous,
          {
            console: null,
            disponibilite: "JAP",
            annee: "2012",
            genre: "Musique",
            developpeur: null,
            serie: null,
            typeAmiibo: null,
            collection: null,
            inclureAVenir: false,
            inclureSansImage: false,
          },
          CTX,
        ),
      ),
    ).toEqual(["wii-karaoke-u"]);
    expect(
      filtrer(
        tous,
        {
          ...SANS_FILTRE,
          disponibilite: "TOUTES",
          genre: "Musique",
        },
        CTX,
      ),
    ).toEqual([]);
  });
});

describe("filtre Console (étape 8)", () => {
  const WII = {
    ...jeu(
      "mario-kart-wii",
      ["2008-04-10", "2008-04-27", "2008-04-11"],
      ["Course"],
    ),
    console: { slug: "wii", nom: "Wii" },
  };
  const avecWii = trier([MK8, WII, KIRBY], "anciens", "TOUS");

  it("ne garde que les jeux de la console choisie", () => {
    expect(
      slugs(filtrer(avecWii, { ...SANS_FILTRE, console: "wii" }, CTX)),
    ).toEqual(["mario-kart-wii"]);
    expect(
      slugs(filtrer(avecWii, { ...SANS_FILTRE, console: "wii-u" }, CTX)),
    ).toEqual(["mario-kart-8", "kirby"]);
  });

  it("propose les consoles qui ont des jeux, dans l'ordre chronologique, avec leur nombre", () => {
    const ordre = [
      { slug: "wii", nom: "Wii" },
      { slug: "wii-u", nom: "Wii U" },
      { slug: "switch", nom: "Switch" },
    ];
    expect(consolesProposees(avecWii, ordre)).toEqual([
      { slug: "wii", nom: "Wii", nombre: 1 },
      { slug: "wii-u", nom: "Wii U", nombre: 2 },
    ]);
  });

  it("se garde dans l'adresse (?console=wii) et ignore une valeur douteuse", () => {
    expect(avecFiltres("", { ...SANS_FILTRE, console: "wii" })).toBe(
      "?console=wii",
    );
    expect(filtresDepuisParametres("?console=wii").console).toBe("wii");
    expect(filtresDepuisParametres("?console=../x").console).toBeNull();
  });
});

describe("choix proposés", () => {
  it("années des versions affichées, dans l'ordre", () => {
    expect(anneesProposees(tous)).toEqual(["2012", "2014", "2015"]);
  });

  it("genres des jeux affichés, par ordre alphabétique français, sans doublon", () => {
    expect(genresProposes(tous)).toEqual([
      "Action",
      "Course",
      "Karaoké",
      "Karting",
      "Musique",
      "Party",
      "Plates-formes",
    ]);
  });

  it("compte les filtres actifs", () => {
    expect(nombreActifs(SANS_FILTRE)).toBe(0);
    expect(
      nombreActifs({ ...SANS_FILTRE, annee: "2014", genre: "Party" }),
    ).toBe(2);
    expect(
      nombreActifs({
        ...SANS_FILTRE,
        inclureAVenir: true,
        inclureSansImage: true,
      }),
    ).toBe(2);
  });
});

describe("filtres dans l'adresse (vue filtrée partageable)", () => {
  it("écrit les filtres en gardant la recherche et le marché", () => {
    expect(
      avecFiltres("?q=mario&marche=jap", {
        console: null,
        disponibilite: "JAP",
        annee: "2014",
        genre: "Plates-formes 3D",
        developpeur: "Nintendo EAD",
        serie: null,
        typeAmiibo: "figurine",
        collection: "manquants",
        inclureAVenir: true,
        inclureSansImage: true,
      }),
    ).toBe(
      "?q=mario&marche=jap&dispo=jap&annee=2014&genre=Plates-formes+3D&dev=Nintendo+EAD&type=figurine&collection=manquants&avenir=1&sans-image=1",
    );
  });

  it("retire un filtre effacé, et ne laisse pas de « ? » vide", () => {
    expect(avecFiltres("?q=mario&genre=Party", SANS_FILTRE)).toBe("?q=mario");
    expect(avecFiltres("?annee=2014", SANS_FILTRE)).toBe("");
    expect(avecFiltres("?voir=amiibo&type=carte", SANS_FILTRE)).toBe(
      "?voir=amiibo",
    );
    expect(avecFiltres("?avenir=1&sans-image=1", SANS_FILTRE)).toBe("");
  });

  it("relit les filtres, et ignore les valeurs inconnues", () => {
    expect(
      filtresDepuisParametres(
        "?dispo=toutes&annee=2014&genre=Plates-formes+3D&dev=Retro+Studios&type=Peluche&collection=possedes&avenir=1&sans-image=1",
      ),
    ).toEqual({
      console: null,
      disponibilite: "TOUTES",
      annee: "2014",
      genre: "Plates-formes 3D",
      developpeur: "Retro Studios",
      serie: null,
      typeAmiibo: "peluche",
      collection: "possedes",
      inclureAVenir: true,
      inclureSansImage: true,
    });
    expect(
      filtresDepuisParametres(
        "?dispo=mars&annee=hier&genre=&type=inconnu&collection=tout&avenir=oui&sans-image=0",
      ),
    ).toEqual(SANS_FILTRE);
  });
});

describe("filtre Développeur (#89)", () => {
  const DKC = jeu(
    "dkc",
    ["2014-02-13", "2014-02-21", "2014-02-21"],
    [],
    "Retro Studios",
  );
  const SPLATOON = jeu(
    "splatoon",
    ["2015-05-28", "2015-05-29", "2015-05-29"],
    [],
    "Nintendo EAD",
  );
  const KIRBY2 = jeu(
    "kirby-2",
    ["2015-01-22", "2015-02-20", "2015-05-08"],
    [],
    "HAL Laboratory",
  );
  const POKKEN = jeu(
    "pokken",
    ["2016-03-18", "2016-03-18", "2016-03-18"],
    [],
    "Bandai Namco Studios, The Pokémon Company",
  );
  const versions = trier([DKC, SPLATOON, KIRBY2, POKKEN], "anciens", "TOUS");

  it("un studio, quelle que soit sa graphie dans l'adresse", () => {
    expect(
      slugs(
        filtrer(
          versions,
          { ...SANS_FILTRE, developpeur: "retro studios" },
          CTX,
        ),
      ),
    ).toEqual(["dkc"]);
    expect(
      slugs(
        filtrer(
          versions,
          {
            ...SANS_FILTRE,
            developpeur: "The Pokémon Company",
          },
          CTX,
        ),
      ),
    ).toEqual(["pokken"]);
  });

  it("Nintendo (first party) : divisions de Nintendo et filiales, pas HAL", () => {
    expect(
      slugs(
        filtrer(
          versions,
          {
            ...SANS_FILTRE,
            developpeur: "Nintendo (first party)",
          },
          CTX,
        ),
      ),
    ).toEqual(["dkc", "splatoon"]);
  });

  it("liste proposée : first party en tête, puis les studios avec leur nombre de jeux", () => {
    expect(developpeursProposes(versions)).toEqual([
      { nom: "Nintendo (first party)", nombre: 2 },
      { nom: "Bandai Namco Studios", nombre: 1 },
      { nom: "HAL Laboratory", nombre: 1 },
      { nom: "Nintendo EAD", nombre: 1 },
      { nom: "Retro Studios", nombre: 1 },
      { nom: "The Pokémon Company", nombre: 1 },
    ]);
  });
});

describe("filtre Série (SPEC v1.37)", () => {
  const DR = jeu(
    "dr-mario",
    ["1990-07-27", "1990-10-01", "1990-12-01"],
    [],
    null,
    ["Dr. Mario", "Mario"],
  );
  const MK = jeu(
    "mario-kart-8",
    ["2014-05-29", "2014-05-30", "2014-05-30"],
    [],
    null,
    ["Mario", "Mario Kart"],
  );
  const STEEL = jeu(
    "steel-diver",
    ["2011-02-26", "2011-03-22", "2011-05-06"],
    [],
  );
  const versions = trier([DR, MK, STEEL], "anciens", "TOUS");
  const slugs = (serie: string) =>
    filtrer(versions, { ...SANS_FILTRE, serie }, CTX).map((v) => v.jeu.slug);

  it("un jeu apparaît sous chacune de ses séries", () => {
    expect(slugs("Mario")).toEqual(["dr-mario", "mario-kart-8"]);
    expect(slugs("Dr. Mario")).toEqual(["dr-mario"]);
  });

  it("« Sans série » montre les jeux qui n'en ont pas", () => {
    expect(slugs(SANS_SERIE)).toEqual(["steel-diver"]);
  });

  it("liste proposée : ordre alphabétique avec le nombre de jeux, puis « Sans série »", () => {
    expect(seriesProposees(versions)).toEqual([
      { nom: "Dr. Mario", nombre: 1 },
      { nom: "Mario", nombre: 2 },
      { nom: "Mario Kart", nombre: 1 },
      { nom: SANS_SERIE, nombre: 1 },
    ]);
  });

  it("lu et écrit dans l'adresse (?serie=)", () => {
    expect(filtresDepuisParametres("?serie=Dr.+Mario").serie).toBe("Dr. Mario");
    expect(avecFiltres("", { ...SANS_FILTRE, serie: "Mario Kart" })).toBe(
      "?serie=Mario+Kart",
    );
  });
});

describe("coches « Déjà sortis uniquement » et « Avec image uniquement » (US-06, US-32, SPEC v1.55)", () => {
  const JEU_SORTI = MK8;
  const JEU_SANS_IMAGE: JeuCatalogue = {
    ...jeu("sans-jaquette", ["2014-05-29", "2014-05-30", "2014-05-30"], []),
    sorties: {
      JAP: sortie("2014-05-29", null),
      US: sortie("2014-05-30", null),
      PAL: sortie("2014-05-30", null),
    },
  };
  const JEU_A_VENIR: JeuCatalogue = {
    ...jeu("metroid-prime-5", ["2027-03-01", "2027-03-01", "2027-03-01"], []),
    sorties: {
      JAP: sortie(
        "2027-03-01",
        "00000000-0000-0000-0000-000000000002/jap-1",
        "saison",
      ),
      US: sortie(
        "2027-03-01",
        "00000000-0000-0000-0000-000000000002/us-1",
        "saison",
      ),
      PAL: sortie(
        "2027-03-01",
        "00000000-0000-0000-0000-000000000002/pal-1",
        "saison",
      ),
    },
  };
  const JEU_A_VENIR_SANS_IMAGE: JeuCatalogue = {
    ...jeu("date-inconnue", [null, null, null], []),
    sorties: {
      JAP: sortie(null, null, null),
      US: sortie(null, null, null),
      PAL: sortie(null, null, "inconnue"),
    },
  };
  // Sorti au Japon, encore à venir en Europe : déjà sorti sur « Tous » et « JAP », à venir sur « PAL ».
  const JEU_SORTI_JAP_SEUL: JeuCatalogue = {
    ...jeu("sorti-jap", ["2026-01-15", null, "2027-06-01"], []),
    sorties: {
      JAP: sortie("2026-01-15", "00000000-0000-0000-0000-000000000003/jap-1"),
      US: sortie(null, null, null),
      PAL: sortie("2027-06-01", "00000000-0000-0000-0000-000000000003/pal-1"),
    },
  };

  const versions = trier(
    [JEU_SORTI, JEU_SANS_IMAGE, JEU_A_VENIR, JEU_A_VENIR_SANS_IMAGE],
    "anciens",
    "TOUS",
  );

  it("par défaut, masque les jeux à venir et les jeux sans image", () => {
    expect(slugs(filtrer(versions, SANS_FILTRE, CTX))).toEqual([
      "mario-kart-8",
    ]);
  });

  it("inclureAVenir affiche les jeux à venir ayant une image", () => {
    expect(
      slugs(filtrer(versions, { ...SANS_FILTRE, inclureAVenir: true }, CTX)),
    ).toEqual(["mario-kart-8", "metroid-prime-5"]);
  });

  it("inclureSansImage affiche les jeux déjà sortis sans image", () => {
    expect(
      slugs(filtrer(versions, { ...SANS_FILTRE, inclureSansImage: true }, CTX)),
    ).toEqual(["mario-kart-8", "sans-jaquette"]);
  });

  it("décocher les deux réaffiche tout", () => {
    expect(
      slugs(
        filtrer(
          versions,
          { ...SANS_FILTRE, inclureAVenir: true, inclureSansImage: true },
          CTX,
        ),
      ),
    ).toEqual([
      "mario-kart-8",
      "sans-jaquette",
      "metroid-prime-5",
      "date-inconnue",
    ]);
  });

  it("respecte le marché : un jeu sorti au Japon et à venir en Europe est masqué sur PAL, gardé sur Tous et Japon", () => {
    const surTous = trier([JEU_SORTI_JAP_SEUL], "anciens", "TOUS");
    const surPal = trier([JEU_SORTI_JAP_SEUL], "anciens", "PAL");
    const surJap = trier([JEU_SORTI_JAP_SEUL], "anciens", "JAP");
    expect(estItemAVenir(surTous[0]!, "TOUS", CTX.aujourdhui)).toBe(false);
    expect(estItemAVenir(surPal[0]!, "PAL", CTX.aujourdhui)).toBe(true);
    expect(estItemAVenir(surJap[0]!, "JAP", CTX.aujourdhui)).toBe(false);
    expect(filtrer(surTous, SANS_FILTRE, CTX)).toHaveLength(1);
    expect(
      filtrer(surPal, SANS_FILTRE, {
        marche: "PAL",
        aujourdhui: CTX.aujourdhui,
      }),
    ).toHaveLength(0);
    expect(
      filtrer(
        surPal,
        { ...SANS_FILTRE, inclureAVenir: true },
        { marche: "PAL", aujourdhui: CTX.aujourdhui },
      ),
    ).toHaveLength(1);
  });

  it("s'applique aussi aux guides (couverture) et aux amiibo (photo + date)", () => {
    const guideAvec: VersionAffichee = {
      jeu: { ...MK8, id: "guide:9784000000001" },
      region: "JAP",
      sortie: sortie("2014-06-01", null, "mois"),
      guide: {
        id: "g1",
        isbn: "9784000000001",
        editeur: "KADOKAWA",
        couverture: { source: "amazon", chemin: "9784000000001-1.webp" },
      },
    };
    const guideSans: VersionAffichee = {
      ...guideAvec,
      jeu: { ...MK8, id: "guide:9784000000002" },
      guide: {
        ...guideAvec.guide!,
        id: "g2",
        isbn: "9784000000002",
        couverture: null,
      },
    };
    const guideFutur: VersionAffichee = {
      ...guideAvec,
      jeu: { ...MK8, id: "guide:9784000000003" },
      sortie: sortie("2027-02-01", null, "mois"),
      guide: { ...guideAvec.guide!, id: "g3", isbn: "9784000000003" },
    };
    const amiiboAvec: VersionAffichee = {
      jeu: { ...MK8, id: "amiibo:mario" },
      region: "PAL",
      sortie: sortie("2015-05-29", null),
      amiibo: {
        id: "a1",
        slug: "mario",
        type: "figurine",
        serieAmiibo: "Mario",
        image: "00000000-0000-0000-0000-000000000010/figurine-1",
        consoles: ["wii-u"],
      },
    };
    const amiiboSans: VersionAffichee = {
      ...amiiboAvec,
      jeu: { ...MK8, id: "amiibo:luigi" },
      amiibo: { ...amiiboAvec.amiibo!, id: "a2", slug: "luigi", image: null },
    };
    const amiiboFutur: VersionAffichee = {
      ...amiiboAvec,
      jeu: { ...JEU_A_VENIR, id: "amiibo:samus" },
      sortie: sortie("2027-03-01", null, "saison"),
      amiibo: { ...amiiboAvec.amiibo!, id: "a3", slug: "samus" },
    };

    expect(aUneImage(guideAvec)).toBe(true);
    expect(aUneImage(guideSans)).toBe(false);
    expect(aUneImage(amiiboAvec)).toBe(true);
    expect(aUneImage(amiiboSans)).toBe(false);

    const meles = [
      guideAvec,
      guideSans,
      guideFutur,
      amiiboAvec,
      amiiboSans,
      amiiboFutur,
    ];
    expect(
      filtrerVisibilite(meles, SANS_FILTRE, CTX).map((v) => v.jeu.id),
    ).toEqual(["guide:9784000000001", "amiibo:mario"]);
    expect(
      filtrerVisibilite(
        meles,
        { inclureAVenir: true, inclureSansImage: false },
        CTX,
      ).map((v) => v.jeu.id),
    ).toEqual([
      "guide:9784000000001",
      "guide:9784000000003",
      "amiibo:mario",
      "amiibo:samus",
    ]);
    expect(
      filtrerVisibilite(
        meles,
        { inclureAVenir: false, inclureSansImage: true },
        CTX,
      ).map((v) => v.jeu.id),
    ).toEqual([
      "guide:9784000000001",
      "guide:9784000000002",
      "amiibo:mario",
      "amiibo:luigi",
    ]);
  });
});

describe("filtres mémorisés (audit de performance, B)", () => {
  it("compare deux jeux de filtres champ par champ", () => {
    expect(memesFiltres(SANS_FILTRE, { ...SANS_FILTRE })).toBe(true);
    expect(memesFiltres(SANS_FILTRE, { ...SANS_FILTRE, annee: "2015" })).toBe(
      false,
    );
    expect(
      memesFiltres(SANS_FILTRE, { ...SANS_FILTRE, inclureAVenir: true }),
    ).toBe(false);
  });

  it("garde le même objet quand seule la recherche (?q=) change", () => {
    const lire = (adresse: string) => {
      vi.stubGlobal("window", { location: { search: adresse } });
      return lireFiltres();
    };
    const avant = lire("?console=wii-u&q=m");
    expect(lire("?console=wii-u&q=ma")).toBe(avant);
    const autre = lire("?console=wii&q=ma");
    expect(autre).not.toBe(avant);
    expect(autre.console).toBe("wii");
    vi.unstubAllGlobals();
  });

  it("lit et sérialise ?collection=souhaits", () => {
    const f = filtresDepuisParametres("?collection=souhaits");
    expect(f.collection).toBe("souhaits");
    expect(nombreActifs(f)).toBe(1);
    expect(avecFiltres("", f)).toBe("?collection=souhaits");
  });
});
