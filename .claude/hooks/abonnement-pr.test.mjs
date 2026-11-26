import { describe, expect, it } from "vitest";
import { DELAI_MS, numeroCree, refusAbonnement } from "./abonnement-pr.mjs";

// Erreur réelle du 26/11/2026 : PR créée #289 (adresse renvoyée), abonnement envoyé en parallèle à #288.
const MAINTENANT = 1_000_000_000;

describe("numeroCree", () => {
  it("lit le numéro dans l'adresse renvoyée par create_pull_request", () => {
    expect(
      numeroCree({
        id: "5506938841",
        url: "https://github.com/Manadthan/nintendo-db/pull/289",
      }),
    ).toBe(289);
    expect(
      numeroCree([
        {
          type: "text",
          text: '{"id":"5507441370","url":"https://github.com/Manadthan/nintendo-db/pull/295"}',
        },
      ]),
    ).toBe(295);
    expect(numeroCree({ erreur: "Validation Failed" })).toBeNull();
  });
});

describe("refusAbonnement", () => {
  it("refuse le numéro deviné du 26/11 (#288 au lieu de #289)", () => {
    expect(
      refusAbonnement({ numero: 289, le: MAINTENANT - 5000 }, 288, MAINTENANT),
    ).toMatch(/#289/);
  });

  it("refuse l'abonnement envoyé pendant que la création est en cours (appels en parallèle)", () => {
    expect(
      refusAbonnement(
        { enCours: true, le: MAINTENANT - 1000 },
        288,
        MAINTENANT,
      ),
    ).toMatch(/en cours/);
  });

  it("accepte le numéro de la PR créée", () => {
    expect(
      refusAbonnement({ numero: 289, le: MAINTENANT - 5000 }, 289, MAINTENANT),
    ).toBeNull();
  });

  it("sans création récente, laisse suivre n'importe quelle PR", () => {
    expect(refusAbonnement(null, 120, MAINTENANT)).toBeNull();
    expect(
      refusAbonnement(
        { numero: 289, le: MAINTENANT - DELAI_MS - 1 },
        120,
        MAINTENANT,
      ),
    ).toBeNull();
  });
});
