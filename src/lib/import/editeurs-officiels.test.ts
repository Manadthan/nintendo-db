import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  basesNintendo,
  editeOfficiellement,
  type DocEurope,
  type ItemJapon,
} from "./editeurs-officiels";
import { reduireBasePortable } from "./relais-portables";
import { reduireBaseSwitch } from "./relais-switch";

// Éditeur officiel quand GameTDB n'en donne pas (étape 22, SPEC v1.33, ADR-13) : extraits des bases de Nintendo
// Europe et Nintendo Japon du 20/11/2026.
const f = (n: string) =>
  JSON.parse(readFileSync(join(__dirname, "__fixtures__", n), "utf8"));
const europe: DocEurope[] = f("nintendo-europe.json");
const japon: ItemJapon[] = f("nintendo-japon.json");

describe("bases de code éditées par Nintendo", () => {
  it("Switch : Nintendo Europe (Fire Emblem: Three Houses) et Nintendo Japon (Pikmin 4, The Pokémon Company)", () => {
    const bases = basesNintendo("switch", europe, japon);
    expect([...bases.europe].sort()).toEqual(["AABP", "AH97", "ANVY"]);
    expect([...bases.japon].sort()).toEqual(["ALZL", "AMPY", "AQ2F"]);
  });

  it("3DS : identifiants de 4 caractères, base de 3 (Fire Emblem Fates, Shovel Knight au Japon)", () => {
    const bases = basesNintendo("3ds", europe, japon);
    expect([...bases.europe]).toEqual(["BFW"]);
    expect([...bases.japon]).toEqual(["AKS"]);
  });

  it("jamais un éditeur tiers (Ubisoft, Imagineer)", () => {
    const edite = editeOfficiellement(basesNintendo("switch", europe, japon));
    expect(edite("ACVK", "ALL")).toBe(false);
    expect(edite("BDWK", "ALL")).toBe(false);
  });

  it("la base japonaise ne vaut que pour une carte japonaise (Shovel Knight : Yacht Club hors du Japon)", () => {
    const edite = editeOfficiellement(basesNintendo("3ds", europe, japon));
    expect(edite("AKS", "NTSC-J")).toBe(true);
    expect(edite("AKS", "NTSC-U")).toBe(false);
    expect(edite("AKS", "PAL")).toBe(false);
  });
});

const jeuSwitch = (id: string, publisher: string, titre: string) =>
  `<game name="${titre}"><id>${id}</id><type>Switch</type><region>ALL</region><locale lang="EN"><title>${titre}</title></locale><publisher>${publisher}</publisher><genre>rpg</genre></game>`;

describe("relais : éditeur vide complété (ADR-13)", () => {
  const xml = `<?xml version="1.0" encoding="UTF-8"?><datafile><SwitchTDB version="1"/>
${jeuSwitch("ANVYA", "", "Fire Emblem: Three Houses")}
${jeuSwitch("ACVKA", "Ubisoft", "Rayman Legends: Definitive Edition")}
${jeuSwitch("ZZZZA", "", "Jeu inconnu")}
</datafile>`;

  it("Switch : une cartouche sans éditeur est gardée si Nintendo l'édite, avec l'éditeur « Nintendo »", () => {
    const { xml: reduite, disques } = reduireBaseSwitch(
      xml,
      editeOfficiellement(basesNintendo("switch", europe, japon)),
    );
    expect(disques.map((d) => d.id)).toEqual(["ANVYA", "ANVYA", "ANVYA"]);
    expect(reduite).toContain("<publisher>Nintendo</publisher>");
    expect(reduite).not.toContain("Rayman");
    expect(reduite).not.toContain("Jeu inconnu");
  });

  it("sans liste officielle, rien ne change (éditeur vide écarté)", () => {
    expect(reduireBaseSwitch(xml).disques).toEqual([]);
  });

  it("3DS : même règle (Shovel Knight, édité par Nintendo au Japon)", () => {
    const carte = (id: string, region: string) =>
      `<game name="Shovel Knight"><id>${id}</id><type>3DS</type><region>${region}</region><locale lang="EN"><title>Shovel Knight</title></locale><publisher></publisher><genre>platformer</genre></game>`;
    const xml3ds = `<?xml version="1.0" encoding="UTF-8"?><datafile><TDB3DS version="1"/>
${carte("AKSJ", "NTSC-J")}
${carte("AKSE", "NTSC-U")}
</datafile>`;
    const { xml: reduite, disques } = reduireBasePortable(
      "3ds",
      xml3ds,
      editeOfficiellement(basesNintendo("3ds", europe, japon)),
    );
    // Le jeu est gardé (édité par Nintendo au Japon) ; seule la carte japonaise reçoit l'éditeur « Nintendo ».
    expect(disques.map((d) => d.id)).toEqual(["AKSJ", "AKSE"]);
    expect(reduite.match(/<publisher>Nintendo<\/publisher>/g)).toHaveLength(1);
  });
});
