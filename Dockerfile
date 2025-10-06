# Build stage
FROM rust:1.83-slim as builder

WORKDIR /app

# Copy manifests
COPY Cargo.toml ./

# Copy source code
COPY src ./src

# Build for release
RUN cargo build --release

# Runtime stage
FROM debian:bookworm-slim

WORKDIR /app

# Copy the binary from builder
COPY --from=builder /app/target/release/goud_chain .

# Create data directory for persistence
RUN mkdir -p /data

# Expose HTTP and P2P ports
EXPOSE 8080 9000

# Run the binary
CMD ["./goud_chain"]
