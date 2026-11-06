"use client";
import { useState, useEffect } from "react";
import { useApp } from "@/contexts/AppContext";
import { getCatalog, ordersList, customersList } from "@/lib/actions";
import { Package, ShoppingCart, Users, DollarSign } from "lucide-react";

export default function AdminDashboard() {
  const { t } = useApp();
  const [productCount, setProductCount] = useState(0);
  const [orderCount, setOrderCount] = useState(0);
  const [customerCount, setCustomerCount] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const [cat, o, c] = await Promise.all([getCatalog(), ordersList(1000), customersList(1000)]);
        setProductCount(cat.products.length);
        setOrderCount(o.length);
        setCustomerCount(c.length);
        setTotalRevenue(o.reduce((s, ord) => s + (ord.finalTotal || ord.total || 0), 0));
      } catch {}
    })();
  }, []);

  const stats = [
    { icon: Package, label: t("admin.productsCount"), value: productCount, color: "bg-primary/10 text-primary" },
    { icon: ShoppingCart, label: t("admin.ordersCount"), value: orderCount, color: "bg-accent/10 text-accent" },
    { icon: Users, label: t("admin.customersCount"), value: customerCount, color: "bg-success/10 text-success" },
    { icon: DollarSign, label: t("admin.totalRevenue"), value: `${totalRevenue.toLocaleString()} ج.م`, color: "bg-warning/10 text-warning" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-content mb-6">{t("admin.dashboard")}</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white rounded-lg shadow-sm border border-border/30 p-6">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg ${s.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-content-muted">{s.label}</p>
                  <p className="text-2xl font-bold text-content">{s.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
