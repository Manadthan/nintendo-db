// Fabrique l'icône d'écran d'accueil iPhone (US-15) : la cartouche du logo sur un carré bleu, 180 × 180.
// Usage : node scripts/icones.mjs → src/app/apple-icon.png (Next.js l'annonce de lui-même).
import sharp from "sharp";

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
<rect width="64" height="64" fill="#2541b2"/>
<g transform="translate(6.4 5.6) scale(.8)">
<path d="M12 8h34l6 6v40a3 3 0 0 1-3 3H15a3 3 0 0 1-3-3V11a3 3 0 0 1 3-3z" fill="#e9ebef"/>
<path d="M16 11.5h26M16 14.5h26" stroke="#0000002a" stroke-width="1.4"/>
<rect x="16" y="19" width="32" height="25" rx="2.5" fill="#2541b2"/>
<rect x="16" y="19" width="32" height="5" rx="2.5" fill="#e8b820"/><rect x="16" y="22" width="32" height="2" fill="#e8b820"/>
<path d="M22.5 28v11h3.2a5.5 5.5 0 0 0 0-11zM34.5 28v11h4.3a2.8 2.8 0 0 0 0-5.6h-4.3h3.8a2.7 2.7 0 0 0 0-5.4z" fill="none" stroke="#fff" stroke-width="2.6" stroke-linejoin="round"/>
<path d="M28.5 48.5l3.5 3.5 3.5-3.5" fill="none" stroke="#0000003a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</g></svg>`;

await sharp(Buffer.from(svg), { density: 300 }).resize(180, 180).png().toFile("src/app/apple-icon.png");
console.log("src/app/apple-icon.png");
