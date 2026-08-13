import Hero from "@/components/Hero";
import ServicesOverview from "@/components/ServicesOverview";
import HowItWorks from "@/components/HowItWorks";
import WhyUs from "@/components/WhyUs";
import Testimonials from "@/components/Testimonials";
import Link from "next/link";
import VitalsLine from "@/components/VitalsLine";

export default function Home() {
  return (
    <>
      <Hero />
      <ServicesOverview />
      <HowItWorks />
      <WhyUs />
      <Testimonials />

      <section className="mx-auto max-w-6xl px-6 py-20 text-center">
        <VitalsLine className="mx-auto h-3 w-40" color="var(--crimson)" />
        <h2 className="mt-6 h1 sm:text-4xl">
          Ready when you are.
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm text-ink-soft">
          Book a consultation and our team will confirm within one business day.
        </p>
        <Link
          href="/contact"
          className="mt-7 inline-block rounded-full bg-indigo px-8 py-3.5 text-sm font-medium text-paper transition-colors hover:bg-indigo-deep"
        >
          Book Appointment
        </Link>
      </section>
    </>
  );
}
