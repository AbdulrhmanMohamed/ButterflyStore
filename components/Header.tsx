"use client";
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useApp } from "@/contexts/AppContext";
import { productImageUrl } from "@/lib/cloudinary";
import {
  Search, Heart, ShoppingBag, User, Menu, X, ChevronDown, LogOut, LayoutDashboard,
  Truck, ShieldCheck, CreditCard, SearchX
} from "lucide-react";
import type { Product } from "@/lib/types";

export default function Header() {
  const { user, logout } = useAuth();
  const { t, cart, wishlist } = useApp();
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [showProfile, setShowProfile] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [focused, setFocused] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dropdownDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const searchWrapRef = useRef<HTMLDivElement>(null);
  const mobileWrapRef = useRef<HTMLDivElement>(null);

  const nav = [
    { href: "/", label: t("nav.home") },
    { href: "/products", label: t("nav.products") },
    { href: "/about", label: t("footer.about") },
    { href: "/contact", label: t("footer.contact") },
  ];

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  // Sync initial search param when landing directly on /products?search=...
  useEffect(() => {
    if (typeof window !== "undefined" && window.location.pathname.startsWith("/products")) {
      const q = new URLSearchParams(window.location.search).get("search") || "";
      if (q) setSearch(q);
    }
  }, []);

  // fetch products for dropdown
  useEffect(() => {
    fetch("/api/products").then(r => r.json()).then((data) => {
      if (Array.isArray(data)) setAllProducts(data);
    }).catch(() => {});
  }, []);

  // click outside to close dropdown
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchWrapRef.current && !searchWrapRef.current.contains(e.target as Node) &&
          mobileWrapRef.current && !mobileWrapRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // debounce for dropdown (120ms) — smooth without bounce
  useEffect(() => {
    if (dropdownDebounceRef.current) clearTimeout(dropdownDebounceRef.current);
    dropdownDebounceRef.current = setTimeout(() => setDebouncedSearch(search), 120);
    return () => { if (dropdownDebounceRef.current) clearTimeout(dropdownDebounceRef.current); };
  }, [search]);

  useEffect(() => {
    if (focused && debouncedSearch.trim()) setShowDropdown(true);
    else if (!debouncedSearch.trim()) setShowDropdown(false);
  }, [debouncedSearch, focused]);

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    if (!q) return [];
    return allProducts.filter(
      (p) =>
        (p.name || "").toLowerCase().includes(q) ||
        (p.nameEn || "").toLowerCase().includes(q) ||
        (p.description || "").toLowerCase().includes(q) ||
        (p.descriptionEn || "").toLowerCase().includes(q)
    ).slice(0, 7);
  }, [allProducts, debouncedSearch]);

  const navigateSearch = useCallback((value: string) => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    const trimmed = value.trim();
    if (trimmed) url.searchParams.set("search", trimmed);
    else url.searchParams.delete("search");
    const newUrl = `/products${url.search}`;
    setShowDropdown(false);
    if (window.location.pathname.startsWith("/products")) router.replace(newUrl);
    else router.push(newUrl);
  }, [router]);

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    // typing only shows dropdown — no navigation to /products (Amazon style)
  }, []);

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    // Enter / search button — keep dropdown open, don't auto-navigate to /products
    // user can click a match to go to /product/[id] or "عرض كل النتائج" for /products
    if (search.trim()) setShowDropdown(true);
  }, [search]);

  useEffect(() => {
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, []);

  const isStaff = user && (user.role === "owner" || user.role === "admin" || user.role === "merchant");

  return (
    <>
      {/* Announcement bar — flexible */}
      <div className="bg-gradient-to-r from-accent via-primary to-primary-dark text-white text-center py-1.5 px-2 sm:px-4 relative z-50">
        <div className="flex flex-wrap items-center justify-center gap-x-3 sm:gap-x-4 gap-y-1 text-[10px] sm:text-[11px] md:text-xs leading-none">
          <span className="inline-flex items-center gap-1 sm:gap-1.5 whitespace-nowrap shrink-0">
            <Truck className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
            {t("home.features.delivery")}
          </span>
          <span className="inline-flex items-center gap-1 sm:gap-1.5 whitespace-nowrap shrink-0">
            <ShieldCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
            {t("home.features.quality")}
          </span>
          <span className="inline-flex items-center gap-1 sm:gap-1.5 whitespace-nowrap shrink-0">
            <CreditCard className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
            {t("home.features.payment")}
          </span>
        </div>
      </div>

      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-border/60 shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16 gap-2 sm:gap-3">
            {/* Logo */}
            <Link href="/" className="shrink-0 group">
              <img src="/butterfly-scarf-removebg-preview.png" alt="Butterfly Scarf" className="h-12 w-auto object-contain group-hover:scale-105 transition-transform" />
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-1">
              {nav.map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
                    isActive(n.href)
                      ? "bg-primary text-white shadow-inner"
                      : "text-content/70 hover:text-content hover:bg-surface"
                  }`}
                >
                  {n.label}
                </Link>
              ))}
            </nav>

            {/* Search — Amazon style large */}
            <div ref={searchWrapRef} className="hidden md:flex flex-1 max-w-[360px] lg:max-w-[640px] mx-3 lg:mx-6 relative">
              <form
                onSubmit={handleSearch}
                className="w-full flex items-center bg-white border-2 border-accent/20 rounded-full overflow-hidden shadow-sm hover:shadow-md focus-within:border-accent focus-within:shadow-lg transition-all h-[46px]"
              >
                <div className="flex items-center flex-1 min-w-0 px-3 sm:px-4 gap-2 sm:gap-3">
                  <Search className="w-5 h-5 text-content-muted/50 shrink-0" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    onFocus={() => { setFocused(true); if (search.trim()) setShowDropdown(true); }}
                    onBlur={() => setFocused(false)}
                    placeholder={t("products.searchPlaceholder")}
                    className="flex-1 min-w-0 bg-transparent outline-none text-[14px] sm:text-[15px] text-content placeholder:text-content-muted/50"
                    autoComplete="off"
                  />
                  {search && (
                    <button type="button" onClick={() => { setSearch(""); setDebouncedSearch(""); setShowDropdown(false); }} className="w-7 h-7 rounded-full bg-surface hover:bg-border/50 flex items-center justify-center text-content-muted hover:text-content transition shrink-0">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <button
                  type="submit"
                  className="h-full px-7 bg-gradient-to-r from-accent to-accent-light hover:from-accent-light hover:to-accent text-white font-bold text-sm transition shrink-0"
                >
                  بحث
                </button>
              </form>

              {/* Dropdown */}
              {showDropdown && (
                <div className="absolute top-full mt-2 w-full bg-white rounded-2xl shadow-2xl border border-border/20 overflow-hidden z-50 animate-in fade-in">
                  {filtered.length > 0 ? (
                    <>
                      <div className="px-3 py-2 text-[11px] font-bold text-content-muted/70 border-b border-border/10">
                        {filtered.length} نتائج لـ “{debouncedSearch.trim()}”
                      </div>
                      <div className="max-h-[380px] overflow-auto divide-y divide-border/10">
                        {filtered.map((p) => {
                          const img = (p.images?.[0] || "");
                          const thumb = img ? (img.startsWith("http") || img.startsWith("/") ? img : productImageUrl(img)) : "";
                          const displayPrice = p.discountPercentage > 0 ? Math.round(p.price * (1 - p.discountPercentage / 100)) : Math.round(p.price);
                          return (
                            <Link
                              key={p.id}
                              href={`/product/${p.id}`}
                              onClick={() => setShowDropdown(false)}
                              className="flex items-center gap-3 px-3 py-3 hover:bg-surface/70 transition group"
                            >
                              <div className="w-12 h-12 rounded-xl overflow-hidden bg-surface border border-border/20 shrink-0">
                                {thumb ? <img src={thumb} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition" /> : <div className="w-full h-full flex items-center justify-center text-content-muted/30"><Search className="w-5 h-5" /></div>}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-content line-clamp-1 group-hover:text-accent transition">{p.name}</p>
                                <p className="text-xs text-content-muted line-clamp-1 mt-0.5">{p.description?.slice(0, 60) || p.nameEn || ""}</p>
                              </div>
                              <div className="text-right shrink-0">
                                <p className="text-sm font-bold text-primary">{displayPrice} ج.م</p>
                                {p.discountPercentage > 0 && <p className="text-[11px] text-content-muted/50 line-through">{Math.round(p.price)} ج.م</p>}
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                      <Link
                        href={`/products?search=${encodeURIComponent(debouncedSearch.trim())}`}
                        onClick={() => setShowDropdown(false)}
                        className="block text-center py-3 bg-surface/50 hover:bg-accent hover:text-white text-sm font-bold text-accent border-t border-border/10 transition"
                      >
                        عرض كل النتائج ({filtered.length}) ←
                      </Link>
                    </>
                  ) : (
                    <div className="py-10 px-6 text-center">
                      <div className="w-14 h-14 rounded-full bg-surface border border-border/20 flex items-center justify-center mx-auto mb-3">
                        <SearchX className="w-7 h-7 text-content-muted/40" />
                      </div>
                      <p className="text-sm font-bold text-content">لا توجد نتائج</p>
                      <p className="text-xs text-content-muted mt-1">لم نجد أي منتج مطابق لـ “{debouncedSearch.trim()}”</p>
                      <Link href="/products" onClick={() => setShowDropdown(false)} className="inline-block mt-4 text-xs font-bold text-accent hover:underline">تصفح كل المنتجات</Link>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {/* Wishlist */}
              <Link
                href="/wishlist"
                className="relative w-10 h-10 bg-surface hover:bg-border/40 border border-border/60 rounded-full flex items-center justify-center text-content/80 hover:text-content transition"
              >
                <Heart className="w-5 h-5" />
                {wishlist.length > 0 && (
                  <span className="absolute -top-1 -end-1 bg-accent text-white text-[10px] min-w-4 h-4 px-1 rounded-full flex items-center justify-center font-bold shadow">
                    {wishlist.length}
                  </span>
                )}
              </Link>

              {/* Cart */}
              <Link
                href="/cart"
                className="relative w-10 h-10 bg-surface hover:bg-border/40 border border-border/60 rounded-full flex items-center justify-center text-content/80 hover:text-content transition"
              >
                <ShoppingBag className="w-5 h-5" />
                {cart.length > 0 && (
                  <span className="absolute -top-1 -end-1 bg-danger text-white text-[10px] min-w-4 h-4 px-1 rounded-full flex items-center justify-center font-bold shadow">
                    {cart.length}
                  </span>
                )}
              </Link>

              {/* Profile / Auth */}
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setShowProfile(!showProfile)}
                    className="flex items-center gap-2 bg-surface hover:bg-border/40 border border-border/60 rounded-full py-1 pe-1 ps-3 transition"
                  >
                    <span className="hidden lg:inline text-sm font-bold text-content/90">{user.name}</span>
                    <span className="w-8 h-8 rounded-full bg-gradient-to-br from-accent to-accent-light flex items-center justify-center text-sm font-bold text-white">
                      {user.name.charAt(0)}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-content-muted" />
                  </button>
                  {showProfile && (
                    <div className="absolute end-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-border/60 overflow-hidden z-50">
                      <div className="bg-gradient-to-r from-primary to-accent px-4 py-3 text-white">
                        <p className="font-bold text-sm">{user.name}</p>
                        <p className="text-[11px] text-white/70 mt-0.5" dir="ltr">{user.phone}</p>
                      </div>
                      <div className="py-1">
                        <Link
                          href="/profile"
                          onClick={() => setShowProfile(false)}
                          className="block px-4 py-2.5 text-sm text-content hover:bg-surface/60 transition flex items-center gap-2"
                        >
                          <User className="w-4 h-4 text-content-muted" />
                          {t("auth.profile")}
                        </Link>
                        {isStaff && (
                          <Link
                            href="/admin"
                            onClick={() => setShowProfile(false)}
                            className="block px-4 py-2.5 text-sm text-content hover:bg-surface/60 transition flex items-center gap-2"
                          >
                            <LayoutDashboard className="w-4 h-4 text-content-muted" />
                            {t("nav.admin")}
                          </Link>
                        )}
                        <div className="border-t border-border/50 my-1" />
                        <button
                          onClick={() => { setShowProfile(false); logout(); }}
                          className="w-full text-end px-4 py-2.5 text-sm text-danger hover:bg-danger/10 transition flex items-center gap-2"
                        >
                          <LogOut className="w-4 h-4" />
                          {t("auth.logout")}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href="/auth"
                  className="hidden sm:inline-flex items-center gap-2 bg-accent text-white px-5 py-2.5 rounded-full text-sm font-bold hover:bg-accent-light transition shadow-lg shadow-accent/30"
                >
                  <User className="w-4 h-4" />
                  {t("nav.login")}
                </Link>
              )}

              {/* Mobile login icon */}
              {!user && (
                <Link
                  href="/auth"
                  className="sm:hidden w-10 h-10 bg-surface hover:bg-border/40 border border-border/60 rounded-full flex items-center justify-center text-content/80 hover:text-content transition"
                >
                  <User className="w-5 h-5" />
                </Link>
              )}

              {/* Mobile Menu Toggle */}
              <button
                className="lg:hidden w-10 h-10 bg-surface hover:bg-border/40 border border-border/60 rounded-full flex items-center justify-center text-content/80 hover:text-content transition"
                onClick={() => setMenuOpen(!menuOpen)}
              >
                {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="lg:hidden bg-white/95 backdrop-blur border-t border-border/60 px-4 py-4 space-y-1">
            <div ref={mobileWrapRef} className="relative mb-3">
              <form onSubmit={handleSearch} className="flex items-center bg-white border-2 border-accent/20 rounded-full overflow-hidden shadow-sm focus-within:border-accent transition h-11 min-w-0">
                <div className="flex items-center flex-1 min-w-0 px-3 gap-2">
                  <Search className="w-4 h-4 text-content-muted/50 shrink-0" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    onFocus={() => { setFocused(true); if (search.trim()) setShowDropdown(true); }}
                    onBlur={() => setFocused(false)}
                    placeholder={t("products.searchPlaceholder")}
                    className="flex-1 min-w-0 bg-transparent outline-none text-sm text-content placeholder:text-content-muted/50"
                    autoComplete="off"
                  />
                  {search && (
                    <button type="button" onClick={() => { setSearch(""); setDebouncedSearch(""); setShowDropdown(false); }} className="w-6 h-6 rounded-full bg-surface flex items-center justify-center text-content-muted">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <button type="submit" className="h-full px-5 bg-accent text-white text-sm font-bold">
                  بحث
                </button>
              </form>
              {showDropdown && (
                <div className="absolute top-full mt-2 w-full bg-white rounded-2xl shadow-xl border border-border/20 overflow-hidden z-50">
                  {filtered.length > 0 ? (
                    <>
                      <div className="max-h-[320px] overflow-auto divide-y divide-border/10">
                        {filtered.map((p) => {
                          const img = (p.images?.[0] || "");
                          const thumb = img ? (img.startsWith("http") || img.startsWith("/") ? img : productImageUrl(img)) : "";
                          const displayPrice = p.discountPercentage > 0 ? Math.round(p.price * (1 - p.discountPercentage / 100)) : Math.round(p.price);
                          return (
                            <Link key={p.id} href={`/product/${p.id}`} onClick={() => { setShowDropdown(false); setMenuOpen(false); }} className="flex items-center gap-3 px-3 py-2.5 hover:bg-surface/60 transition">
                              <div className="w-10 h-10 rounded-lg overflow-hidden bg-surface border border-border/20 shrink-0">
                                {thumb ? <img src={thumb} alt={p.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-content-muted/30"><Search className="w-4 h-4" /></div>}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-content line-clamp-1">{p.name}</p>
                                <p className="text-xs font-bold text-primary">{displayPrice} ج.م</p>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                      <Link href={`/products?search=${encodeURIComponent(debouncedSearch.trim())}`} onClick={() => { setShowDropdown(false); setMenuOpen(false); }} className="block text-center py-2.5 bg-surface/50 text-sm font-bold text-accent border-t border-border/10">عرض كل النتائج</Link>
                    </>
                  ) : (
                    <div className="py-8 text-center px-4">
                      <SearchX className="w-6 h-6 text-content-muted/40 mx-auto mb-2" />
                      <p className="text-sm font-bold text-content">لا توجد نتائج</p>
                      <p className="text-xs text-content-muted mt-1">“{debouncedSearch.trim()}” غير موجود</p>
                    </div>
                  )}
                </div>
              )}
            </div>
            {nav.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                onClick={() => setMenuOpen(false)}
                className={`block text-sm font-bold rounded-xl px-4 py-2.5 transition ${
                  isActive(n.href) ? "bg-primary text-white" : "text-content/70 hover:text-content hover:bg-surface"
                }`}
              >
                {n.label}
              </Link>
            ))}
            {isStaff && (
              <Link
                href="/admin"
                onClick={() => setMenuOpen(false)}
                className="block text-sm font-bold rounded-xl px-4 py-2.5 text-content/70 hover:text-content hover:bg-surface transition"
              >
                {t("nav.admin")}
              </Link>
            )}
          </div>
        )}
      </header>
    </>
  );
}
