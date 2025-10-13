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

# Function to get layer info for a module
get_layer_info() {
    local module=$1
    case "$module" in
        constants|types)
            echo "0:Foundation:#66bb6a"
            ;;
        crypto|config)
            echo "1:Utilities:#42a5f5"
            ;;
        domain)
            echo "2:Business:#ffa726"
            ;;
        storage)
            echo "3:Persistence:#ab47bc"
            ;;
        network)
            echo "4:Network:#ec407a"
            ;;
        api)
            echo "5:Presentation:#ffca28"
            ;;
        *)
            echo "99:Unknown:#9e9e9e"
            ;;
    esac
}

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

EOF

# Dynamically discover modules from src/ directory
echo "  Discovering modules..."
MODULES=()
for item in "$SRC_DIR"/*; do
    name=$(basename "$item")
    # Include directories (modules) and .rs files (exclude main, lib, config)
    if [[ -d "$item" && ! "$name" =~ ^\. && "$name" != "bin" && "$name" != "migrations" ]]; then
        MODULES+=("$name")
    elif [[ -f "$item" && "$item" == *.rs && "$name" != "main.rs" && "$name" != "lib.rs" && "$name" != "config.rs" ]]; then
        # Remove .rs extension
        MODULES+=("${name%.rs}")
    fi
done

# Sort modules for consistent output
IFS=$'\n' MODULES=($(sort <<<"${MODULES[*]}"))
unset IFS

echo "  Found ${#MODULES[@]} modules: ${MODULES[*]}"

# Generate node definitions dynamically
echo "" >> "$DOT_FILE"
echo "    // Module nodes (auto-generated)" >> "$DOT_FILE"

# Arrays to track modules per layer (layer_0, layer_1, etc.)
layer_0=""
layer_1=""
layer_2=""
layer_3=""
layer_4=""
layer_5=""
layer_99=""

for module in "${MODULES[@]}"; do
    layer_info=$(get_layer_info "$module")
    IFS=':' read -r layer_num layer_name color <<< "$layer_info"
    echo "    $module [label=\"$module\\n(Layer $layer_num)\", fillcolor=\"$color\", fontcolor=\"white\"];" >> "$DOT_FILE"

    # Track modules per layer for ranking
    case "$layer_num" in
        0) layer_0="$layer_0 $module" ;;
        1) layer_1="$layer_1 $module" ;;
        2) layer_2="$layer_2 $module" ;;
        3) layer_3="$layer_3 $module" ;;
        4) layer_4="$layer_4 $module" ;;
        5) layer_5="$layer_5 $module" ;;
        99) layer_99="$layer_99 $module" ;;
    esac
done

# Generate layer rankings
echo "" >> "$DOT_FILE"
echo "    // Enforce strict top-to-bottom layering" >> "$DOT_FILE"
for layer_num in 0 1 2 3 4 5 99; do
    layer_var="layer_$layer_num"
    eval "modules=\${$layer_var}"
    if [[ -n "$modules" ]]; then
        echo "    {rank=same;$modules;}" >> "$DOT_FILE"
    fi
done

# Generate invisible edges for horizontal alignment within layers
echo "" >> "$DOT_FILE"
echo "    // Invisible edges to force horizontal alignment within layers" >> "$DOT_FILE"
for layer_num in 0 1 2 3 4 5 99; do
    layer_var="layer_$layer_num"
    eval "modules=\${$layer_var}"
    if [[ -n "$modules" ]]; then
        # Trim leading space
        modules="${modules# }"
        read -ra mods <<< "$modules"
        if [[ ${#mods[@]} -gt 1 ]]; then
            for ((i=0; i<${#mods[@]}-1; i++)); do
                echo "    ${mods[$i]} -> ${mods[$i+1]} [style=invis];" >> "$DOT_FILE"
            done
        fi
    fi
done

echo "" >> "$DOT_FILE"

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
