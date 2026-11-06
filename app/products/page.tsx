import { companies, categories, products, variants } from "@/lib/db";
import ProductsView from "@/components/ProductsView";

export const dynamic = "force-dynamic";

export default function ProductsPage({
  searchParams,
}: {
  searchParams: { company?: string; category?: string; search?: string };
}) {
  return (
    <ProductsView
      companies={companies.list()}
      categories={categories.list()}
      products={products.list()}
      variants={variants.list()}
      initialCompany={searchParams?.company || null}
      initialCategory={searchParams?.category || null}
      initialSearch={searchParams?.search || ""}
    />
  );
}
