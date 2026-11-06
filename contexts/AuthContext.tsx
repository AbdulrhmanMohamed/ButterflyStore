"use client";
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { User } from "@/lib/types";
import { usersList, userByPhone, userCreate } from "@/lib/actions";

interface AuthCtx {
  user: User | null;
  loading: boolean;
  login: (phone: string) => Promise<boolean>;
  register: (name: string, phone: string) => Promise<boolean>;
  updateProfile: (data: { name: string; phone: string }) => Promise<boolean>;
  logout: () => void;
  refresh: () => Promise<void>;
}

const Ctx = createContext<AuthCtx>({
  user: null, loading: true,
  login: async () => false, register: async () => false, updateProfile: async () => false, logout: () => {}, refresh: async () => {},
});

const STORAGE_KEY = "scarf_current_user";
const EXPIRY = 720 * 60 * 60 * 1000;

function loadUser(): User | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const { user, expiresAt } = JSON.parse(raw);
    if (Date.now() > expiresAt) { localStorage.removeItem(STORAGE_KEY); return null; }
    return user;
  } catch { localStorage.removeItem(STORAGE_KEY); return null; }
}

function saveUser(user: User) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ user, expiresAt: Date.now() + EXPIRY }));
}

const SEED_USERS = [
  { name: "مالك المنصة", phone: "01000000001", role: "owner" as const },
  { name: "صاحب المتجر", phone: "01000000002", role: "merchant" as const },
  { name: "مدير المتجر", phone: "01220757043", role: "admin" as const },
  { name: "أحمد علي", phone: "01012345678", role: "client" as const },
];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => { setUser(loadUser()); }, []);

  useEffect(() => {
    (async () => {
      try {
        const existing = await usersList();
        if (existing.length === 0) {
          for (const u of SEED_USERS) await userCreate(u);
        }
      } catch {}
      setUser(loadUser());
      setLoading(false);
    })();
  }, []);

  const login = useCallback(async (phone: string) => {
    const u = await userByPhone(phone.replace(/\s/g, ""));
    if (!u) return false;
    setUser(u);
    saveUser(u);
    window.location.reload();
    return true;
  }, []);

  const register = useCallback(async (name: string, phone: string) => {
    const ref = await userCreate({ name: name.trim(), phone: phone.replace(/\s/g, ""), role: "client" });
    const u: User = { id: ref.id, name: name.trim(), phone: phone.replace(/\s/g, ""), role: "client", createdAt: null };
    setUser(u);
    saveUser(u);
    window.location.reload();
    return true;
  }, []);

  const updateProfile = useCallback(async (data: { name: string; phone: string }) => {
    if (!user) return false;
    const cleanPhone = data.phone.replace(/\s/g, "");
    const cleanName = data.name.trim();
    if (!cleanName || !cleanPhone) return false;
    // check phone uniqueness
    const existing = await userByPhone(cleanPhone);
    if (existing && existing.id !== user.id) return false;
    const { userUpdate } = await import("@/lib/actions");
    await userUpdate(user.id, { name: cleanName, phone: cleanPhone, role: user.role });
    const updated: User = { ...user, name: cleanName, phone: cleanPhone };
    setUser(updated);
    saveUser(updated);
    return true;
  }, [user]);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
    window.location.reload();
  }, []);

  return (
    <Ctx.Provider value={{ user, loading, login, register, updateProfile, logout, refresh }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
