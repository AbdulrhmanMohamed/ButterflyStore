"use client";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import { User, Phone, LogOut, Sparkles, ShieldCheck, Truck, Headphones } from "lucide-react";

export default function AuthPage() {
  const { login, register, user, logout } = useAuth();
  const [tab, setTab] = useState<"login" | "register">("login");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (user) {
    return (
      <div className="min-h-screen bg-surface">
        <Header />
        <div className="max-w-md mx-auto px-4 py-6 sm:py-16">
          <div className="bg-white rounded-3xl border border-border/30 shadow-sm overflow-hidden text-center">
            <div className="bg-gradient-to-r from-content via-primary-dark to-primary px-6 py-8 text-white">
              <div className="w-20 h-20 mx-auto rounded-full bg-white/10 border border-white/20 flex items-center justify-center mb-4">
                <User className="w-10 h-10" />
              </div>
              <h1 className="text-xl font-bold">{user.name}</h1>
              <p className="text-white/60 text-sm mt-1" dir="ltr">{user.phone}</p>
              <span className="inline-block bg-white/10 border border-white/20 text-xs font-bold px-4 py-1 rounded-full mt-3">
                {user.role}
              </span>
            </div>
            <div className="p-6">
              <button
                onClick={logout}
                className="w-full bg-danger/10 text-danger py-3 rounded-full font-bold hover:bg-danger/20 transition flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                تسجيل الخروج
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (tab === "login") {
        const ok = await login(phone);
        if (!ok) setError("رقم الهاتف غير موجود");
      } else {
        if (!name.trim()) { setError("الاسم مطلوب"); setLoading(false); return; }
        const ok = await register(name, phone);
        if (!ok) setError("حدث خطأ");
      }
    } catch {
      setError("حدث خطأ");
    }
    setLoading(false);
  };

  const perks = [
    { icon: Truck, text: "توصيل سريع لجميع المحافظات" },
    { icon: ShieldCheck, text: "منتجات أصلية بجودة مضمونة" },
    { icon: Headphones, text: "دعم على مدار الساعة" },
  ];

  const inputWrap = "flex items-center min-w-0 bg-surface/50 border border-border/40 rounded-xl px-3 focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20 transition";

  return (
    <div className="min-h-screen bg-surface">
      <Header />
      <div className="max-w-4xl mx-auto px-4 py-6 sm:py-12">
        <div className="bg-white rounded-3xl border border-border/30 shadow-sm overflow-hidden grid grid-cols-1 md:grid-cols-5">
          {/* Brand panel */}
          <div className="relative overflow-hidden bg-gradient-to-br from-content via-primary-dark to-primary text-white p-6 sm:p-8 md:col-span-2 flex flex-col">
            <div className="absolute -top-16 -start-16 w-48 h-48 rounded-full bg-accent/25 blur-3xl" />
            <div className="absolute -bottom-20 -end-10 w-56 h-56 rounded-full bg-accent/15 blur-3xl" />
            <div className="relative">
              <span className="inline-flex items-center gap-2 bg-white/10 border border-white/15 text-xs font-bold px-4 py-1.5 rounded-full backdrop-blur">
                <Sparkles className="w-3.5 h-3.5 text-accent-light" />
                Butterfly Scarf
              </span>
              <h2 className="text-xl sm:text-2xl font-bold mt-5 leading-snug">أهلاً بك في متجرك الأول للشالات الفاخرة 🦋</h2>
              <p className="text-white/60 text-sm mt-3 leading-relaxed">سجّل الدخول أو أنشئ حساباً جديداً لتبدأ رحلة التسوق.</p>
              <div className="mt-8 space-y-3">
                {perks.map((p) => {
                  const Icon = p.icon;
                  return (
                    <p key={p.text} className="flex items-center gap-2.5 text-sm text-white/80">
                      <span className="w-8 h-8 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center">
                        <Icon className="w-4 h-4 text-accent-light" />
                      </span>
                      {p.text}
                    </p>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Form panel */}
          <div className="p-6 sm:p-8 md:col-span-3">
            <h1 className="text-lg sm:text-xl font-bold text-content mb-6">تسجيل الدخول</h1>

            {/* Tabs */}
            <div className="flex mb-6 bg-surface rounded-full p-1">
              <button
                onClick={() => { setTab("login"); setError(""); }}
                className={`flex-1 py-2.5 text-sm rounded-full font-bold transition ${
                  tab === "login" ? "bg-white shadow-md text-primary" : "text-content-muted"
                }`}
              >
                دخول
              </button>
              <button
                onClick={() => { setTab("register"); setError(""); }}
                className={`flex-1 py-2.5 text-sm rounded-full font-bold transition ${
                  tab === "register" ? "bg-white shadow-md text-primary" : "text-content-muted"
                }`}
              >
                حساب جديد
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {tab === "register" && (
                <div>
                  <label className="text-sm text-content-muted block mb-1.5">الاسم</label>
                  <div className={inputWrap}>
                    <User className="w-4 h-4 text-content-muted/60" />
                      <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="flex-1 min-w-0 py-2.5 px-2 text-sm outline-none bg-transparent text-content placeholder:text-content-muted/50"
                      placeholder="أدخل اسمك"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="text-sm text-content-muted block mb-1.5">رقم الهاتف</label>
                <div className={inputWrap}>
                  <Phone className="w-4 h-4 text-content-muted/60" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="flex-1 min-w-0 py-2.5 px-2 text-sm outline-none bg-transparent text-content placeholder:text-content-muted/50"
                    placeholder="01XXXXXXXXX"
                    dir="ltr"
                    required
                  />
                </div>
              </div>

              {error && <p className="text-danger text-sm font-medium">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-accent to-primary text-white py-3 rounded-full font-bold hover:shadow-lg hover:shadow-accent/30 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none"
              >
                {loading ? "جارٍ التحميل..." : tab === "login" ? "دخول" : "إنشاء حساب"}
              </button>
            </form>


          </div>
        </div>
      </div>
    </div>
  );
}
