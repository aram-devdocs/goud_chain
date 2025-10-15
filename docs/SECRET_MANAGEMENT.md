# Secret Management

Goud Chain uses **JWT and Session secrets** for stateless authentication. Secrets are stored in **GitHub Secrets** and injected at Docker build time.

## Quick Start

```bash
# 1. Generate and store secrets
./scripts/setup-secrets.sh

# 2. Build Docker images (triggers on push to main)
git push origin main

# 3. Deploy
./scripts/deploy.sh
```

## Architecture

### Simple Flow

```
Developer → scripts/setup-secrets.sh
    ↓
GitHub Secrets (JWT_SECRET, SESSION_SECRET)
    ↓
GitHub Actions (build-images.yml)
    ↓
Docker Build (secrets as build args)
    ↓
Docker Image (secrets baked in)
    ↓
Production VM (secrets loaded from image)
```

### Secret Types

| Secret | Purpose | Length |
|--------|---------|--------|
| **JWT_SECRET** | Signs JWT session tokens | 64 bytes (512 bits) |
| **SESSION_SECRET** | Encrypts API keys in JWT payload | 64 bytes (512 bits) |

## Setup

### Prerequisites

```bash
# Install GitHub CLI
brew install gh  # macOS
# or: curl -sS https://webi.sh/gh | sh  # Linux

# Authenticate
gh auth login
```

### Generate Secrets

```bash
./scripts/setup-secrets.sh
```

**Output:**
```
=== Goud Chain Secret Setup ===

✓ Secrets generated (64 bytes each)
✓ GitHub secrets updated

Secrets stored in GitHub Secrets:
  • JWT_SECRET
  • SESSION_SECRET
```

### Verify

```bash
gh secret list
```

Expected output:
```
JWT_SECRET          Updated 2025-10-15
SESSION_SECRET      Updated 2025-10-15
```

## Rotation

### When to Rotate

**Recommended:** Every 90 days

**Immediate rotation if:**
- Secret compromised
- Team member with access leaves
- Security audit recommendation

### Impact

⚠️ **All user sessions invalidated** - Users must re-login with API key

✅ **User data safe** - Data encrypted with user's API key, not JWT/Session secrets

### Rotate Secrets

```bash
./scripts/rotate-secrets.sh
```

**Output:**
```
=== Goud Chain Secret Rotation ===

⚠️  WARNING: Secret Rotation

This will:
  • Generate new JWT and Session secrets
  • Update GitHub Secrets
  • Require Docker image rebuild
  • Invalidate ALL existing user sessions

Do you want to continue? (y/n): y

✓ New secrets generated
✓ GitHub secrets updated

Next steps:
  1. Rebuild Docker images (push to main)
  2. Redeploy application
  3. Notify users to re-authenticate
```

### After Rotation

1. **Rebuild Docker images:**
   ```bash
   git commit --allow-empty -m "Rotate secrets"
   git push origin main
   ```

2. **Redeploy:**
   ```bash
   ./scripts/deploy.sh
   ```

3. **Notify users:**
   > All user sessions have been invalidated for security. Please log in again: POST `/account/login` with your API key.

## Troubleshooting

### "gh CLI not found"

```bash
# macOS
brew install gh

# Linux
curl -sS https://webi.sh/gh | sh

# Verify
gh --version
```

### "Not authenticated"

```bash
gh auth login
```

Follow prompts to authenticate with GitHub.

### "Secrets not taking effect"

**Problem:** Old secrets still in use after rotation

**Solution:**
1. Verify GitHub Secrets updated: `gh secret list`
2. Rebuild Docker images (push to main)
3. Redeploy application
4. Check containers have new image: `docker ps`

### "Users still getting 401"

**Diagnosis:** Containers may be using cached images

**Solution:**
```bash
# On VM
docker-compose -f docker-compose.gcp.yml pull
docker-compose -f docker-compose.gcp.yml up -d --force-recreate
```

## Best Practices

### DO:
✅ Rotate secrets every 90 days
✅ Use `gh secret set` (never commit secrets to git)
✅ Test rotation in dev before production
✅ Notify users before planned rotation
✅ Verify secrets after rotation: `gh secret list`

### DON'T:
❌ Commit secrets to version control
❌ Share secrets via email/Slack
❌ Reuse secrets across environments (dev/prod)
❌ Skip Docker image rebuild after rotation
❌ Forget to notify users after rotation

## Manual Secret Setup (Alternative)

If you prefer manual setup:

```bash
# Generate secrets
JWT_SECRET=$(openssl rand -hex 64)
SESSION_SECRET=$(openssl rand -hex 64)

# Store in GitHub Secrets
echo "$JWT_SECRET" | gh secret set JWT_SECRET
echo "$SESSION_SECRET" | gh secret set SESSION_SECRET

# Verify
gh secret list
```

## References

- [GitHub CLI Documentation](https://cli.github.com/)
- [GitHub Actions Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [OWASP Key Management](https://cheatsheetseries.owasp.org/cheatsheets/Key_Management_Cheat_Sheet.html)

## Support

Issues? Check:
1. [Troubleshooting](#troubleshooting) section above
2. [GitHub Issues](https://github.com/aram-devdocs/goud_chain/issues)
