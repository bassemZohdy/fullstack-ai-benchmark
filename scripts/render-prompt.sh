#!/bin/bash

################################################################################
# Prompt Rendering Script
#
# Separates prompt templating from project generation.
# Reads template, specifications, and cartridges, then outputs final prompt.
#
# Usage:
#   ./scripts/render-prompt.sh \
#     --template PROMPTS/templates/project-generation.md \
#     --spec PROMPTS/overview.md \
#     --backend-cartridge PROMPTS/cartridges/backend/spring-boot.md \
#     --frontend-cartridge PROMPTS/cartridges/frontend/angular.md \
#     --level overview \
#     --backend spring-boot \
#     --frontend angular \
#     [--output <file>]
#
# Parameters:
#   Required:
#     --template              Prompt template file path
#     --spec                  Specification file path
#     --backend-cartridge     Backend cartridge file path
#     --frontend-cartridge    Frontend cartridge file path
#     --level                 Specification level (overview, detailed)
#     --backend               Backend framework name
#     --frontend              Frontend framework name
#
#   Optional:
#     --output <file>         Write to file instead of stdout
#
# Output:
#   - Rendered prompt (to stdout or specified file)
#   - Writes to stderr on errors
#
# Exit codes:
#   0: Success
#   1: Invalid arguments or missing files
#
# Example:
#   ./scripts/render-prompt.sh \
#     --template PROMPTS/templates/project-generation.md \
#     --spec PROMPTS/overview.md \
#     --backend-cartridge PROMPTS/cartridges/backend/spring-boot.md \
#     --frontend-cartridge PROMPTS/cartridges/frontend/angular.md \
#     --level overview \
#     --backend spring-boot \
#     --frontend angular \
#     --output /tmp/final-prompt.txt
################################################################################

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Color codes
RED='\033[0;31m'
NC='\033[0m'

# Parse arguments
while [ $# -gt 0 ]; do
  case "$1" in
    --template)
      TEMPLATE_FILE="$2"
      shift 2
      ;;
    --spec)
      SPEC_FILE="$2"
      shift 2
      ;;
    --backend-cartridge)
      BACKEND_CARTRIDGE="$2"
      shift 2
      ;;
    --frontend-cartridge)
      FRONTEND_CARTRIDGE="$2"
      shift 2
      ;;
    --level)
      LEVEL="$2"
      shift 2
      ;;
    --backend)
      BACKEND="$2"
      shift 2
      ;;
    --frontend)
      FRONTEND="$2"
      shift 2
      ;;
    --output)
      OUTPUT_FILE="$2"
      shift 2
      ;;
    *)
      echo -e "${RED}Unknown option: $1${NC}" >&2
      exit 1
      ;;
  esac
done

# Validate required parameters
if [ -z "$TEMPLATE_FILE" ] || [ -z "$SPEC_FILE" ] || [ -z "$BACKEND_CARTRIDGE" ] || [ -z "$FRONTEND_CARTRIDGE" ] || [ -z "$LEVEL" ] || [ -z "$BACKEND" ] || [ -z "$FRONTEND" ]; then
  echo -e "${RED}❌ ERROR: Missing required parameters${NC}" >&2
  echo "Required:" >&2
  echo "  --template <path>" >&2
  echo "  --spec <path>" >&2
  echo "  --backend-cartridge <path>" >&2
  echo "  --frontend-cartridge <path>" >&2
  echo "  --level <level>" >&2
  echo "  --backend <backend>" >&2
  echo "  --frontend <frontend>" >&2
  exit 1
fi

# Validate files exist
for file in "$TEMPLATE_FILE" "$SPEC_FILE" "$BACKEND_CARTRIDGE" "$FRONTEND_CARTRIDGE"; do
  if [ ! -f "$file" ]; then
    echo -e "${RED}❌ ERROR: File not found: $file${NC}" >&2
    exit 1
  fi
done

# Render the prompt using Node.js template engine
node - "$TEMPLATE_FILE" "$SPEC_FILE" "$BACKEND_CARTRIDGE" "$FRONTEND_CARTRIDGE" "$LEVEL" "$BACKEND" "$FRONTEND" "$OUTPUT_FILE" <<'NODE'
const fs = require("fs");
const [
  templateFile,
  specFile,
  backendCartridgeFile,
  frontendCartridgeFile,
  level,
  backend,
  frontend,
  outputFile
] = process.argv.slice(2);

let rendered = fs.readFileSync(templateFile, "utf8");
const replacements = {
  "{{LEVEL}}": level,
  "{{BACKEND}}": backend,
  "{{FRONTEND}}": frontend,
  "{{SPEC_CONTENT}}": fs.readFileSync(specFile, "utf8"),
  "{{BACKEND_CARTRIDGE}}": fs.readFileSync(backendCartridgeFile, "utf8"),
  "{{FRONTEND_CARTRIDGE}}": fs.readFileSync(frontendCartridgeFile, "utf8")
};

for (const [token, value] of Object.entries(replacements)) {
  rendered = rendered.split(token).join(value);
}

// Output to file or stdout
if (outputFile) {
  fs.writeFileSync(outputFile, rendered);
} else {
  process.stdout.write(rendered);
}
NODE

exit 0
