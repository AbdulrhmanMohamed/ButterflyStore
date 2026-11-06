"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import Link from "next/link";
import { User, Shield, ShoppingBag, Heart, LogOut, ChevronLeft, Star, Pencil, Save, X, Phone } from "lucide-react";

const ROLE_LABELS: Record<string, string> = {
  owner: "مالك المنصة",
  merchant: "صاحب المتجر",
  admin: "مدير المتجر",
  client: "عميل",
};

export default function ProfilePage() {
  const { user, logout, updateProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // sync when user loads
  useEffect(() => {
    if (user) {
      setName(user.name);
      setPhone(user.phone);
    }
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen bg-surface">
        <Header />
        <div className="max-w-md mx-auto px-4 py-16 text-center">
          <p className="text-content-muted text-lg mb-6">سجّل الدخول أولاً</p>
          <Link
            href="/auth"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-primary to-primary-dark text-white px-8 py-3 rounded-full font-bold hover:shadow-lg hover:shadow-primary/30 transition-all"
          >
            دخول
          </Link>
        </div>
      </div>
    );
  }

  const isStaff = user.role === "owner" || user.role === "admin" || user.role === "merchant";

  const links = [
    ...(isStaff
      ? [{ href: "/admin", icon: Shield, label: "لوحة التحكم", accent: "from-primary to-accent" }]
      : []),
    { href: "/cart", icon: ShoppingBag, label: "سلة التسوق", accent: "from-accent to-accent-light" },
    { href: "/wishlist", icon: Heart, label: "المفضلة", accent: "from-danger to-warning" },
  ];

  return (
    <div className="min-h-screen bg-surface">
      <Header />
      <div className="max-w-md mx-auto px-4 py-12">
        <div className="bg-white rounded-3xl border border-border/30 shadow-sm overflow-hidden">
          {/* Header */}
          <div className="relative overflow-hidden bg-gradient-to-br from-content via-primary-dark to-primary px-6 py-8 sm:py-10 text-center text-white">
            <div className="absolute -top-12 -end-12 w-44 h-44 rounded-full bg-accent/25 blur-3xl" />
            <div className="absolute -bottom-16 -start-10 w-52 h-52 rounded-full bg-accent/15 blur-3xl" />
            <button onClick={() => { setEditing(!editing); setError(""); setSuccess(""); if (!editing) { setName(user.name); setPhone(user.phone); } }} className="absolute top-4 end-4 w-9 h-9 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition z-10" aria-label="تعديل">
              {editing ? <X className="w-4 h-4" /> : <Pencil className="w-4 h-4" />}
            </button>
            <div className="relative">
              <div className="w-20 h-20 mx-auto rounded-full bg-white/10 border border-white/20 flex items-center justify-center mb-4">
                <User className="w-10 h-10" />
              </div>
              {!editing ? (
                <>
                  <h1 className="text-xl font-bold">{user.name}</h1>
                  <p className="text-white/60 text-sm mt-1" dir="ltr">{user.phone}</p>
                  <div className="flex items-center justify-center gap-2 mt-4">
                    <span className="inline-flex items-center gap-1 bg-white/10 border border-white/20 text-xs font-bold px-4 py-1.5 rounded-full">
                      <Star className="w-3 h-3 text-warning fill-warning" />
                      {ROLE_LABELS[user.role] || user.role}
                    </span>
                  </div>
                </>
              ) : (
                <p className="text-sm font-bold text-white/90">تعديل الملف الشخصي</p>
              )}
            </div>
          </div>

          {/* Edit Form */}
          {editing && (
            <div className="p-5 border-b border-border/20 bg-surface/30 space-y-4">
              {error && <p className="text-sm font-bold text-danger bg-danger/10 border border-danger/20 rounded-xl px-3 py-2">{error}</p>}
              {success && <p className="text-sm font-bold text-success bg-success/10 border border-success/20 rounded-xl px-3 py-2">{success}</p>}
              <div>
                <label className="text-xs font-bold text-content-muted block mb-1.5">الاسم</label>
                <div className="flex items-center gap-2 bg-white border border-border/40 rounded-xl px-3 focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20 transition">
                  <User className="w-4 h-4 text-content-muted/60 shrink-0" />
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="الاسم" className="flex-1 min-w-0 py-2.5 bg-transparent outline-none text-sm text-content" />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-content-muted block mb-1.5 flex items-center gap-1.5"><Phone className="w-3 h-3" /> رقم الهاتف</label>
                <div className="flex items-center gap-2 bg-white border border-border/40 rounded-xl px-3 focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20 transition">
                  <Phone className="w-4 h-4 text-content-muted/60 shrink-0" />
                  <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="01XXXXXXXXX" dir="ltr" className="flex-1 min-w-0 py-2.5 bg-transparent outline-none text-sm text-content" />
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => { setEditing(false); setError(""); setSuccess(""); }} className="flex-1 py-2.5 rounded-full border border-border/40 text-sm font-bold text-content-muted hover:bg-white transition">إلغاء</button>
                <button
                  onClick={async () => {
                    setError(""); setSuccess("");
                    if (!name.trim() || !phone.trim()) { setError("الاسم ورقم الهاتف مطلوبان"); return; }
                    setSaving(true);
                    const ok = await updateProfile({ name, phone });
                    setSaving(false);
                    if (!ok) setError("رقم الهاتف مستخدم بالفعل أو حدث خطأ");
                    else { setSuccess("تم حفظ التعديلات ✓"); setTimeout(() => { setEditing(false); setSuccess(""); }, 1200); }
                  }}
                  disabled={saving}
                  className="flex-1 py-2.5 rounded-full bg-gradient-to-r from-primary to-accent text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {saving ? "جارٍ الحفظ..." : "حفظ"}
                </button>
              </div>
            </div>
          )}

          {/* Links */}
          <div className="p-5 space-y-3">
            {links.map((l) => {
              const Icon = l.icon;
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className="flex items-center gap-3 p-3 bg-surface/50 rounded-2xl hover:bg-surface hover:-translate-y-0.5 transition-all group"
                >
                  <span className={`w-11 h-11 rounded-xl bg-gradient-to-br ${l.accent} flex items-center justify-center text-white shadow-md flex-shrink-0`}>
                    <Icon className="w-5 h-5" />
                  </span>
                  <span className="flex-1 text-sm font-bold text-content group-hover:text-primary transition">{l.label}</span>
                  <ChevronLeft className="w-4 h-4 text-content-muted/50" />
                </Link>
              );
            })}

            <button
              onClick={logout}
              className="w-full flex items-center gap-3 p-3 bg-danger/5 rounded-2xl hover:bg-danger/10 transition-all group mt-2"
            >
              <span className="w-11 h-11 rounded-xl bg-danger/10 flex items-center justify-center text-danger flex-shrink-0">
                <LogOut className="w-5 h-5" />
              </span>
              <span className="text-sm font-bold text-danger">تسجيل الخروج</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
