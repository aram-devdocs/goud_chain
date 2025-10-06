#!/bin/bash
# Generate module dependency graph as PNG using GraphViz
#
# This script:
# 1. Parses all Rust source files for module dependencies
# 2. Generates a GraphViz DOT file
# 3. Renders it as a PNG image
# 4. Saves to docs/module-structure.png

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
SRC_DIR="$PROJECT_ROOT/src"
DOCS_DIR="$PROJECT_ROOT/docs"
DOT_FILE="$DOCS_DIR/module-structure.dot"
PNG_FILE="$DOCS_DIR/module-structure.png"

# Create docs directory if it doesn't exist
mkdir -p "$DOCS_DIR"

echo "📊 Generating module dependency graph..."

# Start DOT file
cat > "$DOT_FILE" <<'EOF'
digraph ModuleDependencies {
    // Graph styling - Top to Bottom for clean layer visualization
    rankdir=TB;
    node [shape=box, style="rounded,filled", fontname="Arial Bold", fontsize=16, width=2.2, height=1.0];
    edge [fontname="Arial", fontsize=11, color="#555555", penwidth=1.5];
    splines=polyline;
    nodesep=1.0;
    ranksep=1.5;
    bgcolor="#ffffff";

    // Entry point (Dark Gray) - at the top
    main [label="main\n(entry)", fillcolor="#37474f", fontcolor="white", shape="ellipse", width=2.0, height=2.0];

    // Layer 5: Presentation (Yellow)
    api [label="api\n(Layer 5)", fillcolor="#ffca28", fontcolor="white"];

    // Layer 4: Network (Pink)
    network [label="network\n(Layer 4)", fillcolor="#ec407a", fontcolor="white"];

    // Layer 3: Persistence (Purple)
    storage [label="storage\n(Layer 3)", fillcolor="#ab47bc", fontcolor="white"];

    // Layer 2: Business (Orange)
    domain [label="domain\n(Layer 2)", fillcolor="#ffa726", fontcolor="white"];

    // Layer 1: Utilities (Blue)
    crypto [label="crypto\n(Layer 1)", fillcolor="#42a5f5", fontcolor="white"];
    config [label="config\n(Layer 1)", fillcolor="#42a5f5", fontcolor="white"];

    // Layer 0: Foundation (Green) - at the bottom
    constants [label="constants\n(Layer 0)", fillcolor="#66bb6a", fontcolor="white"];
    types [label="types\n(Layer 0)", fillcolor="#66bb6a", fontcolor="white"];

    // Enforce strict top-to-bottom layering
    {rank=same; constants; types;}
    {rank=same; crypto; config;}
    {rank=same; domain;}
    {rank=same; storage;}
    {rank=same; network;}
    {rank=same; api;}

    // Invisible edges to force horizontal alignment within layers
    constants -> types [style=invis];
    crypto -> config [style=invis];

EOF

# Function to extract dependencies from a module
extract_dependencies() {
    local module=$1
    local module_dir="$SRC_DIR/$module"
    local module_file="$SRC_DIR/${module}.rs"

    # Check if module exists as directory or file
    if [ -d "$module_dir" ]; then
        # Find all .rs files in the module directory
        find "$module_dir" -name "*.rs" -type f
    elif [ -f "$module_file" ]; then
        echo "$module_file"
    fi
}

# Parse dependencies and add edges
MODULES=("api" "config" "constants" "crypto" "domain" "network" "storage" "types")

echo "  Analyzing module dependencies..."

for module in "${MODULES[@]}"; do
    files=$(extract_dependencies "$module")

    if [ -n "$files" ]; then
        # Extract unique dependencies
        deps=$(echo "$files" | xargs grep -h "^use crate::" 2>/dev/null | \
               sed 's/use crate::\([^:;]*\).*/\1/' | \
               grep -v "^$module$" | \
               sort -u || true)

        # Add edges to DOT file
        for dep in $deps; do
            # Only add if dep is in our module list
            if [[ " ${MODULES[@]} " =~ " ${dep} " ]]; then
                echo "    $module -> $dep;" >> "$DOT_FILE"
            fi
        done
    fi
done

# Add main.rs dependencies
echo "  Adding main.rs dependencies..."
if [ -f "$SRC_DIR/main.rs" ]; then
    main_deps=$(grep "^use " "$SRC_DIR/main.rs" | \
                grep -E "use (api|config|storage|network)" | \
                sed 's/.*use \([^:;]*\).*/\1/' | \
                sort -u || true)

    for dep in $main_deps; do
        if [[ " ${MODULES[@]} " =~ " ${dep} " ]]; then
            echo "    main -> $dep;" >> "$DOT_FILE"
        fi
    done
fi

# Close DOT file
echo "}" >> "$DOT_FILE"

echo "  Generated DOT file: $DOT_FILE"

# Generate PNG using GraphViz
if command -v dot &> /dev/null; then
    echo "  Rendering PNG with GraphViz..."
    dot -Tpng "$DOT_FILE" -o "$PNG_FILE"
    echo "✅ Module dependency graph saved to: $PNG_FILE"

    # Get file size for info
    if [ -f "$PNG_FILE" ]; then
        size=$(du -h "$PNG_FILE" | cut -f1)
        echo "   File size: $size"
    fi
else
    echo "❌ Error: GraphViz 'dot' command not found."
    echo "   Install with: brew install graphviz (macOS) or apt-get install graphviz (Linux)"
    exit 1
fi

echo "📊 Module graph generation complete!"
