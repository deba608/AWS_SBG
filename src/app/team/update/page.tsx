import type { Metadata } from "next";
import Container from "@/components/Container";
import SectionHeading from "@/components/SectionHeading";
import JoinClient from "../join/join-client";

export const metadata: Metadata = {
  title: "Update team profile — AWS SBG",
  description: "Team members: select your position, upload a square photo and add LinkedIn, GitHub and email links for admin approval.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/team/update" },
};

export default function TeamUpdatePage() {
  return (
    <div className="pb-12 pt-24 sm:pb-16 md:pb-24 md:pt-32">
      <Container className="max-w-2xl">
        <SectionHeading
          eyebrow="Team profile update"
          title="Photo + links in one go."
          description="Pick your name from the roster, upload a clear photo (auto-crops to square 800×800 JPG) and optionally add LinkedIn, GitHub and email. Admin approves, then it shows on the team page."
        />
        <div className="mt-8">
          <JoinClient />
        </div>
      </Container>
    </div>
  );
}
