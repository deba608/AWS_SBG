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
        eyebrow="OCT 6-8 · SUIIT BURLA · FREE ENTRY"
        title="Student Community Day 2026"
        subtitle="Cloud · AI/GenAI · DevOps — lunch + certificate"
      />
    ),
    { ...size }
  );
}
