import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { REGISTRATIONS_OPEN } from "@/lib/config";

// This is the preview card WhatsApp (and iMessage, Slack, etc.) shows when
// someone shares the site link — how ~500 people will first see it. Next.js
// picks this file up automatically and wires the og:image meta tags itself;
// nothing to import or link anywhere.

export const alt = "Venture Vault 3.0 — E-Cell RBU";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Read once at module scope rather than on every request — the logo never
// changes between requests.
const logoData = await readFile(
  join(process.cwd(), "public/ecell-logo.png"),
  "base64"
);
const logoSrc = `data:image/png;base64,${logoData}`;

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0a0a0b",
          backgroundImage:
            "radial-gradient(circle at 50% 35%, #7a3e00 0%, rgba(10,10,11,0) 60%)",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoSrc} alt="" width={100} height={100} style={{ marginBottom: 28 }} />
        <div
          style={{
            display: "flex",
            fontSize: 76,
            fontWeight: 700,
            color: "#f5a623",
            letterSpacing: -2,
          }}
        >
          VENTURE VAULT 3.0
        </div>
        <div style={{ display: "flex", fontSize: 34, color: "#f5f5f4", marginTop: 18 }}>
          E-Cell RBU
        </div>
        <div style={{ display: "flex", fontSize: 28, color: "#a1a1a6", marginTop: 30 }}>
          {REGISTRATIONS_OPEN ? "Register Now" : "Registrations Closed"}
        </div>
      </div>
    ),
    { ...size }
  );
}
