import { SEO } from "@/components/SEO";
import { BSABrandStyles } from "@/components/BSABrandStyles";
import { Mail, Phone, Globe } from "lucide-react";

export default function SupportMyOrganicSoilPage() {
  return (
    <div className="min-h-screen bg-[#F5F2EC] text-[#0A1628]">
      <SEO
        title="App Support — SSW Sales Portal"
        description="Help, FAQs, and contact information for the SSW Sales Portal mobile app."
        url="https://bettersystems.ai/support/myorganicsoil"
      />
      <BSABrandStyles />

      <section className="relative blueprint-grid grain pt-12 pb-16 md:pt-20 md:pb-20 px-4">
        <div className="container mx-auto max-w-7xl relative z-10">
          <div className="font-mono text-xs uppercase tracking-[0.25em] text-[#F26B1F] mb-6">
            / Support · SSW Sales Portal
          </div>
          <h1 className="font-display text-5xl md:text-7xl leading-[0.95] mb-6">
            App Support
          </h1>
          <p className="font-body text-base md:text-lg text-[#0A1628]/70 max-w-2xl">
            Trouble with the SSW Sales Portal app? Start here. Most issues have a quick fix below. If not, reach out and we’ll get back within one business day.
          </p>
        </div>
      </section>

      <section className="px-4 pb-20 md:pb-28">
        <div className="container mx-auto max-w-3xl space-y-10">

          {/* CONTACT CARD */}
          <div className="bg-white border border-[#0A1628]/10 p-6 md:p-8">
            <div className="font-mono text-xs uppercase tracking-widest text-[#0A1628]/70 mb-3">
              / Get in touch
            </div>
            <div className="grid sm:grid-cols-2 gap-4 font-body text-[15px]">
              <a href="mailto:info@soilseedandwater.com" className="flex items-start gap-3 p-3 hover:bg-[#F5F2EC] rounded">
                <Mail className="h-5 w-5 text-[#F26B1F] mt-0.5" />
                <div>
                  <div className="font-semibold">Email</div>
                  <div className="text-[#0A1628]/70">info@soilseedandwater.com</div>
                </div>
              </a>
              <a href="tel:+16023849993" className="flex items-start gap-3 p-3 hover:bg-[#F5F2EC] rounded">
                <Phone className="h-5 w-5 text-[#F26B1F] mt-0.5" />
                <div>
                  <div className="font-semibold">Phone</div>
                  <div className="text-[#0A1628]/70">(602) 384-9993</div>
                </div>
              </a>
              <div className="flex items-start gap-3 p-3">
                <Globe className="h-5 w-5 text-[#F26B1F] mt-0.5" />
                <div>
                  <div className="font-semibold">Hours</div>
                  <div className="text-[#0A1628]/70">Mon–Fri, 8 AM – 5 PM Arizona time</div>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3">
                <div className="h-5 w-5 mt-0.5 text-center text-[#F26B1F] font-bold">⏱</div>
                <div>
                  <div className="font-semibold">Response time</div>
                  <div className="text-[#0A1628]/70">Within 1 business day, usually same day</div>
                </div>
              </div>
            </div>
          </div>

          {/* FAQs */}
          <div className="bg-white border border-[#0A1628]/10 p-8 md:p-12 font-body text-[15px] md:text-base leading-relaxed text-[#0A1628]/90 space-y-8">

            <h2 className="font-display text-3xl md:text-4xl text-[#0A1628]">Common questions</h2>

            <FAQ q="I can’t log in.">
              <p>Make sure you are using the email address your invitation was sent to. Passwords are case-sensitive. If you forgot your password, email <a className="underline" href="mailto:info@soilseedandwater.com">info@soilseedandwater.com</a> and we will reset it within a few hours.</p>
            </FAQ>

            <FAQ q="I haven’t received my TestFlight invite.">
              <p>Check your spam folder for an email from Apple. TestFlight invites can take 5–10 minutes to arrive. If it never lands, confirm with your administrator that your Apple ID email is on the tester list, then resend the invite from App Store Connect.</p>
            </FAQ>

            <FAQ q="How do I place an order?">
              <p>Tap <strong>Order</strong> in the bottom navigation. Walk through the four steps: choose products, set delivery or pickup, attach a customer, then review and submit. You can email a quote, send a paid invoice, or collect payment in person.</p>
            </FAQ>

            <FAQ q="The customer paid the invoice. When does the order show as “Paid”?">
              <p>Within seconds. Stripe sends a payment webhook to our backend the moment the customer pays, and your Orders list and Earnings tab update accordingly. If you don’t see the update, pull-to-refresh the screen.</p>
            </FAQ>

            <FAQ q="Where do I see my commissions?">
              <p>Open the menu (☰ top-left) and tap <strong>Earnings</strong>. You will see the total earned to date, what is pending payout, and a list of every paid order with the commission earned. Tap any row to open the order detail.</p>
            </FAQ>

            <FAQ q="The receipt printer didn’t print.">
              <p>Make sure the yard printer (Star TSP143) is plugged in and powered. If you are off-site, the print server may be offline. Ask the office to power-cycle the printer. As a fallback, use “Send receipt by email” from the same screen.</p>
            </FAQ>

            <FAQ q="The AI Advisor isn’t responding.">
              <p>Check your internet connection. The advisor uses a cloud AI model and times out after about 30 seconds if it can’t reach the server. Try once more; if it still fails, use the order form directly.</p>
            </FAQ>

            <FAQ q="A customer wants a refund.">
              <p>Only administrators can issue refunds. Email the order number to <a className="underline" href="mailto:info@soilseedandwater.com">info@soilseedandwater.com</a> with the reason for the refund and we will process it through Stripe. Once issued, the order shows as <strong>Refunded</strong> and the related commission is reversed.</p>
            </FAQ>

            <FAQ q="Can I use the app on my Android phone?">
              <p>The iOS version is live on TestFlight today. An Android build is on the roadmap. Until then, you can use the web admin at <a className="underline" href="https://myorganicsoil.com">myorganicsoil.com</a> from a mobile browser.</p>
            </FAQ>

            <FAQ q="Where is my data stored?">
              <p>All app data is stored in a Soil Seed &amp; Water Supabase project hosted in AWS US-East-1. Payment details are handled by Stripe and never stored on our servers. See our <a className="underline" href="/privacy/myorganicsoil">Privacy Policy</a> for the full breakdown.</p>
            </FAQ>

          </div>

          <div className="text-center font-body text-sm text-[#0A1628]/60">
            Built and maintained by <a className="underline" href="https://bettersystems.ai">Better Systems AI</a> for Soil Seed &amp; Water.
          </div>
        </div>
      </section>
    </div>
  );
}

function FAQ({ q, children }: { q: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="font-heading font-semibold text-lg md:text-xl text-[#0A1628] mb-2">{q}</h3>
      <div className="space-y-2 text-[#0A1628]/85">{children}</div>
    </div>
  );
}
