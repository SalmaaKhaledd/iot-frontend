#!/usr/bin/env bash
# Build Allure HTML from target/allure-results and copy to test-runs/allure-reports/<name>.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

MVN="${MVN:-}"
if [[ -z "$MVN" ]]; then
  if command -v mvn >/dev/null 2>&1; then
    MVN="mvn"
  elif [[ -x "../docs/apache-maven-3.9.16/bin/mvn" ]]; then
    MVN="../docs/apache-maven-3.9.16/bin/mvn"
  else
    echo "Maven not found. Set MVN or install Maven."
    exit 1
  fi
fi

NAME="${1:-allure-report-$(date +%Y%m%d-%H%M)}"
DEST="test-runs/allure-reports/${NAME}"
mkdir -p "test-runs/allure-reports"

echo "Generating single-file Allure report from target/allure-results ..."
"$MVN" -q io.qameta.allure:allure-maven:2.14.0:report

rm -rf "$DEST"
mkdir -p "$DEST"
cp -f target/site/allure-maven-plugin/index.html "$DEST/index.html"
if [[ -f target/site/allure-maven-plugin/allure-maven.html ]]; then
  cp -f target/site/allure-maven-plugin/allure-maven.html "$DEST/allure-maven.html"
fi

cp -f scripts/open-allure-report.sh "$DEST/open-report.sh"
chmod +x "$DEST/open-report.sh"

echo "Saved: $DEST/index.html (single-file, double-click to open)"
if command -v open >/dev/null 2>&1; then
  open "$DEST/index.html"
fi
