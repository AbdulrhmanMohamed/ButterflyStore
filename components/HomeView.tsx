"use client";
import { useState, useEffect, useMemo } from "react";
import { useApp } from "@/contexts/AppContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import Link from "next/link";
import {
  Search, ArrowLeft, Star, Sparkles, Truck, ShieldCheck, CreditCard, Headphones,
  ShoppingBag, Phone, Video, MoreHorizontal, ChevronLeft, ChevronRight
} from "lucide-react";
import type { Company, Category, Product, Variant } from "@/lib/types";

function getDescendantIds(categories: Category[], companyId: string, parentId: string): string[] {
  const children = categories
    .filter((c) => c.companyId === companyId && c.parentId === parentId)
    .map((c) => c.id);
  return [...children, ...children.flatMap((cid) => getDescendantIds(categories, companyId, cid))];
}

export default function HomeView({
  companies,
  categories,
  products,
  variants,
}: {
  companies: Company[];
  categories: Category[];
  products: Product[];
  variants: Variant[];
}) {
  const { t, lang } = useApp();
  const [tab, setTab] = useState<"latest" | "offers">("latest");
  const [search, setSearch] = useState("");
  const [selectedCompany, setSelectedCompany] = useState<string | null>(companies[0]?.id || null);

  const [tmIndex, setTmIndex] = useState(0);
  const [perView, setPerView] = useState(3);
  const [tmPaused, setTmPaused] = useState(false);

  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      setPerView(w >= 1024 ? 3 : w >= 640 ? 2 : 1);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const companyName = (c: any) => (lang === "ar" ? c.name : c.nameEn || c.name) || c.name;
  const catName = (c: any) => (lang === "ar" ? c.name : c.nameEn || c.name) || c.name;
  const prodName = (p: any) => (lang === "ar" ? p.name : p.nameEn || p.name) || p.name || "بدون اسم";

  const variantsByProduct = (productId: string) => variants.filter((v) => v.productId === productId);

  // Company-first: categories filtered by selected company
  const topCategories = useMemo(() => {
    const base = categories.filter((c) => !c.parentId);
    return selectedCompany ? base.filter((c) => c.companyId === selectedCompany) : base;
  }, [categories, selectedCompany]);

  const categoryCards = useMemo(() => {
    return topCategories.map((cat) => {
      const ids = [cat.id, ...getDescendantIds(categories, cat.companyId, cat.id)];
      const catProducts = products.filter((p) => ids.includes(p.categoryId));
      const img = catProducts.find((p) => p.images?.[0])?.images?.[0] || "";
      return { ...cat, count: catProducts.length, image: img };
    });
  }, [topCategories, categories, products]);

  const heroProduct = useMemo(() => products.find((p) => p.images?.[0]) || null, [products]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) window.location.href = `/products?search=${encodeURIComponent(search.trim())}`;
  };

  const features = [
    { icon: Truck, title: t("home.features.delivery"), desc: t("home.features.deliveryDesc") },
    { icon: ShieldCheck, title: t("home.features.quality"), desc: t("home.features.qualityDesc") },
    { icon: CreditCard, title: t("home.features.payment"), desc: t("home.features.paymentDesc") },
    { icon: Headphones, title: t("home.features.support"), desc: t("home.features.supportDesc") },
  ];

  const testimonials = [
    {
      name: t("home.testimonial1Name"),
      order: t("home.testimonial1Order"),
      time: t("home.testimonial1Time"),
      text: t("home.testimonial1"),
      reply: t("home.testimonial1Reply"),
      avatar: "/images/avatars/1820575.jpeg",
    },
    {
      name: t("home.testimonial2Name"),
      order: t("home.testimonial2Order"),
      time: t("home.testimonial2Time"),
      text: t("home.testimonial2"),
      reply: t("home.testimonial2Reply"),
      avatar: "/images/avatars/698532.jpeg",
    },
    {
      name: t("home.testimonial3Name"),
      order: t("home.testimonial3Order"),
      time: t("home.testimonial3Time"),
      text: t("home.testimonial3"),
      reply: t("home.testimonial3Reply"),
      avatar: "/images/avatars/6102841.jpeg",
    },
    {
      name: t("home.testimonial4Name"),
      order: t("home.testimonial4Order"),
      time: t("home.testimonial4Time"),
      text: t("home.testimonial4"),
      reply: t("home.testimonial4Reply"),
      avatar: "/images/avatars/25713203.png",
    },
    {
      name: t("home.testimonial5Name"),
      order: t("home.testimonial5Order"),
      time: t("home.testimonial5Time"),
      text: t("home.testimonial5"),
      reply: t("home.testimonial5Reply"),
      avatar: "/images/avatars/9587135.jpeg",
    },
    {
      name: t("home.testimonial6Name"),
      order: t("home.testimonial6Order"),
      time: t("home.testimonial6Time"),
      text: t("home.testimonial6"),
      reply: t("home.testimonial6Reply"),
      avatar: "/images/avatars/25713204.png",
    },
  ];

  const tmMaxIndex = Math.max(0, testimonials.length - perView);

  useEffect(() => {
    setTmIndex((i) => Math.min(i, tmMaxIndex));
  }, [tmMaxIndex]);

  useEffect(() => {
    if (tmPaused || tmMaxIndex === 0) return;
    const id = window.setInterval(() => {
      setTmIndex((i) => (i >= tmMaxIndex ? 0 : i + 1));
    }, 5000);
    return () => window.clearInterval(id);
  }, [tmPaused, tmMaxIndex, testimonials.length]);

  const marqueeItems = [
    t("home.features.delivery"), t("home.features.quality"), t("home.features.payment"),
    t("home.features.support"), t("home.heroBadge"), t("home.statsProducts"),
  ];

  // Company-first: products filtered by selected company
  const companyProducts = useMemo(() => {
    return selectedCompany ? products.filter((p) => p.companyId === selectedCompany) : products;
  }, [products, selectedCompany]);

  const featuredProducts = useMemo(() => {
    const base = companyProducts;
    return tab === "latest" ? base : base.filter((p) => p.discountPercentage > 0);
  }, [companyProducts, tab]);

  return (
    <div className="min-h-screen bg-surface">
      <Header />

      {/* ============ HERO ============ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-dark via-primary to-primary-light">
        {heroProduct?.images?.[0] && (
          <img
            src={heroProduct.images[0]}
            alt={prodName(heroProduct)}
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-content/50 via-content/70 to-content/95" />
        <div className="absolute inset-0 bg-gradient-to-t from-content/40 via-transparent to-transparent" />

        <div className="relative max-w-7xl mx-auto px-4 pt-20 pb-24 lg:pt-28 lg:pb-32">
          <div className="max-w-3xl mx-auto text-center">
            <span className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white/90 text-xs font-medium px-4 py-1.5 rounded-full backdrop-blur animate-fade-in-up">
              <Sparkles className="w-3.5 h-3.5 text-accent-light" />
              {t("home.heroBadge")}
            </span>

            <h1 className="mt-6 text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
              {t("home.heroTitle1")}
              <span className="block bg-gradient-to-r from-accent-light to-accent bg-clip-text text-transparent">
                {t("home.heroTitle2")}
              </span>
            </h1>

            <p className="mt-6 text-white/75 text-base md:text-lg leading-relaxed max-w-xl mx-auto animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
              {t("home.heroSubtitle")}
            </p>

            {/* CTAs */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3 animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
              <Link href="/products" className="inline-flex items-center gap-2 bg-accent text-white px-8 py-3.5 rounded-full font-bold hover:bg-accent-light transition shadow-lg shadow-accent/30">
                <ShoppingBag className="w-4 h-4" />
                {t("home.shopNow")}
              </Link>
              <a href="#categories" className="inline-flex items-center gap-2 bg-white/10 border border-white/25 text-white px-8 py-3.5 rounded-full font-bold hover:bg-white/20 transition backdrop-blur">
                {t("home.browseCollections")}
                <ArrowLeft className="w-4 h-4" />
              </a>
            </div>

            {/* Stats */}
            <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 max-w-lg mx-auto animate-fade-in-up" style={{ animationDelay: "0.5s" }}>
              {[
                { value: products.length, label: t("home.statsProducts") },
                { value: companies.length, label: t("home.statsCompanies") },
                { value: topCategories.length, label: t("home.statsCategories") },
                { value: "4.9", label: t("home.statsClients") },
              ].map((s) => (
                <div key={s.label} className="text-center rounded-2xl bg-white/5 backdrop-blur border border-white/10 px-2 py-3">
                  <p className="text-2xl md:text-3xl font-bold text-white">{s.value}</p>
                  <p className="text-[11px] text-white/60 mt-1">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============ MARQUEE ============ */}
      <div className="bg-content text-white/80 py-3 overflow-hidden border-y border-white/5">
        <div className="flex whitespace-nowrap animate-marquee gap-12 w-max">
          {[...Array(2)].map((_, k) => (
            <div key={k} className="flex gap-12">
              {marqueeItems.map((item, i) => (
                <span key={i} className="inline-flex items-center gap-3 text-sm">
                  <Sparkles className="w-3.5 h-3.5 text-accent" />
                  {item}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4">
        {/* ============ FEATURES ============ */}
        <section className="py-12 md:py-16">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="bg-white rounded-2xl border border-border/30 p-5 flex items-start gap-4 hover:shadow-md hover:-translate-y-1 transition-all duration-300">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-content text-sm">{f.title}</h3>
                    <p className="text-xs text-content-muted mt-1">{f.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ============ COMPANIES (Company-first selector) ============ */}
        {companies.length > 0 && (
          <section className="py-8 md:py-12">
            <h2 className="text-2xl md:text-3xl font-bold text-content mb-2 text-center">{t("home.brandsTitle")}</h2>
            <p className="text-content-muted text-sm text-center mb-6">اختر شركة لعرض تصنيفاتها ومنتجاتها</p>
            <div className="flex flex-wrap justify-center gap-3 mb-8">
              <button onClick={() => setSelectedCompany(null)} className={`px-5 py-2.5 rounded-full text-sm font-bold border transition ${!selectedCompany ? "bg-primary text-white border-primary shadow" : "bg-white text-content-muted border-border/30 hover:border-primary/40"}`}>الكل</button>
              {companies.filter((c) => c.active !== false).map((comp) => (
                <button key={comp.id} onClick={() => setSelectedCompany(comp.id)} className={`px-5 py-2.5 rounded-full text-sm font-bold border transition ${selectedCompany === comp.id ? "bg-primary text-white border-primary shadow" : "bg-white text-content-muted border-border/30 hover:border-primary/40"}`}>{companyName(comp)}</button>
              ))}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {companies.filter((c) => c.active !== false).map((comp) => {
                const count = products.filter((p) => p.companyId === comp.id).length;
                const catCount = categories.filter((c) => c.companyId === comp.id && !c.parentId).length;
                const logoChar = (comp.name || "B").charAt(0);
                const active = selectedCompany === comp.id;
                return (
                  <button
                    key={comp.id}
                    onClick={() => setSelectedCompany(comp.id)}
                    className={`group bg-white rounded-2xl border p-6 text-center hover:shadow-lg hover:-translate-y-1 transition-all duration-300 ${active ? "border-primary ring-2 ring-primary/20 shadow-lg" : "border-border/30"}`}
                  >
                    {comp.logo ? (
                      <img src={comp.logo} alt={comp.name} className="w-16 h-16 mx-auto rounded-full object-cover mb-3" />
                    ) : (
                      <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-primary to-accent text-white text-2xl font-bold flex items-center justify-center mb-3">
                        {logoChar}
                      </div>
                    )}
                    <h3 className={`font-bold transition ${active ? "text-primary" : "text-content group-hover:text-primary"}`}>{companyName(comp)}</h3>
                    <p className="text-xs text-content-muted mt-1">{catCount} تصنيفات • {count} {t("admin.products")}</p>
                    <span className={`mt-3 inline-flex text-xs font-bold ${active ? "text-primary" : "text-accent"}`}>{active ? "محدد ✓" : "عرض →"}</span>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* ============ CATEGORIES (filtered by company) ============ */}
        <section id="categories" className="py-8 md:py-12">
          <div className="flex items-end justify-between mb-8">
            <div>
              <span className="text-accent text-sm font-bold">✦ {selectedCompany ? companyName(companies.find(c=>c.id===selectedCompany)) : t("home.heroBadge")}</span>
              <h2 className="text-2xl md:text-3xl font-bold text-content mt-1">{t("home.categoriesTitle")}{selectedCompany ? ` — ${companyName(companies.find(c=>c.id===selectedCompany))}` : ""}</h2>
            </div>
            <Link href={selectedCompany ? `/products?company=${selectedCompany}` : "/products"} className="hidden md:inline-flex items-center gap-2 text-sm text-accent hover:underline">
              {t("products.browseProducts")}
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {categoryCards.map((cat, i) => (
              <Link
                key={cat.id}
                href={`/products?company=${cat.companyId}&category=${cat.id}`}
                className="group relative rounded-2xl overflow-hidden aspect-[3/4] md:aspect-[4/5] animate-fade-in-up"
                style={{ animationDelay: `${i * 0.08}s` }}
              >
                <img
                  src={cat.image}
                  alt={catName(cat)}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-content/90 via-content/30 to-transparent" />
                <div className="absolute bottom-0 inset-x-0 p-5">
                  <p className="text-xs text-white/70">{cat.count} {t("admin.products")}</p>
                  <h3 className="text-lg md:text-xl font-bold text-white mt-1">{catName(cat)}</h3>
                  <span className="mt-3 inline-flex items-center gap-2 text-xs text-white bg-white/15 backdrop-blur px-3 py-1.5 rounded-full opacity-0 group-hover:opacity-100 transition">
                    {t("home.shopNow")}
                    <ArrowLeft className="w-3 h-3" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ============ PRODUCTS TABS ============ */}
        <section className="py-8 md:py-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <span className="text-accent text-sm font-bold">✦ {t("home.statsProducts")}</span>
              <h2 className="text-2xl md:text-3xl font-bold text-content mt-1">
                {tab === "latest" ? t("home.newArrivalsTitle") : t("home.offersTitle")}
              </h2>
            </div>
            <div className="inline-flex bg-white rounded-full border border-border/30 p-1 self-start md:self-auto">
              <button
                onClick={() => setTab("latest")}
                className={`px-5 py-2 rounded-full text-sm font-bold transition ${tab === "latest" ? "bg-primary text-white shadow" : "text-content-muted hover:text-content"}`}
              >
                {t("home.newArrivalsTitle")}
              </button>
              <button
                onClick={() => setTab("offers")}
                className={`px-5 py-2 rounded-full text-sm font-bold transition ${tab === "offers" ? "bg-danger text-white shadow" : "text-content-muted hover:text-content"}`}
              >
                {t("home.offersTitle")}
              </button>
            </div>
          </div>

          {featuredProducts.length === 0 ? (
            <div className="text-center py-12 text-content-muted">{t("products.noProducts")}</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {featuredProducts.map((p) => {
                const cat = categories.find((c) => c.id === p.categoryId);
                const comp = companies.find((c) => c.id === p.companyId);
                return (
                  <ProductCard
                    key={p.id}
                    id={p.id}
                    name={prodName(p)}
                    price={p.price}
                    discountPercentage={p.discountPercentage}
                    images={p.images}
                    category={`${comp ? companyName(comp) : ""} - ${cat ? catName(cat) : ""}`}
                    variants={variantsByProduct(p.id)}
                  />
                );
              })}
            </div>
          )}
        </section>

        {/* ============ PROMO BANNER ============ */}
        <section className="py-8 md:py-12">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary-dark via-primary to-accent p-6 sm:p-8 md:p-14 text-white">
            <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute -bottom-20 -left-10 w-72 h-72 rounded-full bg-accent/30 blur-2xl" />
            <div className="relative grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div>
                <span className="inline-block bg-white/15 border border-white/25 text-xs font-bold px-4 py-1.5 rounded-full backdrop-blur">
                  ✦ {t("home.promoBadge")}
                </span>
                <h3 className="text-3xl md:text-4xl font-bold mt-4">{t("home.promoTitle")}</h3>
                <p className="text-white/70 mt-3 max-w-md leading-relaxed">{t("home.promoSubtitle")}</p>
                <Link href="/products" className="mt-6 inline-flex items-center gap-2 bg-white text-primary px-8 py-3.5 rounded-full font-bold hover:bg-surface transition shadow-xl">
                  {t("home.promoCta")}
                  <ArrowLeft className="w-4 h-4" />
                </Link>
              </div>
              <div className="hidden md:flex justify-center">
                <div className="relative">
                  <div className="w-40 h-40 bg-white/10 rounded-full flex items-center justify-center">
                    <div className="w-28 h-28 bg-white/20 rounded-full flex items-center justify-center text-5xl">🦋</div>
                  </div>
                  <span className="absolute -top-2 -right-2 bg-white text-danger text-xs font-black px-3 py-1.5 rounded-full animate-float">
                    20% OFF
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============ TESTIMONIALS ============ */}
        <section className="py-8 md:py-12">
          <div className="text-center mb-10">
            <span className="text-accent text-sm font-bold">✦ ✦ ✦</span>
            <h2 className="text-2xl md:text-3xl font-bold text-content mt-1">{t("home.testimonialsTitle")}</h2>
            <p className="text-content-muted text-sm mt-2">
              <Star className="inline w-4 h-4 text-warning fill-warning -mt-0.5" /> {t("home.testimonialsRating")}
            </p>
          </div>
          <div
            className="relative"
            dir="ltr"
            onMouseEnter={() => setTmPaused(true)}
            onMouseLeave={() => setTmPaused(false)}
          >
            <div className="overflow-hidden px-1 py-1">
              <div
                className="flex transition-transform duration-500 ease-out"
                style={{ transform: `translateX(-${tmIndex * (100 / perView)}%)` }}
              >
                {testimonials.map((tm, i) => (
                  <div key={i} className="px-2 flex-shrink-0" style={{ width: `${100 / perView}%` }}>
                    <div className="bg-white rounded-2xl border border-border/30 overflow-hidden shadow-sm hover:shadow-lg transition-shadow h-full flex flex-col">
                      {/* WhatsApp header */}
                      <div className="bg-[#075E54] px-4 py-3 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/30 flex-shrink-0">
                          <img src={tm.avatar} alt={tm.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-bold text-sm truncate">{tm.name}</p>
                          <p className="text-[#A8E6CF] text-[11px] truncate">{tm.order}</p>
                        </div>
                        <div className="flex items-center gap-3 text-white/80">
                          <Phone className="w-4 h-4" />
                          <Video className="w-4 h-4" />
                          <MoreHorizontal className="w-4 h-4" />
                        </div>
                      </div>

                      {/* Chat body */}
                      <div className="bg-[#ECE5DD] p-4 relative min-h-[15rem] flex flex-col flex-1">
                        <div className="text-center">
                          <span className="text-[10px] text-gray-500 bg-white/70 rounded-full px-3 py-0.5">{tm.time}</span>
                        </div>

                        {/* Customer message */}
                        <div className="self-end max-w-[85%] mt-3">
                          <div className="bg-[#DCF8C6] rounded-lg rounded-tr-none px-3 py-2 shadow-sm">
                            <p dir="rtl" className="text-[13px] text-gray-800 leading-relaxed">{tm.text}</p>
                            <div className="flex items-center justify-end gap-1 mt-1" dir="rtl">
                              <span className="text-[10px] text-gray-500">{t("home.testimonialReplyTime")}</span>
                            </div>
                          </div>
                        </div>

                        {/* Store reply */}
                        <div className="self-start max-w-[80%] mt-2">
                          <div className="bg-white rounded-lg rounded-bl-none px-3 py-2 shadow-sm">
                            <p dir="rtl" className="text-[10px] text-[#128C7E] font-bold">{t("home.testimonialReplyFrom")}</p>
                            <p dir="rtl" className="text-[12px] text-gray-700 mt-0.5 leading-relaxed">{tm.reply}</p>
                            <div className="flex items-center justify-end gap-1 mt-1" dir="rtl">
                              <span className="text-[10px] text-gray-500">{t("home.testimonialReplyTime")}</span>
                              <svg viewBox="0 0 16 11" className="w-4 h-3 fill-[#34B7F1]">
                                <path d="M11.07.65 4.7 6.9 2.05 4.3 0 6.35l4.7 4.6 9.15-9-1.98-1.3Z" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {tmMaxIndex > 0 && (
              <>
                <button
                  type="button"
                  aria-label="Previous testimonials"
                  onClick={() => setTmIndex((i) => Math.max(0, i - 1))}
                  disabled={tmIndex === 0}
                  className="absolute left-1 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 border border-border/40 shadow-md flex items-center justify-center text-content hover:bg-primary hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  aria-label="Next testimonials"
                  onClick={() => setTmIndex((i) => Math.min(tmMaxIndex, i + 1))}
                  disabled={tmIndex === tmMaxIndex}
                  className="absolute right-1 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 border border-border/40 shadow-md flex items-center justify-center text-content hover:bg-primary hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                <div className="flex items-center justify-center gap-2 mt-4" dir="ltr">
                  {Array.from({ length: tmMaxIndex + 1 }).map((_, d) => (
                    <button
                      key={d}
                      type="button"
                      aria-label={`Go to testimonial slide ${d + 1}`}
                      onClick={() => setTmIndex(d)}
                      className={`h-2 rounded-full transition-all ${d === tmIndex ? "w-6 bg-primary" : "w-2 bg-border"}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
}
