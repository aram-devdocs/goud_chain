use axum::{
    extract::{Extension, Query},
    http::HeaderMap,
    response::IntoResponse,
    Json,
};
use std::sync::Arc;
use utoipa_axum::{router::OpenApiRouter, routes};

use crate::api::auth::{decrypt_api_key_from_jwt, extract_auth_from_headers, AuthMethod};
use crate::api::schemas::SubmitDataState;
use crate::api::schemas::{AuditLogQuery, ErrorResponse};
use crate::config::Config;
use crate::types::*;

use super::AUDIT_TAG;

/// Audit log routes
pub fn router() -> OpenApiRouter {
    OpenApiRouter::new().routes(routes!(handle_get_audit_logs))
}

/// Get audit logs
///
/// Returns operational security audit logs for the authenticated user.
/// Logs include account creation, login, data submission, data listing, and decryption events.
/// All logs are encrypted per-user and stored on the blockchain for tamper-proof auditing.
#[utoipa::path(
    get,
    path = "/",
    tag = AUDIT_TAG,
    params(AuditLogQuery),
    security(
        ("bearer_token" = []),
        ("api_key" = [])
    ),
    responses(
        (status = 200, description = "Audit logs retrieved successfully", body = AuditLogResponse),
        (status = 401, description = "Missing or invalid authentication", body = ErrorResponse),
        (status = 429, description = "Rate limit exceeded", body = ErrorResponse),
        (status = 500, description = "Internal server error", body = ErrorResponse)
    )
)]
async fn handle_get_audit_logs(
    headers: HeaderMap,
    Query(params): Query<AuditLogQuery>,
    Extension(state): Extension<SubmitDataState>,
    Extension(config): Extension<Arc<Config>>,
) -> Result<impl IntoResponse> {
    let audit_logger = &state.audit_logger;

    // Extract authentication
    let auth = extract_auth_from_headers(&headers, &config)?;

    // Support both API keys and session tokens
    let api_key = match auth {
        AuthMethod::ApiKey(key) => key,
        AuthMethod::SessionToken(claims) => {
            match decrypt_api_key_from_jwt(&claims.encrypted_api_key, &config) {
                Ok(key) => key,
                Err(e) => {
                    return Err(GoudChainError::Unauthorized(format!(
                        "Failed to decrypt API key from session token: {}",
                        e
                    )));
                }
            }
        }
    };

    // Parse query parameters
    let start_ts = params.start_ts;
    let end_ts = params.end_ts;
    let event_type_str = params.event_type.as_deref();
    let page = params.page.unwrap_or(0);
    let page_size = params.page_size.unwrap_or(50).min(100);

    // Parse event type filter
    let event_type = event_type_str.and_then(|s| match s {
        "AccountCreated" => Some(AuditEventType::AccountCreated),
        "DataSubmitted" => Some(AuditEventType::DataSubmitted),
        "DataDecrypted" => Some(AuditEventType::DataDecrypted),
        "DataListed" => Some(AuditEventType::DataListed),
        "AccountLogin" => Some(AuditEventType::AccountLogin),
        _ => None,
    });

    let filter = AuditLogFilter {
        event_type,
        start_ts,
        end_ts,
        include_invalidated: false,
    };

    // Query audit logs
    match audit_logger
        .query_logs(&api_key, filter, page, page_size)
        .await
    {
        Ok(response) => Ok(Json(response).into_response()),
        Err(e) => Err(e),
    }
}
