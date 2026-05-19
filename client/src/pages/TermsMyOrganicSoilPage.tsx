import { SEO } from "@/components/SEO";
import { BSABrandStyles } from "@/components/BSABrandStyles";

export default function TermsMyOrganicSoilPage() {
  return (
    <div className="min-h-screen bg-[#F5F2EC] text-[#0A1628]">
      <SEO
        title="Terms of Service — SSW Sales Portal"
        description="The terms that govern your use of the SSW Sales Portal app and related services."
        url="https://bettersystems.ai/terms/myorganicsoil"
      />
      <BSABrandStyles />

      <section className="relative blueprint-grid grain pt-12 pb-16 md:pt-20 md:pb-20 px-4">
        <div className="container mx-auto max-w-7xl relative z-10">
          <div className="font-mono text-xs uppercase tracking-[0.25em] text-[#F26B1F] mb-6">
            / Legal · SSW Sales Portal
          </div>
          <h1 className="font-display text-5xl md:text-7xl leading-[0.95] mb-6">
            Terms of Service
          </h1>
          <p className="font-body text-base md:text-lg text-[#0A1628]/70">
            Last updated: May 2026
          </p>
        </div>
      </section>

      <section className="px-4 pb-20 md:pb-28">
        <div className="container mx-auto max-w-3xl">
          <div className="bg-white border border-[#0A1628]/10 p-8 md:p-12 font-body text-[15px] md:text-base leading-relaxed text-[#0A1628]/90 space-y-8">

            <Section title="1. Acceptance">
              <p>
                By creating an account or using the SSW Sales Portal app (the “app”), you agree to these terms. If you do not agree, do not use the app. These terms form a binding agreement between you and <strong>Soil Seed &amp; Water</strong>, an Arizona business operating at 1634 N 19th Ave, Phoenix, AZ 85009.
              </p>
            </Section>

            <Section title="2. License to use the app">
              <p>
                Subject to your continued compliance with these terms, Soil Seed &amp; Water grants you a limited, revocable, non-exclusive, non-transferable license to install and use the app on devices you own or control, solely for the purpose of conducting authorized business with Soil Seed &amp; Water (placing orders, managing customer relationships, tracking commissions, etc.).
              </p>
              <p>
                You may not reverse-engineer, copy, resell, sublicense, or attempt to extract source code from the app. You may not use the app to compete with Soil Seed &amp; Water or to harvest customer data for any third party.
              </p>
            </Section>

            <Section title="3. Accounts and credentials">
              <p>
                You are responsible for keeping your credentials confidential and for all activity under your account. Notify us immediately at <a className="underline" href="mailto:info@soilseedandwater.com">info@soilseedandwater.com</a> if you believe your account has been compromised. We may suspend or terminate access if we reasonably believe the account is being misused.
              </p>
            </Section>

            <Section title="4. Orders, pricing, and payment">
              <p>
                Prices shown in the app are the current wholesale rates and may change at any time without notice. Rates listed in a quote are valid through the quote’s stated expiration date. Sales tax is applied where required by law.
              </p>
              <p>
                Orders are not confirmed until payment (or an approved deposit) is received. Payment is collected through Stripe or, where supported, in-person via Apple’s Tap to Pay on iPhone. By submitting payment information you agree to Stripe’s terms of service.
              </p>
            </Section>

            <Section title="5. Returns and refunds">
              <p>
                Returns of physical product are subject to product condition and the standard return policy posted at <a className="underline" href="https://soilseedandwater.com">soilseedandwater.com</a>. Refunds are issued back to the original payment method. We may approve a partial or full refund at our discretion when product is damaged in transit, mis-shipped, or does not meet the agreed specification.
              </p>
            </Section>

            <Section title="6. Acceptable use">
              <p>You agree NOT to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Use the app for any unlawful purpose</li>
                <li>Submit false, misleading, or fraudulent order or customer information</li>
                <li>Attempt to access another user’s account or data</li>
                <li>Interfere with the operation of the app, its security, or its underlying infrastructure</li>
                <li>Use the app to harass, defame, or harm any person</li>
              </ul>
            </Section>

            <Section title="7. Intellectual property">
              <p>
                The app, including its software, design, content, and trademarks (“Soil Seed &amp; Water,” the SSW logo), is owned by Soil Seed &amp; Water and its licensors. Nothing in these terms transfers any ownership rights to you.
              </p>
            </Section>

            <Section title="8. Disclaimers">
              <p className="uppercase text-sm">
                The app is provided “as is” and “as available,” without warranties of any kind, whether express or implied. Soil Seed &amp; Water and Better Systems AI disclaim all warranties of merchantability, fitness for a particular purpose, title, non-infringement, and any warranties arising from course of dealing or usage of trade.
              </p>
              <p>
                The AI Advisor feature provides general suggestions, not professional agronomy advice. You are responsible for confirming the suitability of any product for your specific application.
              </p>
            </Section>

            <Section title="9. Limitation of liability">
              <p className="uppercase text-sm">
                To the maximum extent permitted by law, Soil Seed &amp; Water’s total liability arising from or related to your use of the app will not exceed the greater of (a) the amount you paid Soil Seed &amp; Water in the 12 months preceding the claim or (b) one hundred US dollars ($100). We are not liable for indirect, incidental, special, consequential, or punitive damages.
              </p>
            </Section>

            <Section title="10. Indemnification">
              <p>
                You agree to defend, indemnify, and hold harmless Soil Seed &amp; Water, Better Systems AI, and their officers, employees, and contractors from any claim or demand arising out of your breach of these terms or your misuse of the app.
              </p>
            </Section>

            <Section title="11. Termination">
              <p>
                Either party may terminate this agreement at any time. We may suspend or terminate your access immediately if we believe you have violated these terms. Sections 5 through 12 survive termination.
              </p>
            </Section>

            <Section title="12. Governing law">
              <p>
                These terms are governed by the laws of the State of Arizona, USA, without regard to its conflict-of-law principles. Any dispute will be brought in the state or federal courts located in Maricopa County, Arizona, and you consent to personal jurisdiction there.
              </p>
            </Section>

            <Section title="13. App Store terms">
              <p>
                If you obtained the app through Apple’s App Store or TestFlight, you also agree to Apple’s Licensed Application End User License Agreement (<a className="underline" href="https://www.apple.com/legal/internet-services/itunes/dev/stdeula/" target="_blank" rel="noopener noreferrer">view EULA</a>). Apple is not a party to this agreement and is not responsible for the app or any claims related to it.
              </p>
            </Section>

            <Section title="14. Changes">
              <p>
                We may update these terms from time to time. We will update the “Last updated” date at the top and, for material changes, give active users at least 14 days’ notice. Continuing to use the app after a change means you accept the new terms.
              </p>
            </Section>

            <Section title="15. Contact">
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
