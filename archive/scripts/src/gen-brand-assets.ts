import { Resvg } from "@resvg/resvg-js";
import sharp from "sharp";
import { writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = resolve(__dirname, "../../artifacts/aura-card/public");

function svgToPng(svg: string, width: number, height: number): Buffer {
  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: width },
  });
  const rendered = resvg.render();
  return Buffer.from(rendered.asPng());
}

// ─── Favicon / Apple Touch Icon SVG (gold orb on navy) ──────────────────────

function makeOrbSvg(size: number): string {
  const cx = size / 2;
  const cy = size / 2;
  const rx = Math.round(size * 0.2);
  const r_outer = Math.round(size * 0.42);
  const r_mid = Math.round(size * 0.32);
  const r_core = Math.round(size * 0.23);
  const r_ring = Math.round(size * 0.28);
  const r_hl = Math.round(size * 0.072);
  const hl_x = Math.round(cx - size * 0.078);
  const hl_y = Math.round(cy - size * 0.088);

  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" rx="${rx}" fill="#050816"/>
  <circle cx="${cx}" cy="${cy}" r="${r_outer}" fill="url(#outerGlow)" opacity="0.35"/>
  <circle cx="${cx}" cy="${cy}" r="${r_mid}" fill="url(#midGlow)" opacity="0.55"/>
  <circle cx="${cx}" cy="${cy}" r="${r_core}" fill="url(#coreGrad)"/>
  <circle cx="${cx}" cy="${cy}" r="${r_ring}" fill="none" stroke="#3b82f6" stroke-width="${Math.max(1, Math.round(size * 0.008))}" opacity="0.3"/>
  <circle cx="${hl_x}" cy="${hl_y}" r="${r_hl}" fill="url(#highlight)" opacity="0.5"/>
  <defs>
    <radialGradient id="outerGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#fbbf24"/>
      <stop offset="55%" stop-color="#f59e0b" stop-opacity="0.4"/>
      <stop offset="100%" stop-color="#050816" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="midGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#fde68a"/>
      <stop offset="45%" stop-color="#f59e0b"/>
      <stop offset="100%" stop-color="#92400e" stop-opacity="0.2"/>
    </radialGradient>
    <radialGradient id="coreGrad" cx="40%" cy="36%" r="60%">
      <stop offset="0%" stop-color="#fef3c7"/>
      <stop offset="30%" stop-color="#fbbf24"/>
      <stop offset="70%" stop-color="#d97706"/>
      <stop offset="100%" stop-color="#78350f"/>
    </radialGradient>
    <radialGradient id="highlight" cx="30%" cy="30%" r="70%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.85"/>
      <stop offset="100%" stop-color="#fbbf24" stop-opacity="0"/>
    </radialGradient>
  </defs>
</svg>`;
}

// ─── OG Image SVG (1200×630) ─────────────────────────────────────────────────

function makeOgSvg(): string {
  const W = 1200;
  const H = 630;

  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="${W}" height="${H}" fill="#050816"/>

  <!-- Subtle grid lines -->
  <line x1="0" y1="210" x2="${W}" y2="210" stroke="#ffffff" stroke-opacity="0.04" stroke-width="1"/>
  <line x1="0" y1="420" x2="${W}" y2="420" stroke="#ffffff" stroke-opacity="0.04" stroke-width="1"/>
  <line x1="400" y1="0" x2="400" y2="${H}" stroke="#ffffff" stroke-opacity="0.04" stroke-width="1"/>
  <line x1="800" y1="0" x2="800" y2="${H}" stroke="#ffffff" stroke-opacity="0.04" stroke-width="1"/>

  <!-- Right side gold orb glow (large, atmospheric) -->
  <circle cx="920" cy="315" r="340" fill="url(#bgGlow)" opacity="0.6"/>

  <!-- Orb outer ring -->
  <circle cx="920" cy="315" r="200" fill="url(#orbOuter)" opacity="0.45"/>

  <!-- Orb mid -->
  <circle cx="920" cy="315" r="145" fill="url(#orbMid)" opacity="0.65"/>

  <!-- Orb core -->
  <circle cx="920" cy="315" r="100" fill="url(#orbCore)"/>

  <!-- Blue accent ring -->
  <circle cx="920" cy="315" r="168" fill="none" stroke="#3b82f6" stroke-width="2" opacity="0.35"/>

  <!-- Orb highlight -->
  <circle cx="878" cy="272" r="38" fill="url(#orbHl)" opacity="0.5"/>

  <!-- Left content area -->
  <!-- Eyebrow: WORLD CUP 2026 -->
  <text x="80" y="222" font-family="system-ui, -apple-system, sans-serif" font-size="28" font-weight="700" letter-spacing="6" fill="#fbbf24" opacity="0.9">WORLD CUP 2026</text>

  <!-- Main headline: World Cup Aura -->
  <text x="76" y="330" font-family="system-ui, -apple-system, sans-serif" font-size="96" font-weight="900" fill="url(#headlineGrad)">World Cup</text>
  <text x="76" y="430" font-family="system-ui, -apple-system, sans-serif" font-size="96" font-weight="900" fill="url(#headlineGrad)">Aura</text>

  <!-- Subline -->
  <text x="80" y="502" font-family="system-ui, -apple-system, sans-serif" font-size="30" font-weight="400" fill="#cbd5e1">Create your Aura Card and discover your</text>
  <text x="80" y="542" font-family="system-ui, -apple-system, sans-serif" font-size="30" font-weight="400" fill="#cbd5e1">football energy for the world stage.</text>

  <!-- Decorative gold line under eyebrow -->
  <rect x="80" y="234" width="180" height="3" rx="1.5" fill="#fbbf24" opacity="0.7"/>

  <defs>
    <radialGradient id="bgGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#fbbf24"/>
      <stop offset="60%" stop-color="#f59e0b" stop-opacity="0.2"/>
      <stop offset="100%" stop-color="#050816" stop-opacity="0"/>
    </radialGradient>

    <radialGradient id="orbOuter" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#fbbf24"/>
      <stop offset="55%" stop-color="#f59e0b" stop-opacity="0.4"/>
      <stop offset="100%" stop-color="#050816" stop-opacity="0"/>
    </radialGradient>

    <radialGradient id="orbMid" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#fde68a"/>
      <stop offset="45%" stop-color="#f59e0b"/>
      <stop offset="100%" stop-color="#92400e" stop-opacity="0.2"/>
    </radialGradient>

    <radialGradient id="orbCore" cx="40%" cy="36%" r="60%">
      <stop offset="0%" stop-color="#fef3c7"/>
      <stop offset="30%" stop-color="#fbbf24"/>
      <stop offset="70%" stop-color="#d97706"/>
      <stop offset="100%" stop-color="#78350f"/>
    </radialGradient>

    <radialGradient id="orbHl" cx="30%" cy="30%" r="70%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.85"/>
      <stop offset="100%" stop-color="#fbbf24" stop-opacity="0"/>
    </radialGradient>

    <linearGradient id="headlineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#fef3c7"/>
      <stop offset="40%" stop-color="#fbbf24"/>
      <stop offset="100%" stop-color="#d97706"/>
    </linearGradient>
  </defs>
</svg>`;
}

// ─── Generate files ───────────────────────────────────────────────────────────

async function main() {
  console.log("Generating brand assets…");

  // Apple touch icon (180×180)
  const appleSvg = makeOrbSvg(180);
  const applePng = svgToPng(appleSvg, 180, 180);
  writeFileSync(resolve(publicDir, "apple-touch-icon.png"), applePng);
  console.log("✓ apple-touch-icon.png");

  // OG image PNG (1200×630)
  const ogSvg = makeOgSvg();
  const ogPng = svgToPng(ogSvg, 1200, 630);
  writeFileSync(resolve(publicDir, "og-image.png"), ogPng);
  console.log("✓ og-image.png");

  // OG image JPEG (1200×630, quality 92)
  const ogJpg = await sharp(ogPng)
    .jpeg({ quality: 92, mozjpeg: true })
    .toBuffer();
  writeFileSync(resolve(publicDir, "opengraph.jpg"), ogJpg);
  console.log("✓ opengraph.jpg");

  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
