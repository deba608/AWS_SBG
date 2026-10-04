import type { Metadata } from "next";
import Container from "@/components/Container";
import SectionHeading from "@/components/SectionHeading";
import JoinClient from "./join-client";

export const metadata: Metadata = {
  title: "Submit team photo — AWS SBG",
  description: "Team members: select your position and upload a square photo for admin approval.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/team/join" },
};

export default function TeamJoinPage() {
  return (
    <div className="pb-12 pt-24 sm:pb-16 md:pb-24 md:pt-32">
      <Container className="max-w-2xl">
        <SectionHeading
          eyebrow="Team photo submission"
          title="Select position, upload photo."
          description="Pick your role from the team roster and upload a clear photo. It auto-crops to square 800×800 JPG. Admin approves, then it shows on the team page."
        />
        <div className="mt-8">
          <JoinClient />
        </div>
      </Container>
    </div>
  );
}
