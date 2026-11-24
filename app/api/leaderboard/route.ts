import { prisma } from "@/lib/db";

export async function GET() {
  const users = await prisma.user.findMany({
    select: {
      name: true,
      username: true,
      profile: {
        select: { displayName: true, handle: true, rankedElo: true },
      },
    },
    orderBy: { id: "asc" },
  });

  const players = users.map(({ name, username, profile }) => ({
    displayName: profile?.displayName ?? name,
    handle: profile?.handle ?? username,
    rankedElo: profile?.rankedElo ?? 1_000,
  }));
  players.sort((left, right) =>
    right.rankedElo - left.rankedElo ||
    (left.handle ?? left.displayName).localeCompare(right.handle ?? right.displayName),
  );

  let place = 0;
  const standings = players.map((player, index) => {
    if (player.rankedElo !== players[index - 1]?.rankedElo) place = index + 1;
    return { ...player, place };
  });

  return Response.json(standings, { headers: { "Cache-Control": "no-store" } });
}
