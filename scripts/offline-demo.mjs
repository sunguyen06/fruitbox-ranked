import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { cp, mkdir, readFile, writeFile } from "node:fs/promises";
import { createServer } from "node:net";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const workspace = join(root, ".offline-demo");
const dependencies = join(root, "node_modules");
const databaseDir = join(workspace, "prisma");
const webUrl = "http://127.0.0.1:3400";
const realtimeUrl = "http://127.0.0.1:3401";
const children = new Set();

function run(label, args, env) {
  const child = spawn(process.execPath, args, {
    cwd: workspace,
    env,
    stdio: "inherit",
  });
  children.add(child);
  return new Promise((res, reject) => {
    child.once("error", reject);
    child.once("exit", (code, signal) => {
      children.delete(child);
      if (code === 0) res();
      else reject(new Error(`${label} exited (${code ?? signal}).`));
    });
  });
}

function stopChildren() {
  for (const child of children) child.kill();
}

function checkPort(url) {
  const { hostname, port } = new URL(url);
  return new Promise((resolve, reject) => {
    const probe = createServer();
    probe.once("error", (error) => {
      reject(error.code === "EADDRINUSE"
        ? new Error(`Port ${port} is already in use. Stop the running demo and try again.`)
        : error);
    });
    probe.listen(Number(port), hostname, () => probe.close(resolve));
  });
}

async function prepare() {
  await mkdir(databaseDir, { recursive: true });

  const sources = [
    "app", "components", "lib", "public", "server",
    "next.config.ts", "package.json", "postcss.config.mjs", "proxy.ts",
  ];
  await Promise.all(sources.map((path) => cp(join(root, path), join(workspace, path), { recursive: true })));

  const config = JSON.parse(await readFile(join(root, "tsconfig.json"), "utf8"));
  config.compilerOptions.paths["@prisma/client"] = ["./generated/prisma"];
  config.exclude.push("generated");
  await writeFile(join(workspace, "tsconfig.json"), JSON.stringify(config, null, 2));

  // Use the same models with a local file and a dedicated generated client.
  const schema = await readFile(join(root, "prisma/schema.prisma"), "utf8");
  const sqliteSchema = schema
    .replace('provider = "prisma-client-js"', 'provider = "prisma-client-js"\n  output   = "../generated/prisma"')
    .replace('provider = "postgresql"', 'provider = "sqlite"');
  await writeFile(join(databaseDir, "schema.prisma"), sqliteSchema);

  const authFile = join(workspace, "lib/auth.ts");
  const authConfig = await readFile(authFile, "utf8");
  await writeFile(authFile, authConfig.replace('provider: "postgresql"', 'provider: "sqlite"'));

  const secretFile = join(workspace, "session-secret");
  await writeFile(secretFile, randomBytes(32).toString("hex"), { flag: "wx" }).catch((error) => {
    if (error.code !== "EEXIST") throw error;
  });

  return {
    ...process.env,
    DATABASE_URL: "file:./demo.sqlite",
    BETTER_AUTH_URL: webUrl,
    BETTER_AUTH_SECRET: await readFile(secretFile, "utf8"),
    NEXT_PUBLIC_SOCKET_URL: realtimeUrl,
    RENDER_WAKE_URL: `${realtimeUrl}/health`,
    SOCKET_SERVER_HOST: "127.0.0.1",
    SOCKET_SERVER_PORT: "3401",
    SOCKET_SERVER_CORS_ORIGIN: webUrl,
    PORT: "3401",
    NEXT_TELEMETRY_DISABLED: "1",
    PRISMA_GENERATE_SKIP_AUTOINSTALL: "1",
    CHECKPOINT_DISABLE: "1",
  };
}

async function hasCurrentPrismaClient() {
  try {
    const generated = join(workspace, "generated/prisma");
    const [schema, clientSchema, dependency, client] = await Promise.all([
      readFile(join(databaseDir, "schema.prisma"), "utf8"),
      readFile(join(generated, "schema.prisma"), "utf8"),
      readFile(join(dependencies, "@prisma/client/package.json"), "utf8"),
      readFile(join(generated, "package.json"), "utf8"),
    ]);
    return schema.replaceAll("\r\n", "\n") === clientSchema.replaceAll("\r\n", "\n")
      && JSON.parse(dependency).version === JSON.parse(client).version;
  } catch (error) {
    if (error.code === "ENOENT") return false;
    throw error;
  }
}

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.once(signal, () => {
    stopChildren();
    process.exit(0);
  });
}

try {
  await Promise.all([checkPort(webUrl), checkPort(realtimeUrl)]);
  const env = await prepare();
  const prisma = join(dependencies, "prisma/build/index.js");
  const next = join(dependencies, "next/dist/bin/next");
  await run("Prisma schema setup", [prisma, "db", "push", "--skip-generate"], env);
  await run("Prisma schema formatting", [prisma, "format"], env);
  // Avoid replacing the native client on every demo restart, especially on Windows.
  if (!await hasCurrentPrismaClient()) {
    await run("Prisma client generation", [prisma, "generate"], env);
  }
  await run("Next.js build", [next, "build", "--webpack"], env);
  console.log(`\nFruitbox Ranked offline demo: ${webUrl}\nLocal demo data: ${join(databaseDir, "demo.sqlite")}\n`);
  await Promise.race([
    run("realtime server", ["--import", "tsx", "server/index.ts"], env),
    run("web server", [next, "start", "--hostname", "127.0.0.1", "--port", "3400"], env),
  ]);
} catch (error) {
  console.error(`[offline demo] ${error.message}`);
  process.exitCode = 1;
} finally {
  stopChildren();
}
