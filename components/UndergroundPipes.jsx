// Green pipes with piranha plants, plus a blue Goomba, standing on the
// register section's teal floor (Mario World 1-2 style). Purely decorative —
// no JavaScript runs; all movement is CSS animation (see globals.css).

// Draws a letter grid as a crisp SVG: each letter is one NES pixel, looked up
// in `palette`; a space is transparent. Same-colour runs in a row are merged
// into one <rect> to keep the markup small.
function PixelArt({ rows, palette, className }) {
  const rects = [];
  rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const ch = row[x];
      let end = x + 1;
      while (end < row.length && row[end] === ch) end++;
      if (ch !== " ") {
        rects.push(
          <rect key={`${x}-${y}`} x={x} y={y} width={end - x} height={1} fill={palette[ch]} />
        );
      }
      x = end;
    }
  });
  return (
    <svg
      viewBox={`0 0 ${rows[0].length} ${rows.length}`}
      shapeRendering="crispEdges"
      className={className}
    >
      {rects}
    </svg>
  );
}

const PIPE_PALETTE = { K: "#000000", G: "#00a800", L: "#b8f818" };

// One row of pipe shading, `n` pixels wide: dark/light vertical stripes
// that give the NES pipe its rounded look.
function shadeRow(n) {
  let s = "";
  for (let i = 0; i < n; i++) {
    const f = (i + 0.5) / n;
    s += f < 0.1 ? "G" : f < 0.2 ? "L" : f < 0.25 ? "G" : f < 0.55 ? "L" : f < 0.6 ? "G" : f < 0.65 ? "L" : "G";
  }
  return s;
}

// 32px-wide lip on top of a 28px-wide body, `bodyRows` tall.
function pipeRows(bodyRows) {
  const edge = "K".repeat(32);
  const lip = "K" + shadeRow(30) + "K";
  const body = "  K" + shadeRow(26) + "K  ";
  return [edge, ...Array(10).fill(lip), edge, ...Array(bodyRows).fill(body)];
}

const PIRANHA_PALETTE = { H: "#00808a", W: "#fcfcfc", R: "#c84c0c" };
const PIRANHA = [
  "   HH      HH   ",
  "  HHHH    HHHH  ",
  " HHWHH    HHWHH ",
  " HHHHW    WHHHH ",
  "HHWHHHW  WHHHWHH",
  "HHHHHHW  WHHHHHH",
  "HWHHHHHWWHHHHHWH",
  "HHHHHHHWWHHHHHHH",
  " HHWHHHWWHHHWHH ",
  "  HHHHHWWHHHHH  ",
  "   HHHHWWHHHH   ",
  "     HHHHHH     ",
  "       RR       ",
  " RR    RR    RR ",
  "RRRR   RR   RRRR",
  "RRRRR  RR  RRRRR",
  " RRRRR RR RRRRR ",
  "  RRRRRRRRRRRR  ",
  "   RRRRRRRRRR   ",
  "       RR       ",
  "       RR       ",
  "       RR       ",
];

// A pipe with a piranha plant that pops out of it. The plant is rendered
// first so the pipe paints over it — when it sinks, it disappears "inside".
function Pipe({ bodyRows, delay, className }) {
  return (
    <div className={`absolute bottom-0 ${className}`}>
      <div className="absolute bottom-full left-1/4 w-1/2">
        <div className="piranha" style={{ animationDelay: delay }}>
          <PixelArt rows={PIRANHA} palette={PIRANHA_PALETTE} className="block w-full" />
        </div>
      </div>
      <PixelArt rows={pipeRows(bodyRows)} palette={PIPE_PALETTE} className="relative block w-full" />
    </div>
  );
}

// The underground (blue) Goomba. Feet are dark teal rather than black so
// they don't vanish against the black background.
const GOOMBA_PALETTE = { B: "#1a7f8e", T: "#a8f0f0", K: "#000000", F: "#0a4a52" };
const GOOMBA = [
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
  "   FFTTTTTTFF   ",
  "  FFFFTTTTFFFF  ",
  "  FFFFF  FFFFF  ",
  "   FFF    FFF   ",
];

// Sits just above the 48px floor strip. On phones the form spans the full
// width, so page.js leaves extra bottom padding for these to stand in.
export default function UndergroundPipes() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-[48px]">
      <Pipe bodyRows={14} delay="0s" className="left-4 w-[64px] md:left-6 md:w-[96px]" />
      <Pipe bodyRows={22} delay="-2s" className="right-4 w-[64px] md:right-6 md:w-[96px]" />
      {/* Goomba patrols the gap between the pipes. Three nested layers (see
          .goomba-* in globals.css): the track slides 0→100% of the gap, the
          body slides back by its own width so it stops at the far edge, and
          the innermost flips left/right for the NES walk cycle. */}
      <div className="absolute bottom-0 left-[88px] right-[88px] md:left-[128px] md:right-[128px]">
        <div className="goomba-track">
          <div className="goomba-body w-[32px] md:w-[48px]">
            <div className="goomba-step">
              <PixelArt rows={GOOMBA} palette={GOOMBA_PALETTE} className="block w-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
