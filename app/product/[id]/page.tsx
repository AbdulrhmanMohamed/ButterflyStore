import { products, variants, categories } from "@/lib/db";
import type { Variant } from "@/lib/types";
import ProductDetailView from "@/components/ProductDetailView";

export const dynamic = "force-dynamic";

export default function ProductDetailPage({ params }: { params: { id: string } }) {
  const product = products.get(params.id);
  const related = product
    ? products.byCategory(product.categoryId).filter((p) => p.id !== product.id).slice(0, 4)
    : [];
  const productVariants = product ? variants.byProduct(product.id) : [];
  const relatedVariantsMap = variants.byProductBatch(related.map((p) => p.id));
  const relatedVariants = Object.fromEntries(relatedVariantsMap) as Record<string, Variant[]>;

  return (
    <ProductDetailView
      product={product}
      variants={productVariants}
      related={related}
      relatedVariants={relatedVariants}
      category={product ? categories.get(product.categoryId) : null}
    />
  );
}
