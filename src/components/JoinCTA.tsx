import Button from "./Button";
import Container from "./Container";
import { SITE } from "@/lib/constants";

const channels = [
  { label: "WhatsApp", href: SITE.links.whatsapp },
  { label: "LinkedIn", href: SITE.links.linkedin },
  { label: "Instagram", href: SITE.links.instagram },
];

export default function JoinCTA() {
  return (
    <section aria-labelledby="join-heading" className="border-t border-line">
      <Container className="py-12 sm:py-16 lg:py-24">
        <div className="max-w-2xl">
          <h2
            id="join-heading"
            className="text-3xl font-bold tracking-tight text-cream md:text-4xl"
          >
            Ready to build something?
          </h2>
          <p className="mt-4 text-base leading-relaxed text-fog md:text-lg">
            {SITE.description}
          </p>
          <div className="mt-8 w-full sm:w-auto [&>*]:w-full sm:[&>*]:w-auto">
            <Button href={SITE.links.join} external>
              Join the community
            </Button>
          </div>
          <p className="mt-8 text-sm leading-loose text-fog">
            Find us on{" "}
            {channels.map((channel, i) => (
              <span key={channel.label}>
                <a
                  href={channel.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center py-1 underline decoration-line underline-offset-4 transition-colors hover:text-cream hover:decoration-brand"
                >
                  {channel.label}
                </a>
                {i < channels.length - 1 ? ", " : " "}
              </span>
            ))}
            or reach out at{" "}
            <a
              href={SITE.links.email}
              className="inline-flex items-center py-1 underline decoration-line underline-offset-4 break-all transition-colors hover:text-cream hover:decoration-brand"
            >
              {SITE.email}
            </a>
            .
          </p>
        </div>
      </Container>
    </section>
  );
}
