import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { HomeBentoGrid } from "@/components/home/HomeBentoGrid";

interface HomePageProps {
  searchParams: Promise<{ category?: string; q?: string }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;

  return (
    <div className="flex min-h-dvh flex-col">
      {/* Full-bleed light dashboard surface */}
      <main className="flex-1 bg-[#F4EEE1] p-4 sm:p-6 lg:p-8">
        {/* Embedded header */}
        <SiteHeader
          variant="home"
          activeCategory={params.category}
          searchQuery={params.q}
        />

        {/* Bento grid (rendered inline — no streaming Suspense boundary) */}
        <HomeBentoGrid category={params.category} query={params.q} />
      </main>

      <SiteFooter />
    </div>
  );
}
