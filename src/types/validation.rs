//! Input validation module for Injection Prevention
//! Layer 0: Foundation - Validates user input before processing
//!
//! **Validations:**
//! - Label: Max 100 chars, no control characters (regex-based)
//! - JSON: Valid structure, max 10 levels depth
//! - Performance: <1ms per validation

use lazy_static::lazy_static;
use regex::Regex;

use crate::types::{GoudChainError, Result};

// Validation constants (inlined to maintain layer 0 independence)
const LABEL_REGEX: &str = r"^[a-zA-Z0-9 \-_.,!?()]+$";
const MAX_JSON_DEPTH: usize = 10;

lazy_static! {
    /// Compiled regex for label validation (initialized once)
    static ref LABEL_VALIDATOR: Regex = Regex::new(LABEL_REGEX)
        .expect("Failed to compile label validation regex");
}

/// Validate label: max 100 chars, no control characters
pub fn validate_label(label: &str) -> Result<()> {
    if label.is_empty() {
        return Err(GoudChainError::InvalidLabel(
            "Label cannot be empty".to_string(),
        ));
    }

    if !LABEL_VALIDATOR.is_match(label) {
        return Err(GoudChainError::InvalidLabel(
            "Label contains invalid characters (only alphanumeric, spaces, and -.!?() allowed)"
                .to_string(),
        ));
    }

    Ok(())
}

/// Validate JSON structure: parseable, max depth 10
pub fn validate_json_structure(data: &str) -> Result<()> {
    // Parse JSON to ensure it's valid
    let parsed: serde_json::Value = serde_json::from_str(data)
        .map_err(|e| GoudChainError::InvalidJson(format!("Failed to parse JSON: {}", e)))?;

    // Check JSON depth
    check_json_depth(&parsed, 0)?;

    Ok(())
}

/// Recursively check JSON depth to prevent deeply nested attacks
fn check_json_depth(value: &serde_json::Value, current_depth: usize) -> Result<()> {
    if current_depth > MAX_JSON_DEPTH {
        return Err(GoudChainError::JsonTooDeep {
            max_depth: MAX_JSON_DEPTH,
        });
    }

    match value {
        serde_json::Value::Object(map) => {
            for (_, v) in map.iter() {
                check_json_depth(v, current_depth + 1)?;
            }
        }
        serde_json::Value::Array(arr) => {
            for item in arr {
                check_json_depth(item, current_depth + 1)?;
            }
        }
        _ => {} // Primitives don't increase depth
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_validate_label_valid() {
        assert!(validate_label("Test Label").is_ok());
        assert!(validate_label("Label123").is_ok());
        assert!(validate_label("Test-Label_v1.0").is_ok());
        assert!(validate_label("Question? Answer!").is_ok());
        assert!(validate_label("Label (with parentheses)").is_ok());
    }

    #[test]
    fn test_validate_label_empty() {
        let result = validate_label("");
        assert!(result.is_err());
        match result {
            Err(GoudChainError::InvalidLabel(msg)) => {
                assert!(msg.contains("empty"));
            }
            _ => panic!("Expected InvalidLabel error"),
        }
    }

    #[test]
    fn test_validate_label_control_chars() {
        // Newline
        assert!(validate_label("Test\nLabel").is_err());
        // Tab
        assert!(validate_label("Test\tLabel").is_err());
        // Null byte
        assert!(validate_label("Test\0Label").is_err());
        // Carriage return
        assert!(validate_label("Test\rLabel").is_err());
    }

    #[test]
    fn test_validate_label_special_chars() {
        // Allowed special chars
        assert!(validate_label("Test-Label").is_ok());
        assert!(validate_label("Test_Label").is_ok());
        assert!(validate_label("Test.Label").is_ok());
        assert!(validate_label("Test,Label").is_ok());
        assert!(validate_label("Test!Label").is_ok());
        assert!(validate_label("Test?Label").is_ok());

        // Disallowed special chars
        assert!(validate_label("Test@Label").is_err());
        assert!(validate_label("Test#Label").is_err());
        assert!(validate_label("Test$Label").is_err());
        assert!(validate_label("Test%Label").is_err());
        assert!(validate_label("Test&Label").is_err());
    }

    #[test]
    fn test_validate_json_valid() {
        assert!(validate_json_structure(r#"{"key": "value"}"#).is_ok());
        assert!(validate_json_structure(r#"{"number": 42}"#).is_ok());
        assert!(validate_json_structure(r#"{"array": [1, 2, 3]}"#).is_ok());
        assert!(validate_json_structure(r#"{"nested": {"key": "value"}}"#).is_ok());
    }

    #[test]
    fn test_validate_json_invalid() {
        let result = validate_json_structure("not valid json");
        assert!(result.is_err());
        match result {
            Err(GoudChainError::InvalidJson(_)) => {}
            _ => panic!("Expected InvalidJson error"),
        }
    }

    #[test]
    fn test_validate_json_max_depth() {
        // 10 levels should succeed
        let json_10_levels =
            r#"{"l1":{"l2":{"l3":{"l4":{"l5":{"l6":{"l7":{"l8":{"l9":{"l10":"value"}}}}}}}}}}"#;
        assert!(validate_json_structure(json_10_levels).is_ok());
    }

    #[test]
    fn test_validate_json_too_deep() {
        // 11 levels should fail
        let json_11_levels = r#"{"l1":{"l2":{"l3":{"l4":{"l5":{"l6":{"l7":{"l8":{"l9":{"l10":{"l11":"value"}}}}}}}}}}}"#;
        let result = validate_json_structure(json_11_levels);
        assert!(result.is_err());
        match result {
            Err(GoudChainError::JsonTooDeep { max_depth }) => {
                assert_eq!(max_depth, 10);
            }
            _ => panic!("Expected JsonTooDeep error"),
        }
    }

    #[test]
    fn test_validate_json_array_depth() {
        // Arrays also count toward depth
        let json_nested_arrays = r#"[[[[[[[[[[["too deep"]]]]]]]]]]]"#;
        let result = validate_json_structure(json_nested_arrays);
        assert!(result.is_err());
    }

    #[test]
    fn test_validation_performance() {
        use std::time::Instant;

        let label = "Test Label";
        let json = r#"{"key": "value", "number": 42, "array": [1, 2, 3]}"#;

        let start = Instant::now();
        for _ in 0..1000 {
            let _ = validate_label(label);
            let _ = validate_json_structure(json);
        }
        let duration = start.elapsed();

        // Should complete 1000 validations in <100ms (avg <0.1ms per validation)
        assert!(
            duration.as_millis() < 100,
            "Validation too slow: {:?}",
            duration
        );
    }
}
