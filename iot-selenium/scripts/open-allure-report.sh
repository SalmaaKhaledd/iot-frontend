#!/usr/bin/env bash
# Serve a saved multi-file Allure report over HTTP (browsers block file:// JSON loads).
set -euo pipefail

REPORT_DIR="${1:-}"
if [[ -z "$REPORT_DIR" ]]; then
  echo "Usage: $0 <path-to-report-folder>"
  echo "Example: $0 test-runs/allure-reports/full-suite-26-only-20260529-0328"
  exit 1
fi

if [[ ! -f "$REPORT_DIR/index.html" ]]; then
  echo "No index.html in: $REPORT_DIR"
  exit 1
fi

cd "$REPORT_DIR"
PORT="${ALLURE_REPORT_PORT:-8765}"
echo "Allure report: http://localhost:${PORT}/index.html"
echo "Press Ctrl+C to stop."
python3 -m http.server "$PORT"
