import { describe, expect, it } from "vitest";
import { aCookieDeSession } from "@/lib/supabase/navigateur";

describe("aCookieDeSession (audit de performance)", () => {
  it("reconnaît le cookie de session de Supabase, entier ou découpé", () => {
    expect(aCookieDeSession("sb-abcd-auth-token=base64-xyz")).toBe(true);
    expect(
      aCookieDeSession(
        "theme=sombre; sb-abcd-auth-token.0=base64-x; sb-abcd-auth-token.1=y",
      ),
    ).toBe(true);
  });

  it("ignore les autres cookies : un visiteur ne télécharge pas la bibliothèque", () => {
    expect(aCookieDeSession("")).toBe(false);
    expect(aCookieDeSession("theme=sombre; marche=PAL")).toBe(false);
    expect(aCookieDeSession("sb-abcd-auth-token-code-verifier=z")).toBe(false);
  });
});
