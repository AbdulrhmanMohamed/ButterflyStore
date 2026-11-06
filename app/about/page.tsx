"use client";
import { useApp } from "@/contexts/AppContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PageHeader from "@/components/ui/PageHeader";
import { Sparkles, Truck, ShieldCheck, CreditCard, Headphones, Target } from "lucide-react";

export default function AboutPage() {
  const { t } = useApp();

  const stats = [
    { value: "2019", label: t("about.statsYears") },
    { value: "+1,200", label: t("about.statsCustomers") },
    { value: "+50", label: t("about.statsItems") },
    { value: "+8,000", label: t("about.statsShawls") },
  ];

  const values = [
    { icon: Truck, title: t("home.features.delivery"), desc: t("home.features.deliveryDesc") },
    { icon: ShieldCheck, title: t("home.features.quality"), desc: t("home.features.qualityDesc") },
    { icon: CreditCard, title: t("home.features.payment"), desc: t("home.features.paymentDesc") },
    { icon: Headphones, title: t("home.features.support"), desc: t("home.features.supportDesc") },
  ];

  return (
    <div className="min-h-screen bg-surface">
      <Header />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <PageHeader
          badge={t("about.subtitle")}
          title={t("about.title")}
          icon={<Sparkles className="w-7 h-7 text-white" />}
        />

        {/* Story */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-3xl border border-border/30 shadow-sm p-8 md:p-10">
            <span className="inline-flex items-center gap-2 bg-gradient-to-r from-primary/10 to-accent/10 text-primary text-xs font-bold px-4 py-1.5 rounded-full">
              ✦ {t("about.storyTitle")}
            </span>
            <h2 className="text-2xl md:text-3xl font-bold text-content mt-4 leading-snug">
              {t("about.subtitle")} 🦋
            </h2>
            <p className="text-content-muted leading-relaxed mt-4">{t("about.storyText")}</p>

            <div className="mt-8 flex items-start gap-4 bg-surface/50 border border-border/30 rounded-2xl p-5">
              <span className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
                <Target className="w-6 h-6 text-white" />
              </span>
              <div>
                <h3 className="font-bold text-content">{t("about.missionTitle")}</h3>
                <p className="text-sm text-content-muted mt-1 leading-relaxed">{t("about.missionText")}</p>
              </div>
            </div>
          </div>

          {/* Decorative panel */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-content via-primary-dark to-primary text-white p-8 md:p-10 flex flex-col justify-between min-h-[24rem]">
            <div className="absolute -top-20 -end-20 w-64 h-64 rounded-full bg-accent/25 blur-3xl" />
            <div className="absolute -bottom-24 -start-16 w-72 h-72 rounded-full bg-accent/15 blur-3xl" />
            <div className="relative">
              <span className="inline-flex items-center gap-2 bg-white/10 border border-white/15 text-xs font-bold px-4 py-1.5 rounded-full backdrop-blur">
                ✦ {t("about.valuesTitle")}
              </span>
              <div className="mt-8 grid grid-cols-1 gap-3">
                {values.map((v) => {
                  const Icon = v.icon;
                  return (
                    <div key={v.title} className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur">
                      <span className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-5 h-5 text-accent-light" />
                      </span>
                      <div>
                        <p className="font-bold text-sm">{v.title}</p>
                        <p className="text-white/60 text-xs mt-0.5">{v.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((s, i) => (
            <div
              key={s.label}
              className="bg-white rounded-3xl border border-border/30 shadow-sm p-6 text-center hover:shadow-md hover:-translate-y-1 transition-all animate-fade-in-up"
              style={{ animationDelay: `${i * 0.07}s` }}
            >
              <p className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">{s.value}</p>
              <p className="text-sm text-content-muted mt-2">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
}
