import { FruitboxHome } from "@/components/menu/fruitbox-home";
import { getOptionalViewer } from "@/lib/auth-session";
import { createSessionSeed } from "@/lib/game";

interface HomePageProps {
  searchParams: Promise<{
    seed?: string | string[];
  }>;
}

export default async function Home({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const seed = getSeedFromSearchParams(params.seed) ?? createSessionSeed();
  const viewer = await getOptionalViewer();

  return (
    <FruitboxHome
      fallbackSeed={seed}
      initialViewer={
        viewer
          ? {
              user: {
                name: viewer.user.name,
              },
              profile: {
                displayName: viewer.profile.displayName,
                handle: viewer.profile.handle,
                rankedRating: viewer.profile.rankedRating,
              },
            }
          : null
      }
    />
  );
}

function getSeedFromSearchParams(seed: string | string[] | undefined): string | null {
  const candidate = Array.isArray(seed) ? seed[0] : seed;
  const normalized = candidate?.trim();

  return normalized ? normalized : null;
}
