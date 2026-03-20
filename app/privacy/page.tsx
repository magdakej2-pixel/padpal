import Link from "next/link";

export const metadata = {
  title: "Privacy Policy — PadPal",
  description: "How PadPal collects, uses, and protects your personal data.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-dvh bg-white safe-top safe-bottom">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-border px-5 py-4">
        <Link href="/" className="text-sm text-muted">← Back to PadPal</Link>
        <h1 className="text-2xl font-bold text-dark mt-1">Privacy Policy</h1>
        <p className="text-xs text-muted mt-0.5">Last updated: 18 March 2026</p>
      </div>

      <div className="px-5 py-6 max-w-2xl mx-auto space-y-6 text-sm leading-relaxed text-dark-secondary">

        <section>
          <h2 className="text-lg font-bold text-dark mb-2">1. Introduction</h2>
          <p>
            PadPal Ltd (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) is committed to protecting your privacy.
            This Privacy Policy explains how we collect, use, store, and share your personal data
            when you use the PadPal platform. We comply with the UK General Data Protection Regulation
            (UK GDPR) and the Data Protection Act 2018.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-dark mb-2">2. Data We Collect</h2>
          <p className="mb-2">We collect the following types of personal data:</p>

          <h3 className="font-semibold text-dark mt-3 mb-1">Account Information</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>Email address (used for authentication via magic link)</li>
            <li>Name, age, and occupation</li>
            <li>Profile photos</li>
            <li>Location and postcode</li>
          </ul>

          <h3 className="font-semibold text-dark mt-3 mb-1">Lifestyle Preferences</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>Quiz answers (sleep schedule, cleanliness, social habits, budget, hobbies, pet preferences)</li>
            <li>Room-seeking or room-offering preferences</li>
          </ul>

          <h3 className="font-semibold text-dark mt-3 mb-1">Usage Data</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>Interactions (likes, passes, superlikes)</li>
            <li>Chat messages between matched users</li>
            <li>Listings created and viewed</li>
          </ul>

          <h3 className="font-semibold text-dark mt-3 mb-1">Payment Data</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>Subscription and boost purchase history</li>
            <li>Payment details are processed by <strong>Stripe</strong> — we do not store card numbers</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-dark mb-2">3. How We Use Your Data</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Matching:</strong> Your quiz answers and preferences are used to calculate compatibility scores with other users</li>
            <li><strong>Communication:</strong> To facilitate chat between matched users</li>
            <li><strong>Listings:</strong> To display your room listings to other users</li>
            <li><strong>Payments:</strong> To process Premium subscriptions and Boost purchases</li>
            <li><strong>Service improvement:</strong> To improve the Platform and fix technical issues</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-dark mb-2">4. Legal Basis for Processing</h2>
          <p>We process your personal data under the following legal bases:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li><strong>Contract:</strong> Processing necessary to provide the PadPal service</li>
            <li><strong>Legitimate interests:</strong> To improve and secure the Platform</li>
            <li><strong>Consent:</strong> For optional features like marketing communications</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-dark mb-2">5. Third-Party Services</h2>
          <p className="mb-2">We use the following third-party services to operate the Platform:</p>
          <div className="rounded-[var(--radius-md)] border border-border divide-y divide-border">
            <div className="p-3">
              <p className="font-semibold text-dark">Supabase</p>
              <p className="text-xs text-muted">Database, authentication, and file storage. Data stored in EU data centres.</p>
            </div>
            <div className="p-3">
              <p className="font-semibold text-dark">Stripe</p>
              <p className="text-xs text-muted">Payment processing. PCI DSS Level 1 compliant. We never see your card details.</p>
            </div>
            <div className="p-3">
              <p className="font-semibold text-dark">Vercel</p>
              <p className="text-xs text-muted">Website hosting and deployment. Edge network with global presence.</p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-bold text-dark mb-2">6. Data Retention</h2>
          <p>
            We retain your personal data for as long as your account is active.
            When you delete your account, we will remove your profile, listings, messages,
            and interaction history within 30 days. Payment records may be retained for up to
            7 years as required by UK tax regulations.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-dark mb-2">7. Your Rights (UK GDPR)</h2>
          <p className="mb-2">You have the right to:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Access:</strong> Request a copy of your personal data</li>
            <li><strong>Rectification:</strong> Correct inaccurate data</li>
            <li><strong>Erasure:</strong> Request deletion of your data (&quot;right to be forgotten&quot;)</li>
            <li><strong>Portability:</strong> Receive your data in a machine-readable format</li>
            <li><strong>Objection:</strong> Object to processing based on legitimate interests</li>
            <li><strong>Restriction:</strong> Request restricted processing in certain circumstances</li>
          </ul>
          <p className="mt-2">
            To exercise any of these rights, contact us at <strong>privacy@padpal.app</strong>.
            We will respond within 30 days.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-dark mb-2">8. Data Security</h2>
          <p>
            We implement appropriate technical and organisational measures to protect your data,
            including encryption in transit (TLS) and at rest, rate limiting on API endpoints,
            Row Level Security (RLS) in our database, and authentication-protected routes.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-dark mb-2">9. Cookies</h2>
          <p>
            PadPal uses essential cookies for authentication and session management.
            We do not use third-party tracking cookies or advertising cookies.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-dark mb-2">10. Children&apos;s Privacy</h2>
          <p>
            PadPal is not intended for users under 18. We do not knowingly collect data
            from minors. If we become aware of such data, we will delete it promptly.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-dark mb-2">11. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify users of
            significant changes via email or an in-app notice. Continued use of the Platform
            constitutes acceptance of the updated policy.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-dark mb-2">12. Contact & Complaints</h2>
          <p>
            If you have questions or concerns about this Privacy Policy, contact our Data Protection
            team at <strong>privacy@padpal.app</strong>.
          </p>
          <p className="mt-2">
            You also have the right to lodge a complaint with the Information Commissioner&apos;s Office (ICO)
            at <strong>ico.org.uk</strong>.
          </p>
        </section>

        <div className="border-t border-border pt-4 text-xs text-muted text-center">
          <p>© 2026 PadPal Ltd. All rights reserved.</p>
          <div className="mt-2 flex justify-center gap-4">
            <Link href="/terms" className="text-primary font-medium">Terms of Service</Link>
            <Link href="/" className="text-primary font-medium">Home</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
