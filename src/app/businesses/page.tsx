import Link from "next/link";
import { Store } from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { listApprovedSellers } from "@/services/seller-service";

export default async function BusinessesPage() {
  const sellers = await listApprovedSellers();

  return (
    <div className="flex min-h-full flex-col bg-white">
      <SiteHeader variant="page" />

      <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-10 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900">Business directory</h1>
            <p className="mt-2 text-neutral-600">
              Discover trusted businesses selling on Almost Anything.
            </p>
          </div>
          <Link href="/sell">
            <Button className="rounded-full">Sell with us</Button>
          </Link>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sellers.map((seller) => (
            <Link key={seller.id} href={`/businesses/${seller.slug}`}>
              <Card variant="elevated" className="h-full p-6 transition-shadow hover:shadow-md">
                <Store className="h-8 w-8 text-brand" />
                <h2 className="mt-4 text-lg font-semibold">{seller.shopName}</h2>
                <p className="mt-1 text-sm text-neutral-600 line-clamp-2">
                  {seller.description ?? seller.companyName}
                </p>
                <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-neutral-400">
                  {seller.sellsAllCategories ? "All categories" : `${seller.categorySlugs.length} categories`}
                </p>
              </Card>
            </Link>
          ))}
        </div>

        {!sellers.length ? (
          <Card variant="elevated" className="mt-10 p-10 text-center">
            <p className="text-neutral-600">No businesses listed yet. Be the first to join our marketplace.</p>
            <Link href="/sell/register" className="mt-4 inline-block">
              <Button>Apply to sell</Button>
            </Link>
          </Card>
        ) : null}
      </main>

      <SiteFooter />
    </div>
  );
}
