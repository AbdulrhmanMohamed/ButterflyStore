"use client";
import { useState } from "react";
import { useApp } from "@/contexts/AppContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PageHeader from "@/components/ui/PageHeader";
import { Phone, Mail, MapPin, MessageCircle, Send, Clock, User } from "lucide-react";

export default function ContactPage() {
  const { t, notify } = useApp();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");

  const infoCards = [
    { icon: Phone, label: t("footer.phoneLabel"), value: "01220757043", dir: "ltr" as const },
    { icon: Mail, label: t("footer.emailLabel"), value: "hello@butterflyscarf.com", dir: "ltr" as const },
    { icon: MapPin, label: t("footer.addressLabel"), value: "القاهرة، مصر", dir: "rtl" as const },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !message.trim()) return;
    notify(t("contact.formSuccess"));
    setName("");
    setPhone("");
    setMessage("");
  };

  const inputCls =
    "w-full bg-surface/50 border border-border/40 rounded-xl px-4 py-3 text-sm text-content placeholder:text-content-muted/50 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition";

  return (
    <div className="min-h-screen bg-surface">
      <Header />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <PageHeader
          badge={t("home.heroBadge")}
          title={t("contact.title")}
          subtitle={t("contact.subtitle")}
          icon={<MessageCircle className="w-7 h-7 text-white" />}
        />

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Info side */}
          <div className="lg:col-span-2 space-y-4">
            {infoCards.map((c) => {
              const Icon = c.icon;
              return (
                <div key={c.label} className="bg-white rounded-2xl border border-border/30 shadow-sm p-5 flex items-center gap-4 hover:shadow-md hover:-translate-y-0.5 transition-all">
                  <span className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-primary" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs text-content-muted">{c.label}</p>
                    <p className="text-sm font-bold text-content mt-0.5" dir={c.dir}>{c.value}</p>
                  </div>
                </div>
              );
            })}

            {/* WhatsApp CTA */}
            <a
              href="https://wa.me/201220757043"
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-[#25D366] text-white rounded-2xl p-5 hover:shadow-lg hover:shadow-[#25D366]/30 hover:-translate-y-0.5 transition-all"
            >
              <div className="flex items-center gap-4">
                <span className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
                  <MessageCircle className="w-6 h-6" />
                </span>
                <div>
                  <p className="font-bold text-sm">{t("contact.whatsapp")}</p>
                  <p className="text-white/80 text-xs mt-0.5">{t("contact.whatsappDesc")}</p>
                </div>
              </div>
            </a>

            {/* Hours */}
            <div className="bg-white rounded-2xl border border-border/30 shadow-sm p-5">
              <p className="font-bold text-content text-sm flex items-center gap-2 mb-4">
                <Clock className="w-4 h-4 text-primary" />
                {t("contact.hoursTitle")}
              </p>
              <div className="space-y-3">
                {[
                  { day: t("contact.hoursWeek"), time: t("contact.hoursWeekTime") },
                  { day: t("contact.hoursFriday"), time: t("contact.hoursFridayTime") },
                ].map((h) => (
                  <div key={h.day} className="flex items-center justify-between bg-surface/50 rounded-xl px-4 py-3">
                    <span className="text-sm text-content-muted">{h.day}</span>
                    <span className="text-sm font-bold text-content">{h.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="lg:col-span-3 bg-white rounded-3xl border border-border/30 shadow-sm p-8 md:p-10">
            <span className="inline-flex items-center gap-2 bg-gradient-to-r from-primary/10 to-accent/10 text-primary text-xs font-bold px-4 py-1.5 rounded-full">
              <Send className="w-3.5 h-3.5" />
              {t("contact.formTitle")}
            </span>

            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              <div>
                <label className="text-sm text-content-muted block mb-1.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" />
                  {t("contact.formName")}
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputCls}
                  placeholder={t("contact.formName")}
                  required
                />
              </div>
              <div>
                <label className="text-sm text-content-muted block mb-1.5 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5" />
                  {t("contact.formPhone")}
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={inputCls}
                  placeholder="01XXXXXXXXX"
                  dir="ltr"
                  required
                />
              </div>
              <div>
                <label className="text-sm text-content-muted block mb-1.5">{t("contact.formMessage")}</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className={`${inputCls} resize-none`}
                  rows={5}
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-accent to-primary text-white py-3.5 rounded-full font-bold hover:shadow-lg hover:shadow-accent/30 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                {t("contact.formSend")}
              </button>
            </form>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
