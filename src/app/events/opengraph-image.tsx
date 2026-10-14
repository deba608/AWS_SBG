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
        eyebrow="EVENTS · AWS SBG SUIIT"
        title="Learn by showing up."
        subtitle="Free workshops · Hackathons · Meetups"
      />
    ),
    { ...size }
  );
}
