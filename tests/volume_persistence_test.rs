/// Integration tests for Docker volume persistence
///
/// These tests verify that blockchain data persists correctly across container restarts
/// and that the volume management commands work as expected.
///
/// Note: These tests require Docker to be running and may be skipped in CI environments.
#[cfg(test)]
mod volume_persistence_tests {
    use std::process::Command;

    /// Helper to check if Docker is available
    fn is_docker_available() -> bool {
        Command::new("docker")
            .arg("version")
            .output()
            .map(|output| output.status.success())
            .unwrap_or(false)
    }

    /// Helper to check if volume exists
    fn volume_exists(volume_name: &str) -> bool {
        let output = Command::new("docker")
            .args(["volume", "inspect", volume_name])
            .output()
            .expect("Failed to run docker volume inspect");

        output.status.success()
    }

    /// Helper to get volume size in bytes
    fn get_volume_size(volume_name: &str) -> Option<u64> {
        let output = Command::new("docker")
            .args([
                "run",
                "--rm",
                "-v",
                &format!("{}:/data:ro", volume_name),
                "alpine:latest",
                "du",
                "-sb",
                "/data",
            ])
            .output()
            .ok()?;

        if !output.status.success() {
            return None;
        }

        let stdout = String::from_utf8_lossy(&output.stdout);
        let size_str = stdout.split_whitespace().next()?;
        size_str.parse().ok()
    }

    #[test]
    fn test_volume_creation() {
        if !is_docker_available() {
            println!("Skipping test: Docker not available");
            return;
        }

        // Test volume names from local environment
        let test_volumes = vec!["test_volume_persistence_node1"];

        for volume in &test_volumes {
            // Clean up any existing test volume
            let _ = Command::new("docker")
                .args(["volume", "rm", volume])
                .output();

            // Create volume
            let output = Command::new("docker")
                .args(["volume", "create", volume])
                .output()
                .expect("Failed to create volume");

            assert!(
                output.status.success(),
                "Failed to create volume: {}",
                String::from_utf8_lossy(&output.stderr)
            );

            // Verify volume exists
            assert!(volume_exists(volume), "Volume should exist after creation");

            // Clean up
            let _ = Command::new("docker")
                .args(["volume", "rm", volume])
                .output();
        }
    }

    #[test]
    fn test_volume_data_persistence() {
        if !is_docker_available() {
            println!("Skipping test: Docker not available");
            return;
        }

        let volume_name = "test_volume_persistence_data";

        // Clean up
        let _ = Command::new("docker")
            .args(["volume", "rm", volume_name])
            .output();

        // Create volume
        Command::new("docker")
            .args(["volume", "create", volume_name])
            .output()
            .expect("Failed to create volume");

        // Write test data to volume
        let test_data = "blockchain_test_data";
        let write_output = Command::new("docker")
            .args([
                "run",
                "--rm",
                "-v",
                &format!("{}:/data", volume_name),
                "alpine:latest",
                "sh",
                "-c",
                &format!("echo '{}' > /data/test.txt", test_data),
            ])
            .output()
            .expect("Failed to write data");

        assert!(write_output.status.success(), "Failed to write test data");

        // Read data back from volume
        let read_output = Command::new("docker")
            .args([
                "run",
                "--rm",
                "-v",
                &format!("{}:/data:ro", volume_name),
                "alpine:latest",
                "cat",
                "/data/test.txt",
            ])
            .output()
            .expect("Failed to read data");

        assert!(read_output.status.success(), "Failed to read test data");

        let read_data = String::from_utf8_lossy(&read_output.stdout);
        assert!(
            read_data.trim() == test_data,
            "Data should persist in volume. Expected '{}', got '{}'",
            test_data,
            read_data.trim()
        );

        // Clean up
        let _ = Command::new("docker")
            .args(["volume", "rm", volume_name])
            .output();
    }

    #[test]
    fn test_rocksdb_directory_structure() {
        if !is_docker_available() {
            println!("Skipping test: Docker not available");
            return;
        }

        let volume_name = "test_volume_persistence_rocksdb";

        // Clean up
        let _ = Command::new("docker")
            .args(["volume", "rm", volume_name])
            .output();

        // Create volume
        Command::new("docker")
            .args(["volume", "create", volume_name])
            .output()
            .expect("Failed to create volume");

        // Create mock RocksDB directory structure
        let create_output = Command::new("docker")
            .args([
                "run",
                "--rm",
                "-v",
                &format!("{}:/data", volume_name),
                "alpine:latest",
                "sh",
                "-c",
                "mkdir -p /data/rocksdb && \
                 echo 'MANIFEST-000001' > /data/rocksdb/MANIFEST-000001 && \
                 echo 'CURRENT' > /data/rocksdb/CURRENT && \
                 echo 'data' > /data/rocksdb/000001.sst",
            ])
            .output()
            .expect("Failed to create directory structure");

        assert!(
            create_output.status.success(),
            "Failed to create RocksDB structure"
        );

        // Verify structure exists
        let verify_output = Command::new("docker")
            .args([
                "run",
                "--rm",
                "-v",
                &format!("{}:/data:ro", volume_name),
                "alpine:latest",
                "find",
                "/data/rocksdb",
                "-type",
                "f",
            ])
            .output()
            .expect("Failed to verify structure");

        assert!(verify_output.status.success(), "Failed to verify structure");

        let files = String::from_utf8_lossy(&verify_output.stdout);
        assert!(files.contains("MANIFEST"), "Should have MANIFEST file");
        assert!(files.contains("CURRENT"), "Should have CURRENT file");
        assert!(files.contains(".sst"), "Should have SST file");

        // Clean up
        let _ = Command::new("docker")
            .args(["volume", "rm", volume_name])
            .output();
    }

    #[test]
    fn test_volume_size_calculation() {
        if !is_docker_available() {
            println!("Skipping test: Docker not available");
            return;
        }

        let volume_name = "test_volume_persistence_size";

        // Clean up
        let _ = Command::new("docker")
            .args(["volume", "rm", volume_name])
            .output();

        // Create volume
        Command::new("docker")
            .args(["volume", "create", volume_name])
            .output()
            .expect("Failed to create volume");

        // Write known size data
        let test_size = 1024; // 1 KB
        let write_output = Command::new("docker")
            .args([
                "run",
                "--rm",
                "-v",
                &format!("{}:/data", volume_name),
                "alpine:latest",
                "sh",
                "-c",
                "dd if=/dev/zero of=/data/testfile bs=1024 count=1",
            ])
            .output()
            .expect("Failed to write test file");

        assert!(write_output.status.success(), "Failed to write test file");

        // Get volume size
        let size = get_volume_size(volume_name);
        assert!(size.is_some(), "Should be able to calculate volume size");

        let size_bytes = size.unwrap();
        assert!(
            size_bytes >= test_size,
            "Volume size should be at least {} bytes, got {}",
            test_size,
            size_bytes
        );

        // Clean up
        let _ = Command::new("docker")
            .args(["volume", "rm", volume_name])
            .output();
    }

    #[test]
    fn test_volume_mount_permissions() {
        if !is_docker_available() {
            println!("Skipping test: Docker not available");
            return;
        }

        let volume_name = "test_volume_persistence_permissions";

        // Clean up
        let _ = Command::new("docker")
            .args(["volume", "rm", volume_name])
            .output();

        // Create volume
        Command::new("docker")
            .args(["volume", "create", volume_name])
            .output()
            .expect("Failed to create volume");

        // Test read-write mount
        let rw_output = Command::new("docker")
            .args([
                "run",
                "--rm",
                "-v",
                &format!("{}:/data", volume_name),
                "alpine:latest",
                "sh",
                "-c",
                "echo 'test' > /data/testfile && cat /data/testfile",
            ])
            .output()
            .expect("Failed to test RW mount");

        assert!(
            rw_output.status.success(),
            "Should be able to write to read-write volume"
        );

        // Test read-only mount
        let ro_output = Command::new("docker")
            .args([
                "run",
                "--rm",
                "-v",
                &format!("{}:/data:ro", volume_name),
                "alpine:latest",
                "sh",
                "-c",
                "cat /data/testfile",
            ])
            .output()
            .expect("Failed to test RO mount");

        assert!(
            ro_output.status.success(),
            "Should be able to read from read-only volume"
        );

        let read_data = String::from_utf8_lossy(&ro_output.stdout);
        assert!(
            read_data.trim() == "test",
            "Should read correct data from RO mount"
        );

        // Test that write fails on read-only mount
        let ro_write_output = Command::new("docker")
            .args([
                "run",
                "--rm",
                "-v",
                &format!("{}:/data:ro", volume_name),
                "alpine:latest",
                "sh",
                "-c",
                "echo 'fail' > /data/testfile2 2>&1",
            ])
            .output()
            .expect("Failed to test RO write");

        // Should fail (non-zero exit code) or output error message
        let stderr = String::from_utf8_lossy(&ro_write_output.stderr);
        let stdout = String::from_utf8_lossy(&ro_write_output.stdout);
        assert!(
            !ro_write_output.status.success()
                || stderr.contains("Read-only")
                || stdout.contains("Read-only"),
            "Write should fail on read-only volume"
        );

        // Clean up
        let _ = Command::new("docker")
            .args(["volume", "rm", volume_name])
            .output();
    }

    #[test]
    #[ignore] // Run with: cargo test --test volume_persistence_test -- --ignored
    fn test_full_backup_restore_cycle() {
        if !is_docker_available() {
            println!("Skipping test: Docker not available");
            return;
        }

        // This test would require the full blockchain environment to be running
        // and is therefore marked as ignored by default
        //
        // To run: cargo test --test volume_persistence_test -- --ignored
        //
        // Test steps:
        // 1. Start blockchain network
        // 2. Create test data (accounts, collections)
        // 3. Run backup script
        // 4. Stop network and clear volumes
        // 5. Run restore script
        // 6. Verify data integrity

        println!("Full backup/restore test requires running blockchain - skipped");
    }
}
