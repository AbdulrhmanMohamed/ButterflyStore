"use client";
import { useState, useEffect } from "react";
import { useApp } from "@/contexts/AppContext";
import { companiesList, categoriesList, companyCreate, companyUpdate, companyDelete } from "@/lib/actions";
import type { Company, Category } from "@/lib/types";
import { Plus, Trash2, Edit, X, Building2, ToggleLeft, ToggleRight } from "lucide-react";
import Pagination from "@/components/ui/Pagination";

export default function AdminCompaniesPage() {
  const { t, lang } = useApp();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [editId, setEditId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", nameEn: "", logo: "", description: "", descriptionEn: "", active: true });
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 12;

  const load = async () => {
    try {
      const [c, ca] = await Promise.all([companiesList(), categoriesList()]);
      setCompanies(c);
      setCategories(ca);
    } catch {}
  };

  useEffect(() => { load(); }, []);

  const companyName = (c: any) => (lang === "ar" ? c.name : c.nameEn || c.name) || c.name;

  const filtered = companies.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (c.name || "").toLowerCase().includes(q) || (c.nameEn || "").toLowerCase().includes(q);
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const openNew = () => {
    setEditId(null);
    setForm({ name: "", nameEn: "", logo: "", description: "", descriptionEn: "", active: true });
    setShowForm(true);
  };

  const openEdit = (c: Company) => {
    setEditId(c.id);
    setForm({
      name: c.name || "", nameEn: c.nameEn || "",
      logo: c.logo || "", description: c.description || "",
      descriptionEn: c.descriptionEn || "", active: c.active !== false,
    });
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editId) {
        await companyUpdate(editId, form);
      } else {
        await companyCreate(form);
      }
      setShowForm(false);
      load();
    } catch {
      alert("حدث خطأ");
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("admin.confirmDelete"))) return;
    await companyDelete(id);
    load();
  };

  const toggleActive = async (c: Company) => {
    await companyUpdate(c.id, { active: !c.active });
    load();
  };

  const getCompanyCategories = (companyId: string) =>
    categories.filter((c) => c.companyId === companyId);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-content">{t("admin.companies")} ({filtered.length})</h1>
        <button onClick={openNew} className="bg-primary text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-primary-dark transition text-sm">
          <Plus className="w-4 h-4" />
          {t("admin.addCompany")}
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-border/30 p-4 mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder={t("products.searchPlaceholder")}
          className="w-full border border-border rounded-lg px-3 py-2 text-sm text-content placeholder:text-content-muted/50"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {paginated.map((c) => {
          const cats = getCompanyCategories(c.id);
          return (
            <div key={c.id} className="bg-white rounded-lg shadow-sm border border-border/30 p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  {c.logo ? (
                    <img src={c.logo} alt={c.name} className="w-12 h-12 rounded-lg object-cover" />
                  ) : (
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-primary" />
                    </div>
                  )}
                  <div>
                    <h3 className="font-bold text-content">{companyName(c)}</h3>
                    {c.nameEn && <p className="text-xs text-content-muted">{c.nameEn}</p>}
                  </div>
                </div>
                <button onClick={() => toggleActive(c)} className="flex items-center gap-1">
                  {c.active !== false ? <ToggleRight className="w-5 h-5 text-success" /> : <ToggleLeft className="w-5 h-5 text-content-muted/40" />}
                </button>
              </div>

              {c.description && (
                <p className="text-xs text-content-muted mb-3 line-clamp-2">{c.description}</p>
              )}

              <div className="flex items-center justify-between text-xs text-content-muted mb-3">
                <span>{cats.length} {t("admin.productCategory")}</span>
              </div>

              <div className="flex items-center gap-2">
                <button onClick={() => openEdit(c)} className="flex-1 bg-surface/50 text-content-muted py-1.5 rounded text-sm hover:bg-surface transition flex items-center justify-center gap-1">
                  <Edit className="w-3 h-3" />
                  {t("common.edit")}
                </button>
                <button onClick={() => handleDelete(c.id)} className="bg-danger/10 text-danger py-1.5 px-3 rounded text-sm hover:bg-danger/20 transition">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-content-muted">
          <Building2 className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p>{t("admin.noCompanies")}</p>
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg border border-border/30">
            <div className="flex items-center justify-between p-4 border-b border-border/30">
              <h2 className="font-bold text-content">{editId ? t("common.edit") : t("admin.addCompany")}</h2>
              <button onClick={() => setShowForm(false)} className="p-1 hover:bg-surface rounded transition text-content-muted">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-content-muted">الاسم (عربي)</label>
                  <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border border-border rounded px-3 py-2 text-sm text-content" required />
                </div>
                <div>
                  <label className="text-xs text-content-muted">Name (EN)</label>
                  <input type="text" value={form.nameEn} onChange={(e) => setForm({ ...form, nameEn: e.target.value })} className="w-full border border-border rounded px-3 py-2 text-sm text-content" />
                </div>
              </div>
              <div>
                <label className="text-xs text-content-muted">{t("admin.companyLogo")} (URL)</label>
                <input type="text" value={form.logo} onChange={(e) => setForm({ ...form, logo: e.target.value })} className="w-full border border-border rounded px-3 py-2 text-sm text-content placeholder:text-content-muted/50" placeholder="https://..." />
              </div>
              <div>
                <label className="text-xs text-content-muted">{t("products.description")} (عربي)</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full border border-border rounded px-3 py-2 text-sm text-content" rows={2} />
              </div>
              <div>
                <label className="text-xs text-content-muted">Description (EN)</label>
                <textarea value={form.descriptionEn} onChange={(e) => setForm({ ...form, descriptionEn: e.target.value })} className="w-full border border-border rounded px-3 py-2 text-sm text-content" rows={2} />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-border/30">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-content-muted hover:bg-surface rounded-lg transition">
                  {t("common.cancel")}
                </button>
                <button type="submit" disabled={saving} className="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50 transition">
                  {saving ? "..." : t("admin.saveCompany")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
