# Build stage
FROM rust:1.83-slim as builder

WORKDIR /app

# Install build dependencies (RocksDB system library + build tools)
RUN apt-get update && apt-get install -y \
    librocksdb-dev \
    libclang-dev \
    build-essential \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

# Set environment variable to use system RocksDB instead of compiling from source
# This prevents the rocksdb crate from building from source (much faster!)
ENV ROCKSDB_LIB_DIR=/usr/lib
ENV SNAPPY_LIB_DIR=/usr/lib

# Install cargo-chef for dependency caching (pinned version for Rust 1.83 compatibility)
RUN cargo install cargo-chef --version 0.1.67 --locked

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

# Install runtime dependencies (curl for health checks, librocksdb for RocksDB)
# Use librocksdb-dev which includes the runtime library
RUN apt-get update && apt-get install -y \
    curl \
    ca-certificates \
    librocksdb-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy the binary from builder
COPY --from=builder /app/target/release/goud_chain .

# Create data directory for persistence
RUN mkdir -p /data

# Expose HTTP and P2P ports
EXPOSE 8080 9000

# Run the binary
CMD ["./goud_chain"]
