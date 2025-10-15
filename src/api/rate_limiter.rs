//! Rate limiting middleware with graduated penalties.
//! Layer 5: Presentation - HTTP request rate limiting and DoS protection.
//!
//! **Graduated Penalty System:**
//! 1. **1st violation:** Warning header + 30-second cooldown
//! 2. **2nd violation:** 5-minute write block (reads allowed)
//! 3. **3rd violation:** 1-hour write block (reads allowed)
//! 4. **4th violation:** Permanent write ban (reads allowed)
//! 5. **5th violation:** Complete blacklist + 24-hour IP ban
//!
//! **Performance:** <500µs overhead per request (in-memory LRU cache)

use chrono::Utc;
use std::collections::HashSet;
use std::sync::Arc;
use tracing::{debug, info, warn};

use crate::crypto::hash_api_key;
use crate::storage::{BanLevel, RateLimitStore};
use crate::types::Result;

/// Rate limit check result
#[derive(Debug, Clone)]
pub enum RateLimitResult {
    /// Request allowed to proceed
    Allowed {
        limit: u32,
        remaining: u32,
        reset_at: i64,
    },
    /// Warning issued (1st violation) - request proceeds with cooldown
    Warning {
        cooldown_secs: u64,
        violation_count: u32,
        limit: u32,
        remaining: u32,
    },
    /// Request blocked due to rate limit or ban
    Blocked {
        ban_level: BanLevel,
        retry_after: u64,
        violation_count: u32,
    },
}

/// Rate limiter with graduated penalty enforcement
pub struct RateLimiter {
    store: Arc<RateLimitStore>,
    bypass_keys: HashSet<String>, // Whitelisted API key hashes
}

impl RateLimiter {
    /// Create a new rate limiter with optional bypass whitelist
    pub fn new(store: Arc<RateLimitStore>, bypass_keys: Vec<String>) -> Self {
        let bypass_set: HashSet<String> = bypass_keys.into_iter().collect();

        info!(
            bypass_count = bypass_set.len(),
            "RateLimiter initialized with bypass whitelist"
        );

        Self {
            store,
            bypass_keys: bypass_set,
        }
    }

    /// Check if request should be allowed, warned, or blocked
    /// Returns rate limit result with headers and ban information
    pub fn check_limit(
        &self,
        api_key_hash: &str,
        client_ip: &str,
        is_write: bool,
    ) -> Result<RateLimitResult> {
        // 1. Check bypass whitelist
        if self.bypass_keys.contains(api_key_hash) {
            debug!(
                api_key_hash = %api_key_hash,
                "Request bypassed - whitelisted API key"
            );
            return Ok(RateLimitResult::Allowed {
                limit: 9999,
                remaining: 9999,
                reset_at: Utc::now().timestamp() + 60,
            });
        }

        // 2. Check IP ban (applies to all requests from this IP)
        let ip_hash = hash_ip(client_ip);
        if self.store.is_ip_banned(&ip_hash)? {
            warn!(
                ip = %client_ip,
                "Request blocked - IP banned"
            );
            return Ok(RateLimitResult::Blocked {
                ban_level: BanLevel::CompleteBlacklist,
                retry_after: 86400, // 24 hours
                violation_count: 5,
            });
        }

        // 3. Check API key ban status
        if let Some(ban_record) = self.store.get_ban_status(api_key_hash)? {
            let ban_level = ban_record.level;

            // Check if ban blocks this operation type
            let is_blocked = if is_write {
                ban_level.blocks_writes()
            } else {
                ban_level.blocks_reads()
            };

            if is_blocked {
                let retry_after = match ban_record.expires_at {
                    Some(expiry) => (expiry - Utc::now().timestamp()).max(0) as u64,
                    None => 86400 * 365, // 1 year for permanent bans
                };

                let violations = self.store.get_violations(api_key_hash)?;

                warn!(
                    api_key_hash = %api_key_hash,
                    ban_level = ?ban_level,
                    is_write = is_write,
                    "Request blocked - API key banned"
                );

                return Ok(RateLimitResult::Blocked {
                    ban_level,
                    retry_after,
                    violation_count: violations.count,
                });
            }
        }

        // 4. Check rate limit
        let limit = if is_write {
            crate::constants::RATE_LIMIT_WRITE_PER_SECOND
        } else {
            crate::constants::RATE_LIMIT_READ_PER_SECOND
        };

        let current_count = self.store.increment_request_count(api_key_hash, is_write)?;
        let remaining = limit.saturating_sub(current_count);

        let now = Utc::now().timestamp();
        let window_seconds = crate::constants::RATE_LIMIT_WINDOW_SECONDS as i64;
        let reset_at = now + window_seconds;

        if current_count > limit {
            // Rate limit exceeded - record violation and escalate penalty
            let violations = self.store.record_violation(api_key_hash)?;

            warn!(
                api_key_hash = %api_key_hash,
                current_count = current_count,
                limit = limit,
                violation_count = violations.count,
                "Rate limit exceeded"
            );

            // Determine penalty based on violation count
            let (ban_level, should_ban_ip) = match violations.count {
                1 => {
                    // 1st violation: Warning only
                    info!(
                        api_key_hash = %api_key_hash,
                        "1st violation - issuing warning"
                    );
                    return Ok(RateLimitResult::Warning {
                        cooldown_secs: crate::constants::VIOLATION_COOLDOWN_SECONDS,
                        violation_count: 1,
                        limit,
                        remaining: 0,
                    });
                }
                2 => (BanLevel::WriteBlock5Min, false),
                3 => (BanLevel::WriteBlock1Hr, false),
                4 => (BanLevel::PermanentWriteBan, false),
                _ => (BanLevel::CompleteBlacklist, true), // 5+ violations
            };

            // Apply ban
            self.store.apply_ban(api_key_hash, ban_level.clone())?;

            // Ban IP if complete blacklist
            if should_ban_ip {
                self.store.ban_ip(&ip_hash)?;
                warn!(
                    api_key_hash = %api_key_hash,
                    ip = %client_ip,
                    "Complete blacklist - IP banned for 24 hours"
                );
            }

            let retry_after = ban_level.duration_seconds().unwrap_or(86400 * 365);

            return Ok(RateLimitResult::Blocked {
                ban_level,
                retry_after,
                violation_count: violations.count,
            });
        }

        // Request allowed
        Ok(RateLimitResult::Allowed {
            limit,
            remaining,
            reset_at,
        })
    }

    /// Create HTTP headers for rate limit response
    pub fn create_headers(&self, result: &RateLimitResult) -> Vec<(String, String)> {
        match result {
            RateLimitResult::Allowed {
                limit,
                remaining,
                reset_at,
            } => vec![
                ("X-RateLimit-Limit".to_string(), limit.to_string()),
                ("X-RateLimit-Remaining".to_string(), remaining.to_string()),
                ("X-RateLimit-Reset".to_string(), reset_at.to_string()),
            ],
            RateLimitResult::Warning {
                limit,
                remaining,
                cooldown_secs,
                violation_count,
            } => vec![
                ("X-RateLimit-Limit".to_string(), limit.to_string()),
                ("X-RateLimit-Remaining".to_string(), remaining.to_string()),
                (
                    "X-RateLimit-Reset".to_string(),
                    (Utc::now().timestamp() + *cooldown_secs as i64).to_string(),
                ),
                (
                    "X-RateLimit-Violation".to_string(),
                    violation_count.to_string(),
                ),
                (
                    "X-RateLimit-Warning".to_string(),
                    format!("Rate limit exceeded. {}s cooldown applied (violation #{}). Repeated violations will result in temporary bans.", cooldown_secs, violation_count),
                ),
            ],
            RateLimitResult::Blocked {
                ban_level,
                retry_after,
                violation_count,
            } => vec![
                ("Retry-After".to_string(), retry_after.to_string()),
                (
                    "X-RateLimit-Violation".to_string(),
                    violation_count.to_string(),
                ),
                (
                    "X-RateLimit-Ban-Level".to_string(),
                    format!("{:?}", ban_level),
                ),
            ],
        }
    }
}

/// Hash IP address for storage (privacy-preserving)
fn hash_ip(ip: &str) -> String {
    let hash_bytes = hash_api_key(ip.as_bytes());
    hex::encode(hash_bytes)
}

#[cfg(test)]
mod tests {
    use super::*;
    use rocksdb::DB;

    fn create_test_limiter() -> RateLimiter {
        let temp_dir = std::env::temp_dir().join(format!("test_limiter_{}", rand::random::<u64>()));
        let db = DB::open_default(&temp_dir).expect("Failed to open test DB");
        let store = Arc::new(RateLimitStore::new(Arc::new(db)));
        RateLimiter::new(store, vec![])
    }

    #[test]
    fn test_bypass_whitelist() {
        let temp_dir = std::env::temp_dir().join(format!("test_bypass_{}", rand::random::<u64>()));
        let db = DB::open_default(&temp_dir).expect("Failed to open test DB");
        let store = Arc::new(RateLimitStore::new(Arc::new(db)));

        let whitelisted_key = "whitelisted_key_123";
        let limiter = RateLimiter::new(store, vec![whitelisted_key.to_string()]);

        // Whitelisted key should always be allowed
        let result = limiter
            .check_limit(whitelisted_key, "127.0.0.1", true)
            .unwrap();
        assert!(matches!(result, RateLimitResult::Allowed { .. }));
    }

    #[test]
    fn test_header_generation() {
        let limiter = create_test_limiter();

        let allowed = RateLimitResult::Allowed {
            limit: 10,
            remaining: 5,
            reset_at: 1697123456,
        };
        let headers = limiter.create_headers(&allowed);
        assert_eq!(headers.len(), 3);
        assert!(headers
            .iter()
            .any(|(k, v)| k == "X-RateLimit-Limit" && v == "10"));

        let warning = RateLimitResult::Warning {
            limit: 10,
            remaining: 0,
            cooldown_secs: 30,
            violation_count: 1,
        };
        let headers = limiter.create_headers(&warning);
        assert!(headers.iter().any(|(k, _)| k == "X-RateLimit-Warning"));
    }
}
