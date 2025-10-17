# Security Considerations

## Client-Side Storage (localStorage)

**Current Implementation**: Session tokens and API keys are stored in `localStorage`.

**Security Risk**: HIGH - vulnerable to XSS attacks. If malicious JavaScript is injected into the page, attackers can:

- Exfiltrate session tokens (temporary access)
- Exfiltrate API keys (permanent account access)
- Perform actions on behalf of authenticated users

**Mitigation Strategies** (for production deployment):

### 1. Use HttpOnly Cookies (Recommended)

```nginx
# Backend should set cookies with:
Set-Cookie: session_token=xxx; HttpOnly; Secure; SameSite=Strict; Max-Age=3600
```

Benefits:

- JavaScript cannot access cookies (immune to XSS)
- Automatic CSRF protection with SameSite=Strict
- Browser automatically sends with requests

### 2. Content Security Policy (Implemented)

`web/nginx.conf` includes CSP headers to mitigate XSS:

```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; ...
```

**Note**: `unsafe-inline` and `unsafe-eval` are required for React/Vite. Further hardening requires:

- Using nonce-based CSP
- Removing inline scripts
- Using strict-dynamic

### 3. Input Sanitization

All user inputs are validated before processing:

- Username: 3-32 alphanumeric characters, hyphens, underscores
- API Key: 64-character hexadecimal string
- Collection IDs: 1-255 characters

### 4. Client-Side Encryption

**Encryption**: AES-256-GCM with PBKDF2 key derivation

- Random salt per encryption (32 bytes)
- Random IV per encryption (12 bytes)
- 100,000 PBKDF2 iterations

**Format**: `base64(salt || iv || ciphertext)`

- Salt: 32 bytes (prevents rainbow table attacks)
- IV: 12 bytes (unique per encryption)
- Ciphertext: variable length

## Production Deployment Checklist

- [ ] Replace localStorage with HttpOnly cookies
- [ ] Implement CSRF token validation
- [ ] Harden CSP (remove unsafe-inline, use nonce-based)
- [ ] Add rate limiting at nginx level
- [ ] Enable HTTPS with TLS 1.3
- [ ] Implement session token rotation
- [ ] Add audit logging for authentication events
- [ ] Regular security audits of dependencies

## Current Security Posture

| Feature                | Status          | Notes                             |
| ---------------------- | --------------- | --------------------------------- |
| Client-side encryption | ✅ Secure       | Random salt + IV, AES-256-GCM     |
| Input validation       | ✅ Implemented  | All inputs validated              |
| CSP headers            | ✅ Implemented  | Basic protection                  |
| XSS protection         | ⚠️ Partial      | CSP present but localStorage risk |
| HTTPS                  | ❌ Not enforced | Production must use TLS           |
| Session management     | ⚠️ Basic        | 1-hour expiry, no rotation        |
| API key storage        | ⚠️ localStorage | Should move to backend-only       |

## Known Vulnerabilities

1. **localStorage XSS Risk**: Session tokens accessible to JavaScript
2. **No CSRF Protection**: Cookies not implemented yet
3. **CSP Unsafe Directives**: Allows inline scripts (required for Vite)

## Recommended Reading

- [OWASP XSS Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- [OWASP Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
- [Content Security Policy Reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
