# Build stage
FROM rust:1.83-slim as builder

WORKDIR /app

# Install cargo-chef for dependency caching
RUN cargo install cargo-chef

# Copy manifests first to cache dependency compilation
COPY Cargo.toml Cargo.lock* ./

# Create a dummy src/main.rs to build dependencies only
RUN mkdir -p src && \
    echo "fn main() {}" > src/main.rs && \
    echo "pub fn dummy() {}" > src/lib.rs

# Build dependencies (this layer is cached unless Cargo.toml changes)
# Remove intermediate binaries to force rebuild when real source is copied
RUN cargo build --release && \
    rm -rf src target/release/goud_chain target/release/deps/goud_chain*

# Now copy the real source code
COPY src ./src

# Build the actual application (only this rebuilds when code changes)
# This will rebuild because we removed the binary above
RUN cargo build --release

# Runtime stage
FROM debian:bookworm-slim

WORKDIR /app

# Install runtime dependencies (curl for health checks)
RUN apt-get update && apt-get install -y \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Copy the binary from builder
COPY --from=builder /app/target/release/goud_chain .

# Create data directory for persistence
RUN mkdir -p /data

# Expose HTTP and P2P ports
EXPOSE 8080 9000

# Run the binary
CMD ["./goud_chain"]
