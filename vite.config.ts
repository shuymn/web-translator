import { execSync } from "node:child_process";
import path from "node:path";
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

// Get GitHub repository URL at build time
const githubRepo = (() => {
  try {
    const remoteUrl = execSync("git remote get-url origin").toString().trim();
    // Convert SSH URL to HTTPS URL if needed
    const httpsUrl = remoteUrl.replace(/^git@github\.com:/, "https://github.com/").replace(/\.git$/, "");
    // Extract owner/repo from URL
    const match = httpsUrl.match(/github\.com\/([^/]+\/[^/]+)/);
    return match ? match[1] : "shuymn/web-translator";
  } catch {
    return "shuymn/web-translator";
  }
})();

export default defineConfig({
  plugins: [cloudflare({ viteEnvironment: { name: "ssr" } }), tailwindcss(), reactRouter()],
  ssr: {
    target: "webworker",
    resolve: { conditions: ["workerd", "browser"] },
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./app") },
  },
  define: {
    __COMMIT_HASH__: JSON.stringify(commitHash),
    __GITHUB_REPO__: JSON.stringify(githubRepo),
  },
});
