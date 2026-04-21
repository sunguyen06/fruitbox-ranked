export function createSeededRng(seed: string): () => number {
  const seedGenerator = xmur3(seed);
  return mulberry32(seedGenerator());
}

export function randomInt(rng: () => number, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

export function pickOne<T>(rng: () => number, values: readonly T[]): T {
  return values[Math.floor(rng() * values.length)]!;
}

export function createSessionSeed(prefix = "fruitbox"): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
  }

  return `${prefix}-${Date.now().toString(36)}`;
}

function xmur3(seed: string): () => number {
  let hash = 1779033703 ^ seed.length;

  for (let index = 0; index < seed.length; index += 1) {
    hash = Math.imul(hash ^ seed.charCodeAt(index), 3432918353);
    hash = (hash << 13) | (hash >>> 19);
  }

  return () => {
    hash = Math.imul(hash ^ (hash >>> 16), 2246822507);
    hash = Math.imul(hash ^ (hash >>> 13), 3266489909);
    hash ^= hash >>> 16;
    return hash >>> 0;
  };
}

function mulberry32(seed: number): () => number {
  let current = seed >>> 0;

  return () => {
    current += 0x6d2b79f5;

    let output = Math.imul(current ^ (current >>> 15), current | 1);
    output ^= output + Math.imul(output ^ (output >>> 7), output | 61);

    return ((output ^ (output >>> 14)) >>> 0) / 4294967296;
  };
}
