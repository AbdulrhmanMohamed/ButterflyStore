"use client";
import { useState, useEffect } from "react";
import { useApp } from "@/contexts/AppContext";
import { ordersList, orderUpdate } from "@/lib/actions";
import type { Order } from "@/lib/types";
import Pagination from "@/components/ui/Pagination";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-warning/10 text-warning",
  confirmed: "bg-accent/10 text-accent",
  shipped: "bg-primary/10 text-primary",
  delivered: "bg-success/10 text-success",
  cancelled: "bg-danger/10 text-danger",
};

const STATUS_OPTIONS = [
  { value: "pending", label: "قيد الانتظار" },
  { value: "confirmed", label: "تم التأكيد" },
  { value: "shipped", label: "تم الشحن" },
  { value: "delivered", label: "تم التوصيل" },
  { value: "cancelled", label: "ملغي" },
];

export default function AdminOrdersPage() {
  const { t } = useApp();
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const perPage = 10;

  const load = async () => {
    setLoading(true);
    try { setAllOrders(await ordersList(500)); } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const totalPages = Math.max(1, Math.ceil(allOrders.length / perPage));
  const paginated = allOrders.slice((page - 1) * perPage, page * perPage);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const updateStatus = async (id: string, status: string) => {
    await orderUpdate(id, { status });
    setAllOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
  };

  if (loading) return <div className="text-center py-8 text-content-muted">{t("common.loading")}</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-content mb-6">{t("admin.orders")} ({allOrders.length})</h1>
      <div className="bg-white rounded-lg shadow-sm border border-border/30 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface/50">
              <tr>
                <th className="px-4 py-3 text-right text-content-muted font-medium">رقم الطلب</th>
                <th className="px-4 py-3 text-right text-content-muted font-medium">العميل</th>
                <th className="px-4 py-3 text-right text-content-muted font-medium">الهاتف</th>
                <th className="px-4 py-3 text-right text-content-muted font-medium">المبلغ</th>
                <th className="px-4 py-3 text-right text-content-muted font-medium">الحالة</th>
                <th className="px-4 py-3 text-right text-content-muted font-medium">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {paginated.map((o) => (
                <tr key={o.id} className="hover:bg-surface/30 transition">
                  <td className="px-4 py-3 font-mono text-xs text-content-muted">{o.id.slice(0, 8)}...</td>
                  <td className="px-4 py-3 text-content">{o.customerName || "-"}</td>
                  <td className="px-4 py-3 text-content">{o.customerPhone || "-"}</td>
                  <td className="px-4 py-3 font-bold text-primary">{(o.finalTotal || o.total || 0).toLocaleString()} ج.م</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[o.status] || "bg-surface text-content-muted"}`}>
                      {STATUS_OPTIONS.find((s) => s.value === o.status)?.label || o.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={o.status}
                      onChange={(e) => updateStatus(o.id, e.target.value)}
                      className="border border-border rounded px-2 py-1 text-xs text-content"
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {allOrders.length === 0 && (
          <div className="text-center py-8 text-content-muted">{t("common.noResults")}</div>
        )}
      </div>

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
