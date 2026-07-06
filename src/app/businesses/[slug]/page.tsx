import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { getSellerBySlug } from "@/services/seller-service";
import { sellerDb } from "@/lib/seller/db";

export default async function BusinessProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const seller = await getSellerBySlug(slug);
  if (!seller) notFound();

  const { data: products, error } = await sellerDb()
    .from("products")
    .select("id, name, retail_price, image_url, slug")
    .eq("seller_id", seller.id)
    .eq("listing_status", "published")
    .limit(12);

  if (error) throw error;

  return (
    <div className="flex min-h-full flex-col bg-white">
      <SiteHeader variant="page" />

      <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-10 sm:px-6">
        <Card variant="elevated" className="p-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand">Verified seller</p>
          <h1 className="mt-2 text-3xl font-bold">{seller.shopName}</h1>
          <p className="mt-2 text-neutral-600">{seller.description ?? seller.companyName}</p>
          <p className="mt-4 text-sm text-neutral-500">{seller.businessAddress.city}, {seller.businessAddress.country}</p>
        </Card>

        <section className="mt-10">
          <h2 className="text-xl font-bold">Products from this business</h2>
          {products?.length ? (
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {products.map((product) => (
                <Link key={product.id} href={`/products/${product.slug}`}>
                  <Card variant="elevated" className="overflow-hidden">
                    {product.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={product.image_url} alt={product.name} className="aspect-square w-full object-cover" />
                    ) : (
                      <div className="aspect-square bg-neutral-100" />
                    )}
                    <div className="p-4">
                      <p className="font-semibold line-clamp-2">{product.name}</p>
                      <p className="mt-1 text-sm text-neutral-600">R{Number(product.retail_price).toFixed(2)}</p>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-neutral-500">Products coming soon.</p>
          )}
        </section>

        <div className="mt-10">
          <Link href="/businesses">
            <Button variant="secondary">← All businesses</Button>
          </Link>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
