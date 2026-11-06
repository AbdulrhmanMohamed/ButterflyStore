import { companies, categories, products, variants } from "@/lib/db";
import HomeView from "@/components/HomeView";

export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <HomeView
      companies={companies.list()}
      categories={categories.list()}
      products={products.list()}
      variants={variants.list()}
    />
  );
}
