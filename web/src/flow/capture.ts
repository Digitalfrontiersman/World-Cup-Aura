// ─────────────────────────────────────────────────────────────────────────────
// Card capture + share-asset rendering. html2canvas can't handle flex gaps,
// background-clip:text, or 3D transforms, so we always screenshot a fixed
// 400×600 off-screen clone (never the live 3D card). The three share slides are
// drawn onto <canvas> from that base capture.
// ─────────────────────────────────────────────────────────────────────────────

import html2canvas from "html2canvas-pro";
import type { CardResult, ShareAssets } from "./types";

// Screenshot the off-screen capture clone at 2× into a canvas.
export async function captureCardCanvas(el: HTMLElement): Promise<HTMLCanvasElement> {
  await document.fonts.ready;
  return html2canvas(el, {
    scale: 2,
    useCORS: true,
    backgroundColor: null,
    width: 400,
    height: 600,
  });
}

export async function captureCardDataUrl(el: HTMLElement): Promise<string> {
  const canvas = await captureCardCanvas(el);
  return canvas.toDataURL("image/png");
}

// Build the three shareable PNGs (plain card, card + prophecy, 9:16 story) from
// a base card capture. Pure given the base canvas + card result.
export function buildShareAssets(base: HTMLCanvasElement, result: CardResult): ShareAssets {
  // --- Slide 1: Just the card ---
  const justDataUrl = base.toDataURL("image/png");

  // --- Slide 2: Card + prophecy overlay ---
  const pc = document.createElement("canvas");
  pc.width = base.width;
  pc.height = base.height;
  const pctx = pc.getContext("2d")!;
  pctx.drawImage(base, 0, 0);

  const W = pc.width;
  const H = pc.height;
  if (result.prophecy) {
    const grd = pctx.createLinearGradient(0, H * 0.56, 0, H);
    grd.addColorStop(0, "rgba(0,0,0,0)");
    grd.addColorStop(1, "rgba(0,0,0,0.9)");
    pctx.fillStyle = grd;
    pctx.fillRect(0, H * 0.56, W, H * 0.44);

    const fontSize = Math.max(14, Math.floor(W * 0.046));
    pctx.font = `italic ${fontSize}px Georgia, serif`;
    pctx.fillStyle = "rgba(255,255,255,0.93)";
    pctx.textAlign = "center";

    const words = result.prophecy.split(" ");
    const maxLineW = W * 0.84;
    const lineH = fontSize * 1.45;
    let line = "";
    const lines: string[] = [];
    for (const word of words) {
      const test = line + word + " ";
      if (pctx.measureText(test).width > maxLineW && line) {
        lines.push(line.trim());
        line = word + " ";
      } else {
        line = test;
      }
    }
    if (line.trim()) lines.push(line.trim());

    const textBlockH = lines.length * lineH;
    let ty = H * 0.82 - textBlockH / 2 + fontSize;
    for (const l of lines) {
      pctx.fillText(l, W / 2, ty);
      ty += lineH;
    }
  }
  const prophecyDataUrl = pc.toDataURL("image/png");

  // --- Slide 3: 9:16 Story format ---
  const SW = 1080;
  const SH = 1920;
  const sc = document.createElement("canvas");
  sc.width = SW;
  sc.height = SH;
  const sctx = sc.getContext("2d")!;

  const bgGrd = sctx.createLinearGradient(0, 0, 0, SH);
  bgGrd.addColorStop(0, "#050816");
  bgGrd.addColorStop(0.45, "#0c1a2e");
  bgGrd.addColorStop(1, "#050816");
  sctx.fillStyle = bgGrd;
  sctx.fillRect(0, 0, SW, SH);

  const glowGrd = sctx.createRadialGradient(SW / 2, SH / 2, 0, SW / 2, SH / 2, SW * 0.7);
  glowGrd.addColorStop(0, "rgba(251,191,36,0.1)");
  glowGrd.addColorStop(1, "rgba(0,0,0,0)");
  sctx.fillStyle = glowGrd;
  sctx.fillRect(0, 0, SW, SH);

  const cardAspect = base.width / base.height;
  const cW = SW * 0.8;
  const cH = cW / cardAspect;
  const cX = (SW - cW) / 2;
  const cY = (SH - cH) / 2;

  sctx.shadowColor = "rgba(251,191,36,0.4)";
  sctx.shadowBlur = 64;
  sctx.drawImage(base, cX, cY, cW, cH);
  sctx.shadowBlur = 0;
  sctx.shadowColor = "transparent";

  const fanName = (result.name || "Fan").toUpperCase();
  sctx.textAlign = "center";
  sctx.fillStyle = "rgba(251,191,36,0.95)";
  sctx.font = `900 ${Math.floor(SW * 0.056)}px sans-serif`;
  sctx.fillText(fanName, SW / 2, cY - SW * 0.04);

  sctx.fillStyle = "rgba(255,255,255,0.4)";
  sctx.font = `${Math.floor(SW * 0.036)}px sans-serif`;
  sctx.fillText("MY AURA CARD", SW / 2, cY + cH + SW * 0.065);

  const storyDataUrl = sc.toDataURL("image/png");

  return { just: justDataUrl, prophecy: prophecyDataUrl, story: storyDataUrl };
}
