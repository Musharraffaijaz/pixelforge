#!/usr/bin/env bash
# PixelForge — Full Launcher (Backend + Extension build)

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo ""
echo "╔══════════════════════════════════╗"
echo "║   🎨  PixelForge Launcher        ║"
echo "╚══════════════════════════════════╝"
echo ""

# Ensure extension is built
if [ ! -d "$SCRIPT_DIR/extension/dist" ] || [ ! -f "$SCRIPT_DIR/extension/dist/manifest.json" ]; then
  echo "📦 Building PixelForge extension..."
  (cd "$SCRIPT_DIR/extension" && npm run build:ext)
  echo ""
fi

# Start backend in background
echo "🚀 Starting backend server..."
bash "$SCRIPT_DIR/backend/start.sh" &
BACKEND_PID=$!

cleanup() {
  echo ""
  echo "🛑 Stopping PixelForge backend..."
  kill "$BACKEND_PID" 2>/dev/null || true
}
trap cleanup SIGINT SIGTERM

# Wait for backend to be ready
echo "⏳ Waiting for backend to start..."
for i in {1..30}; do
  if curl -sf http://127.0.0.1:7832/health > /dev/null 2>&1; then
    echo "✅ Backend is ready!"
    break
  fi
  sleep 1
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ PixelForge Backend running at http://127.0.0.1:7832"
echo ""
echo "📌 To load the extension in Chrome / Brave / Edge:"
echo "   1. Open chrome://extensions/"
echo "   2. Enable 'Developer mode' (top-right)"
echo "   3. Click 'Load unpacked'"
echo "   4. Select: $(realpath "$SCRIPT_DIR/extension/dist")"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Press Ctrl+C to stop the backend server."
echo ""

wait $BACKEND_PID
