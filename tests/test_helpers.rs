// Shared test utilities
use goud_chain::config::ValidatorConfig;
use std::collections::HashMap;

pub fn test_validator_config() -> ValidatorConfig {
    let mut node_to_validator = HashMap::new();
    node_to_validator.insert("node1".to_string(), "Validator_1".to_string());
    node_to_validator.insert("node2".to_string(), "Validator_2".to_string());

    let mut validator_to_address = HashMap::new();
    validator_to_address.insert("Validator_1".to_string(), "node1:8080".to_string());
    validator_to_address.insert("Validator_2".to_string(), "node2:8080".to_string());

    ValidatorConfig {
        validators: vec!["Validator_1".to_string(), "Validator_2".to_string()],
        node_to_validator,
        validator_to_address,
    }
}
