"use client";
import { useState, useEffect } from "react";
import { useApp } from "@/contexts/AppContext";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import ProductCard from "@/components/ProductCard";
import { productImageUrl } from "@/lib/cloudinary";
import { PACK_SIZE } from "@/lib/constants";
import { Heart, ShoppingBag, Plus, Minus, ChevronRight, Sparkles, Truck, ShieldCheck, Headphones } from "lucide-react";
import Link from "next/link";
import type { Product, Variant, Category } from "@/lib/types";

export default function ProductDetailView({
  product,
  variants,
  related,
  relatedVariants,
  category,
}: {
  product: Product | null;
  variants: Variant[];
  related: Product[];
  relatedVariants: Record<string, Variant[]>;
  category: Category | null;
}) {
  const { toggleWishlist, isWished, addItem, t, lang, notify } = useApp();
  const { user } = useAuth();
  const [qty, setQty] = useState(1);
  const [unit, setUnit] = useState<"qty" | "pack">("qty");
  const [selectedVariant, setSelectedVariant] = useState<Record<string, string>>({});
  const [mainImage, setMainImage] = useState(0);

  useEffect(() => {
    if (!product) return;
    const first = variants.find((v) => v.active !== false);
    if (first) {
      setSelectedVariant((prev) => (Object.keys(prev).length > 0 ? prev : { ...first.attrs }));
    }
  }, [product?.id]);

  if (!product) {
    return (
      <div className="min-h-screen bg-surface">
        <Header />
        <div className="max-w-7xl mx-auto px-4 py-12 text-center">
          <p className="text-content-muted text-lg">{t("products.notFound")}</p>
        </div>
      </div>
    );
  }

  const id = product.id;
  const wished = isWished(id);

  const prodName = (lang === "ar" ? product.name : product.nameEn || product.name) || "بدون اسم";
  const prodDesc = (lang === "ar" ? product.description : product.descriptionEn || product.description) || "";
  const catName = category ? (lang === "ar" ? category.name : category.nameEn || category.name) : "";

  const variantAttrs = product.variantAttrs || [];
  const productVariants = variants.filter((v) => v.active !== false);

  const matchedVariant = productVariants.find((v) =>
    JSON.stringify(v.attrs || {}) === JSON.stringify(selectedVariant)
  );
  const unitPrice = matchedVariant?.price ?? product.price;
  const displayPrice = product.discountPercentage > 0
    ? unitPrice * (1 - product.discountPercentage / 100)
    : unitPrice;

  const galleryImages =
    (matchedVariant?.images?.length ? matchedVariant.images : null) ||
    (matchedVariant?.image ? [matchedVariant.image] : null) ||
    product.images;

  const colorValues = Array.from(new Set(productVariants.map((v) => v.attrs?.color).filter(Boolean)));

  const handleSelectVariant = (attr: string, val: string) => {
    const next = { ...selectedVariant, [attr]: val };
    setSelectedVariant(next);
    setMainImage(0);
    const nextMatched = productVariants.find(
      (v) => JSON.stringify(v.attrs || {}) === JSON.stringify(next)
    );
    if (nextMatched) {
      setQty(1);
      if (nextMatched.stock < PACK_SIZE) setUnit("qty");
    }
  };

  const stock = matchedVariant?.stock ?? Infinity;
  const stockVisible = matchedVariant ? matchedVariant.showStock !== false : true;
  const maxQty = unit === "pack"
    ? Math.max(0, Math.floor(stock / PACK_SIZE))
    : stock;
  const packAvailable = stock >= PACK_SIZE;

  const switchUnit = (u: "qty" | "pack") => {
    setUnit(u);
    setQty(1);
  };

  const handleAddToCart = () => {
    if (maxQty !== Infinity && qty > maxQty) {
      notify(t("products.stockExceeded"));
      return;
    }
    addItem({
      variantId: matchedVariant?.id || `${id}#base`,
      productId: id,
      name: prodName,
      price: unit === "pack" ? unitPrice * PACK_SIZE : unitPrice,
      discountPercentage: product.discountPercentage,
      image: matchedVariant?.image || product.images[0] || "",
      attrs: selectedVariant,
      quantity: qty,
      unit,
      packSize: PACK_SIZE,
    });
    notify(t("cart.added"));
  };

  const trustItems = [
    { icon: Truck, text: t("home.features.delivery") },
    { icon: ShieldCheck, text: t("home.features.quality") },
    { icon: Headphones, text: t("home.features.support") },
  ];

  return (
    <div className="min-h-screen bg-surface">
      <Header />
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-content-muted mb-6">
          <Link href="/products" className="hover:text-primary transition">{t("products.title")}</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          {catName && <span className="text-content-muted/70">{catName}</span>}
        </div>

        <div className="bg-white rounded-3xl border border-border/30 shadow-sm overflow-hidden">
          <div className="flex flex-col lg:flex-row">
            {/* Images */}
            <div className="w-full lg:w-1/2 p-4 md:p-8">
              <div className="relative aspect-square bg-surface rounded-2xl overflow-hidden mb-4">
                {galleryImages[mainImage] && (
                  <img
                    src={galleryImages[mainImage].startsWith("http") ? galleryImages[mainImage] : productImageUrl(galleryImages[mainImage])}
                    alt={prodName}
                    className="w-full h-full object-contain"
                  />
                )}
                {product.discountPercentage > 0 && (
                  <span className="absolute top-4 start-4 bg-danger text-white text-sm font-bold px-4 py-1.5 rounded-full shadow-lg">
                    -{product.discountPercentage}%
                  </span>
                )}
              </div>
              {galleryImages.length > 1 && (
                <div className="flex gap-3 overflow-x-auto no-scrollbar">
                  {galleryImages.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setMainImage(i)}
                      className={`w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden border-2 transition ${
                        i === mainImage ? "border-accent shadow-md shadow-accent/20" : "border-border/30 hover:border-primary/40"
                      }`}
                    >
                      <img
                        src={img.startsWith("http") ? img : productImageUrl(img)}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
              {colorValues.length > 0 && (
                <div className="flex items-center gap-2 mt-4">
                  <span className="text-xs font-bold text-content-muted">{t("products.color")}</span>
                  {colorValues.map((val) => {
                    const swatch = productVariants.find((v) => v.attrs?.color === val);
                    const swatchImg = swatch?.images?.[0] || swatch?.image || "";
                    const active = selectedVariant.color === val;
                    return (
                      <button
                        key={val}
                        onClick={() => handleSelectVariant("color", val)}
                        title={val}
                        className={`w-9 h-9 rounded-full overflow-hidden border-2 transition ${
                          active ? "border-accent ring-2 ring-accent/30" : "border-border/30 hover:border-primary/40"
                        }`}
                      >
                        {swatchImg && (
                          <img
                            src={swatchImg.startsWith("http") ? swatchImg : productImageUrl(swatchImg)}
                            alt={val}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Details */}
            <div className="w-full lg:w-1/2 p-4 md:p-8 lg:border-s border-border/30">
              <div className="flex items-center justify-between mb-3">
                {catName ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-accent bg-accent/10 px-3 py-1 rounded-full">
                    <Sparkles className="w-3 h-3" />
                    {catName}
                  </span>
                ) : <span />}
                <button
                  onClick={() =>
                    toggleWishlist({
                      productId: id,
                      name: prodName,
                      price: product.price,
                      discountPercentage: product.discountPercentage,
                      image: product.images[0] || "",
                      categoryName: catName,
                    })
                  }
                  className="p-2.5 rounded-full border border-border/40 hover:border-danger/40 hover:bg-danger/5 transition"
                  aria-label={t("wishlist.title")}
                >
                  <Heart className={`w-5 h-5 ${wished ? "fill-danger text-danger" : "text-content-muted/40"}`} />
                </button>
              </div>

              <h1 className="text-2xl md:text-3xl font-bold text-content mb-4">{prodName}</h1>

              <div className="flex items-end gap-3 mb-4">
                <span className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  {Math.round(displayPrice)} {t("cart.currency")}
                </span>
                {product.discountPercentage > 0 && (
                  <span className="text-lg text-content-muted/50 line-through mb-0.5">{unitPrice} {t("cart.currency")}</span>
                )}
              </div>

              {matchedVariant && matchedVariant.showStock !== false && (
                <p className={`text-sm font-bold mb-5 inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${
                  matchedVariant.stock > 0 ? "bg-success/10 text-success" : "bg-danger/10 text-danger"
                }`}>
                  <span className={`w-2 h-2 rounded-full ${matchedVariant.stock > 0 ? "bg-success" : "bg-danger"}`} />
                  {t("products.stock")}: {matchedVariant.stock}
                </p>
              )}

              {/* Variants */}
              {variantAttrs.length > 0 && (
                <div className="mb-6">
                  {variantAttrs.map((attr: string) => {
                    const values = Array.from(new Set(productVariants.map((v) => v.attrs?.[attr]).filter(Boolean)));
                    return (
                      <div key={attr} className="mb-3">
                        <label className="text-sm font-bold text-content block mb-2">{attr}</label>
                        <div className="flex gap-2 flex-wrap">
                          {values.map((val) => (
                            <button
                              key={val}
                              onClick={() => handleSelectVariant(attr, val)}
                              className={`px-4 py-2 rounded-full border text-sm font-bold transition-all ${
                                selectedVariant[attr] === val
                                  ? "border-primary bg-gradient-to-r from-primary to-primary-dark text-white shadow-md shadow-primary/25"
                                  : "border-border hover:border-primary/50 text-content hover:-translate-y-0.5"
                              }`}
                            >
                              {val}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Quantity & Add to Cart */}
              <div className="mb-6">
                {stockVisible && (
                  <div className="flex items-center gap-2 mb-3">
                    <button
                      onClick={() => switchUnit("qty")}
                      className={`px-4 py-1.5 rounded-full border text-xs font-bold transition ${
                        unit === "qty"
                          ? "border-primary bg-gradient-to-r from-primary to-primary-dark text-white shadow-md shadow-primary/25"
                          : "border-border/50 text-content-muted hover:border-primary/50 hover:text-content"
                      }`}
                    >
                      {t("cart.piece")}
                    </button>
                    <button
                      onClick={() => packAvailable && switchUnit("pack")}
                      disabled={!packAvailable}
                      title={packAvailable ? t("products.piecesPerPack") : t("products.outOfStock")}
                      className={`px-4 py-1.5 rounded-full border text-xs font-bold transition ${
                        unit === "pack"
                          ? "border-primary bg-gradient-to-r from-primary to-primary-dark text-white shadow-md shadow-primary/25"
                          : packAvailable
                          ? "border-border/50 text-content-muted hover:border-primary/50 hover:text-content"
                          : "border-border/30 text-content-muted/40 cursor-not-allowed"
                      }`}
                    >
                      {t("products.pack")}
                    </button>
                    <span className="text-[11px] text-content-muted/60">{t("products.piecesPerPack")}</span>
                  </div>
                )}
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center border border-border rounded-full bg-surface/40">
                    <button
                      onClick={() => setQty(Math.max(1, qty - 1))}
                      className="p-2.5 hover:bg-surface transition text-content-muted rounded-full"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="px-3 py-2 text-sm font-bold text-content min-w-10 text-center">
                      {qty} {unit === "pack" ? t("products.pack") : t("cart.piece")}
                    </span>
                    <button
                      onClick={() => setQty(maxQty !== Infinity && qty >= maxQty ? qty : qty + 1)}
                      className="p-2.5 hover:bg-surface transition text-content-muted rounded-full"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  {unit === "pack" && (
                    <span className="text-xs text-content-muted">
                      = {qty * PACK_SIZE} {t("cart.piece")}
                    </span>
                  )}
                  {stockVisible && maxQty !== Infinity && (
                    <span className="text-[11px] text-content-muted/60">
                      {t("products.maxAvailable")}: {maxQty} {unit === "pack" ? t("products.pack") : t("cart.piece")}
                    </span>
                  )}

                  <button
                    onClick={handleAddToCart}
                    className="flex-1 min-w-40 bg-gradient-to-r from-accent to-primary text-white py-3.5 rounded-full font-bold hover:shadow-lg hover:shadow-accent/30 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
                  >
                    <ShoppingBag className="w-5 h-5" />
                    {t("cart.addToCart")}
                  </button>
                </div>
              </div>

              {/* Trust row */}
              <div className="flex flex-wrap gap-3 mb-6">
                {trustItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <span key={item.text} className="inline-flex items-center gap-1.5 text-xs text-content-muted bg-surface/50 px-3 py-1.5 rounded-full">
                      <Icon className="w-3.5 h-3.5 text-primary" />
                      {item.text}
                    </span>
                  );
                })}
              </div>

              {/* Description */}
              {prodDesc && (
                <div className="border-t border-border/30 pt-5">
                  <h3 className="font-bold text-sm text-content mb-2">{t("products.description")}</h3>
                  <p className="text-sm text-content-muted leading-relaxed whitespace-pre-wrap">{prodDesc}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Related Products */}
        {related.length > 0 && (
          <div className="mt-12">
            <div className="flex items-end justify-between mb-6">
              <div>
                <span className="text-accent text-sm font-bold">✦ {t("products.category")}</span>
                <h2 className="text-2xl font-bold text-content mt-1">{t("products.relatedProducts")}</h2>
              </div>
              <Link href="/products" className="hidden md:inline-flex items-center gap-2 text-sm text-accent hover:underline">
                {t("products.browseProducts")}
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {related.map((p) => (
                <ProductCard
                  key={p.id}
                  id={p.id}
                  name={(lang === "ar" ? p.name : p.nameEn || p.name) || ""}
                  price={p.price}
                  discountPercentage={p.discountPercentage}
                  images={p.images}
                  variants={relatedVariants[p.id] || []}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
