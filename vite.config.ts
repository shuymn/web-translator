import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tailwindcss(), reactRouter(), tsconfigPaths()],
  define: {
    __COMMIT_HASH__: JSON.stringify(process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || "unknown"),
    __GITHUB_REPO__: JSON.stringify(
      `${process.env.VERCEL_GIT_REPO_OWNER ?? "shuymn"}/${process.env.VERCEL_GIT_REPO_SLUG ?? "web-translator"}`,
    ),
  },
});
