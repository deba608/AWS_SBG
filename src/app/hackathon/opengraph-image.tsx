import { ImageResponse } from "next/og";
import { OgCard, getLogoDataUri } from "@/lib/og";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OgImage() {
  const logo = await getLogoDataUri();
  return new ImageResponse(
    (
      <OgCard
        logo={logo}
        eyebrow="DECODEX · DAY 1 · OCT 6"
        title="DecodeX Hackathon"
        subtitle="Teams of 4 · INR 15,000 prize pool"
      />
    ),
    { ...size }
  );
}
