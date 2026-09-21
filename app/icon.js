import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

// The browser-tab icon. Next.js finds this automatically and generates the
// <link rel="icon"> tag itself — same mechanism as opengraph-image.js.

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

const logoData = await readFile(
  join(process.cwd(), "public/ecell-logo.png"),
  "base64"
);
const logoSrc = `data:image/png;base64,${logoData}`;

export default async function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0a0a0b",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoSrc} alt="" width={380} height={380} />
      </div>
    ),
    { ...size }
  );
}
