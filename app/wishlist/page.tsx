"use client";
import { useState, useEffect, useMemo } from "react";
import { useApp } from "@/contexts/AppContext";
import { getCatalog } from "@/lib/actions";
import Header from "@/components/Header";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import { productImageUrl } from "@/lib/cloudinary";
import { Heart, Trash2, ShoppingBag, Eye, Sparkles, ArrowLeft, ShieldCheck, Truck, Check, Share2 } from "lucide-react";
import Link from "next/link";
import type { Product, Variant } from "@/lib/types";

export default function WishlistPage() {
  const { wishlist, toggleWishlist, addItem, t, lang, notify } = useApp();
  const [products, setProducts] = useState<Product[]>([]);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [addedId, setAddedId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const cat = await getCatalog();
        setProducts(cat.products);
        setVariants(cat.variants);
      } catch {}
    })();
  }, []);

  const productById = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  const variantsByProduct = useMemo(() => {
    const map = new Map<string, Variant[]>();
    for (const v of variants) {
      const list = map.get(v.productId) || [];
      list.push(v);
      map.set(v.productId, list);
    }
    return map;
  }, [variants]);

  // Stats for summary
  const stats = useMemo(() => {
    let total = 0;
    let saving = 0;
    for (const item of wishlist) {
      const live = productById.get(item.productId);
      const price = live?.price ?? item.price;
      const disc = live?.discountPercentage ?? item.discountPercentage;
      const discounted = disc > 0 ? price * (1 - disc / 100) : price;
      total += discounted;
      if (disc > 0) saving += price - discounted;
    }
    return { total: Math.round(total), saving: Math.round(saving) };
  }, [wishlist, productById]);

  const handleAddToCart = (productId: string) => {
    const item = wishlist.find((w) => w.productId === productId);
    if (!item) return;
    const live = productById.get(productId);
    const liveVariants = variantsByProduct.get(productId) || [];
    const activeVariants = liveVariants.filter((v) => v.active !== false);
    const defaultVariant = activeVariants.find((v) => (v.stock || 0) > 0) || activeVariants[0];

    // out of stock check
    const hasVariantInfo = liveVariants.length > 0;
    const outOfStock = hasVariantInfo ? activeVariants.length === 0 || (!!defaultVariant && (defaultVariant.stock || 0) <= 0 && defaultVariant.showStock !== false) : false;
    if (outOfStock) {
      notify("المنتج غير متوفر حالياً");
      return;
    }

    const price = defaultVariant?.price ?? live?.price ?? item.price;
    const discount = live?.discountPercentage ?? item.discountPercentage;
    const image = defaultVariant?.image || live?.images?.[0] || item.image;

    addItem({
      variantId: defaultVariant?.id || `${productId}#base`,
      productId,
      name: live ? (lang === "ar" ? live.name : live.nameEn || live.name) || item.name : item.name,
      price,
      discountPercentage: discount,
      image,
      attrs: defaultVariant?.attrs || {},
      quantity: 1,
    });
    setAddedId(productId);
    notify(t("cart.added"));
    setTimeout(() => setAddedId(null), 1500);
  };

  const handleAddAll = () => {
    let added = 0;
    for (const item of wishlist) {
      const liveVariants = variantsByProduct.get(item.productId) || [];
      const activeVariants = liveVariants.filter((v) => v.active !== false);
      const defaultVariant = activeVariants.find((v) => (v.stock || 0) > 0) || activeVariants[0];
      const hasVariantInfo = liveVariants.length > 0;
      const outOfStock = hasVariantInfo ? activeVariants.length === 0 || (!!defaultVariant && (defaultVariant.stock || 0) <= 0 && defaultVariant.showStock !== false) : false;
      if (outOfStock) continue;
      handleAddToCart(item.productId);
      added++;
    }
    if (added === 0) notify("لا توجد منتجات متاحة للإضافة");
  };

  const handleClear = () => {
    if (!confirm("هل تريد حذف كل المفضلة؟")) return;
    // toggle each
    [...wishlist].forEach((it) => toggleWishlist(it));
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: "قائمة مفضلتي - Butterfly Scarf", url: window.location.href });
      } catch {}
    } else {
      await navigator.clipboard.writeText(window.location.href);
      notify("تم نسخ الرابط ✓");
    }
  };

  return (
    <div className="min-h-screen bg-surface">
      <Header />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <PageHeader
          badge={t("home.heroBadge")}
          title={t("wishlist.title")}
          subtitle={
            wishlist.length > 0
              ? `${wishlist.length} ${wishlist.length === 1 ? t("wishlist.item") : t("wishlist.items")} · ${wishlist.length > 1 && stats.saving > 0 ? `ستوفر ${stats.saving} ج.م` : "مجموعتك الخاصة"}`
              : undefined
          }
          icon={<Heart className="w-7 h-7 text-white fill-white/20" />}
          count={wishlist.length}
        />

        {wishlist.length === 0 ? (
          <div className="bg-white rounded-3xl border border-border/30 shadow-sm overflow-hidden">
            <EmptyState
              icon={<Heart className="w-10 h-10 text-danger/30" />}
              title={t("wishlist.empty")}
              actionText={t("products.browseProducts")}
              actionHref="/products"
            />
            <div className="px-6 pb-8 flex flex-wrap justify-center gap-2 text-xs text-content-muted/60">
              <span className="inline-flex items-center gap-1.5 bg-surface/60 border border-border/30 rounded-full px-3 py-1.5"><Sparkles className="w-3.5 h-3.5 text-accent" /> احفظ منتجاتك المفضلة هنا</span>
              <span className="inline-flex items-center gap-1.5 bg-surface/60 border border-border/30 rounded-full px-3 py-1.5"><ShieldCheck className="w-3.5 h-3.5 text-success" /> ستظل محفوظة حتى بعد تسجيل الخروج</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-6">
            {/* List */}
            <div className="flex-1 space-y-4">
              {/* Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-white/70 backdrop-blur border border-white/60 rounded-2xl px-4 py-3 shadow-sm">
                <p className="text-sm text-content-muted flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-danger animate-pulse" />
                  {wishlist.length} منتج في المفضلة
                  {stats.saving > 0 && <span className="text-success font-bold">· وفر {stats.saving} ج.م</span>}
                </p>
                <div className="flex items-center gap-2">
                  <button onClick={handleShare} className="inline-flex items-center gap-1.5 text-xs font-bold text-content-muted hover:text-content border border-border/40 hover:border-border rounded-full px-3 py-1.5 bg-white transition">
                    <Share2 className="w-3.5 h-3.5" /> مشاركة
                  </button>
                  <button onClick={handleClear} className="inline-flex items-center gap-1.5 text-xs font-bold text-danger/70 hover:text-danger border border-danger/15 hover:border-danger/30 rounded-full px-3 py-1.5 bg-white transition">
                    <Trash2 className="w-3.5 h-3.5" /> حذف الكل
                  </button>
                </div>
              </div>

              {wishlist.map((item) => {
                const live = productById.get(item.productId);
                const liveVariants = variantsByProduct.get(item.productId) || [];
                const activeVariants = liveVariants.filter((v) => v.active !== false);
                const defaultVariant = activeVariants.find((v) => (v.stock || 0) > 0) || activeVariants[0];
                const hasVariantInfo = liveVariants.length > 0;
                const outOfStock = hasVariantInfo ? activeVariants.length === 0 || (!!defaultVariant && (defaultVariant.stock || 0) <= 0 && defaultVariant.showStock !== false) : false;

                const name = live ? (lang === "ar" ? live.name : live.nameEn || live.name) || item.name : item.name;
                const price = defaultVariant?.price ?? live?.price ?? item.price;
                const discount = live?.discountPercentage ?? item.discountPercentage;
                const discounted = discount > 0 ? price * (1 - discount / 100) : price;
                const images = live?.images?.length ? live.images : [item.image].filter(Boolean);
                const cover = defaultVariant?.image || images[0] || item.image;
                const category = live ? undefined : item.categoryName;

                const colorValues = Array.from(new Set(activeVariants.map((v) => v.attrs?.color).filter(Boolean))).slice(0, 5);

                const isAdded = addedId === item.productId;

                return (
                  <div
                    key={item.productId}
                    className="group relative bg-white rounded-3xl border border-border/30 shadow-sm hover:shadow-xl hover:shadow-primary/10 hover:border-primary/20 hover:-translate-y-0.5 transition-all duration-300 overflow-hidden flex flex-col sm:flex-row gap-0"
                  >
                    {/* Accent line */}
                    <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary via-accent to-primary opacity-0 group-hover:opacity-100 transition-opacity" />

                    {/* Image */}
                    <Link href={`/product/${item.productId}`} className="relative w-full sm:w-48 md:w-56 h-56 sm:h-auto flex-shrink-0 bg-surface overflow-hidden sm:m-3 sm:rounded-2xl border-b sm:border border-border/20">
                      {cover ? (
                        <img
                          src={cover.startsWith("http") ? cover : productImageUrl(cover)}
                          alt={name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-content-muted/20">
                          <Heart className="w-10 h-10" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-content/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      {discount > 0 && (
                        <span className="absolute top-3 end-3 bg-gradient-to-r from-rose-500 to-danger text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg shadow-danger/30">
                          -{discount}%
                        </span>
                      )}
                      {outOfStock && (
                        <div className="absolute inset-0 bg-white/75 backdrop-blur-[2px] flex items-center justify-center">
                          <span className="bg-content text-white text-xs px-4 py-1.5 rounded-full font-bold shadow-lg">غير متوفر</span>
                        </div>
                      )}
                      <span className="absolute bottom-3 start-3 bg-white/90 backdrop-blur text-content text-xs font-bold px-3 py-1.5 rounded-full shadow-sm opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5" /> عرض التفاصيل
                      </span>
                    </Link>

                    {/* Content */}
                    <div className="flex-1 p-5 flex flex-col min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <Link href={`/product/${item.productId}`} className="group/title">
                            <h3 className="font-bold text-content text-base leading-snug line-clamp-2 group-hover/title:text-primary transition-colors">{name}</h3>
                          </Link>
                          {(category || live?.categoryId) && (
                            <p className="text-xs text-content-muted mt-1 flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                              {category || "تشكيلة مميزة"}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => toggleWishlist(item)}
                          className="w-9 h-9 rounded-full bg-danger/10 hover:bg-danger text-danger hover:text-white border border-danger/15 flex items-center justify-center transition-all hover:scale-105 hover:rotate-6 flex-shrink-0"
                          title="إزالة من المفضلة"
                        >
                          <Heart className="w-4 h-4 fill-danger group-hover:fill-white" />
                        </button>
                      </div>

                      {/* Variants colors */}
                      {colorValues.length > 0 && (
                        <div className="flex items-center gap-2 mt-3">
                          <span className="text-xs text-content-muted">الألوان:</span>
                          <div className="flex items-center gap-1.5">
                            {colorValues.map((val) => {
                              const swatch = activeVariants.find((v) => v.attrs?.color === val);
                              const swatchImg = swatch?.images?.[0] || swatch?.image || cover;
                              return (
                                <span key={val} title={val} className="w-7 h-7 rounded-full overflow-hidden border-2 border-white shadow-sm ring-1 ring-border/30">
                                  {swatchImg ? (
                                    <img src={swatchImg.startsWith("http") ? swatchImg : productImageUrl(swatchImg)} alt={val} className="w-full h-full object-cover" />
                                  ) : (
                                    <span className="w-full h-full bg-surface block" />
                                  )}
                                </span>
                              );
                            })}
                            {activeVariants.length > 5 && <span className="text-xs text-content-muted">+{activeVariants.length - 5}</span>}
                          </div>
                        </div>
                      )}

                      {/* Price row */}
                      <div className="flex items-end justify-between gap-4 mt-auto pt-4">
                        <div>
                          <div className="flex items-baseline gap-2">
                            <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">{Math.round(discounted)} ج.م</span>
                            {discount > 0 && <span className="text-xs text-content-muted/50 line-through">{Math.round(price)} ج.م</span>}
                          </div>
                          {discount > 0 && <p className="text-xs text-success font-medium mt-0.5">توفر {Math.round(price - discounted)} ج.م</p>}
                        </div>

                        <div className="flex items-center gap-2">
                          <Link
                            href={`/product/${item.productId}`}
                            className="hidden sm:inline-flex w-10 h-10 rounded-full border border-border/40 bg-white hover:bg-surface hover:border-primary/20 items-center justify-center text-content-muted hover:text-primary transition"
                            title="عرض المنتج"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleAddToCart(item.productId)}
                            disabled={outOfStock}
                            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all ${
                              outOfStock
                                ? "bg-surface text-content-muted/50 cursor-not-allowed border border-border/30"
                                : isAdded
                                  ? "bg-success text-white shadow-md shadow-success/20"
                                  : "bg-gradient-to-r from-primary to-accent text-white shadow-md shadow-accent/25 hover:shadow-lg hover:shadow-accent/30 hover:-translate-y-0.5"
                            }`}
                          >
                            {isAdded ? (
                              <>
                                <Check className="w-4 h-4" /> تمت الإضافة
                              </>
                            ) : outOfStock ? (
                              "غير متوفر"
                            ) : (
                              <>
                                <ShoppingBag className="w-4 h-4" /> أضف للسلة
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              <Link href="/products" className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:text-primary-dark transition mt-2">
                <ArrowLeft className="w-4 h-4" /> متابعة التسوق
              </Link>
            </div>

            {/* Summary Sidebar - Premium */}
            <div className="w-full lg:w-80 flex-shrink-0">
              <div className="bg-white rounded-3xl border border-border/30 shadow-sm overflow-hidden sticky top-28">
                <div className="relative bg-gradient-to-br from-content via-primary-dark to-primary px-6 py-6 text-white overflow-hidden">
                  <div className="absolute -top-10 -end-10 w-32 h-32 rounded-full bg-accent/20 blur-2xl" />
                  <div className="absolute -bottom-10 -start-10 w-40 h-40 rounded-full bg-white/5 blur-2xl" />
                  <div className="relative flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="font-bold">ملخص المفضلة</h2>
                      <p className="text-white/60 text-xs mt-0.5">{wishlist.length} منتج · محفوظة بأمان</p>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between text-sm">
                      <span className="text-content-muted">عدد المنتجات</span>
                      <span className="font-bold text-content">{wishlist.length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-content-muted">القيمة الإجمالية</span>
                      <span className="font-bold text-content">{stats.total} ج.م</span>
                    </div>
                    {stats.saving > 0 && (
                      <div className="flex justify-between text-sm bg-success/5 border border-success/15 rounded-xl px-3 py-2">
                        <span className="text-success font-medium flex items-center gap-1"><Sparkles className="w-3 h-3" /> ستوفر</span>
                        <span className="font-bold text-success">{stats.saving} ج.م</span>
                      </div>
                    )}
                    <div className="border-t border-dashed border-border/60 pt-3 flex justify-between items-center">
                      <span className="font-bold text-content">المجموع بعد الخصم</span>
                      <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">{stats.total} ج.م</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <button
                      onClick={handleAddAll}
                      className="w-full bg-gradient-to-r from-accent to-primary text-white py-3 rounded-full font-bold shadow-md shadow-accent/25 hover:shadow-lg hover:shadow-accent/30 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
                    >
                      <ShoppingBag className="w-4 h-4" /> أضف الكل للسلة
                    </button>
                    <Link
                      href="/products"
                      className="block w-full text-center py-3 rounded-full font-bold border border-border/40 hover:bg-surface transition text-content text-sm"
                    >
                      تصفح المزيد
                    </Link>
                    <button
                      onClick={handleClear}
                      className="w-full text-center py-2.5 rounded-full text-sm font-bold text-danger/70 hover:text-danger hover:bg-danger/5 transition flex items-center justify-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> مسح المفضلة
                    </button>
                  </div>

                  <div className="mt-6 pt-6 border-t border-border/30 space-y-2.5">
                    {[
                      { icon: Truck, text: "توصيل سريع خلال 3-5 أيام" },
                      { icon: ShieldCheck, text: "منتجات أصلية بجودة مضمونة" },
                      { icon: Heart, text: "محفوظة حتى بعد تسجيل الدخول" },
                    ].map((it) => {
                      const Icon = it.icon;
                      return (
                        <p key={it.text} className="flex items-center gap-2 text-xs text-content-muted">
                          <span className="w-7 h-7 rounded-full bg-surface border border-border/30 flex items-center justify-center flex-shrink-0">
                            <Icon className="w-3.5 h-3.5 text-primary" />
                          </span>
                          {it.text}
                        </p>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Promo mini card */}
              <div className="mt-4 bg-gradient-to-br from-primary to-accent rounded-3xl p-5 text-white relative overflow-hidden">
                <div className="absolute -top-8 -end-8 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
                <p className="text-sm font-bold flex items-center gap-2"><Sparkles className="w-4 h-4" /> عرض خاص للمفضلة</p>
                <p className="text-xs text-white/80 mt-1 leading-relaxed">أضف 3 منتجات من المفضلة للسلة واحصل على خصم إضافي عند الدفع</p>
                <Link href="/products" className="inline-flex mt-3 bg-white text-primary text-xs font-bold px-4 py-2 rounded-full hover:bg-white/90 transition">اكتشف العروض</Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
