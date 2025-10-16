// Route module exports
pub mod account;
pub mod audit;
pub mod data;
pub mod health;
pub mod metrics;

// OpenAPI tag constants (shared across all route modules)
pub const ACCOUNT_TAG: &str = "Account Management";
pub const DATA_TAG: &str = "Data Operations";
pub const HEALTH_TAG: &str = "Health & Status";
pub const METRICS_TAG: &str = "Metrics & Analytics";
pub const AUDIT_TAG: &str = "Audit Logs";
