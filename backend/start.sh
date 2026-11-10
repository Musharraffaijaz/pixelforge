#!/usr/bin/env bash
# PixelForge Backend Startup Script

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VENV_DIR="$SCRIPT_DIR/.venv"

echo "🎨 PixelForge Backend"
echo "====================="

# Create virtual environment if not exists
if [ ! -d "$VENV_DIR" ]; then
  echo "📦 Creating virtual environment..."
  PYTHON_BIN=""
  for py in python3.12 python3.11 python3.10 python3; do
    if command -v "$py" >/dev/null 2>&1; then
      ver=$("$py" -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")' 2>/dev/null || true)
      if [[ "$ver" == "3.10" || "$ver" == "3.11" || "$ver" == "3.12" ]]; then
        PYTHON_BIN="$py"
        break
      fi
    fi
  done
  if [ -z "$PYTHON_BIN" ]; then
    PYTHON_BIN="python3"
  fi
  echo "Using Python: $PYTHON_BIN"
  "$PYTHON_BIN" -m venv "$VENV_DIR"
fi

# Activate virtual environment
source "$VENV_DIR/bin/activate"

# Install / upgrade dependencies
echo "📥 Installing dependencies..."
pip install -q -r "$SCRIPT_DIR/requirements.txt"

echo "✅ All dependencies installed."
echo "🚀 Starting server on http://127.0.0.1:7832"
echo "   Press Ctrl+C to stop."
echo ""

# Start FastAPI server
python "$SCRIPT_DIR/main.py"
