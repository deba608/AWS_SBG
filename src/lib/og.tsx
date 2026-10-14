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
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        padding: "64px 72px",
        backgroundColor: "#0b0e11",
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          flex: 1,
          minWidth: 0,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
          }}
        >
          <div
            style={{
              width: 44,
              height: 6,
              backgroundColor: "#ad5cff",
              borderRadius: 3,
            }}
          />
          <div
            style={{
              fontSize: 30,
              color: "#ad5cff",
              letterSpacing: 3,
              marginLeft: 16,
            }}
          >
            {eyebrow}
          </div>
        </div>
        <div
          style={{
            fontSize: 76,
            fontWeight: 700,
            lineHeight: 1.05,
            color: "#f5f3ee",
            marginTop: 20,
          }}
        >
          {title}
        </div>
        <div style={{ fontSize: 30, color: "#a8b0bb", marginTop: 20 }}>
          {subtitle}
        </div>
        <div style={{ fontSize: 24, color: "#5c6672", marginTop: 28 }}>
          awssbgsuiit.in
        </div>
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 248,
          height: 248,
          marginLeft: 48,
          borderRadius: 56,
          border: "3px solid rgba(173,92,255,0.45)",
          backgroundColor: "#12161b",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logo}
          alt=""
          width={176}
          height={176}
          style={{ borderRadius: 24 }}
        />
      </div>
    </div>
  );
}
