"use client";
import { useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import { productImageUrl } from "@/lib/cloudinary";
import { Minus, Plus, Trash2, ShoppingBag, ShieldCheck, Truck, CreditCard } from "lucide-react";
import Link from "next/link";

export default function CartPage() {
  const { cart, updateQuantity, removeItem, clearCart, t, notify } = useApp();
  const { user } = useAuth();
  const [showLogin, setShowLogin] = useState(false);

  const total = cart.reduce((sum, item) => {
    const dp = item.discountPercentage > 0 ? item.price * (1 - item.discountPercentage / 100) : item.price;
    return sum + dp * item.quantity;
  }, 0);

  const totalPieces = cart.reduce(
    (s, i) => s + i.quantity * (i.unit === "pack" ? i.packSize || 12 : 1),
    0
  );

  const handleCheckout = (e: React.MouseEvent) => {
    if (!user) {
      e.preventDefault();
      setShowLogin(true);
      notify("سجّل الدخول لإتمام الطلب ✨");
    }
  };

  return (
    <div className="min-h-screen bg-surface">
      <Header />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <PageHeader
          badge={t("home.heroBadge")}
          title={t("cart.title")}
          subtitle={cart.length > 0 ? `${totalPieces} ${t("cart.piece")}` : undefined}
          icon={<ShoppingBag className="w-7 h-7 text-white" />}
          count={cart.length}
        />

        {cart.length === 0 ? (
          <div className="bg-white rounded-3xl border border-border/30 shadow-sm">
            <EmptyState
              icon={<ShoppingBag className="w-10 h-10 text-content-muted/30" />}
              title={t("cart.empty")}
              actionText={t("products.browseProducts")}
              actionHref="/products"
            />
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Items */}
            <div className="flex-1 space-y-4">
              {cart.map((item) => {
                const dp = item.discountPercentage > 0 ? item.price * (1 - item.discountPercentage / 100) : item.price;
                const hasAttrs = Object.keys(item.attrs || {}).length > 0;
                return (
                  <div key={item.variantId} className="bg-white rounded-2xl border border-border/30 shadow-sm p-4 flex gap-4 hover:shadow-md transition-shadow">
                    <div className="w-24 h-24 md:w-28 md:h-28 bg-surface rounded-xl overflow-hidden flex-shrink-0 border border-border/30">
                      {item.image && (
                        <img
                          src={item.image.startsWith("http") ? item.image : productImageUrl(item.image)}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="font-bold text-sm text-content truncate">{item.name}</h3>
                          {hasAttrs && (
                            <p className="text-xs text-content-muted mt-1 truncate">
                              {Object.entries(item.attrs).map(([k, v]) => `${k}: ${v}`).join(" | ")}
                            </p>
                          )}
                          {item.unit === "pack" && (
                            <p className="text-xs text-accent mt-1">
                              {item.quantity} {t("products.pack")} = {item.quantity * (item.packSize || 12)} {t("cart.piece")}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => removeItem(item.variantId)}
                          className="w-8 h-8 rounded-full border border-border/40 flex items-center justify-center text-danger/60 hover:text-danger hover:bg-danger/5 hover:border-danger/30 transition flex-shrink-0"
                          aria-label={t("common.delete")}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 bg-surface/60 border border-border/40 rounded-full p-1">
                            <button
                              onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                              className="w-7 h-7 rounded-full hover:bg-white hover:shadow-sm transition flex items-center justify-center text-content-muted"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="text-sm font-bold min-w-7 text-center text-content">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                              className="w-7 h-7 rounded-full hover:bg-white hover:shadow-sm transition flex items-center justify-center text-content-muted"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <span className="text-xs font-bold text-content-muted">
                            {item.unit === "pack" ? t("products.pack") : t("cart.piece")}
                          </span>
                        </div>
                        <div className="text-left">
                          {item.discountPercentage > 0 && (
                            <p className="text-[11px] text-content-muted/50 line-through">{Math.round(item.price)} {t("cart.currency")}</p>
                          )}
                          <p className="font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                            {Math.round(dp * item.quantity)} {t("cart.currency")}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              <button onClick={clearCart} className="text-sm text-danger/70 hover:text-danger transition inline-flex items-center gap-1.5">
                <Trash2 className="w-3.5 h-3.5" />
                {t("common.delete")} {t("cart.title")}
              </button>
            </div>

            {/* Summary */}
            <div className="w-full lg:w-80 flex-shrink-0">
              <div className="bg-white rounded-3xl border border-border/30 shadow-sm overflow-hidden sticky top-28">
                <div className="bg-gradient-to-r from-content via-primary-dark to-primary px-6 py-5 text-white">
                  <h2 className="font-bold text-lg">{t("cart.title")}</h2>
                  <p className="text-white/60 text-xs mt-0.5">{totalPieces} {t("cart.piece")}</p>
                </div>
                <div className="p-6">
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between text-sm">
                      <span className="text-content-muted">{t("cart.total")}</span>
                      <span className="text-content font-bold">{totalPieces} {t("cart.piece")}</span>
                    </div>
                    <div className="border-t border-dashed border-border/60 pt-3 flex justify-between items-end">
                      <span className="text-content font-bold">{t("cart.total")}</span>
                      <span className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                        {Math.round(total)} {t("cart.currency")}
                      </span>
                    </div>
                  </div>
                  <Link
                    href="/checkout"
                    onClick={handleCheckout}
                    className="block w-full bg-gradient-to-r from-accent to-primary text-white text-center py-3.5 rounded-full font-bold hover:shadow-lg hover:shadow-accent/30 hover:-translate-y-0.5 transition-all"
                  >
                    {t("cart.checkout")}
                  </Link>
                  {showLogin && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                      <div className="absolute inset-0 bg-content/60 backdrop-blur-sm" onClick={() => setShowLogin(false)} />
                      <div className="relative bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 text-center animate-in fade-in">
                        <div className="w-14 h-14 mx-auto rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-4">
                          <ShoppingBag className="w-7 h-7 text-white" />
                        </div>
                        <h3 className="text-lg font-bold text-content">سجّل الدخول لإتمام الطلب</h3>
                        <p className="text-sm text-content-muted mt-2">يمكنك إضافة المنتجات كضيف، لكن إتمام الطلب يتطلب تسجيل الدخول — تمام زي Amazon ✨</p>
                        <div className="mt-6 flex gap-3">
                          <button onClick={() => setShowLogin(false)} className="flex-1 py-2.5 rounded-full border border-border/40 text-sm font-bold text-content-muted hover:bg-surface transition">إلغاء</button>
                          <Link href="/auth" onClick={() => setShowLogin(false)} className="flex-1 py-2.5 rounded-full bg-gradient-to-r from-accent to-primary text-white text-sm font-bold text-center">تسجيل الدخول</Link>
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="mt-5 space-y-2">
                    {[
                      { icon: Truck, text: t("home.features.delivery") },
                      { icon: ShieldCheck, text: t("home.features.quality") },
                      { icon: CreditCard, text: t("home.features.payment") },
                    ].map((item) => {
                      const Icon = item.icon;
                      return (
                        <p key={item.text} className="flex items-center gap-2 text-xs text-content-muted">
                          <Icon className="w-3.5 h-3.5 text-primary" />
                          {item.text}
                        </p>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
