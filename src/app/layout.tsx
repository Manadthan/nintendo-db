import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import {
  NOM_SITE,
  OPEN_GRAPH_DE_BASE,
  URL_SITE,
} from "@/lib/referencement/referencement";
import { SCRIPT_THEME } from "@/lib/theme/theme";
import "./globals.css";

// Polices auto-hébergées par Next.js : aucune requête vers Google côté visiteur.
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-space-grotesk",
});

const DESCRIPTION =
  "Les jeux Nintendo en boîte, version par version : jaquettes, titres et dates au Japon, en Amérique du Nord et en Europe.";

export const metadata: Metadata = {
  // Base des adresses relatives (canoniques, aperçus de partage) : toujours le site de production.
  metadataBase: new URL(URL_SITE),
  title: NOM_SITE,
  description: DESCRIPTION,
  openGraph: {
    ...OPEN_GRAPH_DE_BASE,
    title: NOM_SITE,
    description: DESCRIPTION,
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  // Barre de Safari aux couleurs du thème (US-08).
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#252931" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    // data-theme est posé par le script avant React (thème forcé) : différence attendue à l'hydratation.
    <html
      lang="fr"
      className={`${inter.variable} ${spaceGrotesk.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* Avant le premier affichage : pas d'éclair blanc en thème sombre forcé (US-08). */}
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_THEME }} />
      </head>
      <body className="min-h-dvh font-sans antialiased">{children}</body>
    </html>
  );
}
