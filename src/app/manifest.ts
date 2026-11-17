import type { MetadataRoute } from "next";

/** Installation sur l'écran d'accueil de l'iPhone (US-15) : nom, couleurs et icône du site. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Nintendo DB",
    short_name: "Nintendo DB",
    description:
      "Les jeux Nintendo en boîte, version par version : jaquettes, titres et dates au Japon, en Amérique du Nord et en Europe.",
    start_url: "/",
    display: "standalone",
    background_color: "#f4f5f7",
    theme_color: "#2541b2",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
