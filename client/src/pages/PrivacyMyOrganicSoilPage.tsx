import { SEO } from "@/components/SEO";
import { BSABrandStyles } from "@/components/BSABrandStyles";

export default function PrivacyMyOrganicSoilPage() {
  return (
    <div className="min-h-screen bg-[#F5F2EC] text-[#0A1628]">
      <SEO
        title="Privacy Policy — SSW Sales Portal"
        description="How the SSW Sales Portal collects, uses, and protects your data."
        url="https://bettersystems.ai/privacy/myorganicsoil"
      />
      <BSABrandStyles />

      {/* HERO */}
      <section className="relative blueprint-grid grain pt-12 pb-16 md:pt-20 md:pb-20 px-4">
        <div className="container mx-auto max-w-7xl relative z-10">
          <div className="font-mono text-xs uppercase tracking-[0.25em] text-[#F26B1F] mb-6">
            / Legal · SSW Sales Portal
          </div>
          <h1 className="font-display text-5xl md:text-7xl leading-[0.95] mb-6">
            Privacy Policy
          </h1>
          <p className="font-body text-base md:text-lg text-[#0A1628]/70">
            Last updated: May 2026 · Effective for the SSW Sales Portal mobile app
          </p>
        </div>
      </section>

      {/* CONTENT */}
      <section className="px-4 pb-20 md:pb-28">
        <div className="container mx-auto max-w-3xl">
          <div className="bg-white border border-[#0A1628]/10 p-8 md:p-12 font-body text-[15px] md:text-base leading-relaxed text-[#0A1628]/90 space-y-8">

            <Section title="Who we are">
              <p>
                The SSW Sales Portal (the “app”) is operated by <strong>Soil Seed &amp; Water</strong>, a regenerative-agriculture wholesale supplier based in Phoenix, Arizona. This privacy policy applies to the iOS and Android mobile applications, the related web portal at <a className="underline" href="https://myorganicsoil.com">myorganicsoil.com</a>, and supporting services. The technology platform is built and maintained by Better Systems AI (BSA) on behalf of Soil Seed &amp; Water.
              </p>
              <p>
                The app is an internal tool for Soil Seed &amp; Water sales representatives. Customer contact information appears only as a result of business relationships those representatives have with you.
              </p>
            </Section>

            <Section title="What we collect">
              <p>We collect the minimum information needed to operate the app. Specifically:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Account information</strong> — name, email, password (stored hashed), phone, role (rep or admin), commission percentage</li>
                <li><strong>Customer records</strong> — name, company, email, phone, billing &amp; delivery address, order history, notes added by your sales rep</li>
                <li><strong>Order data</strong> — line items, quantities, pricing, fulfillment method, discounts, totals</li>
                <li><strong>Payment data</strong> — handled by Stripe. We never receive or store your full card number. We retain the Stripe payment intent / charge / invoice IDs and the last four digits of the card used, for reconciliation</li>
                <li><strong>Device tokens</strong> — Apple Push Notification (APNs) tokens, used to deliver app notifications about new leads and order status</li>
                <li><strong>Diagnostic logs</strong> — anonymized error reports and performance metrics needed to keep the app running</li>
              </ul>
            </Section>

            <Section title="How we use it">
              <ul className="list-disc pl-6 space-y-2">
                <li>To create and manage orders, quotes, invoices, and delivery records</li>
                <li>To send transactional emails and text messages tied to orders (confirmations, invoices, receipts, delivery updates)</li>
                <li>To pay sales representatives the correct commission</li>
                <li>To send push notifications about new leads or order changes</li>
                <li>To detect, investigate, and prevent fraud or abuse</li>
                <li>To meet our legal obligations (tax records, audits)</li>
              </ul>
              <p>
                We do not sell your personal information. We do not use your data to train third-party AI models. We do not run advertising in the app.
              </p>
            </Section>

            <Section title="Who we share with">
              <p>We share only with vendors that help us operate the service, each bound by their own privacy commitments:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Stripe</strong> — payment processing</li>
                <li><strong>Supabase</strong> — secure database hosting</li>
                <li><strong>Resend</strong> — transactional email delivery</li>
                <li><strong>Twilio</strong> — transactional SMS delivery</li>
                <li><strong>Apple Push Notification Service / Expo</strong> — push notifications</li>
                <li><strong>Anthropic</strong> — AI advisor product recommendations (your message is sent to the model; no account data is shared)</li>
                <li><strong>Vercel</strong> — application hosting</li>
              </ul>
              <p>
                We will also share information when required by law, when needed to prevent harm or fraud, or in the event of a corporate transaction (with the same protections passed to the new owner).
              </p>
            </Section>

            <Section title="How long we keep it">
              <p>
                Account, order, and payment records are retained for the lifetime of the account plus seven (7) additional years to meet tax and accounting requirements. Diagnostic logs are retained for up to 90 days. Push tokens are deleted within 30 days of an account becoming inactive.
              </p>
            </Section>

            <Section title="Your rights">
              <p>
                You can ask us to access, correct, export, or delete your personal information. To make a request, email <a className="underline" href="mailto:info@soilseedandwater.com">info@soilseedandwater.com</a> from the address associated with your account. We will respond within 30 days.
              </p>
              <p>
                If you live in California (CCPA / CPRA), the European Economic Area (GDPR), or another region with equivalent rights, you have additional rights including the right to object to processing and to lodge a complaint with your local regulator.
              </p>
              <p>
                We do not knowingly collect data from anyone under 13. The app is intended only for adults engaged in commercial wholesale.
              </p>
            </Section>

            <Section title="Security">
              <p>
                Data is encrypted in transit (HTTPS / TLS 1.2+) and at rest. Passwords are stored as bcrypt hashes. Production database access is restricted to authenticated server functions and a small number of named administrators. We follow standard secure-development practices but no system is perfectly secure — please use a strong unique password and notify us immediately if you suspect account compromise.
              </p>
            </Section>

            <Section title="Changes to this policy">
              <p>
                We will update the “Last updated” date at the top of this page when we make material changes. If the change affects how we use your data, we will also notify active users by email or in-app message at least 14 days before the change takes effect.
              </p>
            </Section>

            <Section title="Contact us">
              <p>
                Questions about this policy or how we handle your data:
              </p>
              <p>
                Soil Seed &amp; Water<br/>
                1634 N 19th Ave, Phoenix, AZ 85009<br/>
                <a className="underline" href="mailto:info@soilseedandwater.com">info@soilseedandwater.com</a> · (602) 384-9993
              </p>
            </Section>
          </div>
        </div>
      </section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="font-heading font-semibold text-xl md:text-2xl text-[#0A1628] mb-3">{title}</h2>
      <div className="space-y-3">{children}</div>
    </div>
  );
}
