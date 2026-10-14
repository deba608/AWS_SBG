import { readFile } from "node:fs/promises";
import { join } from "node:path";

let logoCache: string | null = null;

/** Load public/logo.png as data URI for use inside ImageResponse. */
export async function getLogoDataUri(): Promise<string> {
  if (!logoCache) {
    const buf = await readFile(join(process.cwd(), "public", "logo.png"));
    logoCache = `data:image/png;base64,${buf.toString("base64")}`;
  }
  return logoCache;
}

export function OgCard({
  logo,
  eyebrow,
  title,
  subtitle,
}: {
  logo: string;
  eyebrow: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div
      style={{
        width: "1200px",
        height: "630px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        backgroundColor: "#ffffff",
        fontFamily: "sans-serif",
        padding: "72px 88px",
      }}
    >
      {/* Brand row */}
      <div style={{ display: "flex", alignItems: "center" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logo}
          alt=""
          width={56}
          height={56}
          style={{ borderRadius: 12 }}
        />
        <div
          style={{
            fontSize: 26,
            fontWeight: 700,
            color: "#111418",
            letterSpacing: 1,
            marginLeft: 18,
          }}
        >
          AWS Student Builder Group
        </div>
        <div
          style={{
            fontSize: 26,
            color: "#8a94a0",
            marginLeft: 14,
          }}
        >
          · SUIIT
        </div>
      </div>

      {/* Eyebrow */}
      <div
        style={{
          fontSize: 24,
          fontWeight: 700,
          color: "#7c3aed",
          letterSpacing: 3,
          marginTop: 44,
          whiteSpace: "nowrap",
        }}
      >
        {eyebrow}
      </div>

      {/* Title */}
      <div
        style={{
          fontSize: 76,
          fontWeight: 700,
          lineHeight: 1.08,
          letterSpacing: -1,
          color: "#111418",
          marginTop: 16,
        }}
      >
        {title}
      </div>

      {/* Subtitle */}
      <div
        style={{
          fontSize: 30,
          lineHeight: 1.4,
          color: "#5b6470",
          marginTop: 16,
        }}
      >
        {subtitle}
      </div>

      {/* Footer */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          marginTop: 44,
          paddingTop: 26,
          borderTop: "1px solid #e3e6ea",
        }}
      >
        <div style={{ fontSize: 24, fontWeight: 700, color: "#111418" }}>
          awssbgsuiit.in
        </div>
        <div style={{ fontSize: 24, color: "#8a94a0", marginLeft: 16 }}>
          Sambalpur University Institute of Information Technology
        </div>
      </div>
    </div>
  );
}
