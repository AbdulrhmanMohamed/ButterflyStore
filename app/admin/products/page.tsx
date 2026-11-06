"use client";
import { useState, useEffect } from "react";
import { useApp } from "@/contexts/AppContext";
import { getCatalog, productCreate, productUpdate, productDelete, variantCreate, variantDelete } from "@/lib/actions";
import type { Product, Variant, Company, Category } from "@/lib/types";
import { productImageUrl } from "@/lib/cloudinary";
import { searchPexels, type PexelsPhoto } from "@/lib/pexels";
import Pagination from "@/components/ui/Pagination";
import { Plus, Trash2, Edit, X, ChevronDown, ChevronUp, Image as ImageIcon, Search } from "lucide-react";

export default function AdminProductsPage() {
  const { t, lang } = useApp();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [editId, setEditId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    companyId: "", categoryId: "", name: "", nameEn: "",
    description: "", descriptionEn: "", price: 0,
    images: [""] as string[], discountPercentage: 0,
    variantAttrs: [] as string[], active: true,
  });
  const [saving, setSaving] = useState(false);
  const [filterCompany, setFilterCompany] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 10;

  // Pexels
  const [pexelsQuery, setPexelsQuery] = useState("");
  const [pexelsResults, setPexelsResults] = useState<PexelsPhoto[]>([]);
  const [pexelsLoading, setPexelsLoading] = useState(false);
  const [showPexels, setShowPexels] = useState(false);

  // Variants
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null);
  const [showVariantForm, setShowVariantForm] = useState(false);
  const [variantForm, setVariantForm] = useState({
    productId: "", attrs: {} as Record<string, string>,
    sku: "", price: 0, stock: 100, showStock: true, image: "", active: true,
  });
  const [newAttrKey, setNewAttrKey] = useState("");
  const [newAttrValue, setNewAttrValue] = useState("");

  const load = async () => {
    try {
      const cat = await getCatalog();
      setCompanies(cat.companies);
      setCategories(cat.categories);
      setProducts(cat.products);
      setVariants(cat.variants);
    } catch {}
  };

  useEffect(() => { load(); }, []);

  const companyName = (c: any) => (lang === "ar" ? c.name : c.nameEn || c.name) || c.name;
  const catName = (c: any) => (lang === "ar" ? c.name : c.nameEn || c.name) || c.name;
  const prodName = (p: any) => (lang === "ar" ? p.name : p.nameEn || p.name) || p.name;

  const filteredCategories = filterCompany
    ? categories.filter((c) => c.companyId === filterCompany)
    : categories;

  const filtered = products.filter((p) => {
    if (filterCompany && p.companyId !== filterCompany) return false;
    if (filterCategory && p.categoryId !== filterCategory) return false;
    if (search) {
      const q = search.toLowerCase();
      return (p.name || "").toLowerCase().includes(q) || (p.nameEn || "").toLowerCase().includes(q);
    }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const openNew = () => {
    setEditId(null);
    setForm({
      companyId: "", categoryId: "", name: "", nameEn: "",
      description: "", descriptionEn: "", price: 0,
      images: [""], discountPercentage: 0, variantAttrs: [], active: true,
    });
    setShowForm(true);
  };

  const openEdit = (p: Product) => {
    setEditId(p.id);
    setForm({
      companyId: p.companyId || "", categoryId: p.categoryId || "",
      name: p.name || "", nameEn: p.nameEn || "",
      description: p.description || "", descriptionEn: p.descriptionEn || "",
      price: p.price, images: p.images?.length ? [...p.images] : [""],
      discountPercentage: p.discountPercentage || 0,
      variantAttrs: p.variantAttrs || [], active: p.active !== false,
    });
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = {
        ...form,
        images: form.images.filter(Boolean),
        price: Number(form.price),
        discountPercentage: Number(form.discountPercentage),
      };
      if (editId) {
        await productUpdate(editId, data);
      } else {
        await productCreate(data);
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
    await productDelete(id);
    load();
  };

  const handlePexelsSearch = async () => {
    if (!pexelsQuery.trim()) return;
    setPexelsLoading(true);
    try {
      const res = await searchPexels(pexelsQuery, 1, 20);
      setPexelsResults(res.photos || []);
    } catch {}
    setPexelsLoading(false);
  };

  const addPexelsImage = (photo: PexelsPhoto) => {
    setForm({ ...form, images: [...form.images.filter(Boolean), photo.src.large] });
    setShowPexels(false);
  };

  const addVariantAttr = () => {
    if (!newAttrKey.trim() || !newAttrValue.trim()) return;
    setVariantForm({
      ...variantForm,
      attrs: { ...variantForm.attrs, [newAttrKey.trim()]: newAttrValue.trim() },
    });
    setNewAttrKey("");
    setNewAttrValue("");
  };

  const handleSaveVariant = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await variantCreate({
        ...variantForm,
        price: Number(variantForm.price),
        stock: Number(variantForm.stock),
      });
      setShowVariantForm(false);
      load();
    } catch {
      alert("حدث خطأ");
    }
  };

  const handleDeleteVariant = async (id: string) => {
    if (!confirm(t("admin.confirmDelete"))) return;
    await variantDelete(id);
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-content">{t("admin.products")} ({filtered.length})</h1>
        <button onClick={openNew} className="bg-primary text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-primary-dark transition text-sm">
          <Plus className="w-4 h-4" />
          {t("admin.addProduct")}
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-border/30 p-4 mb-4 flex flex-col md:flex-row gap-3">
        <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder={t("products.searchPlaceholder")} className="border border-border rounded-lg px-3 py-2 text-sm flex-1 text-content placeholder:text-content-muted/50" />
        <select value={filterCompany} onChange={(e) => { setFilterCompany(e.target.value); setFilterCategory(""); setPage(1); }} className="border border-border rounded-lg px-3 py-2 text-sm text-content">
          <option value="">{t("admin.selectCompany")}</option>
          {companies.map((c) => (<option key={c.id} value={c.id}>{companyName(c)}</option>))}
        </select>
        <select value={filterCategory} onChange={(e) => { setFilterCategory(e.target.value); setPage(1); }} className="border border-border rounded-lg px-3 py-2 text-sm text-content">
          <option value="">{t("admin.selectCategory")}</option>
          {filteredCategories.map((c) => (<option key={c.id} value={c.id}>{catName(c)}</option>))}
        </select>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow-sm border border-border/30 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface/50">
              <tr>
                <th className="px-4 py-3 text-right text-content-muted font-medium"></th>
                <th className="px-4 py-3 text-right text-content-muted font-medium">{t("products.title")}</th>
                <th className="px-4 py-3 text-right text-content-muted font-medium">{t("admin.companies")}</th>
                <th className="px-4 py-3 text-right text-content-muted font-medium">{t("admin.productCategory")}</th>
                <th className="px-4 py-3 text-right text-content-muted font-medium">السعر</th>
                <th className="px-4 py-3 text-right text-content-muted font-medium">{t("admin.variants")}</th>
                <th className="px-4 py-3 text-right text-content-muted font-medium">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {paginated.map((p) => {
                const company = companies.find((c) => c.id === p.companyId);
                const cat = categories.find((c) => c.id === p.categoryId);
                const pVariants = variants.filter((v) => v.productId === p.id);
                const isExpanded = expandedProduct === p.id;
                return (
                  <>
                    <tr key={p.id} className="hover:bg-surface/30 transition">
                      <td className="px-2 py-3">
                        <button onClick={() => setExpandedProduct(isExpanded ? null : p.id)} className="p-1 hover:bg-surface rounded text-content-muted">
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-surface rounded overflow-hidden flex-shrink-0">
                            {p.images?.[0] && (
                              <img src={p.images[0].startsWith("http") ? p.images[0] : productImageUrl(p.images[0])} alt="" className="w-full h-full object-cover" />
                            )}
                          </div>
                          <span className="font-medium text-content">{prodName(p)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-content-muted text-xs">{company ? companyName(company) : "-"}</td>
                      <td className="px-4 py-3 text-content-muted text-xs">{cat ? catName(cat) : "-"}</td>
                      <td className="px-4 py-3 text-content">{p.price} ج.م</td>
                      <td className="px-4 py-3">
                        <span className="bg-surface text-content-muted text-xs px-2 py-0.5 rounded">{pVariants.length}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button onClick={() => openEdit(p)} className="p-1 hover:bg-surface rounded transition"><Edit className="w-4 h-4 text-accent" /></button>
                          <button onClick={() => handleDelete(p.id)} className="p-1 hover:bg-danger/10 rounded transition"><Trash2 className="w-4 h-4 text-danger/70" /></button>
                        </div>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr key={`${p.id}-variants`}>
                        <td colSpan={7} className="px-4 py-3 bg-surface/20">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-content">{t("admin.variants")} ({pVariants.length})</span>
                            <button onClick={() => { setVariantForm({ ...variantForm, productId: p.id }); setShowVariantForm(true); }} className="text-xs text-accent hover:underline flex items-center gap-1">
                              <Plus className="w-3 h-3" /> {t("admin.addVariant")}
                            </button>
                          </div>
                          {pVariants.length === 0 ? (
                            <p className="text-xs text-content-muted/50">{t("admin.noVariants")}</p>
                          ) : (
                            <div className="space-y-1">
                              {pVariants.map((v) => (
                                <div key={v.id} className="flex items-center gap-3 text-xs bg-white rounded p-2 border border-border/20">
                                  {v.image && <img src={v.image} alt="" className="w-8 h-8 rounded object-cover" />}
                                  <span className="font-mono text-content-muted">{v.sku}</span>
                                  <span className="text-content">{v.price} ج.م</span>
                                  <span className="text-content-muted">stock: {v.stock}</span>
                                  <span className="text-content-muted/50">{Object.entries(v.attrs || {}).map(([k, val]) => `${k}: ${val}`).join(", ")}</span>
                                  <button onClick={() => handleDeleteVariant(v.id)} className="ml-auto text-danger/50 hover:text-danger"><Trash2 className="w-3 h-3" /></button>
                                </div>
                              ))}
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && <div className="text-center py-8 text-content-muted">{t("admin.noProducts")}</div>}
      </div>

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      {/* Product Modal Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-border/30">
            <div className="flex items-center justify-between p-4 border-b border-border/30">
              <h2 className="font-bold text-content">{editId ? t("common.edit") : t("admin.addProduct")}</h2>
              <button onClick={() => setShowForm(false)} className="p-1 hover:bg-surface rounded transition text-content-muted"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSave} className="p-4 space-y-3">
              {/* Company & Category */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-content-muted">{t("admin.selectCompany")}</label>
                  <select value={form.companyId} onChange={(e) => setForm({ ...form, companyId: e.target.value, categoryId: "" })} className="w-full border border-border rounded px-3 py-2 text-sm text-content" required>
                    <option value="">{t("admin.selectCompany")}</option>
                    {companies.map((c) => (<option key={c.id} value={c.id}>{companyName(c)}</option>))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-content-muted">{t("admin.selectCategory")}</label>
                  <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} className="w-full border border-border rounded px-3 py-2 text-sm text-content" required>
                    <option value="">{t("admin.selectCategory")}</option>
                    {categories.filter((c) => c.companyId === form.companyId).map((c) => (<option key={c.id} value={c.id}>{catName(c)}</option>))}
                  </select>
                </div>
              </div>

              {/* Names */}
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

              {/* Price & Discount */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-content-muted">السعر</label>
                  <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: +e.target.value })} className="w-full border border-border rounded px-3 py-2 text-sm text-content" min="0" required />
                </div>
                <div>
                  <label className="text-xs text-content-muted">الخصم %</label>
                  <input type="number" value={form.discountPercentage} onChange={(e) => setForm({ ...form, discountPercentage: +e.target.value })} className="w-full border border-border rounded px-3 py-2 text-sm text-content" min="0" max="100" />
                </div>
              </div>

              {/* Variant Attrs */}
              <div>
                <label className="text-xs text-content-muted">{t("admin.variantAttrs")} (مثال: لون، مقاس)</label>
                <div className="flex gap-2 mb-2">
                  {form.variantAttrs.map((attr, i) => (
                    <span key={i} className="bg-primary/10 text-primary text-xs px-2 py-1 rounded flex items-center gap-1">
                      {attr}
                      <button type="button" onClick={() => setForm({ ...form, variantAttrs: form.variantAttrs.filter((_, j) => j !== i) })} className="hover:text-primary-dark"><X className="w-3 h-3" /></button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input type="text" value={newAttrKey} onChange={(e) => setNewAttrKey(e.target.value)} placeholder="اسم الصفة" className="flex-1 border border-border rounded px-3 py-1.5 text-sm text-content" />
                  <button type="button" onClick={() => { if (newAttrKey.trim()) { setForm({ ...form, variantAttrs: [...form.variantAttrs, newAttrKey.trim()] }); setNewAttrKey(""); } }} className="bg-surface text-content-muted px-3 py-1.5 rounded text-sm hover:bg-surface/80 transition">
                    {t("admin.addAttr")}
                  </button>
                </div>
              </div>

              {/* Descriptions */}
              <div>
                <label className="text-xs text-content-muted">{t("products.description")} (عربي)</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full border border-border rounded px-3 py-2 text-sm text-content" rows={2} />
              </div>
              <div>
                <label className="text-xs text-content-muted">Description (EN)</label>
                <textarea value={form.descriptionEn} onChange={(e) => setForm({ ...form, descriptionEn: e.target.value })} className="w-full border border-border rounded px-3 py-2 text-sm text-content" rows={2} />
              </div>

              {/* Images with Pexels */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs text-content-muted">الصور</label>
                  <button type="button" onClick={() => setShowPexels(!showPexels)} className="text-xs text-accent hover:underline flex items-center gap-1">
                    <Search className="w-3 h-3" /> {t("admin.searchImages")}
                  </button>
                </div>

                {showPexels && (
                  <div className="bg-surface/50 rounded-lg p-3 mb-2">
                    <div className="flex gap-2 mb-2">
                      <input type="text" value={pexelsQuery} onChange={(e) => setPexelsQuery(e.target.value)} placeholder="scarf, shawl..." className="flex-1 border border-border rounded px-3 py-1.5 text-sm text-content" onKeyDown={(e) => e.key === "Enter" && handlePexelsSearch()} />
                      <button type="button" onClick={handlePexelsSearch} disabled={pexelsLoading} className="bg-primary text-white px-3 py-1.5 rounded text-sm hover:bg-primary-dark transition disabled:opacity-50">
                        {pexelsLoading ? "..." : <Search className="w-4 h-4" />}
                      </button>
                    </div>
                    {pexelsResults.length > 0 && (
                      <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto">
                        {pexelsResults.map((photo) => (
                          <button key={photo.id} type="button" onClick={() => addPexelsImage(photo)} className="aspect-square rounded overflow-hidden border-2 border-transparent hover:border-primary transition">
                            <img src={photo.src.tiny} alt={photo.alt} className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {form.images.map((img, i) => (
                  <div key={i} className="flex gap-2 mb-1">
                    <input type="text" value={img} onChange={(e) => { const imgs = [...form.images]; imgs[i] = e.target.value; setForm({ ...form, images: imgs }); }} className="flex-1 border border-border rounded px-3 py-2 text-sm text-content placeholder:text-content-muted/50" placeholder="https://..." />
                    {form.images.length > 1 && (
                      <button type="button" onClick={() => setForm({ ...form, images: form.images.filter((_, j) => j !== i) })} className="text-danger/60 hover:text-danger"><X className="w-4 h-4" /></button>
                    )}
                  </div>
                ))}
                <button type="button" onClick={() => setForm({ ...form, images: [...form.images, ""] })} className="text-sm text-accent hover:underline">+ {t("admin.addImageUrl")}</button>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border/30">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-content-muted hover:bg-surface rounded-lg transition">{t("common.cancel")}</button>
                <button type="submit" disabled={saving} className="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50 transition">{saving ? "..." : t("admin.saveProduct")}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Variant Modal Form */}
      {showVariantForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md border border-border/30">
            <div className="flex items-center justify-between p-4 border-b border-border/30">
              <h2 className="font-bold text-content">{t("admin.addVariant")}</h2>
              <button onClick={() => setShowVariantForm(false)} className="p-1 hover:bg-surface rounded transition text-content-muted"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSaveVariant} className="p-4 space-y-3">
              <div>
                <label className="text-xs text-content-muted">{t("admin.variantSku")}</label>
                <input type="text" value={variantForm.sku} onChange={(e) => setVariantForm({ ...variantForm, sku: e.target.value })} className="w-full border border-border rounded px-3 py-2 text-sm text-content" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-content-muted">{t("admin.variantPrice")}</label>
                  <input type="number" value={variantForm.price} onChange={(e) => setVariantForm({ ...variantForm, price: +e.target.value })} className="w-full border border-border rounded px-3 py-2 text-sm text-content" min="0" required />
                </div>
                <div>
                  <label className="text-xs text-content-muted">{t("admin.variantStock")}</label>
                  <input type="number" value={variantForm.stock} onChange={(e) => setVariantForm({ ...variantForm, stock: +e.target.value })} className="w-full border border-border rounded px-3 py-2 text-sm text-content" min="0" />
                </div>
              </div>
              <div>
                <label className="text-xs text-content-muted">{t("admin.variantAttrs")}</label>
                <div className="space-y-1 mb-2">
                  {Object.entries(variantForm.attrs).map(([k, v]) => (
                    <div key={k} className="flex items-center gap-2 text-xs">
                      <span className="text-content-muted">{k}:</span>
                      <span className="text-content">{v}</span>
                      <button type="button" onClick={() => { const a = { ...variantForm.attrs }; delete a[k]; setVariantForm({ ...variantForm, attrs: a }); }} className="text-danger/50 hover:text-danger"><X className="w-3 h-3" /></button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input type="text" value={newAttrKey} onChange={(e) => setNewAttrKey(e.target.value)} placeholder="Key" className="w-24 border border-border rounded px-2 py-1.5 text-xs text-content" />
                  <input type="text" value={newAttrValue} onChange={(e) => setNewAttrValue(e.target.value)} placeholder="Value" className="flex-1 border border-border rounded px-2 py-1.5 text-xs text-content" />
                  <button type="button" onClick={addVariantAttr} className="bg-surface text-content-muted px-2 py-1.5 rounded text-xs hover:bg-surface/80 transition">+</button>
                </div>
              </div>
              <div>
                <label className="text-xs text-content-muted">{t("admin.companyLogo")} (URL)</label>
                <input type="text" value={variantForm.image} onChange={(e) => setVariantForm({ ...variantForm, image: e.target.value })} className="w-full border border-border rounded px-3 py-2 text-sm text-content placeholder:text-content-muted/50" placeholder="https://..." />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-border/30">
                <button type="button" onClick={() => setShowVariantForm(false)} className="px-4 py-2 text-sm text-content-muted hover:bg-surface rounded-lg transition">{t("common.cancel")}</button>
                <button type="submit" className="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary-dark transition">{t("admin.saveVariant")}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
