import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/"
          className="mb-10 inline-flex items-center gap-1.5 text-sm text-gray-400 transition hover:text-gray-600"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 12H5" />
            <path d="m12 19-7-7 7-7" />
          </svg>
          Back to DocToDeck
        </Link>

        <h1 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">
          Privacy &amp; Data Handling
        </h1>
        <p className="mt-2 text-sm text-gray-400">Last updated: April 2026</p>

        <section className="mt-12">
          <h2 className="text-lg font-semibold text-gray-900">
            Your documents stay yours
          </h2>
          <p className="mt-3 text-base leading-relaxed text-gray-600">
            DocToDeck does not store your uploaded documents. When you paste or
            upload a document, it is sent directly to our AI provider for
            processing. Once your slide deck is generated and returned to your
            browser, the original document content is discarded. It is never
            written to disk, saved to a database, or logged on our servers.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="text-lg font-semibold text-gray-900">
            How your data flows
          </h2>
          <p className="mt-3 text-base leading-relaxed text-gray-600">
            When you use DocToDeck, here is exactly what happens:
          </p>
          <ol className="mt-4 list-decimal space-y-3 pl-5 text-base leading-relaxed text-gray-600">
            <li>
              You paste or upload your document in the browser. The content is
              held in your browser&apos;s memory only.
            </li>
            <li>
              When you click generate, the document text is sent via an
              encrypted (HTTPS) connection to our server, which forwards it to
              the Anthropic API for processing.
            </li>
            <li>
              Anthropic&apos;s API generates the slide content and returns it to
              our server, which passes it back to your browser.
            </li>
            <li>
              The generated slides exist only in your browser&apos;s memory.
              They are not stored on our servers.
            </li>
            <li>
              When you close or refresh the page, the content is gone.
            </li>
          </ol>
          <p className="mt-4 text-base leading-relaxed text-gray-600">
            There is one limited exception: if you export to Google Slides and
            need to authenticate with Google, the generated slide data is
            temporarily held in your browser&apos;s session storage to survive
            the authentication redirect. It is automatically removed once the
            export completes, and session storage is cleared when you close the
            browser tab.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="text-lg font-semibold text-gray-900">
            Our AI provider
          </h2>
          <p className="mt-3 text-base leading-relaxed text-gray-600">
            DocToDeck uses the Anthropic API (Claude) to process documents and
            generate slides. Anthropic&apos;s data handling practices for
            commercial API customers:
          </p>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-base leading-relaxed text-gray-600">
            <li>
              <strong className="text-gray-700">
                No model training on your data.
              </strong>{" "}
              Anthropic does not use commercial API inputs or outputs to train
              its models.
            </li>
            <li>
              <strong className="text-gray-700">Data retention:</strong> Under
              standard API terms, Anthropic deletes inputs and outputs within 30
              days. Zero Data Retention arrangements are also available.
            </li>
            <li>
              <strong className="text-gray-700">
                Compliance certifications:
              </strong>{" "}
              Anthropic holds SOC 2 Type I &amp; Type II, ISO 27001:2022, and
              ISO/IEC 42001:2023 certifications.
            </li>
            <li>
              <strong className="text-gray-700">
                Data Processing Agreement:
              </strong>{" "}
              A DPA with Standard Contractual Clauses is automatically included
              in Anthropic&apos;s commercial terms of service.
            </li>
          </ul>
          <p className="mt-4 text-base leading-relaxed text-gray-600">
            For more details, visit the{" "}
            <a
              href="https://trust.anthropic.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-900 underline underline-offset-2 hover:text-gray-600"
            >
              Anthropic Trust Portal
            </a>
            .
          </p>
        </section>

        <section className="mt-10">
          <h2 className="text-lg font-semibold text-gray-900">
            What we do not do
          </h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-base leading-relaxed text-gray-600">
            <li>
              We do not sell or share your data with third parties.
            </li>
            <li>
              We do not use your documents or generated content to train any AI
              models.
            </li>
            <li>
              We do not store your documents or generated slides on our servers.
            </li>
            <li>
              We do not track the content of your documents or presentations.
            </li>
          </ul>
        </section>

        <section className="mt-10">
          <h2 className="text-lg font-semibold text-gray-900">
            Google Slides integration
          </h2>
          <p className="mt-3 text-base leading-relaxed text-gray-600">
            If you choose to export to Google Slides, DocToDeck requests limited
            access to your Google account to create a presentation in your
            Google Drive. We request only the permissions necessary to create the
            presentation. We do not access, read, or modify any other files in
            your Google Drive.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="text-lg font-semibold text-gray-900">Analytics</h2>
          <p className="mt-3 text-base leading-relaxed text-gray-600">
            We use basic analytics to understand how the product is used (page
            views, feature usage). We do not track or log the content of your
            documents or generated presentations.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="text-lg font-semibold text-gray-900">Contact</h2>
          <p className="mt-3 text-base leading-relaxed text-gray-600">
            If you have questions about how DocToDeck handles your data, reach
            out at{" "}
            <a
              href="mailto:yuann@sealai.org"
              className="text-gray-900 underline underline-offset-2 hover:text-gray-600"
            >
              yuann@sealai.org
            </a>
            .
          </p>
        </section>
      </div>
    </main>
  );
}
