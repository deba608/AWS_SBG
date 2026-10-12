import { redirect } from "next/navigation";

export const metadata = {
  robots: { index: false, follow: false },
  alternates: { canonical: "/team/update" },
};

export default function TeamJoinPage() {
  redirect("/team/update");
}
