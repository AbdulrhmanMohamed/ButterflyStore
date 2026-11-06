"use client";
import { useState, useEffect, Fragment } from "react";
import { useApp } from "@/contexts/AppContext";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import { orderCreate, paymentsList } from "@/lib/actions";
import { productImageUrl } from "@/lib/cloudinary";
import type { PaymentMethod } from "@/lib/types";
import {
  CheckCircle, CreditCard, ShoppingBag, ShieldCheck, Truck, User, Phone, MapPin,
  Banknote, Smartphone, ArrowLeftRight, Check, ChevronLeft, ChevronRight,
} from "lucide-react";
import Link from "next/link";

function paymentIcon(p: PaymentMethod) {
  const key = `${p.nameEn || ""} ${p.name}`.toLowerCase();
  if (key.includes("cash") || key.includes("استلام") || key.includes("عند")) return Banknote;
  if (key.includes("vodafone") || key.includes("فودافون") || key.includes("wallet") || key.includes("محفظة")) return Smartphone;
  if (key.includes("insta") || key.includes("انست")) return ArrowLeftRight;
  return CreditCard;
}

export default function CheckoutPage() {
  const { cart, clearCart, t, lang, notify } = useApp();
  const { user } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [address, setAddress] = useState("");
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [payments, setPayments] = useState<PaymentMethod[]>([]);
  const [loadingPm, setLoadingPm] = useState(true);
  const [paymentId, setPaymentId] = useState("");
  const [paymentDetails, setPaymentDetails] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const list = await paymentsList();
        const active = list.filter((p) => p.active !== false);
        setPayments(active);
        if (active.length > 0) setPaymentId(active[0].id);
      } catch {}
      setLoadingPm(false);
    })();
  }, []);

  const total = cart.reduce((sum, item) => {
    const dp = item.discountPercentage > 0 ? item.price * (1 - item.discountPercentage / 100) : item.price;
    return sum + dp * item.quantity;
  }, 0);

  const totalPieces = cart.reduce(
    (s, i) => s + i.quantity * (i.unit === "pack" ? i.packSize || 12 : 1),
    0
  );

  const payment = payments.find((p) => p.id === paymentId);
  const steps = [t("checkout.step1"), t("checkout.step2"), t("checkout.step3")];

  const goNext = () => {
    setError("");
    if (step === 1) {
      if (!name.trim() || !phone.trim() || !address.trim()) {
        setError(t("checkout.fillAll"));
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!paymentId) {
        setError(t("checkout.selectPayment"));
        return;
      }
      setStep(3);
    }
  };

  const handleOrder = async () => {
    if (!user) { setShowLogin(true); notify("سجّل الدخول لإتمام الطلب ✨"); return; }
    if (cart.length === 0) return;
    setLoading(true);
    setError("");
    try {
      await orderCreate({
        customerId: user.id,
        customerName: name,
        customerPhone: phone,
        address,
        paymentMethod: payment ? (lang === "ar" ? payment.name : payment.nameEn || payment.name) : "",
        paymentDetails,
        items: cart.map((c) => ({ ...c })),
        total,
        finalTotal: total,
        status: "pending",
      });
      clearCart();
      setDone(true);
    } catch {
      setError(t("checkout.failed"));
    }
    setLoading(false);
  };

  const inputCls =
    "w-full border border-border rounded-xl px-4 py-2.5 text-sm text-content placeholder:text-content-muted/50 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition";

  if (done) {
    return (
      <div className="min-h-screen bg-surface">
        <Header />
        <div className="max-w-md mx-auto px-4 py-16 text-center">
          <div className="bg-white rounded-3xl border border-border/30 shadow-sm p-10">
            <div className="w-20 h-20 mx-auto rounded-full bg-success/10 flex items-center justify-center mb-5">
              <CheckCircle className="w-12 h-12 text-success" />
            </div>
            <h1 className="text-2xl font-bold text-content mb-2">{t("checkout.success")}</h1>
            <p className="text-content-muted text-sm mb-8">✓✓ {t("home.testimonialSeen")}</p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-primary to-primary-dark text-white px-8 py-3 rounded-full font-bold hover:shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5 transition-all"
            >
              {t("nav.home")}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-surface">
        <Header />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <PageHeader badge={t("home.heroBadge")} title={t("checkout.title")} icon={<CreditCard className="w-7 h-7 text-white" />} />
          <div className="bg-white rounded-3xl border border-border/30 shadow-sm">
            <EmptyState
              icon={<ShoppingBag className="w-10 h-10 text-content-muted/30" />}
              title={t("cart.empty")}
              actionText={t("products.browseProducts")}
              actionHref="/products"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      <Header />
      <div className="max-w-5xl mx-auto px-4 py-8">
        <PageHeader
          badge={t("home.heroBadge")}
          title={t("checkout.title")}
          icon={<CreditCard className="w-7 h-7 text-white" />}
        />

        {/* Step indicator */}
        <div className="flex items-center justify-center mb-8">
          {steps.map((label, i) => {
            const n = i + 1;
            const active = step === n;
            const doneStep = step > n;
            return (
              <Fragment key={n}>
                {i > 0 && (
                  <div className={`h-0.5 w-10 sm:w-16 rounded-full transition ${step > i ? "bg-gradient-to-r from-primary to-accent" : "bg-border/70"}`} />
                )}
                <button
                  type="button"
                  onClick={() => { if (n < step) { setStep(n); setError(""); } }}
                  disabled={n >= step}
                  className={`flex flex-col items-center gap-1.5 ${n < step ? "cursor-pointer" : "cursor-default"} px-1`}
                >
                  <span className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition ${
                    active
                      ? "bg-gradient-to-r from-primary to-accent text-white shadow-md shadow-accent/30"
                      : doneStep
                      ? "bg-success/15 text-success"
                      : "bg-white border border-border/40 text-content-muted"
                  }`}>
                    {doneStep ? <Check className="w-4 h-4" /> : n}
                  </span>
                  <span className={`text-xs font-bold ${active ? "text-primary" : "text-content-muted"}`}>{label}</span>
                </button>
              </Fragment>
            );
          })}
        </div>

        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* Main step content */}
          <div className="flex-1 w-full space-y-4">
            {step === 1 && (
              <div className="bg-white rounded-3xl border border-border/30 shadow-sm p-6 md:p-8 space-y-5">
                <h2 className="font-bold text-content text-lg flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                    <User className="w-4 h-4 text-primary" />
                  </span>
                  {t("checkout.step1")}
                </h2>
                <div>
                  <label className="text-sm text-content-muted block mb-1.5">{t("checkout.name")}</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputCls} required />
                </div>
                <div>
                  <label className="text-sm text-content-muted block mb-1.5 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5" />
                    {t("checkout.phone")}
                  </label>
                  <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputCls} required dir="ltr" />
                </div>
                <div>
                  <label className="text-sm text-content-muted block mb-1.5 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" />
                    {t("checkout.address")}
                  </label>
                  <textarea
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className={`${inputCls} resize-none`}
                    rows={3}
                    required
                  />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="bg-white rounded-3xl border border-border/30 shadow-sm p-6 md:p-8 space-y-4">
                <h2 className="font-bold text-content text-lg flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                    <CreditCard className="w-4 h-4 text-primary" />
                  </span>
                  {t("footer.payment")}
                </h2>
                {loadingPm ? (
                  <p className="text-sm text-content-muted py-6 text-center">{t("common.loading")}</p>
                ) : (
                  <>
                    <div className="space-y-3">
                      {payments.map((p) => {
                        const Icon = paymentIcon(p);
                        const selected = paymentId === p.id;
                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => { setPaymentId(p.id); setError(""); }}
                            className={`w-full flex items-center gap-3 border-2 rounded-2xl p-4 text-start transition ${
                              selected
                                ? "border-accent bg-accent/5 shadow-md shadow-accent/10"
                                : "border-border/40 hover:border-primary/40"
                            }`}
                          >
                            <span className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition ${
                              selected ? "bg-gradient-to-br from-primary to-accent text-white" : "bg-surface text-content-muted"
                            }`}>
                              <Icon className="w-5 h-5" />
                            </span>
                            <span className="flex-1 min-w-0">
                              <span className="block text-sm font-bold text-content">{lang === "ar" ? p.name : p.nameEn || p.name}</span>
                              <span className="block text-xs text-content-muted truncate">{lang === "ar" ? p.nameEn || "" : p.name}</span>
                            </span>
                            <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                              selected ? "border-accent" : "border-border"
                            }`}>
                              {selected && <span className="w-2.5 h-2.5 rounded-full bg-accent" />}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    {paymentId && (
                      <div>
                        <label className="text-sm text-content-muted block mb-1.5 flex items-center gap-1.5">
                          <Smartphone className="w-3.5 h-3.5" />
                          {t("checkout.paymentDetails")}
                        </label>
                        <input
                          type="text"
                          value={paymentDetails}
                          onChange={(e) => setPaymentDetails(e.target.value)}
                          className={inputCls}
                          placeholder={t("checkout.paymentDetailsPlaceholder")}
                          dir="ltr"
                        />
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {step === 3 && (
              <div className="bg-white rounded-3xl border border-border/30 shadow-sm p-6 md:p-8 space-y-5">
                <h2 className="font-bold text-content text-lg flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-primary" />
                  </span>
                  {t("checkout.step3")}
                </h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="bg-surface/50 border border-border/40 rounded-2xl p-4">
                    <p className="text-xs font-bold text-content-muted mb-2 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5" /> {t("checkout.reviewContact")}
                    </p>
                    <p className="text-sm font-bold text-content">{name}</p>
                    <p className="text-xs text-content-muted mt-0.5" dir="ltr">{phone}</p>
                    <p className="text-xs text-content-muted mt-1">{address}</p>
                  </div>
                  <div className="bg-surface/50 border border-border/40 rounded-2xl p-4">
                    <p className="text-xs font-bold text-content-muted mb-2 flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5" /> {t("checkout.reviewPayment")}
                    </p>
                    <p className="text-sm font-bold text-content">{payment ? (lang === "ar" ? payment.name : payment.nameEn || payment.name) : "—"}</p>
                    {paymentDetails && <p className="text-xs text-content-muted mt-1" dir="ltr">{paymentDetails}</p>}
                  </div>
                </div>
                <div className="space-y-3 border-t border-border/30 pt-4">
                  {cart.map((item) => {
                    const dp = item.discountPercentage > 0 ? item.price * (1 - item.discountPercentage / 100) : item.price;
                    const hasAttrs = Object.keys(item.attrs || {}).length > 0;
                    return (
                      <div key={item.variantId} className="flex items-center gap-3">
                        <div className="relative w-12 h-12 bg-surface rounded-xl overflow-hidden flex-shrink-0 border border-border/30">
                          {item.image && (
                            <img src={item.image.startsWith("http") ? item.image : productImageUrl(item.image)} alt={item.name} className="w-full h-full object-cover" />
                          )}
                          <span className="absolute -top-0 -end-0 bg-primary text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                            {item.quantity}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-content truncate font-medium">{item.name}</p>
                          {hasAttrs && (
                            <p className="text-xs text-content-muted truncate">
                              {Object.entries(item.attrs).map(([k, v]) => `${k}: ${v}`).join(" | ")}
                            </p>
                          )}
                          {item.unit === "pack" && (
                            <p className="text-xs text-accent truncate">
                              {item.quantity} {t("products.pack")} = {item.quantity * (item.packSize || 12)} {t("cart.piece")}
                            </p>
                          )}
                        </div>
                        <div className="text-sm font-bold text-content flex-shrink-0">{Math.round(dp * item.quantity)} {t("cart.currency")}</div>
                      </div>
                    );
                  })}
                </div>
                <div className="border-t border-dashed border-border/60 pt-4 space-y-2 text-sm">
                  <div className="flex justify-between text-content-muted">
                    <span>{t("checkout.subtotal")}</span>
                    <span>{Math.round(total)} {t("cart.currency")}</span>
                  </div>
                  <div className="flex justify-between text-content-muted">
                    <span>{t("checkout.deliveryFee")}</span>
                    <span className="text-success font-bold">{t("checkout.free")}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <span className="font-bold text-content">{t("cart.total")}</span>
                    <span className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                      {Math.round(total)} {t("cart.currency")}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <p className="text-sm font-bold text-danger bg-danger/10 border border-danger/20 rounded-xl px-4 py-3">{error}</p>
            )}

            {/* Nav buttons */}
            <div className="flex items-center gap-3">
              {step > 1 && (
                <button
                  type="button"
                  onClick={() => { setStep(step - 1); setError(""); }}
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-3.5 rounded-full border border-border/60 text-sm font-bold text-content hover:bg-white transition disabled:opacity-50"
                >
                  {lang === "ar" ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                  {t("checkout.back")}
                </button>
              )}
              {step < 3 ? (
                <button
                  type="button"
                  onClick={goNext}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-gradient-to-r from-accent to-primary text-white px-8 py-3.5 rounded-full font-bold hover:shadow-lg hover:shadow-accent/30 hover:-translate-y-0.5 transition-all"
                >
                  {t("checkout.next")}
                  {lang === "ar" ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleOrder}
                  disabled={loading}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-gradient-to-r from-accent to-primary text-white px-8 py-3.5 rounded-full font-bold hover:shadow-lg hover:shadow-accent/30 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none"
                >
                  <ShoppingBag className="w-4 h-4" />
                  {loading ? t("common.loading") : t("checkout.placeOrder")}
                </button>
              )}
            </div>
          </div>

          {/* Summary */}
          <div className="w-full lg:w-80 flex-shrink-0">
            <div className="bg-white rounded-3xl border border-border/30 shadow-sm overflow-hidden sticky top-28">
              <div className="bg-gradient-to-r from-content via-primary-dark to-primary px-6 py-5 text-white">
                <h2 className="font-bold text-lg">{t("cart.title")}</h2>
                <p className="text-white/60 text-xs mt-0.5">{totalPieces} {t("cart.piece")}</p>
              </div>
              <div className="p-6">
                <div className="space-y-3 max-h-64 overflow-y-auto mb-5 pe-1">
                  {cart.map((item) => {
                    const dp = item.discountPercentage > 0 ? item.price * (1 - item.discountPercentage / 100) : item.price;
                    const hasAttrs = Object.keys(item.attrs || {}).length > 0;
                    return (
                      <div key={item.variantId} className="flex items-center gap-3">
                        <div className="relative w-12 h-12 bg-surface rounded-xl overflow-hidden flex-shrink-0 border border-border/30">
                          {item.image && (
                            <img src={item.image.startsWith("http") ? item.image : productImageUrl(item.image)} alt={item.name} className="w-full h-full object-cover" />
                          )}
                          <span className="absolute -top-0 -end-0 bg-primary text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                            {item.quantity}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-content truncate font-medium">{item.name}</p>
                          {hasAttrs && (
                            <p className="text-xs text-content-muted truncate">
                              {Object.entries(item.attrs).map(([k, v]) => `${k}: ${v}`).join(" | ")}
                            </p>
                          )}
                          {item.unit === "pack" && (
                            <p className="text-xs text-accent truncate">
                              {item.quantity} {t("products.pack")} = {item.quantity * (item.packSize || 12)} {t("cart.piece")}
                            </p>
                          )}
                        </div>
                        <div className="text-sm font-bold text-content flex-shrink-0">{Math.round(dp * item.quantity)} {t("cart.currency")}</div>
                      </div>
                    );
                  })}
                </div>
                <div className="border-t border-dashed border-border/60 pt-4">
                  <div className="flex justify-between items-center mb-5">
                    <span className="font-bold text-content">{t("cart.total")}</span>
                    <span className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                      {Math.round(total)} {t("cart.currency")}
                    </span>
                  </div>
                  <p className="flex items-center justify-center gap-1.5 text-[11px] text-content-muted/60">
                    <Truck className="w-3.5 h-3.5" />
                    {t("home.features.delivery")}
                  </p>
                  <p className="flex items-center justify-center gap-1.5 text-[11px] text-content-muted/60 mt-2">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    {t("home.features.payment")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {showLogin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-content/60 backdrop-blur-sm" onClick={() => setShowLogin(false)} />
          <div className="relative bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 text-center">
            <div className="w-14 h-14 mx-auto rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-4">
              <ShoppingBag className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-lg font-bold text-content">سجّل الدخول لإتمام الطلب</h3>
            <p className="text-sm text-content-muted mt-2">أضف للسلة كمضيف، لكن إتمام الطلب يتطلب حساب — زي Amazon ✨</p>
            <div className="mt-6 flex gap-3">
              <button onClick={() => setShowLogin(false)} className="flex-1 py-2.5 rounded-full border border-border/40 text-sm font-bold text-content-muted hover:bg-surface transition">إلغاء</button>
              <Link href="/auth" onClick={() => setShowLogin(false)} className="flex-1 py-2.5 rounded-full bg-gradient-to-r from-accent to-primary text-white text-sm font-bold text-center">تسجيل الدخول</Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
