"use client";
import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { translations } from "@/lib/translations";
import { useAuth } from "@/contexts/AuthContext";

export interface WishlistItem {
  productId: string;
  name: string;
  price: number;
  discountPercentage: number;
  image: string;
  categoryName?: string;
  companyName?: string;
}

export interface CartItem {
  variantId: string;
  productId: string;
  name: string;
  price: number;
  discountPercentage: number;
  image: string;
  attrs: Record<string, string>;
  quantity: number;
  unit?: "qty" | "pack";
  packSize?: number;
}

interface AppCtx {
  lang: string;
  t: (key: string) => string;
  setLang: (l: string) => void;

  wishlist: WishlistItem[];
  cart: CartItem[];
  toggleWishlist: (item: WishlistItem) => void;
  isWished: (productId: string) => boolean;
  addItem: (item: CartItem) => void;
  updateQuantity: (variantId: string, qty: number) => void;
  removeItem: (variantId: string) => void;
  clearCart: () => void;
  notify: (message: string) => void;
}

const Ctx = createContext<AppCtx>({
  lang: "ar", t: (k) => k, setLang: () => {},
  wishlist: [], cart: [],
  toggleWishlist: () => {}, isWished: () => false,
  addItem: () => {}, updateQuantity: () => {}, removeItem: () => {}, clearCart: () => {},
  notify: () => {},
});

const GUEST_WISHLIST_KEY = "scarf_wishlist_guest";
const GUEST_CART_KEY = "scarf_cart_guest";
const wishlistKeyFor = (userId?: string | null) => userId ? `scarf_wishlist_${userId}` : GUEST_WISHLIST_KEY;
const cartKeyFor = (userId?: string | null) => userId ? `scarf_cart_${userId}` : GUEST_CART_KEY;

function loadJson<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const d = JSON.parse(raw);
    const arr = Array.isArray(d) ? d : d.state?.items || [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}
function saveJson<T>(key: string, data: T[]) {
  try { localStorage.setItem(key, JSON.stringify(data)); } catch {}
}
function mergeWishlist(a: WishlistItem[], b: WishlistItem[]): WishlistItem[] {
  const map = new Map<string, WishlistItem>();
  [...a, ...b].forEach((it) => { if (!map.has(it.productId)) map.set(it.productId, it); });
  return Array.from(map.values());
}
function mergeCart(a: CartItem[], b: CartItem[]): CartItem[] {
  const map = new Map<string, CartItem>();
  [...a, ...b].forEach((it) => {
    const k = `${it.variantId}::${it.unit || "qty"}`;
    const ex = map.get(k);
    if (ex) ex.quantity += it.quantity;
    else map.set(k, { ...it });
  });
  return Array.from(map.values());
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const lang = "ar" as const;
  const { user } = useAuth();
  const userId = user?.id || null;
  const prevUserIdRef = useRef<string | null>(null);

  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  const notify = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2200);
  }, []);

  const t = useCallback((key: string) => {
    const tr = translations["ar"];
    return (tr as any)?.[key] || key;
  }, []);

  const setLang = useCallback((_l: string) => {}, []);

  // Load correct key when user changes + merge guest → user on login
  useEffect(() => {
    const prev = prevUserIdRef.current;
    // login: null → userId
    if (!prev && userId) {
      const guestW = loadJson<WishlistItem>(GUEST_WISHLIST_KEY);
      const guestC = loadJson<CartItem>(GUEST_CART_KEY);
      const userW = loadJson<WishlistItem>(wishlistKeyFor(userId));
      const userC = loadJson<CartItem>(cartKeyFor(userId));
      const mergedW = mergeWishlist(userW, guestW);
      const mergedC = mergeCart(userC, guestC);
      if (guestW.length || guestC.length) {
        saveJson(wishlistKeyFor(userId), mergedW);
        saveJson(cartKeyFor(userId), mergedC);
        localStorage.removeItem(GUEST_WISHLIST_KEY);
        localStorage.removeItem(GUEST_CART_KEY);
        if (guestW.length || guestC.length) notify("تم نقل سلتك ومفضلتك إلى حسابك ✓");
      }
      setWishlist(mergedW);
      setCart(mergedC);
    } else if (prev && !userId) {
      // logout: show empty guest
      setWishlist(loadJson<WishlistItem>(GUEST_WISHLIST_KEY));
      setCart(loadJson<CartItem>(GUEST_CART_KEY));
    } else {
      // initial load or user switch
      setWishlist(loadJson<WishlistItem>(wishlistKeyFor(userId)));
      setCart(loadJson<CartItem>(cartKeyFor(userId)));
    }
    prevUserIdRef.current = userId;
  }, [userId, notify]);

  // Persist to per-user / guest key
  useEffect(() => {
    if (typeof window === "undefined") return;
    // skip initial empty before load? still save
    saveJson(wishlistKeyFor(userId), wishlist);
  }, [wishlist, userId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    saveJson(cartKeyFor(userId), cart);
  }, [cart, userId]);

  const toggleWishlist = useCallback((item: WishlistItem) => {
    setWishlist((prev) => {
      const exists = prev.some((w) => w.productId === item.productId);
      return exists ? prev.filter((w) => w.productId !== item.productId) : [...prev, item];
    });
  }, []);

  const isWished = useCallback((productId: string) => wishlist.some((w) => w.productId === productId), [wishlist]);

  const addItem = useCallback((item: CartItem) => {
    setCart((prev) => {
      const idx = prev.findIndex((c) => c.variantId === item.variantId && (c.unit || "qty") === (item.unit || "qty"));
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + item.quantity };
        return next;
      }
      return [...prev, item];
    });
  }, []);

  const updateQuantity = useCallback((variantId: string, qty: number) => {
    setCart((prev) =>
      qty <= 0
        ? prev.filter((c) => c.variantId !== variantId)
        : prev.map((c) => (c.variantId === variantId ? { ...c, quantity: qty } : c))
    );
  }, []);

  const removeItem = useCallback((variantId: string) => {
    setCart((prev) => prev.filter((c) => c.variantId !== variantId));
  }, []);

  const clearCart = useCallback(() => { setCart([]); }, []);

  return (
    <Ctx.Provider value={{
      lang, t, setLang,
      wishlist, cart, toggleWishlist, isWished,
      addItem, updateQuantity, removeItem, clearCart, notify,
    }}>
      {children}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] bg-content text-white text-sm px-5 py-3 rounded-full shadow-lg animate-pulse">
          {toast}
        </div>
      )}
    </Ctx.Provider>
  );
}

export const useApp = () => useContext(Ctx);
