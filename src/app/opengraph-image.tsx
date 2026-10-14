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
        eyebrow="AWS STUDENT BUILDER GROUP · SUIIT"
        title="Build. Learn. Deploy. Together."
        subtitle="Workshops · Hackathons · Community Day 2026"
      />
    ),
    { ...size }
  );
}
