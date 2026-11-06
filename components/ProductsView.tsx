"use client";
import { useState, useMemo } from "react";
import { useApp } from "@/contexts/AppContext";
import Header from "@/components/Header";
import ProductCard from "@/components/ProductCard";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import Pagination from "@/components/ui/Pagination";
import { Search, Filter, Building2, ShoppingBag } from "lucide-react";
import type { Company, Category, Product, Variant } from "@/lib/types";

function getChildren(categories: Category[], companyId: string, parentId: string) {
  return categories.filter((c) => c.companyId === companyId && c.parentId === parentId);
}

function getDescendantIds(categories: Category[], companyId: string, parentId: string): string[] {
  const children = categories
    .filter((c) => c.companyId === companyId && c.parentId === parentId)
    .map((c) => c.id);
  return [...children, ...children.flatMap((cid) => getDescendantIds(categories, companyId, cid))];
}

export default function ProductsView({
  companies,
  categories,
  products,
  variants,
  initialCompany,
  initialCategory,
  initialSearch,
}: {
  companies: Company[];
  categories: Category[];
  products: Product[];
  variants: Variant[];
  initialCompany: string | null;
  initialCategory: string | null;
  initialSearch: string;
}) {
  const { t, lang } = useApp();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const perPage = 8;

  const companyName = (c: any) => (lang === "ar" ? c.name : c.nameEn || c.name) || c.name;
  const catName = (c: any) => (lang === "ar" ? c.name : c.nameEn || c.name) || c.name;
  const prodName = (p: any) => (lang === "ar" ? p.name : p.nameEn || p.name) || p.name || "بدون اسم";

  const variantsByProduct = (productId: string) => variants.filter((v) => v.productId === productId);

  const effectiveCompany = selectedCompany || initialCompany;
  const effectiveCategory = selectedCategory || initialCategory;
  const effectiveSearch = searchQuery || initialSearch || "";

  const filteredProducts = useMemo(() => {
    let result = products;
    if (effectiveCompany) {
      result = result.filter((p) => p.companyId === effectiveCompany);
    }
    if (effectiveCategory) {
      const descendantIds = effectiveCompany
        ? getDescendantIds(categories, effectiveCompany, effectiveCategory)
        : categories.filter((c) => c.parentId === effectiveCategory).map((c) => c.id);
      const catIds = [effectiveCategory, ...descendantIds];
      result = result.filter((p) => catIds.includes(p.categoryId));
    }
    if (effectiveSearch) {
      const q = effectiveSearch.toLowerCase();
      result = result.filter(
        (p) =>
          (p.name || "").toLowerCase().includes(q) ||
          (p.nameEn || "").toLowerCase().includes(q) ||
          (p.description || "").toLowerCase().includes(q) ||
          (p.descriptionEn || "").toLowerCase().includes(q)
      );
    }
    return result;
  }, [products, effectiveCompany, effectiveCategory, effectiveSearch, categories]);

  const totalPages = Math.ceil(filteredProducts.length / perPage);
  const paginatedProducts = filteredProducts.slice((page - 1) * perPage, page * perPage);

  const companyCategories = useMemo(() => {
    if (!effectiveCompany) return [];
    return categories
      .filter((c) => c.companyId === effectiveCompany && !c.parentId)
      .map((cat) => ({
        ...cat,
        children: getChildren(categories, effectiveCompany, cat.id),
      }));
  }, [categories, effectiveCompany]);

  const allCompanyCategories = useMemo(() => {
    return companies.map((comp) => ({
      ...comp,
      categories: categories
        .filter((c) => c.companyId === comp.id && !c.parentId)
        .map((cat) => ({
          ...cat,
          children: getChildren(categories, comp.id, cat.id),
        })),
    }));
  }, [companies, categories]);

  return (
    <div className="min-h-screen bg-surface">
      <Header />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <PageHeader
          badge={t("home.heroBadge")}
          title={t("products.title")}
          subtitle={t("products.recentProducts")}
          icon={<ShoppingBag className="w-7 h-7 text-white" />}
          count={filteredProducts.length}
        />

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <aside className="w-full lg:w-64 flex-shrink-0 space-y-4">
            {/* Search */}
            <div className="bg-white rounded-2xl border border-border/30 p-4 shadow-sm">
              <div className="flex items-center bg-surface rounded-full px-3 py-2 border border-border/50 focus-within:border-accent/60 focus-within:bg-white transition">
                <Search className="w-4 h-4 text-content-muted/60 ml-2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                  placeholder={t("products.searchPlaceholder")}
                  className="bg-transparent text-sm w-full outline-none text-content placeholder:text-content-muted/50"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-2xl border border-border/30 p-4 shadow-sm">
              <h3 className="font-bold text-sm text-content mb-3 flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                  <Filter className="w-4 h-4 text-primary" />
                </span>
                {t("products.filter")}
              </h3>
              <div className="space-y-1">
                <button
                  onClick={() => { setSelectedCompany(null); setSelectedCategory(null); setPage(1); }}
                  className={`w-full text-right px-3 py-2 rounded-xl text-sm transition flex items-center gap-2 ${
                    !effectiveCompany && !effectiveCategory
                      ? "bg-gradient-to-r from-primary/10 to-accent/10 text-primary font-bold"
                      : "text-content-muted hover:bg-surface/60"
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${!effectiveCompany && !effectiveCategory ? "bg-primary" : "bg-border"}`} />
                  {t("home.all")}
                </button>

                {allCompanyCategories.map((comp) => (
                  <div key={comp.id}>
                    <button
                      onClick={() => { setSelectedCompany(comp.id); setSelectedCategory(null); setPage(1); }}
                      className={`w-full text-right px-3 py-2 rounded-xl text-sm transition flex items-center gap-2 ${
                        effectiveCompany === comp.id && !effectiveCategory
                          ? "bg-gradient-to-r from-primary/10 to-accent/10 text-primary font-bold"
                          : "text-content-muted hover:bg-surface/60"
                      }`}
                    >
                      <Building2 className="w-3.5 h-3.5" />
                      {companyName(comp)}
                    </button>
                    {effectiveCompany === comp.id && comp.categories.map((cat: any) => (
                      <div key={cat.id}>
                        <button
                          onClick={() => { setSelectedCategory(cat.id); setPage(1); }}
                          className={`w-full text-right px-6 py-1.5 rounded-lg text-xs transition ${
                            effectiveCategory === cat.id
                              ? "bg-accent/10 text-accent font-bold"
                              : "text-content-muted hover:bg-surface/60"
                          }`}
                        >
                          {catName(cat)}
                        </button>
                        {cat.children.map((child: any) => (
                          <button
                            key={child.id}
                            onClick={() => { setSelectedCategory(child.id); setPage(1); }}
                            className={`w-full text-right px-9 py-1 rounded-lg text-[11px] transition ${
                              effectiveCategory === child.id
                                ? "bg-accent/10 text-accent font-bold"
                                : "text-content-muted/70 hover:bg-surface/60"
                            }`}
                          >
                            {catName(child)}
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </aside>

          {/* Products Grid */}
          <main className="flex-1">
            {paginatedProducts.length === 0 ? (
              <div className="bg-white rounded-3xl border border-border/30 shadow-sm">
                <EmptyState
                  icon={<ShoppingBag className="w-10 h-10 text-content-muted/30" />}
                  title={t("products.noProducts")}
                />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                  {paginatedProducts.map((p) => {
                    const cat = categories.find((c) => c.id === p.categoryId);
                    const comp = companies.find((c) => c.id === p.companyId);
                    return (
                      <ProductCard
                        key={p.id}
                        id={p.id}
                        name={prodName(p)}
                        price={p.price}
                        discountPercentage={p.discountPercentage}
                        images={p.images}
                        category={`${comp ? companyName(comp) : ""} - ${cat ? catName(cat) : ""}`}
                        variants={variantsByProduct(p.id)}
                      />
                    );
                  })}
                </div>
                {totalPages > 1 && (
                  <div className="mt-10">
                    <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
