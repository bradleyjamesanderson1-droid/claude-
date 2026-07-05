import { Footer, Prose, Wordmark } from "@/components/ui";

export const metadata = { title: "Privacy — The Weekly Reset" };

export default function Privacy() {
  return (
    <main className="flex-1">
      <div className="mx-auto w-full max-w-xl px-6 pb-16 pt-8">
        <Wordmark />
        <h1 className="mt-12 font-serif text-3xl">Privacy, in plain language</h1>
        <div className="mt-6">
          <Prose>
            <p>
              Until you enter an email address, everything you type in The
              Weekly Reset stays in your own browser (localStorage). Nothing is
              sent to us. Close the tab, and it&rsquo;s still only on your
              device.
            </p>
            <p>
              If you choose to save your resets, we collect: your email
              address, the content of your resets, and basic anonymous usage
              events (page views and button presses via Plausible, which uses
              no cookies and no personal identifiers). We never ask for your
              name, phone number, or demographics — we don&rsquo;t want them.
            </p>
            <p>
              Your email is used to send your reset card, your history link,
              and — only if you ticked the separate box — occasional
              Undisciplined emails. We record when and where you gave that
              consent, and unsubscribing takes effect immediately.
            </p>
            <p>
              Data is stored with Supabase (EU region). You can delete your
              account and all your data from your history page at any time —
              it&rsquo;s a hard delete, not an &ldquo;archive.&rdquo;
            </p>
            <p>
              This policy will be finalised (POPIA-compliant, with the
              operator&rsquo;s details and full retention terms) before launch.
              Questions or deletion requests in the meantime:{" "}
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
