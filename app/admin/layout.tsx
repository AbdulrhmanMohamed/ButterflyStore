"use client";
import { useAuth } from "@/contexts/AuthContext";
import { useApp } from "@/contexts/AppContext";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Header from "@/components/Header";
import {
  LayoutDashboard, Package, ShoppingCart, Users, Percent, CreditCard, Image, ArrowRight, Building2
} from "lucide-react";

const adminNav = [
  { href: "/admin", icon: LayoutDashboard, labelKey: "admin.dashboard", exact: true },
  { href: "/admin/companies", icon: Building2, labelKey: "admin.companies" },
  { href: "/admin/products", icon: Package, labelKey: "admin.products" },
  { href: "/admin/orders", icon: ShoppingCart, labelKey: "admin.orders" },
  { href: "/admin/customers", icon: Users, labelKey: "admin.customers" },
  { href: "/admin/discounts", icon: Percent, labelKey: "admin.discounts" },
  { href: "/admin/payments", icon: CreditCard, labelKey: "admin.payments" },
  { href: "/admin/media", icon: Image, labelKey: "admin.media" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { t } = useApp();
  const pathname = usePathname();

  if (!user || (user.role !== "owner" && user.role !== "admin" && user.role !== "merchant")) {
    return (
      <div className="min-h-screen bg-surface">
        <Header />
        <div className="max-w-md mx-auto px-4 py-12 text-center">
          <p className="text-content-muted">غير مصرح لك بالوصول</p>
          <Link href="/" className="mt-4 inline-block text-accent hover:underline">
            {t("nav.home")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      <Header />
      <div className="max-w-7xl mx-auto px-4 py-6 flex gap-6">
        {/* Sidebar */}
        <aside className="w-64 flex-shrink-0 hidden md:block">
          <div className="bg-white rounded-lg shadow-sm border border-border/30 p-4 sticky top-24">
            <Link href="/" className="flex items-center gap-2 text-sm text-content-muted hover:text-primary transition mb-4">
              <ArrowRight className="w-4 h-4" />
              {t("nav.home")}
            </Link>
            <nav className="space-y-1">
              {adminNav.map((n) => {
                const Icon = n.icon;
                const active = n.exact ? pathname === n.href : pathname.startsWith(n.href);
                return (
                  <Link
                    key={n.href}
                    href={n.href}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
                      active ? "bg-primary/10 text-primary font-medium" : "text-content-muted hover:bg-surface/50"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {t(n.labelKey)}
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Mobile nav */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-border z-50">
          <div className="flex overflow-x-auto no-scrollbar">
            {adminNav.map((n) => {
              const Icon = n.icon;
              const active = n.exact ? pathname === n.href : pathname.startsWith(n.href);
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  className={`flex flex-col items-center gap-1 px-4 py-2 text-xs min-w-[64px] ${
                    active ? "text-primary" : "text-content-muted/60"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {t(n.labelKey)}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <main className="flex-1 pb-20 md:pb-0">{children}</main>
      </div>
    </div>
  );
}
