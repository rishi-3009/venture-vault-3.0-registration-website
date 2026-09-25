"use client";

import { useEffect, useRef } from "react";

// Pixel-art Mario sprites drawn on top of the portrait hero background
// (public/hero-bg-mobile-v2.jpg). Every sprite is a small grid of letters, one
// letter per NES pixel, looked up in its palette; a space is transparent.
//
// Positions below are in the background image's own pixels (1080 x 1920),
// then mapped to the screen the same way CSS `object-cover` maps the image —
// so sprites stay glued to the ledge/ground whatever the phone's shape.

const BG_W = 1080;
const BG_H = 1920;

// Size of one NES pixel, in background-image pixels. Blocks match the
// ledge's own bricks (16 NES px = ~93 image px); characters are drawn a bit
// smaller so big Mario still has room to jump under the "?" block.
const BLOCK_PX = 5.8;
const CHAR_PX = 4.8;

// Scene layout, in background-image pixels.
const LEDGE_TOP = 1386; // top edge of the floating brick ledge
const GROUND_TOP = 1786; // top edge of the ground bricks
const QBLOCK_X = 345; // "?" block left edge
const QBLOCK_Y = 1068; // "?" block top edge
const MUSHROOM_X = 245;
const MARIO_START_X = 20;
const GOOMBA_MIN_X = 425; // just right of the pipe
const GOOMBA_MAX_X = 690; // before the hill
const GOOMBA_SPEED = 55; // image px per second

const SMALL_MARIO = {
  palette: { R: "#b53120", B: "#6b6d00", S: "#ea9e22" },
  frames: [
    [
      "   RRRRR    ",
      "  RRRRRRRRR ",
      "  BBBSSBS   ",
      " BSBSSSBSSS ",
      " BSBBSSSBSSS",
      " BBSSSSBBBB ",
      "   SSSSSSS  ",
      "  BBRBBB    ",
      " BBBRBBRBBB ",
      "BBBBRRRRBBBB",
      "SSBRSRRSRBSS",
      "SSSRRRRRRSSS",
      "SSRRRRRRRRSS",
      "  RRR  RRR  ",
      " BBB    BBB ",
      "BBBB    BBBB",
    ],
    // Walking: same body, legs mid-stride.
    [
      "   RRRRR    ",
      "  RRRRRRRRR ",
      "  BBBSSBS   ",
      " BSBSSSBSSS ",
      " BSBBSSSBSSS",
      " BBSSSSBBBB ",
      "   SSSSSSS  ",
      "  BBRBBB    ",
      " BBBRBBRBBB ",
      "BBBBRRRRBBBB",
      "SSBRSRRSRBSS",
      "SSSRRRRRRSSS",
      " SRRRRRRRRS ",
      "  RRRRRRR   ",
      "  BBBBBBB   ",
      "   BBB BBB  ",
    ],
  ],
};

const MUSHROOM = {
  palette: { R: "#d82800", W: "#fcfcfc", S: "#fcd8a8", K: "#000000" },
  frames: [
    [
      "      RRRR      ",
      "    RRWWWWRR    ",
      "   RWWWWWWWWR   ",
      "  RRWWWWWWWWRR  ",
      " RRRRWWWWWWRRRR ",
      " RWWRRRRRRRRWWR ",
      "RWWWWRRRRRRWWWWR",
      "RWWWWRRRRRRWWWWR",
      "RWWWWRRRRRRWWWWR",
      "RRWWRRRRRRRRWWRR",
      " RRSSKSSSSKSSRR ",
      "  SSSKSSSSKSSS  ",
      "  SSSKSSSSKSSS  ",
      "  SSSSSSSSSSSS  ",
      "   SSSSSSSSSS   ",
      "    SSSSSSSS    ",
    ],
  ],
};

const GOOMBA = {
  palette: { B: "#9c4a00", T: "#f0d0b0", K: "#000000" },
  frames: [
    [
      "      BBBB      ",
      "     BBBBBB     ",
      "    BBBBBBBB    ",
      "   BKKBBBBKKB   ",
      "  BBBTKBBKTBBB  ",
      "  BBBTKKKKTBBB  ",
      " BBBBTKBBKTBBBB ",
      "BBBBBTTBBTTBBBBB",
      "BBBBBBBBBBBBBBBB",
      "BBBBTTTTTTTTBBBB",
      "    TTTTTTTT    ",
      "    TTTTTTTT    ",
      "   KKTTTTTTKK   ",
      "  KKKKTTTTKKKK  ",
      "  KKKKK  KKKKK  ",
      "   KKK    KKK   ",
    ],
  ],
};

const COIN = {
  palette: { Y: "#fcbc3c", W: "#fcfcfc", O: "#c86c0c" },
  frames: [
    [
      "  YYYY  ",
      " YYWWYY ",
      "YYWYYOYY",
      "YYWYYOYY",
      "YYWYYOYY",
      "YYWYYOYY",
      "YYWYYOYY",
      "YYWYYOYY",
      "YYWYYOYY",
      "YYWYYOYY",
      "YYWYYOYY",
      "YYWYYOYY",
      " YYOOYY ",
      "  YYYY  ",
    ],
  ],
};

const QBLOCK = {
  palette: { O: "#f8a848", D: "#8c3c10", K: "#000000", U: "#9c4a00" },
  frames: [
    // Unhit "?" block.
    [
      " DDDDDDDDDDDDDD ",
      "DOOOOOOOOOOOOOOD",
      "DOKOOOOOOOOOOKOD",
      "DOOOOODDDDOOOOOD",
      "DOOOODDOODDOOOOD",
      "DOOOODDOODDOOOOD",
      "DOOOOOOOODDOOOOD",
      "DOOOOOOODDOOOOOD",
      "DOOOOOODDOOOOOOD",
      "DOOOOOODDOOOOOOD",
      "DOOOOOOOOOOOOOOD",
      "DOOOOOODDOOOOOOD",
      "DOOOOOODDOOOOOOD",
      "DOKOOOOOOOOOOKOD",
      "DOOOOOOOOOOOOOOD",
      " DDDDDDDDDDDDDD ",
    ],
    // Used (empty) block, after Mario hits it.
    [
      " KKKKKKKKKKKKKK ",
      "KUUUUUUUUUUUUUUK",
      "KUKUUUUUUUUUUKUK",
      "KUUUUUUUUUUUUUUK",
      "KUUUUUUUUUUUUUUK",
      "KUUUUUUUUUUUUUUK",
      "KUUUUUUUUUUUUUUK",
      "KUUUUUUUUUUUUUUK",
      "KUUUUUUUUUUUUUUK",
      "KUUUUUUUUUUUUUUK",
      "KUUUUUUUUUUUUUUK",
      "KUUUUUUUUUUUUUUK",
      "KUUUUUUUUUUUUUUK",
      "KUKUUUUUUUUUUKUK",
      "KUUUUUUUUUUUUUUK",
      " KKKKKKKKKKKKKK ",
    ],
  ],
};

// Turns each frame's letter grid into a tiny offscreen canvas (1 canvas
// pixel = 1 NES pixel), drawn later with smoothing off so it scales up crisp.
function buildSprite({ palette, frames }) {
  return frames.map((rows) => {
    const canvas = document.createElement("canvas");
    canvas.width = rows[0].length;
    canvas.height = rows.length;
    const ctx = canvas.getContext("2d");
    rows.forEach((row, y) => {
      [...row].forEach((ch, x) => {
        if (ch === " ") return;
        ctx.fillStyle = palette[ch];
        ctx.fillRect(x, y, 1, 1);
      });
    });
    return canvas;
  });
}

function clamp01(t) {
  return Math.min(1, Math.max(0, t));
}

// 0 before `start`, 1 after `end`, linear in between.
function phase(p, start, end) {
  return clamp01((p - start) / (end - start));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

// Mario's whole routine as a pure function of scroll progress `p` — no
// state carried between frames, so scrolling back up plays it in reverse.
//  0.02–0.18  small Mario walks right to the mushroom
//  0.18–0.26  touches it and grows (NES-style flicker between sizes)
//  0.26–0.34  big Mario walks under the "?" block
//  0.36–0.43  jumps up, head hits the block
//  0.43–0.50  falls back to the ledge; block bumps, coin pops out
function marioState(p) {
  const smallW = 12 * CHAR_PX;
  const touchX = MUSHROOM_X - smallW; // left edge when touching the mushroom
  const smallCenter = lerp(MARIO_START_X, touchX, phase(p, 0.02, 0.18)) + smallW / 2;

  // Grow: flicker small/medium/big like the original, ending big.
  const growT = phase(p, 0.18, 0.26);
  const growSteps = [1, 1.5, 1, 1.5, 2, 1.5, 2];
  const scale = growT <= 0 ? 1 : growSteps[Math.min(growSteps.length - 1, Math.floor(growT * growSteps.length))];

  const blockCenter = QBLOCK_X + (16 * BLOCK_PX) / 2;
  const centerX = lerp(smallCenter, blockCenter, phase(p, 0.26, 0.34));

  // Jump: rise until the top of his head meets the block's underside.
  const bigH = 16 * CHAR_PX * 2;
  const blockBottom = QBLOCK_Y + 16 * BLOCK_PX;
  const maxRise = LEDGE_TOP - bigH - blockBottom;
  const up = phase(p, 0.36, 0.43);
  const down = phase(p, 0.43, 0.5);
  const rise = up < 1 ? maxRise * (1 - (1 - up) * (1 - up)) : maxRise * (1 - down * down);

  const walking = (p > 0.02 && p < 0.18) || (p > 0.26 && p < 0.34);
  const frame = walking ? Math.floor(centerX / 18) % 2 : 0;

  return { centerX, bottom: LEDGE_TOP - rise, scale, frame };
}

export default function MarioScene({ progressRef, active, animate }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;

    const sprites = {
      mario: buildSprite(SMALL_MARIO),
      mushroom: buildSprite(MUSHROOM),
      goomba: buildSprite(GOOMBA),
      coin: buildSprite(COIN),
      qblock: buildSprite(QBLOCK),
    };

    let rafId;
    const startTime = performance.now();

    function draw(now) {
      try {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const w = canvas.clientWidth;
        const h = canvas.clientHeight;
        if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
          canvas.width = Math.round(w * dpr);
          canvas.height = Math.round(h * dpr);
        }
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Landscape screens show the desktop background, which still has
        // Mario baked in — nothing to draw there.
        if (w >= h) {
          if (animate) rafId = requestAnimationFrame(draw);
          return;
        }

        // Same maths as CSS object-cover: scale the image to cover the
        // screen, centred, then map image pixels to (device) screen pixels.
        const s = Math.max(w / BG_W, h / BG_H) * dpr;
        const offX = (w * dpr - BG_W * s) / 2;
        const offY = (h * dpr - BG_H * s) / 2;
        ctx.imageSmoothingEnabled = false;

        // Draws sprite frame `img` with its bottom-centre at image coords
        // (cx, bottom), each NES pixel `px` image pixels wide.
        function put(img, cx, bottom, px, flip = false) {
          const dw = img.width * px * s;
          const dh = img.height * px * s;
          const dx = offX + cx * s - dw / 2;
          const dy = offY + bottom * s - dh;
          if (flip) {
            ctx.save();
            ctx.translate(dx + dw, dy);
            ctx.scale(-1, 1);
            ctx.drawImage(img, 0, 0, dw, dh);
            ctx.restore();
          } else {
            ctx.drawImage(img, dx, dy, dw, dh);
          }
        }

        const p = animate ? progressRef.current : 0;
        const blockW = 16 * BLOCK_PX;
        const blockCx = QBLOCK_X + blockW / 2;

        // Coin: pops up out of the block after the hit, then vanishes.
        const coinT = phase(p, 0.43, 0.53);
        if (coinT > 0 && coinT < 1) {
          const coinRise = Math.sin(coinT * Math.PI) * blockW * 1.6;
          put(sprites.coin[0], blockCx, QBLOCK_Y - coinRise, CHAR_PX);
        }

        // "?" block: bumps up briefly when hit, then shows as used.
        const hit = p >= 0.43;
        const bump = Math.sin(phase(p, 0.43, 0.47) * Math.PI) * BLOCK_PX * 3;
        put(sprites.qblock[hit ? 1 : 0], blockCx, QBLOCK_Y + blockW - bump, BLOCK_PX);

        // Mushroom: sits on the ledge until Mario touches it.
        if (p < 0.18) {
          put(sprites.mushroom[0], MUSHROOM_X + (16 * CHAR_PX) / 2, LEDGE_TOP, CHAR_PX);
        }

        const mario = marioState(p);
        put(sprites.mario[mario.frame], mario.centerX, mario.bottom, CHAR_PX * mario.scale);

        // Goomba: patrols between the pipe and the hill on a timer (not
        // scroll), flipping horizontally every step — the NES walk cycle.
        const t = animate ? (now - startTime) / 1000 : 0;
        const span = GOOMBA_MAX_X - GOOMBA_MIN_X;
        const travel = (t * GOOMBA_SPEED) % (span * 2);
        const goombaX = GOOMBA_MIN_X + (travel < span ? travel : span * 2 - travel);
        const goombaW = 16 * CHAR_PX;
        put(sprites.goomba[0], goombaX + goombaW / 2, GROUND_TOP, CHAR_PX, Math.floor(t * 4) % 2 === 1);

        if (animate) rafId = requestAnimationFrame(draw);
      } catch (err) {
        // Purely decorative — on any failure, clear and stop rather than
        // risk anything else on the page.
        console.error("MarioScene stopped:", err);
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }

    rafId = requestAnimationFrame(draw);
    // With animation off, draw one still frame — and again on resize, since
    // there's no loop to pick up the new size.
    const onResize = () => {
      if (!animate) rafId = requestAnimationFrame(draw);
    };
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", onResize);
    };
  }, [active, animate, progressRef]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full"
    />
  );
}
