import { cp, mkdir, rm, writeFile } from "node:fs/promises";

await rm("dist", { recursive: true, force: true });
await cp("out", "dist/client", { recursive: true });
await mkdir("dist/server", { recursive: true });
await mkdir("dist/.openai", { recursive: true });
await writeFile("dist/server/index.js", `export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    let response = await env.ASSETS.fetch(request);
    if (response.status === 404 && !url.pathname.includes(".")) {
      response = await env.ASSETS.fetch(new Request(new URL("/index.html", url), request));
    }
    return response;
  }
};
`);
await cp(".openai/hosting.json", "dist/.openai/hosting.json");
