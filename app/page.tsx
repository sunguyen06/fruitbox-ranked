import { FruitboxHome } from "@/components/menu/fruitbox-home";
import { createSessionSeed } from "@/lib/game";

interface HomePageProps {
  searchParams: Promise<{
    seed?: string | string[];
  }>;
}

export default async function Home({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const seed = getSeedFromSearchParams(params.seed) ?? createSessionSeed();

  return <FruitboxHome fallbackSeed={seed} />;
}

function getSeedFromSearchParams(seed: string | string[] | undefined): string | null {
  const candidate = Array.isArray(seed) ? seed[0] : seed;
  const normalized = candidate?.trim();

  return normalized ? normalized : null;
}
