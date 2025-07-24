#!/bin/bash

# Generate wrangler.jsonc from template using jsonnet
# For deployment: dynamically fetches KV namespace ID
# For development: uses placeholder ID

set -Eeu -o pipefail

# Check if jsonnet is installed
if ! command -v jsonnet &> /dev/null; then
  echo "❌ Error: jsonnet is not installed"
  echo ""
  echo "Please install jsonnet using one of these methods:"
  echo ""
  echo "macOS:"
  echo "  brew install go-jsonnet"
  echo ""
  echo "Linux:"
  echo "  # Ubuntu/Debian"
  echo "  sudo apt-get install jsonnet"
  echo "  # or download from https://github.com/google/go-jsonnet/releases"
  echo ""
  echo "Windows:"
  echo "  # Using Chocolatey"
  echo "  choco install jsonnet"
  echo ""
  exit 1
fi

# Default KV namespace name
DEFAULT_KV_NAME="web-translator-cache"
KV_NAME="${KV_NAME:-$DEFAULT_KV_NAME}"

# Check if --deploy flag is passed
DEPLOY_MODE=false
if [[ "${1:-}" == "--deploy" ]]; then
  DEPLOY_MODE=true
fi

if [ "$DEPLOY_MODE" = true ]; then
  echo "🚀 Deployment mode: Looking up KV namespace ID for '$KV_NAME'..."

  # Get list of KV namespaces and find the one matching our name
  KV_ID=$(pnpm exec wrangler kv namespace list | jq -r --arg name "$KV_NAME" '.[] | select(.title == $name) | .id')

  if [ -z "$KV_ID" ]; then
    echo "❌ Error: KV namespace '$KV_NAME' not found"
    echo "Available namespaces:"
    pnpm exec wrangler kv namespace list | jq -r '.[] | "  - \(.title) (ID: \(.id))"'
    echo ""
    echo "To create a new namespace, run:"
    echo "  pnpm exec wrangler kv namespace create \"${KV_NAME#*-}\""
    exit 1
  fi

  echo "✅ Found KV namespace: $KV_NAME (ID: $KV_ID)"
else
  # Development mode: use placeholder
  KV_ID="development_placeholder_id"
  echo "🔧 Development mode: Using placeholder KV namespace ID"
fi

# Generate wrangler.jsonc from template using jsonnet
jsonnet \
  --ext-str KV_NAMESPACE_ID="$KV_ID" \
  -o wrangler.jsonc \
  wrangler.jsonnet

echo "✅ wrangler.jsonc generated successfully"
