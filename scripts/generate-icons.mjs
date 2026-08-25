/**
 * Generates every app icon from the vector artwork below.
 *
 *   node scripts/generate-icons.mjs
 *
 * Outputs:
 *   assets/icon.svg                     master artwork
 *   public/favicon.svg                  simplified favicon
 *   public/icons/icon-{192,512}.png     PWA icons
 *   public/icons/icon-maskable-{192,512}.png
 *   public/apple-touch-icon.png         180x180
 *
 * The artwork is deliberately font-free (the W is a stroked path) so it
 * renders identically in every rasterizer.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Resvg } from '@resvg/resvg-js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const GRADIENT = `
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#1ea7ec"/>
        <stop offset="1" stop-color="#075a97"/>
      </linearGradient>
      <radialGradient id="glow" cx="0.25" cy="0.2" r="0.9">
        <stop offset="0" stop-color="#ffffff" stop-opacity="0.28"/>
        <stop offset="0.55" stop-color="#ffffff" stop-opacity="0"/>
      </radialGradient>
    </defs>`;

/** Rounded-square background used by the regular (any) icons. */
function anyBackground() {
  return `<rect x="16" y="16" width="480" height="480" rx="112" fill="url(#bg)"/>`;
}

/** Full-bleed square background used by maskable icons. */
function maskableBackground() {
  return `<rect width="512" height="512" fill="url(#bg)"/>`;
}

/** Word-path motif: three tiles joined by a selection line, W on the middle tile. */
function motif() {
  const tiles = [
    { cx: 138, cy: 374 },
    { cx: 256, cy: 256 },
    { cx: 374, cy: 138 },
  ];
  const tileRects = tiles
    .map(
      (t) =>
        `<rect x="${t.cx - 59}" y="${t.cy - 59}" width="118" height="118" rx="24" fill="#f5f9fc"/>`,
    )
    .join('\n      ');
  // Selection path joining the tile centres (drawn beneath the tiles).
  const path = `M ${tiles[0].cx} ${tiles[0].cy} L ${tiles[1].cx} ${tiles[1].cy} L ${tiles[2].cx} ${tiles[2].cy}`;
  // Placeholder dots on the outer tiles ("more letters").
  const dots = [];
  for (const t of [tiles[0], tiles[2]]) {
    for (const dx of [-24, 0, 24]) {
      dots.push(`<circle cx="${t.cx + dx}" cy="${t.cy}" r="7.5" fill="#0b6aa8" opacity="0.55"/>`);
    }
  }
  // Bold W as a stroked zigzag on the middle tile.
  const w = `M ${256 - 34} ${256 - 26} L ${256 - 13} ${256 + 26} L 256 ${256 - 8} L ${256 + 13} ${256 + 26} L ${256 + 34} ${256 - 26}`;
  return `
    <g stroke-linecap="round" stroke-linejoin="round">
      <path d="${path}" stroke="#ffd23f" stroke-width="22" fill="none"/>
      ${tileRects}
      ${dots.join('\n      ')}
      <path d="${w}" stroke="#0b6aa8" stroke-width="15" fill="none"/>
    </g>`;
}

function anyIcon() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  ${GRADIENT}
  ${anyBackground()}
  <rect x="16" y="16" width="480" height="480" rx="112" fill="url(#glow)"/>
  ${motif()}
</svg>
`;
}

/** Maskable icons need the artwork inside the central 80% safe zone. */
function maskableIcon() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  ${GRADIENT}
  ${maskableBackground()}
  <rect width="512" height="512" fill="url(#glow)"/>
  <g transform="translate(256 256) scale(0.72) translate(-256 -256)">
    ${motif()}
  </g>
</svg>
`;
}

/** Minimal mark for tiny sizes: gradient tile with a single W. */
function favicon() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 512 512">
  ${GRADIENT}
  ${anyBackground()}
  <path d="M 148 190 L 205 330 L 256 216 L 307 330 L 364 190"
        stroke="#f5f9fc" stroke-width="46" stroke-linecap="round"
        stroke-linejoin="round" fill="none"/>
</svg>
`;
}

function renderPng(svg, size, outFile) {
  const png = new Resvg(svg, {
    fitTo: { mode: 'width', value: size },
  })
    .render()
    .asPng();
  const target = join(root, outFile);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, png);
  console.log(`wrote ${outFile}`);
}

writeFileSync(join(root, 'assets/icon.svg'), anyIcon());
console.log('wrote assets/icon.svg');
writeFileSync(join(root, 'public/favicon.svg'), favicon());
console.log('wrote public/favicon.svg');

const maskable = maskableIcon();
const any = anyIcon();
renderPng(any, 192, 'public/icons/icon-192.png');
renderPng(any, 512, 'public/icons/icon-512.png');
renderPng(maskable, 192, 'public/icons/icon-maskable-192.png');
renderPng(maskable, 512, 'public/icons/icon-maskable-512.png');
renderPng(favicon(), 180, 'public/apple-touch-icon.png');
