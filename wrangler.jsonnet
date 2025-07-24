// Wrangler configuration template
// For more details on how to configure Wrangler, refer to:
// https://developers.cloudflare.com/workers/wrangler/configuration/

local kv_namespace_id = std.extVar('KV_NAMESPACE_ID');

{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "web-translator",
  "compatibility_date": "2024-09-23",
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
  // "placement": { "mode": "smart" },

  // Bindings
  // Bindings allow your Worker to interact with resources on the Cloudflare Developer Platform, including
  // databases, object storage, AI inference, real-time communication and more.
  // https://developers.cloudflare.com/workers/runtime-apis/bindings/

  // Environment Variables
  // https://developers.cloudflare.com/workers/wrangler/configuration/#environment-variables
  // Note: Use secrets to store sensitive data.
  // https://developers.cloudflare.com/workers/configuration/secrets/

  // Static Assets
  // https://developers.cloudflare.com/workers/static-assets/binding/
  "assets": {
    "directory": "./build/client"
  }
  // Service Bindings (communicate between multiple Workers)
  // https://developers.cloudflare.com/workers/wrangler/configuration/#service-bindings
  // "services": [{ "binding": "MY_SERVICE", "service": "my-service" }]
}
