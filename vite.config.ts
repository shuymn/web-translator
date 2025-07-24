import { execSync } from "node:child_process";
import { cloudflare } from "@cloudflare/vite-plugin";
import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

// Get git commit hash at build time
const commitHash = (() => {
  try {
    return execSync("git rev-parse --short HEAD").toString().trim();
  } catch {
    return "unknown";
  }
})();

export default defineConfig({
  plugins: [cloudflare({ viteEnvironment: { name: "ssr" } }), tailwindcss(), reactRouter()],
  ssr: {
    target: "webworker",
    resolve: { conditions: ["workerd", "browser"] },
  },
  define: {
    __COMMIT_HASH__: JSON.stringify(commitHash),
  },
});
