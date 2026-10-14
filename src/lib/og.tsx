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
        position: "relative",
        overflow: "hidden",
        backgroundColor: "#0b0e11",
        fontFamily: "sans-serif",
      }}
    >
      {/* Glow orbs */}
      <div
        style={{
          position: "absolute",
          top: "-260px",
          right: "-140px",
          width: "680px",
          height: "680px",
          display: "flex",
          backgroundImage:
            "radial-gradient(circle, rgba(173,92,255,0.32) 0%, rgba(173,92,255,0.08) 45%, transparent 70%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "-300px",
          left: "-120px",
          width: "720px",
          height: "520px",
          display: "flex",
          backgroundImage:
            "radial-gradient(circle, rgba(255,153,0,0.14) 0%, transparent 70%)",
        }}
      />
      {/* Giant watermark */}
      <div
        style={{
          position: "absolute",
          right: "24px",
          bottom: "-86px",
          display: "flex",
          fontSize: 300,
          fontWeight: 800,
          letterSpacing: -12,
          color: "rgba(255,255,255,0.045)",
          lineHeight: 1,
        }}
      >
        AWS
      </div>
      {/* Hairline frame */}
      <div
        style={{
          position: "absolute",
          top: "20px",
          left: "20px",
          right: "20px",
          bottom: "20px",
          display: "flex",
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: "28px",
        }}
      />

      {/* Content */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          width: "1200px",
          height: "630px",
          padding: "64px 72px",
        }}
      >
        {/* Left */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            width: "700px",
          }}
        >
          {/* Brand row */}
          <div style={{ display: "flex", alignItems: "center" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logo}
              alt=""
              width={52}
              height={52}
              style={{ borderRadius: 12 }}
            />
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                marginLeft: 16,
              }}
            >
              <div
                style={{
                  fontSize: 24,
                  fontWeight: 700,
                  color: "#f5f3ee",
                  letterSpacing: 3,
                }}
              >
                AWS SBG
              </div>
              <div style={{ fontSize: 19, color: "#6b7480", letterSpacing: 2 }}>
                SUIIT · SAMBALPUR UNIVERSITY
              </div>
            </div>
          </div>

          {/* Eyebrow pill */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              alignSelf: "flex-start",
              marginTop: 28,
              padding: "10px 22px",
              borderRadius: 999,
              border: "1px solid rgba(173,92,255,0.5)",
              backgroundColor: "rgba(173,92,255,0.12)",
            }}
          >
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: 6,
                backgroundColor: "#ad5cff",
              }}
            />
            <div
              style={{
                fontSize: 25,
                fontWeight: 700,
                color: "#d8b4fe",
                letterSpacing: 2,
                marginLeft: 12,
                whiteSpace: "nowrap",
              }}
            >
              {eyebrow}
            </div>
          </div>

          {/* Title */}
          <div
            style={{
              fontSize: 82,
              fontWeight: 800,
              lineHeight: 1.0,
              letterSpacing: -2,
              color: "#f5f3ee",
              marginTop: 24,
            }}
          >
            {title}
          </div>

          {/* Accent bar */}
          <div
            style={{
              width: 128,
              height: 8,
              borderRadius: 4,
              marginTop: 24,
              backgroundImage:
                "linear-gradient(90deg, #ad5cff 0%, #7c3aed 45%, #ff9900 100%)",
            }}
          />

          {/* Subtitle */}
          <div
            style={{
              fontSize: 30,
              lineHeight: 1.35,
              color: "#a8b0bb",
              marginTop: 18,
            }}
          >
            {subtitle}
          </div>

          {/* Footer */}
          <div
            style={{ display: "flex", alignItems: "center", marginTop: 30 }}
          >
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: 5,
                backgroundColor: "#ff9900",
              }}
            />
            <div
              style={{ fontSize: 24, color: "#f5f3ee", marginLeft: 12 }}
            >
              awssbgsuiit.in
            </div>
            <div
              style={{ fontSize: 24, color: "#5c6672", marginLeft: 16 }}
            >
              Free · Hands-on · Community
            </div>
          </div>
        </div>

        {/* Right showcase */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            width: 336,
            height: 486,
            marginLeft: 48,
            borderRadius: 32,
            border: "1px solid rgba(255,255,255,0.14)",
            backgroundImage:
              "linear-gradient(180deg, #181e27 0%, #0f1317 100%)",
            padding: "36px 28px",
          }}
        >
          <div
            style={{
              fontSize: 19,
              fontWeight: 700,
              color: "#6b7480",
              letterSpacing: 2,
              whiteSpace: "nowrap",
            }}
          >
            LEARN · BUILD · DEPLOY
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 208,
              height: 208,
              marginTop: 24,
              borderRadius: 52,
              border: "2px solid rgba(173,92,255,0.55)",
              backgroundColor: "#000000",
              boxShadow: "0 0 80px rgba(173,92,255,0.35)",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logo}
              alt=""
              width={156}
              height={156}
              style={{ borderRadius: 24 }}
            />
          </div>
          <div
            style={{
              width: 220,
              height: 1,
              marginTop: 28,
              backgroundColor: "rgba(255,255,255,0.12)",
            }}
          />
          <div
            style={{ display: "flex", alignItems: "center", marginTop: 24 }}
          >
            <div
              style={{
                fontSize: 20,
                fontWeight: 700,
                letterSpacing: 2,
                color: "#ffd9a0",
                border: "1px solid rgba(255,153,0,0.45)",
                backgroundColor: "rgba(255,153,0,0.12)",
                borderRadius: 999,
                padding: "8px 18px",
              }}
            >
              CLOUD
            </div>
            <div
              style={{
                fontSize: 20,
                fontWeight: 700,
                letterSpacing: 2,
                color: "#d8b4fe",
                border: "1px solid rgba(173,92,255,0.45)",
                backgroundColor: "rgba(173,92,255,0.12)",
                borderRadius: 999,
                padding: "8px 18px",
                marginLeft: 12,
              }}
            >
              AI
            </div>
            <div
              style={{
                fontSize: 20,
                fontWeight: 700,
                letterSpacing: 2,
                color: "#a8b0bb",
                border: "1px solid rgba(255,255,255,0.2)",
                backgroundColor: "rgba(255,255,255,0.06)",
                borderRadius: 999,
                padding: "8px 18px",
                marginLeft: 12,
              }}
            >
              DEVOPS
            </div>
          </div>
          <div
            style={{
              fontSize: 19,
              color: "#5c6672",
              letterSpacing: 1,
              marginTop: 22,
              whiteSpace: "nowrap",
            }}
          >
            500+ BUILDERS · SUIIT BURLA
          </div>
        </div>
      </div>

      {/* Bottom brand bar */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: 8,
          display: "flex",
          backgroundImage:
            "linear-gradient(90deg, #ad5cff 0%, #7c3aed 45%, #ff9900 100%)",
        }}
      />
    </div>
  );
}
