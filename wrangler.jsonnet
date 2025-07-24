// Wrangler configuration template
// For more details on how to configure Wrangler, refer to:
// https://developers.cloudflare.com/workers/wrangler/configuration/

local kv_namespace_id = std.extVar('KV_NAMESPACE_ID');

{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "web-translator",
  "compatibility_date": "2025-05-05",
  "compatibility_flags": ["nodejs_compat_v2"],
  "main": "./workers/app.ts",
  "kv_namespaces": [
    {
      "binding": "TRANSLATION_CACHE",
      "id": kv_namespace_id
    }
  ],
  "observability": {
    "enabled": true
  },
  // Smart Placement
  // Docs: https://developers.cloudflare.com/workers/configuration/smart-placement/#smart-placement
  "placement": { "mode": "smart" },

  // Static Assets
  // https://developers.cloudflare.com/workers/static-assets/binding/
  "assets": {
    "directory": "./build/client"
  }
}
