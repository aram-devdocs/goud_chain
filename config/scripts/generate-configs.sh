#!/bin/bash
# Goud Chain Configuration Generator
# Generates environment-specific nginx and docker-compose configs from templates
#
# Usage: ./generate-configs.sh [local|gcp]

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
CONFIG_DIR="$PROJECT_ROOT/config"
BASE_DIR="$CONFIG_DIR/base"
ENVIRONMENTS_DIR="$CONFIG_DIR/environments"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging helpers
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Usage
usage() {
    cat << EOF
Usage: $0 [ENVIRONMENT]

Generate environment-specific configuration files from templates.

ENVIRONMENT:
    local       Generate configs for local development (3 nodes)
    gcp         Generate configs for GCP e2-micro deployment (2 nodes)
    all         Generate configs for both environments

Examples:
    $0 local
    $0 gcp
    $0 all

Generated files:
    - nginx/nginx.[env].conf
    - docker-compose.[env].yml

EOF
    exit 1
}

# Validate environment argument
validate_environment() {
    local env="$1"
    if [[ ! "$env" =~ ^(local|gcp|all)$ ]]; then
        log_error "Invalid environment: $env"
        usage
    fi
}

# Load environment variables from file
load_env_file() {
    local file="$1"
    if [[ ! -f "$file" ]]; then
        log_error "File not found: $file"
        exit 1
    fi

    # Source file and export all variables
    set -a
    # shellcheck disable=SC1090
    source "$file"
    set +a
}

# Substitute variables in template
# Usage: substitute_template <template_file> <output_file>
substitute_template() {
    local template="$1"
    local output="$2"

    if [[ ! -f "$template" ]]; then
        log_error "Template not found: $template"
        exit 1
    fi

    log_info "Processing template: $(basename "$template")"

    # Read template content
    local content
    content=$(cat "$template")

    # Generate to temporary file first
    local temp_output="/tmp/$(basename "$output").$$"

    # Replace all {{VARIABLE}} patterns with environment variable values
    # Use perl for better regex support and multi-line handling
    echo "$content" | perl -pe 's/\{\{(\w+)\}\}/$ENV{$1} \/\/ ""/ge' > "$temp_output"

    # Compare content (excluding timestamp line) to detect real changes
    local needs_update=true
    if [[ -f "$output" ]]; then
        # Strip out the "Generated: " timestamp line before comparing
        local existing_content_normalized
        local new_content_normalized
        existing_content_normalized=$(grep -v "^# Generated: " "$output" 2>/dev/null || true)
        new_content_normalized=$(grep -v "^# Generated: " "$temp_output" 2>/dev/null || true)

        if [[ "$existing_content_normalized" == "$new_content_normalized" ]]; then
            needs_update=false
        fi
    fi

    if [[ "$needs_update" == true ]]; then
        mv "$temp_output" "$output"
        log_success "Generated: $output"
    else
        rm -f "$temp_output"
        log_info "Skipped: $output (no changes)"
    fi
}

# Generate upstream nodes list for nginx
generate_upstream_nodes() {
    local env="$1"
    local node_count="${NODE_COUNT:-3}"
    local output=""

    for ((i=1; i<=node_count; i++)); do
        local node_hostname_var="NODE${i}_HOSTNAME"
        local node_hostname="${!node_hostname_var:-node${i}}"
        output+="        server ${node_hostname}:${HTTP_PORT} max_fails=${NGINX_MAX_FAILS} fail_timeout=${NGINX_FAIL_TIMEOUT};\n"
    done

    echo -e "$output"
}

# Generate account operations routing block for nginx
generate_account_operations_routing() {
    local strategy="${ACCOUNT_OPERATIONS_ROUTING_STRATEGY:-readers}"

    if [[ "$strategy" == "node1_only" ]]; then
        # GCP: Route account operations ONLY to node1 for consistency
        cat << EOF
        # ACCOUNT operations - Route to node1 only for consistency
        # This prevents "API key no longer valid" errors caused by chain inconsistency
        location ~ ^/(data/list|data/generate)$ {
            proxy_pass http://${NODE1_HOSTNAME}:${HTTP_PORT};

            # Proxy headers
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;

            # Connection reuse
            proxy_http_version 1.1;
            proxy_set_header Connection "";

            # Timeouts (blockchain reads can take time)
            proxy_connect_timeout ${NGINX_PROXY_CONNECT_TIMEOUT_READ};
            proxy_send_timeout ${NGINX_PROXY_SEND_TIMEOUT_READ};
            proxy_read_timeout ${NGINX_PROXY_READ_TIMEOUT_READ};

            # CORS headers for browser access
            include /etc/nginx/cors.conf;

            # No caching for account operations (need fresh data)
            add_header Cache-Control "no-store, no-cache, must-revalidate" always;
        }
EOF
    else
        # Local: No special routing, account operations go to readers
        echo ""
    fi
}

# Generate dashboard server block for nginx
generate_dashboard_server_block() {
    local needed="${DASHBOARD_SERVER_NEEDED:-true}"

    if [[ "$needed" == "true" ]]; then
        cat << EOF
    # Dashboard server block
    server {
        listen ${NGINX_HTTP_PORT};
        listen ${NGINX_API_PORT};
        server_name ${DASHBOARD_SERVER_NAME};

        location / {
            proxy_pass http://${DASHBOARD_HOSTNAME}:${HTTP_PORT};

            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;

            proxy_http_version 1.1;
            proxy_set_header Connection "";

            # CORS
            include /etc/nginx/cors.conf;
        }
    }

EOF
    else
        echo ""
    fi
}

# Generate additional listen directive
generate_additional_listen() {
    local enabled="${ADDITIONAL_LISTEN_ENABLED:-false}"

    if [[ "$enabled" == "true" ]]; then
        echo "        listen ${NGINX_HTTP_PORT};"
    else
        echo ""
    fi
}

# Generate configs for a specific environment
generate_for_environment() {
    local env="$1"

    log_info "Generating configs for environment: $env"

    # Load base constants
    load_env_file "$BASE_DIR/constants.env"

    # Load environment-specific overrides
    load_env_file "$ENVIRONMENTS_DIR/$env/overrides.env"

    # Set generation timestamp
    export GENERATION_TIMESTAMP=$(date -u +"%Y-%m-%d %H:%M:%S UTC")

    # Generate dynamic nginx sections
    export UPSTREAM_NODES=$(generate_upstream_nodes "$env")
    export UPSTREAM_READERS="$UPSTREAM_NODES"  # Same for now
    export ACCOUNT_OPERATIONS_ROUTING=$(generate_account_operations_routing)
    export DASHBOARD_SERVER_BLOCK=$(generate_dashboard_server_block)
    export ADDITIONAL_LISTEN=$(generate_additional_listen)

    # Generate nginx config
    local nginx_template="$BASE_DIR/nginx.conf.template"
    local nginx_output="$PROJECT_ROOT/nginx/nginx.${env}.conf"
    substitute_template "$nginx_template" "$nginx_output"

    # Generate docker-compose config
    local compose_template="$ENVIRONMENTS_DIR/$env/docker-compose.template.yml"
    local compose_output="$PROJECT_ROOT/docker-compose.${env}.yml"

    # First, inject YAML anchors from base into the template
    local temp_compose="/tmp/compose-with-anchors-$$.yml"

    # Extract anchors section from base (everything from "# YAML anchors" up to but not including "networks:")
    local anchors_section
    anchors_section=$(awk '/^# YAML anchors/,/^networks:/ {if (/^networks:/) exit; print}' "$BASE_DIR/docker-compose.base.yml")

    # Prepend anchors to template content
    {
        head -n 8 "$compose_template"  # Keep version and comments
        echo ""
        echo "$anchors_section"
        echo ""
        tail -n +9 "$compose_template"  # Rest of template
    } > "$temp_compose"

    substitute_template "$temp_compose" "$compose_output"
    rm -f "$temp_compose"

    log_success "Configuration generation complete for: $env"
    echo ""
}

# Main
main() {
    if [[ $# -eq 0 ]]; then
        usage
    fi

    local env="$1"
    validate_environment "$env"

    log_info "Goud Chain Configuration Generator"
    log_info "Project root: $PROJECT_ROOT"
    echo ""

    if [[ "$env" == "all" ]]; then
        for e in local gcp; do
            generate_for_environment "$e"
        done
    else
        generate_for_environment "$env"
    fi

    log_success "All configurations generated successfully!"
    log_info "To use generated configs:"
    echo "  Local:  docker-compose -f docker-compose.local.yml up -d"
    echo "  GCP:    docker-compose -f docker-compose.gcp.yml up -d"
}

main "$@"
