import { describe, expect, it } from "vitest";
import { adresseInterdite, telechargerImageExterne } from "./telecharger";

const publique = async () => ["93.184.216.34"];
const image = (corps = "img", entetes: Record<string, string> = {}) =>
  new Response(corps, {
    headers: { "content-type": "image/jpeg", ...entetes },
  });

describe("adresseInterdite (SSRF)", () => {
  it.each([
    "127.0.0.1",
    "10.1.2.3",
    "172.16.0.1",
    "192.168.1.10",
    "169.254.169.254",
    "100.64.0.1",
    "0.0.0.0",
    "::1",
    "fd00::1",
    "fe80::1",
    "::ffff:127.0.0.1",
  ])("refuse %s", (ip) => expect(adresseInterdite(ip)).toBe(true));

  it.each(["93.184.216.34", "2606:4700::1111", "172.32.0.1"])(
    "accepte %s",
    (ip) => expect(adresseInterdite(ip)).toBe(false),
  );
});

describe("telechargerImageExterne (US-12)", () => {
  it("télécharge une image publique", async () => {
    const r = await telechargerImageExterne("https://exemple.com/j.jpg", {
      resoudre: publique,
      fetch: async () => image("abc"),
    });
    expect(r.toString()).toBe("abc");
  });

  it("refuse une adresse interne, même atteinte par une redirection", async () => {
    await expect(
      telechargerImageExterne("http://localhost/j.jpg", {
        resoudre: async () => ["127.0.0.1"],
        fetch: async () => image(),
      }),
    ).rejects.toThrow("réseau interne");
    await expect(
      telechargerImageExterne("https://exemple.com/j.jpg", {
        resoudre: async (h) =>
          h === "exemple.com" ? ["93.184.216.34"] : ["10.0.0.1"],
        fetch: async () =>
          new Response(null, {
            status: 302,
            headers: { location: "http://interne.lan/x" },
          }),
      }),
    ).rejects.toThrow("réseau interne");
  });

  it("refuse les autres protocoles, ce qui n'est pas une image, et les images trop lourdes", async () => {
    await expect(telechargerImageExterne("file:///etc/passwd")).rejects.toThrow(
      "http(s)",
    );
    await expect(
      telechargerImageExterne("https://exemple.com/p.html", {
        resoudre: publique,
        fetch: async () =>
          new Response("<html>", { headers: { "content-type": "text/html" } }),
      }),
    ).rejects.toThrow("pas à une image");
    await expect(
      telechargerImageExterne("https://exemple.com/gros.jpg", {
        resoudre: publique,
        fetch: async () => image("x".repeat(9 * 1024 * 1024)),
      }),
    ).rejects.toThrow("trop lourde");
    await expect(telechargerImageExterne("pas une adresse")).rejects.toThrow(
      "invalide",
    );
  });
});
