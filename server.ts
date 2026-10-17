import { join } from "path";

const PORT = Number(process.env.PORT ?? 3000);
const distDir = join(import.meta.dir, "dist");
const indexHtml = Bun.file(join(distDir, "index.html"));

Bun.serve({
  port: PORT,
  hostname: "0.0.0.0",
  async fetch(req) {
    const pathname = new URL(req.url).pathname;
    const file = Bun.file(join(distDir, pathname));

    if (await file.exists()) {
      const isNoCache =
        pathname === "/sw.js" ||
        pathname.endsWith(".html") ||
        pathname.includes("workbox-") ||
        pathname.endsWith(".webmanifest");

      const headers = new Headers();
      if (isNoCache) {
        headers.set("Cache-Control", "no-cache, no-store, must-revalidate");
        headers.set("Pragma", "no-cache");
        headers.set("Expires", "0");
      } else if (pathname.startsWith("/assets/")) {
        headers.set("Cache-Control", "public, max-age=31536000, immutable");
      }

      return new Response(file, { headers });
    }

    return new Response(indexHtml, {
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
      },
    });
  },
});

console.log(`Manga Reader running on http://0.0.0.0:${PORT}`);
