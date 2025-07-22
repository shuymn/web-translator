import { index, type RouteConfig, route } from "@react-router/dev/routes";

export default [index("routes/home.tsx"), route("api/completion", "routes/api/completion.tsx")] satisfies RouteConfig;
