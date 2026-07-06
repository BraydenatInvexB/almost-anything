import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ChevronRight,
  Star,
  Truck,
  RotateCcw,
  Lock,
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

const TRUST = [
  { icon: Truck, label: "Fast delivery" },
  { icon: RotateCcw, label: "30 day returns" },
  { icon: Lock, label: "Secure checkout" },
];

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
    <div className="flex min-h-full flex-col bg-white">
      <SiteHeader activeCategory={product.category} />

      <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 sm:px-6">
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

        {/* Product summary — name, price, description at the top */}
        <header className="mt-5 border-b border-neutral-100 pb-6">
          <Link
            href={`/products?category=${product.category}`}
            className="text-xs font-semibold uppercase tracking-wide text-neutral-400 hover:text-neutral-700"
          >
            {category?.label ?? product.category}
          </Link>

          <h1 className="mt-2 text-3xl font-bold text-neutral-900 sm:text-4xl">
            {product.name}
          </h1>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            {product.review_count > 0 && product.rating > 0 ? (
              <>
                <span className="flex items-center gap-1 text-sm">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  {formatRating(product.rating)}
                  <span className="text-neutral-400">
                    {" "}
                    ({product.review_count}{" "}
                    {product.review_count === 1 ? "review" : "reviews"})
                  </span>
                </span>
                <span className="text-sm text-neutral-300">·</span>
              </>
            ) : null}
            <span className="text-sm text-neutral-500">{warehouseLabel}</span>
          </div>

          <div className="mt-5">
            <ProductPriceDisplay
              price={product.retail_price}
              currency={product.currency}
              compareAtPrice={special.compareAtPrice}
              unitLabel={minimumOrderQuantity > 1 ? unitLabel : undefined}
            />
          </div>

          {minimumOrderQuantity > 1 ? (
            <p className="mt-2 text-sm font-medium text-amber-700">
              Minimum order: {minimumOrderQuantity} {unitLabel}
              {enrichment.pricingNote ? ` · ${enrichment.pricingNote}` : ""}
            </p>
          ) : null}

          <p
            className={`mt-2 text-sm ${
              product.stock_status === "out_of_stock" ? "text-neutral-500" : "text-emerald-600"
            }`}
          >
            {getStockAvailabilityMessage(
              product.stock_status,
              product.delivery_days_min,
              product.delivery_days_max,
            )}
          </p>
        </header>

        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          <Card padding="none" className="relative overflow-hidden bg-neutral-100">
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

          <div>
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

            {/* Trust badges */}
            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {TRUST.map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex flex-col items-center gap-1.5 rounded-2xl border border-neutral-200 bg-white px-2 py-3 text-center"
                >
                  <Icon className="h-5 w-5 text-neutral-700" />
                  <span className="text-[11px] font-medium text-neutral-500">{label}</span>
                </div>
              ))}
            </div>

            <ProductDetailDescription
              enrichment={rawEnrichment}
              description={product.description}
            />
          </div>
        </div>

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
