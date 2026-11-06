"use client";
import { useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { useAuth } from "@/contexts/AuthContext";
import { productImageUrl } from "@/lib/cloudinary";
import Link from "next/link";
import { Heart, ShoppingBag, Check } from "lucide-react";
import type { Variant } from "@/lib/types";

interface Props {
  id: string;
  name: string;
  price: number;
  discountPercentage?: number;
  images?: string[];
  category?: string;
  variants?: Variant[];
}

export default function ProductCard({ id, name, price, discountPercentage = 0, images = [], category, variants }: Props) {
  const { toggleWishlist, isWished, addItem, t, notify } = useApp();
  const { user } = useAuth();
  const [added, setAdded] = useState(false);
  const [cover, setCover] = useState<string | null>(null);
  const wished = isWished(id);

  const hasVariantInfo = variants !== undefined;
  const activeVariants = (variants || []).filter((v) => v.active !== false);
  const defaultVariant = activeVariants.find((v) => (v.stock || 0) > 0) || activeVariants[0];
  const variantCover = defaultVariant?.image || "";
  const img = cover || variantCover || images[0] || "";
  const displayPrice = discountPercentage > 0 ? price * (1 - discountPercentage / 100) : price;
  const coverVariant =
    activeVariants.find((v) => (v.image || v.images?.[0]) === img) || defaultVariant;
  const colorValues = Array.from(new Set(activeVariants.map((v) => v.attrs?.color).filter(Boolean)));

  const outOfStock = hasVariantInfo
    ? activeVariants.length === 0
      ? true
      : (defaultVariant?.stock || 0) <= 0 && defaultVariant.showStock !== false
    : false;

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (outOfStock) return;
    addItem({
      variantId: coverVariant?.id || `${id}#base`,
      productId: id,
      name,
      price: coverVariant?.price ?? price,
      discountPercentage,
      image: coverVariant?.image || img,
      attrs: coverVariant?.attrs || {},
      quantity: 1,
    });
    setAdded(true);
    notify(t("cart.added"));
    window.setTimeout(() => setAdded(false), 1500);
  };

  return (
    <Link
      href={`/product/${id}`}
      className="block bg-white rounded-2xl border border-border/30 shadow-sm shadow-content/5 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1 hover:ring-1 hover:ring-primary/15 transition-all duration-300 overflow-hidden group flex flex-col"
    >
      <div className="relative aspect-square bg-surface overflow-hidden">
        {img && (
          <img
            src={img.startsWith("http") ? img : productImageUrl(img)}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            loading="lazy"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-content/15 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleWishlist({
              productId: id,
              name,
              price,
              discountPercentage,
              image: img,
              categoryName: category,
            });
          }}
          className="absolute top-3 start-3 w-9 h-9 bg-white/80 backdrop-blur border border-white/40 rounded-full flex items-center justify-center shadow-sm hover:bg-white hover:scale-110 transition z-10"
          title={t("wishlist.title")}
        >
          <Heart className={`w-4 h-4 ${wished ? "fill-danger text-danger" : "text-content-muted/40"}`} />
        </button>
        {discountPercentage > 0 && (
          <span className="absolute top-3 end-3 bg-gradient-to-r from-rose-500 to-danger text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-lg shadow-danger/30 z-10">
            -{discountPercentage}%
          </span>
        )}
        {outOfStock && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px] flex items-center justify-center z-[5]">
            <span className="bg-content text-white text-xs px-3 py-1 rounded-full font-medium">
              {t("products.outOfStock")}
            </span>
          </div>
        )}
        <button
          onClick={handleAdd}
          disabled={outOfStock}
          title={t("cart.addToCart")}
          className={`absolute bottom-3 end-3 w-10 h-10 rounded-full flex items-center justify-center transition-all z-10 ${
            added
              ? "bg-gradient-to-r from-success to-success shadow-lg shadow-success/40"
              : "bg-gradient-to-r from-primary to-accent text-white shadow-lg shadow-accent/30 hover:shadow-accent/50 hover:scale-110"
          } md:translate-y-1 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100 ${outOfStock ? "hidden" : ""}`}
        >
          {added ? <Check className="w-4 h-4" /> : <ShoppingBag className="w-4 h-4" />}
        </button>
      </div>
      <div className="p-4 flex flex-col flex-1">
        <h3 className="text-sm font-bold text-content line-clamp-2">{name}</h3>
        {category && <p className="text-xs text-content-muted mt-1 line-clamp-1">{category}</p>}
        <div className="flex items-baseline gap-2 mt-2.5">
          <span className="text-lg font-bold text-primary">{Math.round(displayPrice)} ج.م</span>
          {discountPercentage > 0 && (
            <span className="text-xs text-content-muted/50 line-through">{price} ج.م</span>
          )}
        </div>
        {colorValues.length > 0 && (
          <div className="flex items-center gap-1.5 mt-2.5">
            {colorValues.map((val) => {
              const swatch = activeVariants.find((v) => v.attrs?.color === val);
              const swatchImg = swatch?.images?.[0] || swatch?.image || "";
              const active = swatchImg && img === swatchImg;
              return (
                <button
                  key={val}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setCover(swatchImg);
                  }}
                  title={val}
                  className={`w-6 h-6 rounded-full overflow-hidden border transition ${
                    active ? "border-white ring-2 ring-accent" : "border-border/40 hover:scale-110"
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
        <button
          onClick={handleAdd}
          disabled={outOfStock}
          className={`mt-4 w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            outOfStock
              ? "bg-surface/60 text-content-muted/50 cursor-not-allowed"
              : added
              ? "bg-gradient-to-r from-success to-success text-white shadow-md shadow-success/30"
              : "bg-gradient-to-r from-primary to-accent text-white shadow-md shadow-accent/25 hover:shadow-lg hover:shadow-accent/40 hover:-translate-y-0.5"
          }`}
        >
          {added ? (
            <><Check className="w-3.5 h-3.5" /> {t("cart.added")}</>
          ) : outOfStock ? (
            t("products.outOfStock")
          ) : (
            <><ShoppingBag className="w-3.5 h-3.5" /> {t("cart.addToCart")}</>
          )}
        </button>
      </div>
    </Link>
  );
}
