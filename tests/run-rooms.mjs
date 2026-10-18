// Starts an isolated real Workers runtime with a random, test-only hub signing key.
import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { once } from "node:events";
import { createServer } from "node:net";
import ts from "typescript";
const parsed = ts.parseConfigFileTextToJson(
  "wrangler.jsonc",
  await readFile("workers/rooms/wrangler.jsonc", "utf8"),
);
if (parsed.error) throw new Error("Invalid rooms configuration.");
const config = parsed.config;
const directory = await mkdtemp(join(tmpdir(), "sipzone-rooms-"));
const secret = crypto.randomUUID();
config.main = resolve("workers/rooms/src/index.ts");
delete config.$schema;
await writeFile(join(directory, "wrangler.json"), JSON.stringify(config));
await writeFile(join(directory, ".dev.vars"), `AUTH_SECRET=${secret}\n`);
const reservation = createServer();
reservation.listen(0, "127.0.0.1");
await once(reservation, "listening");
const port = reservation.address().port;
await new Promise((resolve) => reservation.close(resolve));
const worker = spawn(
  process.execPath,
  [
    "node_modules/wrangler/bin/wrangler.js",
    "dev",
    "-c",
    join(directory, "wrangler.json"),
    "--port",
    String(port),
    "--persist-to",
    join(directory, "state"),
  ],
  { stdio: ["ignore", "pipe", "pipe"] },
);
let log = "";
worker.stdout.on("data", (chunk) => {
  log += chunk;
});
worker.stderr.on("data", (chunk) => {
  log += chunk;
});
try {
  let ready = false;
  for (let attempt = 0; attempt < 150; attempt++) {
    if (worker.exitCode !== null)
      throw new Error("Local room server exited before startup.");
    try {
      const response = await fetch(`http://127.0.0.1:${port}/api/rooms/123A`);
      if (response.status === 401) {
        ready = true;
        break;
      }
    } catch {
      /* Wait for runtime startup. */
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  if (!ready) throw new Error("Local room server did not start.");
  const test = spawn(
    process.execPath,
    ["--test", "tests/rooms.integration.mjs"],
    {
      stdio: "inherit",
      env: {
        ...process.env,
        SIPZONE_ROOMS_URL: `http://127.0.0.1:${port}/api/rooms/`,
        SIPZONE_TEST_SECRET: secret,
      },
    },
  );
  const [code] = await once(test, "exit");
  if (code !== 0) process.exitCode = code ?? 1;
} catch (error) {
  console.error(error.message);
  console.error(log.replaceAll(secret, "[test key]"));
  process.exitCode = 1;
} finally {
  worker.kill("SIGTERM");
  await Promise.race([
    once(worker, "exit"),
    new Promise((resolve) => setTimeout(resolve, 3000)),
  ]);
  await rm(directory, { recursive: true, force: true });
}
