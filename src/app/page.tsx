import { SiteFooter } from "@/components/layout/SiteFooter";
import { HomeBentoGrid } from "@/components/home/HomeBentoGrid";

interface HomePageProps {
  searchParams: Promise<{ category?: string; q?: string }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;

  return (
    <div className="flex min-h-dvh flex-col bg-white">
      <main className="mx-auto w-full max-w-[1680px] flex-1 px-3 py-3 sm:px-6 sm:py-6">
        <HomeBentoGrid category={params.category} query={params.q} />
      </main>

      <SiteFooter />
    </div>
  );
}
