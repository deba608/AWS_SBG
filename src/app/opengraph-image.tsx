import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          backgroundColor: "#0b0e11",
          color: "#f5f3ee",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ fontSize: 36, color: "#ad5cff", letterSpacing: 4 }}>
          AWS STUDENT BUILDER GROUP · SUIIT
        </div>
        <div style={{ fontSize: 84, fontWeight: 700, lineHeight: 1.05, marginTop: 16 }}>
          Build. Learn. Deploy. Together.
        </div>
        <div style={{ fontSize: 32, color: "#a8b0bb", marginTop: 24 }}>
          Workshops · Hackathons · Community Day SUIIT 2026
        </div>
      </div>
    ),
    { ...size }
  );
}
