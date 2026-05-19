import { Link, useLocation } from "wouter";
import { Linkedin, Phone, Mail, MapPin, ArrowUpRight } from "lucide-react";
import { useEffect } from "react";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const [, navigate] = useLocation();

  // Hidden admin shortcut: Ctrl/Cmd + Shift + A
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "A") {
        e.preventDefault();
        navigate("/admin/login");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [navigate]);

  return (
    <footer className="bg-[#0A1628] text-white relative overflow-hidden">
      {/* Top spec line */}
      <div className="border-b border-white/10">
        <div className="container mx-auto px-4 py-3 flex flex-wrap justify-between items-center gap-2 font-mono text-[10px] md:text-xs uppercase tracking-widest text-white/55">
          <div>[ Better Systems AI · Phoenix, AZ ]</div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#F26B1F]" />
            Booking calls now
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
          {/* Brand block */}
          <div className="md:col-span-4">
            <div className="font-display text-2xl md:text-3xl mb-3 leading-tight">
              Better Systems AI
            </div>
            <p className="font-body text-base text-white/70 max-w-sm mb-6 leading-relaxed">
              A small Phoenix studio that builds custom software with AI for the businesses software usually skips.
            </p>
            <Link
              href="/book"
              className="inline-flex items-center gap-2 bg-[#F26B1F] hover:bg-[#FF8742] text-white px-5 py-3 font-heading font-bold uppercase tracking-wide text-sm transition-colors"
            >
              Book a call <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Sitemap */}
          <div className="md:col-span-2">
            <div className="font-mono text-[10px] uppercase tracking-widest text-[#F26B1F] mb-4">/ Site</div>
            <ul className="space-y-2.5 font-body">
              <li><Link href="/" className="text-white/80 hover:text-[#F26B1F] transition-colors">Home</Link></li>
              <li><Link href="/services" className="text-white/80 hover:text-[#F26B1F] transition-colors">Services & Pricing</Link></li>
              <li><Link href="/about" className="text-white/80 hover:text-[#F26B1F] transition-colors">About</Link></li>
              <li><Link href="/learn" className="text-white/80 hover:text-[#F26B1F] transition-colors">Learn</Link></li>
              <li><Link href="/partners" className="text-white/80 hover:text-[#F26B1F] transition-colors">Partners</Link></li>
              <li><Link href="/contact" className="text-white/80 hover:text-[#F26B1F] transition-colors">Contact</Link></li>
            </ul>
          </div>

          {/* SSW Sales Portal app */}
          <div className="md:col-span-3">
            <div className="font-mono text-[10px] uppercase tracking-widest text-[#F26B1F] mb-4">/ SSW Sales Portal</div>
            <ul className="space-y-2.5 font-body">
              <li><Link href="/privacy/myorganicsoil" className="text-white/80 hover:text-[#F26B1F] transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms/myorganicsoil" className="text-white/80 hover:text-[#F26B1F] transition-colors">Terms of Service</Link></li>
              <li><Link href="/support/myorganicsoil" className="text-white/80 hover:text-[#F26B1F] transition-colors">App Support</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div className="md:col-span-3">
            <div className="font-mono text-[10px] uppercase tracking-widest text-[#F26B1F] mb-4">/ Contact</div>
            <ul className="space-y-3 font-body">
              <li className="flex items-start gap-3">
                <Phone className="h-4 w-4 text-white/60 mt-1 shrink-0" />
                <a href="tel:+16026370032" className="text-white/85 hover:text-[#F26B1F] transition-colors">
                  (602) 637-0032
                </a>
              </li>
              <li className="flex items-start gap-3">
                <Mail className="h-4 w-4 text-white/60 mt-1 shrink-0" />
                <a href="mailto:rodolfo@bettersystems.ai" className="text-white/85 hover:text-[#F26B1F] transition-colors break-all">
                  rodolfo@bettersystems.ai
                </a>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-white/60 mt-1 shrink-0" />
                <div className="text-white/85">
                  Phoenix, AZ<br />
                  <span className="font-mono text-xs text-white/55">Mon–Fri 9am–5pm MST</span>
                </div>
              </li>
            </ul>

            <a
              href="https://linkedin.com/in/rodolfoalvarez"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-6 text-white/70 hover:text-[#F26B1F] transition-colors font-mono text-xs uppercase tracking-widest"
              aria-label="LinkedIn"
            >
              <Linkedin className="h-4 w-4" /> LinkedIn
            </a>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="container mx-auto px-4 py-5 flex flex-col md:flex-row justify-between items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-white/45">
          <div>© {currentYear} Better Systems AI. All rights reserved.</div>
          <div className="flex items-center gap-3">
            <span>Built in Phoenix</span>
            <Link
              href="/admin/login"
              className="opacity-0 hover:opacity-50 transition-opacity"
              title="Admin"
              aria-label="Admin"
            >
              ·
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
