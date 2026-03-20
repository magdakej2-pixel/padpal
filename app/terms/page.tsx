import Link from "next/link";

export const metadata = {
  title: "Terms of Service — PadPal",
  description: "Terms of Service for using the PadPal platform.",
};

export default function TermsPage() {
  return (
    <div className="min-h-dvh bg-white safe-top safe-bottom">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-border px-5 py-4">
        <Link href="/" className="text-sm text-muted">← Back to PadPal</Link>
        <h1 className="text-2xl font-bold text-dark mt-1">Terms of Service</h1>
        <p className="text-xs text-muted mt-0.5">Last updated: 18 March 2026</p>
      </div>

      <div className="px-5 py-6 max-w-2xl mx-auto space-y-6 text-sm leading-relaxed text-dark-secondary">

        <section>
          <h2 className="text-lg font-bold text-dark mb-2">1. Acceptance of Terms</h2>
          <p>
            By accessing or using PadPal (&quot;the Platform&quot;), you agree to be bound by these Terms of Service.
            If you do not agree, please do not use the Platform.
            PadPal is operated by PadPal Ltd, registered in England and Wales.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-dark mb-2">2. The Service</h2>
          <p>
            PadPal is a peer-to-peer platform that helps users find compatible flatmates and rooms.
            We provide matching tools, listing features, and communication channels to facilitate connections
            between users. PadPal does not act as a letting agent, landlord, or estate agent.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-dark mb-2">3. Eligibility</h2>
          <p>
            You must be at least 18 years old to create an account.
            By registering, you confirm that the information you provide is accurate and complete.
            You are responsible for maintaining the confidentiality of your account credentials.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-dark mb-2">4. User Conduct</h2>
          <p className="mb-2">You agree not to:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Post false, misleading, or fraudulent information</li>
            <li>Harass, abuse, or threaten other users</li>
            <li>Use the Platform for any unlawful purpose</li>
            <li>Scrape, data-mine, or collect user data without consent</li>
            <li>Create multiple accounts or impersonate another person</li>
            <li>Post listings for properties you do not have authority to advertise</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-dark mb-2">5. Listings & Content</h2>
          <p>
            Users are solely responsible for the accuracy of their listings and profile information.
            PadPal reserves the right to remove any content that violates these Terms or that we deem
            inappropriate, without prior notice. By posting content, you grant PadPal a non-exclusive,
            royalty-free licence to display it on the Platform.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-dark mb-2">6. Premium Subscriptions & Payments</h2>
          <p>
            PadPal offers optional paid features (&quot;Premium&quot;). Subscriptions are processed via Stripe and
            auto-renew unless cancelled. You can cancel at any time through your profile settings.
            Refunds are handled on a case-by-case basis — contact us at <strong>support@padpal.app</strong> for assistance.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-dark mb-2">7. Disclaimers</h2>
          <p>
            PadPal is provided &quot;as is&quot; without warranties of any kind. We do not guarantee the accuracy of user
            profiles, listings, or match percentages. We are not responsible for any transactions, agreements,
            or disputes between users. Always exercise caution when meeting someone in person for the first time.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-dark mb-2">8. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by law, PadPal shall not be liable for any indirect, incidental,
            or consequential damages arising from your use of the Platform. Our total liability shall not
            exceed the amount paid by you for Premium services in the 12 months preceding the claim.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-dark mb-2">9. Account Termination</h2>
          <p>
            We may suspend or terminate your account at our discretion if you violate these Terms.
            You may delete your account at any time from your profile settings. Upon deletion,
            your personal data will be removed in accordance with our <Link href="/privacy" className="text-primary font-semibold">Privacy Policy</Link>.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-dark mb-2">10. Changes to Terms</h2>
          <p>
            We may update these Terms from time to time. Continued use of the Platform after changes
            constitutes acceptance of the revised Terms. We will notify users of significant changes
            via email or an in-app notice.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-dark mb-2">11. Governing Law</h2>
          <p>
            These Terms are governed by the laws of England and Wales. Any disputes shall be subject
            to the exclusive jurisdiction of the courts of England and Wales.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-dark mb-2">12. Contact</h2>
          <p>
            If you have questions about these Terms, contact us at <strong>support@padpal.app</strong>.
          </p>
        </section>

        <div className="border-t border-border pt-4 text-xs text-muted text-center">
          <p>© 2026 PadPal Ltd. All rights reserved.</p>
          <div className="mt-2 flex justify-center gap-4">
            <Link href="/privacy" className="text-primary font-medium">Privacy Policy</Link>
            <Link href="/" className="text-primary font-medium">Home</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
