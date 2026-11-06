"use client";
import { useApp } from "@/contexts/AppContext";
import Link from "next/link";
import {
  Heart, ShoppingBag, Phone, Mail, MapPin, Globe, MessageCircle, AtSign
} from "lucide-react";

function InstaPayIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
      <path
        stroke="currentColor"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m21.36 15.869l4.546 7.887l-9.278 8.322m-1.874-16.21l4.547 7.888l-9.278 8.322m21.099-14.913h8.13c2.81 0 4.669 1.96 4.166 4.397c-.504 2.436-3.173 4.397-5.984 4.397h-9.762l-1.896 6.173M9.383 16.016l-.936 3.087m-.995 3.287L4.5 32.132"
      />
    </svg>
  );
}

function VodafoneCashIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12a12 12 0 0 0 12-12A12 12 0 0 0 12 0m4.25 1.12c.32 0 .65.03.86.1c-2.17.45-3.9 2.47-3.89 4.78c0 .05 0 .11.01.17c3.64.89 5.27 3.08 5.27 6.11c.04 3.03-2.36 6.36-6.41 6.37c-3.27.01-6.68-2.79-6.7-7.28C5.38 8.4 7 5.54 9.04 3.85c2-1.66 4.73-2.72 7.21-2.73"
      />
    </svg>
  );
}

export default function Footer() {
  const { t } = useApp();

  const quickLinks = [
    { href: "/", label: t("nav.home") },
    { href: "/products", label: t("nav.products") },
    { href: "/about", label: t("footer.about") },
    { href: "/contact", label: t("footer.contact") },
    { href: "/wishlist", label: t("nav.wishlist") },
    { href: "/cart", label: t("nav.cart") },
  ];

  const payments = [
    { icon: InstaPayIcon, label: "InstaPay", color: "#00A6A6" },
    { icon: VodafoneCashIcon, label: "Vodafone Cash", color: "#E60000" },
  ];

  return (
    <footer className="bg-gradient-to-b from-content via-content to-primary-dark text-white mt-16">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <Link href="/" className="inline-block group">
              <img src="/scarf-dark-logo-removebg-preview.png" alt="Butterfly Scarf" className="h-20 w-auto object-contain group-hover:scale-105 transition-transform" />
            </Link>
            <p className="text-sm text-white/60 mt-4 leading-relaxed">{t("footer.aboutText")}</p>
            <div className="flex items-center gap-3 mt-5">
              <a href="#" className="w-9 h-9 rounded-full bg-white/10 border border-white/15 flex items-center justify-center text-white/70 hover:bg-white/20 hover:text-white transition" aria-label="Instagram">
                <AtSign className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 rounded-full bg-white/10 border border-white/15 flex items-center justify-center text-white/70 hover:bg-white/20 hover:text-white transition" aria-label="Facebook">
                <Globe className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 rounded-full bg-white/10 border border-white/15 flex items-center justify-center text-white/70 hover:bg-white/20 hover:text-white transition" aria-label="Twitter">
                <MessageCircle className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-bold text-white mb-4">{t("footer.quickLinks")}</h3>
            <ul className="space-y-2">
              {quickLinks.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-white/60 hover:text-white transition inline-flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-accent inline-block" />
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-bold text-white mb-4">{t("footer.contact")}</h3>
            <ul className="space-y-3 text-sm text-white/70">
              <li className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-white/10 border border-white/15 flex items-center justify-center flex-shrink-0">
                  <Phone className="w-4 h-4 text-accent" />
                </span>
                <span>01220757043</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-white/10 border border-white/15 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-4 h-4 text-accent" />
                </span>
                <span dir="ltr">hello@butterflyscarf.com</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-white/10 border border-white/15 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-4 h-4 text-accent" />
                </span>
                <span>القاهرة، مصر</span>
              </li>
            </ul>
          </div>

          {/* Payments */}
          <div>
            <h3 className="font-bold text-white mb-4">{t("footer.payment")}</h3>
            <div className="flex flex-wrap gap-2">
              {payments.map((p) => {
                const Icon = p.icon;
                return (
                  <div key={p.label} className="flex items-center gap-2 bg-white/10 border border-white/15 rounded-lg px-3 py-2">
                    <span className="flex items-center justify-center" style={{ color: p.color }}>
                      <Icon className="w-5 h-5" />
                    </span>
                    <span className="text-xs font-bold text-white/80">{p.label}</span>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center gap-2 mt-5 text-xs text-white/50">
              <Heart className="w-3.5 h-3.5 text-danger" />
              <span>Butterfly Scarf</span>
              <ShoppingBag className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 mt-6 pt-4 flex flex-col items-center justify-center gap-3 text-center">
          <a
            href="https://byterank.net"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2.5 bg-white/10 border border-white/15 rounded-full pl-1 pr-3 py-1 hover:bg-white/20 transition"
            dir="ltr"
          >
            <img src="/byterank-logo.jpg" alt="ByteRank" className="w-6 h-6 rounded-full object-cover" />
            <span className="text-[11px] font-bold text-white/80">© {new Date().getFullYear()} All rights reserved to ByteRank</span>
          </a>
        </div>
      </div>
    </footer>
  );
}
