import { join } from "path";

const PORT = Number(process.env.PORT ?? 3000);
const distDir = join(import.meta.dir, "dist");
const indexHtml = Bun.file(join(distDir, "index.html"));

Bun.serve({
  port: PORT,
  hostname: "0.0.0.0",   // ← accessible from outside the container
  async fetch(req) {
    const pathname = new URL(req.url).pathname;
    const file = Bun.file(join(distDir, pathname));

    // Serve the file if it exists, otherwise SPA fallback → index.html
    if (await file.exists()) {
      return new Response(file);
    }

    return new Response(indexHtml);
  },
});

console.log(`Manga Reader running on http://0.0.0.0:${PORT}`);
