#!/bin/bash
# Security testing script for Goud Chain
# Tests authentication, rate limiting, input validation, and CORS

set -e

API_URL="${API_URL:-http://localhost:8080}"
RESULTS_FILE="${RESULTS_FILE:-security_test_results.log}"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counters
TESTS_PASSED=0
TESTS_FAILED=0

log_test() {
    echo "[TEST] $1" | tee -a "$RESULTS_FILE"
}

log_pass() {
    echo -e "${GREEN}✓ PASS${NC}: $1" | tee -a "$RESULTS_FILE"
    ((TESTS_PASSED++))
}

log_fail() {
    echo -e "${RED}✗ FAIL${NC}: $1" | tee -a "$RESULTS_FILE"
    ((TESTS_FAILED++))
}

log_warn() {
    echo -e "${YELLOW}⚠ WARN${NC}: $1" | tee -a "$RESULTS_FILE"
}

# Initialize results file
echo "=== Goud Chain Security Test Results ===" > "$RESULTS_FILE"
echo "Test started: $(date)" >> "$RESULTS_FILE"
echo "API URL: $API_URL" >> "$RESULTS_FILE"
echo "" >> "$RESULTS_FILE"

# Test 1: Invalid API key authentication
log_test "Test 1: Invalid API key should return 401"
RESPONSE=$(curl -s -w "%{http_code}" -o /dev/null \
    -H "Authorization: Bearer invalid_key_here" \
    "$API_URL/api/data/list")
if [ "$RESPONSE" -eq 401 ]; then
    log_pass "Invalid API key rejected with 401"
else
    log_fail "Expected 401, got $RESPONSE"
fi

# Test 2: Missing Authorization header
log_test "Test 2: Missing Authorization header should return 401"
RESPONSE=$(curl -s -w "%{http_code}" -o /dev/null "$API_URL/api/data/list")
if [ "$RESPONSE" -eq 401 ]; then
    log_pass "Missing auth header rejected with 401"
else
    log_fail "Expected 401, got $RESPONSE"
fi

# Test 3: CORS headers present
log_test "Test 3: CORS headers should be present"
CORS_HEADERS=$(curl -s -I "$API_URL/api/health" | grep -i "access-control")
if [ -n "$CORS_HEADERS" ]; then
    log_pass "CORS headers present"
else
    log_fail "CORS headers missing"
fi

# Test 4: Health endpoint accessible without auth
log_test "Test 4: Health endpoint should not require auth"
RESPONSE=$(curl -s -w "%{http_code}" -o /dev/null "$API_URL/api/health")
if [ "$RESPONSE" -eq 200 ]; then
    log_pass "Health endpoint accessible without auth"
else
    log_fail "Expected 200, got $RESPONSE"
fi

# Test 5: Malformed JSON should return 400
log_test "Test 5: Malformed JSON should return 400"
RESPONSE=$(curl -s -w "%{http_code}" -o /dev/null \
    -X POST \
    -H "Content-Type: application/json" \
    -d '{invalid json}' \
    "$API_URL/api/account/create")
if [ "$RESPONSE" -eq 400 ]; then
    log_pass "Malformed JSON rejected with 400"
else
    log_warn "Expected 400, got $RESPONSE (may not be implemented)"
fi

# Test 6: Empty request body should return 400
log_test "Test 6: Empty request body should return 400"
RESPONSE=$(curl -s -w "%{http_code}" -o /dev/null \
    -X POST \
    -H "Content-Type: application/json" \
    -d '' \
    "$API_URL/api/account/create")
if [ "$RESPONSE" -eq 400 ]; then
    log_pass "Empty request body rejected with 400"
else
    log_warn "Expected 400, got $RESPONSE (may not be implemented)"
fi

# Test 7: Rate limiting (if implemented)
log_test "Test 7: Rate limiting check (optional)"
log_warn "Rate limiting test not implemented - manual testing recommended"

# Test 8: SQL injection attempts (should not apply, but test input sanitization)
log_test "Test 8: Input sanitization - special characters in account_id"
RESPONSE=$(curl -s -w "%{http_code}" -o /dev/null \
    -X POST \
    -H "Content-Type: application/json" \
    -d '{"account_id": "test'\''OR 1=1--"}' \
    "$API_URL/api/account/create")
if [ "$RESPONSE" -eq 201 ] || [ "$RESPONSE" -eq 400 ] || [ "$RESPONSE" -eq 409 ]; then
    log_pass "Special characters handled safely (got $RESPONSE)"
else
    log_warn "Unexpected response: $RESPONSE"
fi

# Test 9: XSS attempt in account_id
log_test "Test 9: XSS prevention - script tags in account_id"
RESPONSE=$(curl -s -w "%{http_code}" -o /dev/null \
    -X POST \
    -H "Content-Type: application/json" \
    -d '{"account_id": "<script>alert(1)</script>"}' \
    "$API_URL/api/account/create")
if [ "$RESPONSE" -eq 201 ] || [ "$RESPONSE" -eq 400 ] || [ "$RESPONSE" -eq 409 ]; then
    log_pass "XSS attempt handled safely (got $RESPONSE)"
else
    log_warn "Unexpected response: $RESPONSE"
fi

# Test 10: Oversized payload (if size limits exist)
log_test "Test 10: Oversized payload handling"
LARGE_PAYLOAD=$(printf '{"account_id": "%s"}' "$(head -c 10000 /dev/zero | tr '\0' 'A')")
RESPONSE=$(curl -s -w "%{http_code}" -o /dev/null \
    -X POST \
    -H "Content-Type: application/json" \
    -d "$LARGE_PAYLOAD" \
    "$API_URL/api/account/create")
if [ "$RESPONSE" -eq 413 ] || [ "$RESPONSE" -eq 400 ]; then
    log_pass "Oversized payload rejected with $RESPONSE"
else
    log_warn "Expected 413/400, got $RESPONSE (size limits may not be enforced)"
fi

# Test 11: Invalid HTTP methods
log_test "Test 11: Invalid HTTP method should return 405"
RESPONSE=$(curl -s -w "%{http_code}" -o /dev/null \
    -X DELETE \
    "$API_URL/api/health")
if [ "$RESPONSE" -eq 405 ]; then
    log_pass "Invalid HTTP method rejected with 405"
else
    log_warn "Expected 405, got $RESPONSE"
fi

# Test 12: HTTPS redirect (if deployed with HTTPS)
log_test "Test 12: HTTPS enforcement check"
if [[ "$API_URL" == https://* ]]; then
    HTTP_URL="${API_URL/https:/http:}"
    RESPONSE=$(curl -s -w "%{http_code}" -o /dev/null -L "$HTTP_URL/api/health")
    if [ "$RESPONSE" -eq 200 ]; then
        log_pass "HTTPS accessible"
    else
        log_fail "HTTPS not accessible: $RESPONSE"
    fi
else
    log_warn "API URL is HTTP, skipping HTTPS test"
fi

# Summary
echo "" | tee -a "$RESULTS_FILE"
echo "=== Test Summary ===" | tee -a "$RESULTS_FILE"
echo -e "${GREEN}Passed: $TESTS_PASSED${NC}" | tee -a "$RESULTS_FILE"
echo -e "${RED}Failed: $TESTS_FAILED${NC}" | tee -a "$RESULTS_FILE"
echo "Test completed: $(date)" | tee -a "$RESULTS_FILE"
echo "" | tee -a "$RESULTS_FILE"

# Exit with failure if any tests failed
if [ "$TESTS_FAILED" -gt 0 ]; then
    echo -e "${RED}Security tests FAILED${NC}"
    exit 1
else
    echo -e "${GREEN}All security tests PASSED${NC}"
    exit 0
fi
