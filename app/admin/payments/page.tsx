"use client";
import { useState, useEffect } from "react";
import { useApp } from "@/contexts/AppContext";
import { paymentsList, paymentCreate, paymentUpdate, paymentDelete } from "@/lib/actions";
import type { PaymentMethod } from "@/lib/types";
import { Plus, Trash2, X, ToggleLeft, ToggleRight } from "lucide-react";
import Pagination from "@/components/ui/Pagination";

export default function AdminPaymentsPage() {
  const { t } = useApp();
  const [list, setList] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", nameEn: "", active: true });
  const [page, setPage] = useState(1);
  const perPage = 10;

  const load = async () => {
    setLoading(true);
    try { setList(await paymentsList()); } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const totalPages = Math.max(1, Math.ceil(list.length / perPage));
  const paginated = list.slice((page - 1) * perPage, page * perPage);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await paymentCreate(form);
    setShowForm(false);
    load();
  };

  const toggleActive = async (item: PaymentMethod) => {
    await paymentUpdate(item.id, { active: !item.active });
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("admin.confirmDelete"))) return;
    await paymentDelete(id);
    load();
  };

  if (loading) return <div className="text-center py-8 text-content-muted">{t("common.loading")}</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-content">{t("admin.payments")} ({list.length})</h1>
        <button onClick={() => setShowForm(true)} className="bg-primary text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-primary-dark transition text-sm">
          <Plus className="w-4 h-4" />
          إضافة طريقة دفع
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-border/30 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface/50">
            <tr>
              <th className="px-4 py-3 text-right text-content-muted font-medium">الاسم</th>
              <th className="px-4 py-3 text-right text-content-muted font-medium">Name (EN)</th>
              <th className="px-4 py-3 text-right text-content-muted font-medium">الحالة</th>
              <th className="px-4 py-3 text-right text-content-muted font-medium">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {paginated.map((p) => (
              <tr key={p.id} className="hover:bg-surface/30 transition">
                <td className="px-4 py-3 text-content">{p.name}</td>
                <td className="px-4 py-3 text-content-muted">{p.nameEn || "-"}</td>
                <td className="px-4 py-3">
                  <button onClick={() => toggleActive(p)} className="flex items-center gap-1">
                    {p.active ? <ToggleRight className="w-5 h-5 text-success" /> : <ToggleLeft className="w-5 h-5 text-content-muted/40" />}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => handleDelete(p.id)} className="p-1 hover:bg-danger/10 rounded transition"><Trash2 className="w-4 h-4 text-danger/70" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {list.length === 0 && <div className="text-center py-8 text-content-muted">{t("common.noResults")}</div>}
      </div>

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md border border-border/30">
            <div className="flex items-center justify-between p-4 border-b border-border/30">
              <h2 className="font-bold text-content">إضافة طريقة دفع</h2>
              <button onClick={() => setShowForm(false)} className="p-1 hover:bg-surface rounded transition text-content-muted"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSave} className="p-4 space-y-3">
              <input type="text" placeholder="الاسم (عربي)" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border border-border rounded px-3 py-2 text-sm text-content placeholder:text-content-muted/50" required />
              <input type="text" placeholder="Name (EN)" value={form.nameEn} onChange={(e) => setForm({ ...form, nameEn: e.target.value })} className="w-full border border-border rounded px-3 py-2 text-sm text-content placeholder:text-content-muted/50" />
              <button type="submit" className="w-full bg-primary text-white py-2 rounded-lg hover:bg-primary-dark transition">{t("common.save")}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
