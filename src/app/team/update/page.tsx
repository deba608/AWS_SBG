import type { Metadata } from "next";
import Container from "@/components/Container";
import SectionHeading from "@/components/SectionHeading";
import UpdateClient from "./update-client";

export const metadata: Metadata = {
  title: "Request profile update — AWS SBG",
  description: "Team members: pick your name, upload a square photo and add LinkedIn, GitHub and email links for admin approval.",
  robots: { index: false, follow: false },
};

export default function TeamUpdatePage() {
  return (
    <div className="pb-12 pt-24 sm:pb-16 md:pb-24 md:pt-32">
      <Container className="max-w-2xl">
        <SectionHeading
          eyebrow="Request profile update"
          title="Photo + links in one go."
          description="Pick your name — position fills itself. Your current photo and links show up prefilled, so edit only what's new. Resubmitting replaces your pending request instead of stacking duplicates."
        />
        <div className="mt-8">
          <UpdateClient />
        </div>
      </Container>
    </div>
  );
}
