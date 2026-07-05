import { Footer, Prose, Wordmark } from "@/components/ui";

export const metadata = { title: "Terms — The Weekly Reset" };

export default function Terms() {
  return (
    <main className="flex-1">
      <div className="mx-auto w-full max-w-xl px-6 pb-16 pt-8">
        <Wordmark />
        <h1 className="mt-12 font-serif text-3xl">Terms of use</h1>
        <div className="mt-6">
          <Prose>
            <p>
              The Weekly Reset is a free tool provided by Undisciplined, as is,
              with no guarantees that it will make your week go to plan —
              that&rsquo;s rather the point of the design.
            </p>
            <p>
              Don&rsquo;t abuse the service (automated scraping, attempting to
              access other people&rsquo;s data, or using it to send spam). Your
              reset content belongs to you; we claim no rights over it.
            </p>
            <p>
              Paid products mentioned in the app are sold separately through
              Stan Store under their own terms. Full terms will be finalised
              before launch. Questions:{" "}
              <a className="underline underline-offset-4" href="mailto:hello@undisciplined.co">
                hello@undisciplined.co
              </a>
              .
            </p>
          </Prose>
        </div>
      </div>
      <Footer />
    </main>
  );
}
