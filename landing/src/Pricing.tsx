import { useEffect } from "react";
import { Nav, Footer } from "./components/Chrome";
import { useReveal } from "./components/useReveal";
import WaitlistForm from "./components/WaitlistForm";

const TIERS = [
  {
    name: "Launch",
    price: "$3,500",
    period: "/mo",
    summary: "One ICP, one campaign, a demo for every prospect in it.",
    features: [
      "One campaign against one ICP",
      "Custom demo with every email",
      "Domains and inboxes set up and warmed",
      "Deliverability watched daily",
      "Replies land in your inbox",
      "Weekly readout",
    ],
    cta: "Get early access",
    href: "#join",
  },
  {
    name: "Scale",
    price: "$5,000",
    period: "/mo",
    summary: "Campaigns running head to head, ramped by what converts.",
    highlight: true,
    features: [
      "Everything in Launch",
      "Multiple campaigns and ICPs in parallel",
      "Higher demo volume",
      "Angles and segments tested head to head",
      "Lead lists re-cut from reply data",
      "Direct line to the founders",
    ],
    cta: "Get early access",
    href: "#join",
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    summary: "Multiple products, custom artifact pipelines, or unusual scale.",
    features: [
      "Everything in Scale",
      "Multiple products or brands",
      "Custom-built artifact pipeline for your product",
      "Security review and DPA",
      "Dedicated capacity",
    ],
    cta: "Email us",
    href: "mailto:aayush@driftwood.sh",
  },
];

export default function Pricing() {
  useReveal();

  useEffect(() => {
    document.title = "pricing — driftwood";
  }, []);

  return (
    <div className="grain relative min-h-screen overflow-x-clip">
      <Nav homePrefix="/" />

      <main className="mx-auto max-w-6xl px-5 sm:px-8">
        {/* header */}
        <section className="py-16 sm:py-20">
          <div className="reveal is-visible mx-auto max-w-160 text-center">
            <h1 className="m-0 text-[clamp(2rem,4.6vw,3rem)] font-semibold leading-[1.08] tracking-[-0.02em]">
              One retainer, the whole channel.
            </h1>
            <p className="mx-auto mt-5 max-w-130 text-[16px] leading-relaxed text-ink-soft">
              Every tier ships the full pipeline: leads, warmed inboxes, deliverability, sequencing, and a demo
              built for each prospect. A human reviews every send.
            </p>
          </div>
        </section>

        {/* tiers */}
        <section className="pb-16 sm:pb-20">
          <div className="grid items-start gap-5 lg:grid-cols-3">
            {TIERS.map((tier, i) => (
              <div
                key={tier.name}
                className={`reveal relative rounded-2xl border p-7 ${
                  tier.highlight
                    ? "border-tide/40 bg-surface shadow-[0_28px_64px_-32px_rgba(13,60,91,0.5)] lg:-my-3 lg:py-10"
                    : "border-line bg-surface/60"
                }`}
                style={{ transitionDelay: `${i * 0.08}s` }}
              >
                {tier.highlight && (
                  <span className="absolute -top-3 left-7 rounded-full bg-tide px-3 py-1 font-mono text-[10.5px] font-medium text-white">
                    most teams pick this
                  </span>
                )}
                <h2 className="m-0 text-[15px] font-semibold uppercase tracking-[0.08em] text-ink-soft">{tier.name}</h2>
                <p className="mb-0 mt-3 text-[34px] font-semibold leading-none tracking-[-0.02em]">
                  {tier.price}
                  {tier.period && <span className="ml-1 font-mono text-[13px] font-normal text-ink-faint">{tier.period}</span>}
                </p>
                <p className="mb-0 mt-3.5 min-h-11 text-[14px] leading-relaxed text-ink-soft">{tier.summary}</p>
                <ul className="m-0 mt-6 list-none space-y-2.5 border-t border-line p-0 pt-6">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5 text-[13.5px] leading-snug text-ink-soft">
                      <svg
                        viewBox="0 0 24 24"
                        className="mt-0.5 size-3.5 shrink-0 stroke-tide"
                        fill="none"
                        strokeWidth="2.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M5 12.5l4.5 4.5L19 7.5" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
                <a
                  href={tier.href}
                  className={`mt-7 block rounded-xl px-4 py-2.5 text-center text-[14px] font-semibold no-underline transition-colors ${
                    tier.highlight
                      ? "bg-tide text-white hover:bg-tide-deep"
                      : "border border-line bg-paper text-ink hover:border-ink-faint"
                  }`}
                >
                  {tier.cta}
                </a>
              </div>
            ))}
          </div>
          <p className="reveal mt-8 text-center font-mono text-[12px] text-ink-faint">
            No setup fees. Cancel any month.
          </p>
        </section>

        {/* cta */}
        <section id="join" className="scroll-mt-20 border-t border-line py-20 sm:py-24">
          <div className="reveal mx-auto max-w-150 text-center">
            <h2 className="m-0 text-[clamp(1.6rem,3.6vw,2.4rem)] font-semibold leading-tight tracking-[-0.015em]">
              Start with a 15-minute call.
            </h2>
            <p className="mt-4 text-[16px] leading-relaxed text-ink-soft">
              Leave a work email and we'll show you what a campaign for your product looks like.
            </p>
            <div className="relative mt-8 flex justify-center">
              <WaitlistForm id="email-pricing" />
            </div>
          </div>
        </section>
      </main>

      <Footer homePrefix="/" />
    </div>
  );
}
