#!/bin/bash
# Update Visual Regression Baselines
#
# This script updates the baseline screenshots for visual regression testing.
# Use after approving visual changes during development.

set -e

echo "Updating visual regression baselines..."

# Navigate to web directory
cd "$(dirname "$0")/../.."

# Run visual regression tests with update flag
echo "Running visual regression tests and updating snapshots..."
pnpm exec playwright test e2e/tests/visual-regression.spec.ts --update-snapshots

echo "✓ Baseline screenshots updated successfully"
echo ""
echo "Next steps:"
echo "1. Review the updated screenshots in e2e/visual/baseline/"
echo "2. Commit the changes to git"
echo "3. Push to remote repository"
echo ""
echo "To review diffs before approving:"
echo "  pnpm test:e2e:visual"
echo "  Check e2e/visual/diff/ for visual differences"
