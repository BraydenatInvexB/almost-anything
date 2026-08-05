import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ChevronRight,
  Star,
} from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ProductActions } from "@/components/products/ProductActions";
import { ProductGrid } from "@/components/home/ProductGrid";
import { getProductBySlug, getRelatedProducts } from "@/services/product-service";
import { getCategory } from "@/config/categories";
import { formatRating } from "@/lib/utils/cn";
import { getStockAvailabilityMessage, getWarehouseBadgeLabel } from "@/config/product-stock";
import { parseVariantsConfig } from "@/types/product-variants";
import { parseProductEnrichment, customerFacingEnrichment } from "@/types/product-enrichment";
import { ProductDetailDescription } from "@/components/products/ProductDetailDescription";
import { parseProductGallery } from "@/lib/product/product-gallery";
import { ProductImageGallery } from "@/components/products/ProductImageGallery";
import { ProductPriceDisplay } from "@/components/products/ProductPriceDisplay";
import { parseSpecialPricing } from "@/lib/product/product-special-pricing";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) notFound();

  const galleryImages = parseProductGallery(
    product.metadata,
    product.enhanced_image_url ?? product.image_url,
  );
  const imageUrl = galleryImages[0];
  const category = getCategory(product.category);
  const related = await getRelatedProducts(product.slug, product.category, 4);
  const special = parseSpecialPricing(
    product.metadata,
    product.retail_price,
    product.is_deal,
  );
  const variants = parseVariantsConfig(product.metadata);
  const rawEnrichment = parseProductEnrichment(product.metadata);
  const enrichment = customerFacingEnrichment(rawEnrichment);
  const minimumOrderQuantity = enrichment.minimumOrderQuantity ?? 1;
  const unitLabel = enrichment.unitLabel ?? "each";
  const warehouseLabel = getWarehouseBadgeLabel(product.stock_status, product.metadata);

  return (
    <div className="flex min-h-full flex-col bg-[#faf9f7]">
      <SiteHeader activeCategory={product.category} />

      <main className="mx-auto w-full max-w-[1500px] flex-1 px-4 py-6 sm:px-6 lg:py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-neutral-400">
          <Link href="/" className="hover:text-neutral-700">
            Home
          </Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/products" className="hover:text-neutral-700">
            Shop
          </Link>
          {category && (
            <>
              <ChevronRight className="h-3 w-3" />
              <Link
                href={`/products?category=${category.slug}`}
                className="hover:text-neutral-700"
              >
                {category.label}
              </Link>
            </>
          )}
          <ChevronRight className="h-3 w-3" />
          <span className="max-w-[180px] truncate font-medium text-neutral-700">
            {product.name}
          </span>
        </nav>

        <section className="mt-5 grid items-start gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(420px,1.1fr)] xl:gap-9">
          <Card padding="none" className="relative overflow-hidden rounded-[1.75rem] border-neutral-200 bg-[#f4f2ee] shadow-none">
            <ProductImageGallery
              images={galleryImages}
              alt={product.name}
              className="w-full"
            />
            {product.is_exclusive ? (
              <Badge variant="exclusive" className="absolute left-4 top-4">
                Exclusive
              </Badge>
            ) : null}
            {special.enabled ? (
              <Badge variant="deal" className="absolute right-4 top-4">
                {special.discountPercent
                  ? `${special.discountPercent}% off`
                  : "Special"}
              </Badge>
            ) : product.is_deal && product.deal_discount_percent ? (
              <Badge variant="deal" className="absolute right-4 top-4">
                {product.deal_discount_percent}% off
              </Badge>
            ) : null}
          </Card>

          <div className="rounded-[1.75rem] border border-neutral-200 bg-white p-5 shadow-[0_18px_50px_rgba(45,35,30,0.06)] sm:p-7 lg:sticky lg:top-[10.5rem]">
            <Link
              href={`/products?category=${product.category}`}
              className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand hover:text-[#a92d35]"
            >
              {category?.label ?? product.category}
            </Link>

            <h1 className="mt-3 text-3xl font-semibold leading-[1.08] tracking-[-0.04em] text-neutral-950 sm:text-4xl">
              {product.name}
            </h1>

            <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
              {product.review_count > 0 && product.rating > 0 ? (
                <span className="flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-neutral-700">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  {formatRating(product.rating)}
                  <span className="text-neutral-400">({product.review_count})</span>
                </span>
              ) : null}
              <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-neutral-500">{warehouseLabel}</span>
            </div>

            <div className="mt-6 border-y border-neutral-100 py-5">
              <ProductPriceDisplay
                price={product.retail_price}
                currency={product.currency}
                compareAtPrice={special.compareAtPrice}
                unitLabel={minimumOrderQuantity > 1 ? unitLabel : undefined}
              />

              {minimumOrderQuantity > 1 ? (
                <p className="mt-2 text-sm font-medium text-amber-700">
                  Minimum order: {minimumOrderQuantity} {unitLabel}
                  {enrichment.pricingNote ? ` · ${enrichment.pricingNote}` : ""}
                </p>
              ) : null}

              <p className={`mt-2 flex items-center gap-2 text-sm font-medium ${product.stock_status === "out_of_stock" ? "text-neutral-500" : "text-emerald-700"}`}>
                <span className={`h-2 w-2 rounded-full ${product.stock_status === "out_of_stock" ? "bg-neutral-400" : "bg-emerald-500"}`} />
                {getStockAvailabilityMessage(product.stock_status, product.delivery_days_min, product.delivery_days_max)}
              </p>
            </div>

            <ProductActions
              productId={product.id}
              slug={product.slug}
              name={product.name}
              price={product.retail_price}
              currency={product.currency}
              imageUrl={imageUrl ?? ""}
              rating={product.rating}
              stockStatus={product.stock_status}
              variants={variants}
              minimumOrderQuantity={minimumOrderQuantity}
            />

          </div>
        </section>

        <section className="mt-8 rounded-[1.75rem] border border-neutral-200 bg-white p-5 sm:p-8">
          <ProductDetailDescription enrichment={rawEnrichment} description={product.description} />
        </section>

        {/* Related products */}
        {related.length > 0 && (
          <section className="mt-14">
            <div className="mb-5 flex items-end justify-between">
              <h2 className="text-xl font-bold text-neutral-900">You might also like</h2>
              {category && (
                <Link
                  href={`/products?category=${category.slug}`}
                  className="text-sm font-medium text-neutral-500 hover:text-neutral-900"
                >
                  View all {category.label} →
                </Link>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              <ProductGrid products={related} />
            </div>
          </section>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
