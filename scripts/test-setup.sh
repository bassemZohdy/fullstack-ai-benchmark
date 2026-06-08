#!/bin/bash

################################################################################
# Test & Validation Script
#
# Validates the benchmark infrastructure before running actual benchmarks
# Tests with a single small project to verify everything works
#
# Usage:
#   ./scripts/test-setup.sh [--harness opencode] [--provider z-ai|openrouter] [--auto-approve true|false] [--retries count] [--keep-test-files]
#
# This script:
# 1. Validates directory structure
# 2. Checks harness/provider setup (OpenCode CLI, optional OpenRouter API key)
# 3. Runs a single test generation with the overview specification
# 4. Tests evaluation framework
# 5. Verifies results format
#
# Use this to validate infrastructure before running benchmarks
################################################################################

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
. "$SCRIPT_DIR/benchmark-support.sh"

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Defaults
HARNESS="opencode"
PROVIDER="z-ai"
AUTO_APPROVE="true"
RETRIES="3"
KEEP_TEST_FILES="false"

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --harness)
      HARNESS="$2"
      shift 2
      ;;
    --provider)
      PROVIDER="$2"
      shift 2
      ;;
    --auto-approve)
      AUTO_APPROVE="$2"
      shift 2
      ;;
    --retries)
      RETRIES="$2"
      shift 2
      ;;
    --keep-test-files)
      KEEP_TEST_FILES="true"
      shift
      ;;
    *)
      echo -e "${RED}Unknown option: $1${NC}"
      exit 1
      ;;
  esac
done

# Helper function for checks
check_item() {
  local name="$1"
  local result="$2"

  if [ "$result" == "pass" ]; then
    echo -e "${GREEN}✅${NC} $name"
  else
    echo -e "${RED}❌${NC} $name"
  fi
}

# Start tests
echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}Benchmark Infrastructure Test${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "Harness:  ${YELLOW}${HARNESS}${NC}"
echo -e "Provider: ${YELLOW}${PROVIDER}${NC}"
echo -e "Auto Approve: ${YELLOW}${AUTO_APPROVE}${NC}"
echo -e "Retries: ${YELLOW}${RETRIES}${NC}"
echo ""

# Step 1: Verify directory structure
echo -e "${BLUE}Step 1: Verifying Directory Structure${NC}"
echo ""

CHECKS_PASSED=0
CHECKS_TOTAL=0

check_dir() {
  local path="$1"
  local desc="$2"
  CHECKS_TOTAL=$((CHECKS_TOTAL + 1))

  if [ -d "$path" ]; then
    check_item "$desc" "pass"
    CHECKS_PASSED=$((CHECKS_PASSED + 1))
  else
    check_item "$desc" "fail"
  fi
}

check_file() {
  local path="$1"
  local desc="$2"
  CHECKS_TOTAL=$((CHECKS_TOTAL + 1))

  if [ -f "$path" ]; then
    check_item "$desc" "pass"
    CHECKS_PASSED=$((CHECKS_PASSED + 1))
  else
    check_item "$desc" "fail"
  fi
}

check_dir "scripts" "scripts/ directory"
check_dir "PROMPTS" "PROMPTS/ directory"
check_dir "E2E_TESTS" "E2E_TESTS/ directory"
check_file "PROMPTS/overview.md" "Overview specification"
check_file "PROMPTS/detailed.md" "Detailed specification"
check_file "PROMPTS/templates/project-generation.md" "Prompt template"
check_file "README.md" "README.md"
check_file "docs/ARCHITECTURE.md" "docs/ARCHITECTURE.md"

echo ""
echo -e "Directory checks: ${GREEN}${CHECKS_PASSED}/${CHECKS_TOTAL}${NC}"
echo ""

# Step 2: Verify provider setup
echo -e "${BLUE}Step 2: Verifying Harness/Provider Setup (${HARNESS}/${PROVIDER})${NC}"
echo ""

CHECKS_PASSED=0
CHECKS_TOTAL=0

if benchmark_contains "$HARNESS" "${BENCHMARK_HARNESSES[@]}"; then
  if command -v opencode &> /dev/null; then
    check_item "OpenCode CLI installed" "pass"
    CHECKS_PASSED=$((CHECKS_PASSED + 1))
  else
    check_item "OpenCode CLI installed" "fail"
  fi
  CHECKS_TOTAL=$((CHECKS_TOTAL + 1))

  # Try to get OpenCode version
  if opencode --version &> /dev/null; then
    VERSION=$(opencode --version 2>&1 | head -1)
    echo -e "${GREEN}✅${NC} OpenCode version: ${VERSION}"
    CHECKS_PASSED=$((CHECKS_PASSED + 1))
  else
    echo -e "${YELLOW}⚠️${NC} Could not determine OpenCode version"
  fi
  CHECKS_TOTAL=$((CHECKS_TOTAL + 1))
else
  check_item "Supported harness (${HARNESS})" "fail"
  CHECKS_TOTAL=$((CHECKS_TOTAL + 1))
fi

if benchmark_contains "$PROVIDER" "${BENCHMARK_PROVIDERS[@]}"; then
  check_item "Z.ai coding provider selected" "pass"
  CHECKS_PASSED=$((CHECKS_PASSED + 1))
  CHECKS_TOTAL=$((CHECKS_TOTAL + 1))

elif [ "$PROVIDER" == "openrouter" ]; then
  if [ ! -z "$OPENROUTER_API_KEY" ]; then
    check_item "OPENROUTER_API_KEY set" "pass"
    CHECKS_PASSED=$((CHECKS_PASSED + 1))
  else
    check_item "OPENROUTER_API_KEY set" "fail"
  fi
  CHECKS_TOTAL=$((CHECKS_TOTAL + 1))
else
  check_item "Supported provider (${PROVIDER})" "fail"
  CHECKS_TOTAL=$((CHECKS_TOTAL + 1))
fi

echo ""
echo -e "Harness/provider checks: ${GREEN}${CHECKS_PASSED}/${CHECKS_TOTAL}${NC}"
echo ""

if [ "$CHECKS_PASSED" -ne "$CHECKS_TOTAL" ]; then
  echo -e "${RED}❌ Harness/provider checks failed${NC}"
  exit 1
fi

# Step 3: Test single generation
echo -e "${BLUE}Step 3: Testing Single Project Generation${NC}"
echo ""
echo -e "Generating test project: ${YELLOW}GLM-5.1Z.AI + overview${NC}"
echo ""

TEST_OUTPUT_DIR="WORKSPACE/.test-setup/overview"
mkdir -p "$TEST_OUTPUT_DIR"

if ./scripts/generate-project.sh \
    --model "GLM-5.1Z.AI" \
    --level "overview" \
    --backend "node-js" \
    --frontend "react" \
    --output-dir "$TEST_OUTPUT_DIR" \
    --harness "$HARNESS" \
    --provider "$PROVIDER" \
    --auto-approve "$AUTO_APPROVE" \
    --retries "$RETRIES" \
    --session-file "$TEST_OUTPUT_DIR/.opencode-session-id" \
    --timeout 120; then

  echo -e "${GREEN}✅ Generation test PASSED${NC}"
  echo ""

  # Verify generated files
  if [ -d "$TEST_OUTPUT_DIR" ] && [ "$(ls -A "$TEST_OUTPUT_DIR")" ]; then
    echo -e "${GREEN}✅ Generated files exist${NC}"
    echo -e "   Files: $(ls -1 "$TEST_OUTPUT_DIR" | wc -l) items"
    ls -1 "$TEST_OUTPUT_DIR" | head -5
    [ "$(ls -1 "$TEST_OUTPUT_DIR" | wc -l)" -gt 5 ] && echo "   ... and more"
  else
    echo -e "${YELLOW}⚠️  Generated directory appears empty${NC}"
  fi
else
  echo -e "${RED}❌ Generation test FAILED${NC}"
  exit 1
fi

echo ""

# Step 4: Test evaluation framework
echo -e "${BLUE}Step 4: Testing Evaluation Framework${NC}"
echo ""

if [ -d "E2E_TESTS" ]; then
  echo -e "${YELLOW}E2E_TESTS/ directory exists${NC}"

  if [ -f "E2E_TESTS/package.json" ]; then
    check_item "E2E_TESTS/package.json exists" "pass"
  else
    check_item "E2E_TESTS/package.json exists" "fail"
  fi
else
  check_item "E2E_TESTS/ directory exists" "fail"
fi

if [ -d "EVAL" ]; then
  echo -e "${YELLOW}EVAL/ directory exists${NC}"

  if [ -f "EVAL/package.json" ]; then
    check_item "EVAL/package.json exists" "pass"
  else
    check_item "EVAL/package.json exists" "fail"
  fi
else
  check_item "EVAL/ directory exists" "fail"
fi

echo ""

# Step 5: Test evaluation script existence
echo -e "${BLUE}Step 5: Testing Evaluation Script${NC}"
echo ""

if [ -f "scripts/eval-generated-project.sh" ]; then
  check_item "eval-generated-project.sh exists" "pass"

  if bash -n scripts/eval-generated-project.sh && node --check EVAL/comprehensive-evaluator.js &> /dev/null; then
    echo -e "${GREEN}✅${NC} Evaluation script syntax valid"
  else
    echo -e "${RED}❌${NC} Evaluation script syntax invalid"
    exit 1
  fi
else
  check_item "eval-generated-project.sh exists" "fail"
fi

echo ""

# Step 6: Summary
echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}Test Summary${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
echo ""

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ ALL INFRASTRUCTURE TESTS PASSED${NC}"
  echo ""
  echo "You can now run benchmarks with all required selectors:"
  echo ""
  echo -e "  ${YELLOW}./scripts/run-benchmark.sh --model kimi/2.6 --level overview --backend node-js --frontend react --provider openrouter${NC}"
  echo ""
  echo "Or use the GLM validation setup:"
  echo ""
  echo -e "  ${YELLOW}./scripts/run-benchmark.sh --model GLM-5.1Z.AI --level overview --backend spring-boot --frontend angular --provider z-ai${NC}"
  echo ""
else
  echo -e "${RED}❌ SOME TESTS FAILED${NC}"
  echo ""
  echo "Check the errors above and verify:"
  echo "  1. Directory structure is correct"
  echo "  2. Provider is properly configured"
  echo "  3. OpenCode CLI or OpenRouter API is available"
  echo ""
fi

echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
echo ""

# Cleanup test artifacts
if [ "$KEEP_TEST_FILES" != "true" ]; then
  echo -e "${YELLOW}Cleaning up test artifacts...${NC}"
  rm -rf "WORKSPACE/.test-setup"
  echo -e "${GREEN}Done.${NC}"
  echo ""
fi
