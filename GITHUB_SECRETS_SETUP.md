# GitHub Secrets Setup for E2E Tests

## Overview

To run E2E tests in GitHub Actions CI/CD, you need to configure GitHub Secrets with your Clerk credentials and test user information.

## Required Secrets

You need to add **4 secrets** to your GitHub repository:

| Secret Name | Description | Example Value |
|-------------|-------------|---------------|
| `E2E_CLERK_USER_USERNAME` | Test user email | `test@pajamadot.com` |
| `E2E_CLERK_USER_PASSWORD` | Test user password | `playwright@pajamadot` |
| `CLERK_PUBLISHABLE_KEY` | Clerk publishable key | `pk_test_...` |
| `CLERK_SECRET_KEY` | Clerk secret key | `sk_test_...` |

## Setup Instructions

### Step 1: Get Clerk API Keys

1. Go to [Clerk Dashboard](https://dashboard.clerk.com/)
2. Select your application
3. Navigate to **Developers → API Keys**
4. Copy both keys:
   - **Publishable Key** (starts with `pk_test_` or `pk_live_`)
   - **Secret Key** (starts with `sk_test_` or `sk_live_`)

⚠️ **Important:** Use **test keys** (`pk_test_` / `sk_test_`) for CI/CD, not production keys!

### Step 2: Verify Test User

1. Go to Clerk Dashboard → **Users**
2. Verify test user exists:
   - Email: `test@pajamadot.com`
   - Status: Active
   - Email verified: Yes (or disable email verification for test environment)

### Step 3: Add Secrets to GitHub

#### Option A: Via GitHub Web UI

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each secret:

**Secret 1: Test User Email**
```
Name:  E2E_CLERK_USER_USERNAME
Value: test@pajamadot.com
```

**Secret 2: Test User Password**
```
Name:  E2E_CLERK_USER_PASSWORD
Value: playwright@pajamadot
```

**Secret 3: Clerk Publishable Key**
```
Name:  CLERK_PUBLISHABLE_KEY
Value: pk_test_xxxxxxxxxxxxxxxxxxxxxxxxx
```

**Secret 4: Clerk Secret Key**
```
Name:  CLERK_SECRET_KEY
Value: sk_test_xxxxxxxxxxxxxxxxxxxxxxxxx
```

#### Option B: Via GitHub CLI

```bash
# Install GitHub CLI if not already installed
# https://cli.github.com/

# Login to GitHub
gh auth login

# Set secrets (replace values with your actual credentials)
gh secret set E2E_CLERK_USER_USERNAME --body "test@pajamadot.com"
gh secret set E2E_CLERK_USER_PASSWORD --body "playwright@pajamadot"
gh secret set CLERK_PUBLISHABLE_KEY --body "pk_test_your_key_here"
gh secret set CLERK_SECRET_KEY --body "sk_test_your_key_here"

# Verify secrets were added
gh secret list
```

### Step 4: Verify Setup

1. Go to **Actions** tab in your GitHub repository
2. Find the **E2E Tests** workflow
3. Click **Run workflow** → **Run workflow**
4. Watch the workflow execute
5. Verify it passes (especially the "global setup" step)

## Security Best Practices

### ✅ DO

- ✅ Use dedicated test user credentials (not personal accounts)
- ✅ Use Clerk **test keys** (`pk_test_`/`sk_test_`) for CI/CD
- ✅ Rotate test credentials periodically
- ✅ Limit test user permissions in Clerk
- ✅ Use separate Clerk project/environment for testing

### ❌ DON'T

- ❌ Don't use production Clerk keys in CI/CD
- ❌ Don't commit credentials to `.env.test` in git
- ❌ Don't use personal account as test user
- ❌ Don't share test credentials publicly
- ❌ Don't use same credentials across multiple projects

## Environment-Specific Secrets

For multiple environments (staging, production):

### Staging Environment

```bash
gh secret set E2E_CLERK_USER_USERNAME_STAGING --body "test-staging@example.com"
gh secret set E2E_CLERK_USER_PASSWORD_STAGING --body "staging_password"
gh secret set CLERK_PUBLISHABLE_KEY_STAGING --body "pk_test_staging_key"
gh secret set CLERK_SECRET_KEY_STAGING --body "sk_test_staging_key"
```

### Production Environment

```bash
gh secret set E2E_CLERK_USER_USERNAME_PROD --body "test-prod@example.com"
gh secret set E2E_CLERK_USER_PASSWORD_PROD --body "prod_password"
gh secret set CLERK_PUBLISHABLE_KEY_PROD --body "pk_live_prod_key"
gh secret set CLERK_SECRET_KEY_PROD --body "sk_live_prod_key"
```

Then in `.github/workflows/e2e-tests.yml`:

```yaml
env:
  E2E_CLERK_USER_USERNAME: ${{ secrets.E2E_CLERK_USER_USERNAME_STAGING }}
  E2E_CLERK_USER_PASSWORD: ${{ secrets.E2E_CLERK_USER_PASSWORD_STAGING }}
  CLERK_PUBLISHABLE_KEY: ${{ secrets.CLERK_PUBLISHABLE_KEY_STAGING }}
  CLERK_SECRET_KEY: ${{ secrets.CLERK_SECRET_KEY_STAGING }}
```

## Troubleshooting

### Error: "Secret not found"

**Cause:** Secret name mismatch between workflow and GitHub settings

**Fix:**
1. Check exact secret names in `.github/workflows/e2e-tests.yml`
2. Verify secrets exist in **Settings → Secrets → Actions**
3. Secret names are **case-sensitive**

### Error: "Invalid credentials"

**Cause:** Incorrect Clerk keys or test user password

**Fix:**
1. Verify keys are from correct Clerk project
2. Re-copy keys from Clerk Dashboard
3. Update secrets in GitHub
4. Ensure test user exists and is active

### Tests Pass Locally But Fail in CI

**Possible causes:**
1. Different Clerk keys (local vs CI)
2. Test user doesn't exist in CI environment
3. Network/timeout issues in CI

**Fix:**
```bash
# Test locally with same credentials as CI
cd apps/web
cat > .env.test << EOF
E2E_CLERK_USER_USERNAME=test@pajamadot.com
E2E_CLERK_USER_PASSWORD=playwright@pajamadot
CLERK_PUBLISHABLE_KEY=pk_test_from_ci
CLERK_SECRET_KEY=sk_test_from_ci
EOF

npm run test:e2e
```

### Rotating Credentials

When you need to change credentials:

1. **Update Clerk Dashboard**
   - Change test user password or create new user
   - Generate new API keys if needed

2. **Update GitHub Secrets**
   ```bash
   gh secret set E2E_CLERK_USER_PASSWORD --body "new_password"
   gh secret set CLERK_PUBLISHABLE_KEY --body "pk_test_new_key"
   gh secret set CLERK_SECRET_KEY --body "sk_test_new_key"
   ```

3. **Update Local `.env.test`**
   - Update your local file to match

4. **Test Both Environments**
   ```bash
   # Local
   npm run test:e2e

   # CI - trigger workflow manually
   gh workflow run e2e-tests.yml
   ```

## Verification Checklist

Before running E2E tests in CI:

- [ ] Test user exists in Clerk Dashboard
- [ ] Test user email is verified (or verification disabled)
- [ ] Clerk API keys are from test environment
- [ ] All 4 secrets added to GitHub repository
- [ ] Secret names match workflow file exactly
- [ ] Workflow file exists: `.github/workflows/e2e-tests.yml`
- [ ] Tests pass locally with same credentials
- [ ] CI workflow triggered and passes

## Additional Resources

- [GitHub Encrypted Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Clerk API Keys](https://clerk.com/docs/reference/backend-api/authentication)
- [GitHub CLI Secrets](https://cli.github.com/manual/gh_secret)

## Support

If you encounter issues:

1. Check workflow logs in GitHub Actions
2. Verify all secrets are set correctly
3. Test locally with same credentials
4. Review Clerk Dashboard for user/key status
5. Check this guide's troubleshooting section

## Quick Reference

```bash
# List all secrets
gh secret list

# Delete a secret
gh secret delete SECRET_NAME

# Update a secret
gh secret set SECRET_NAME --body "new_value"

# View workflow runs
gh run list --workflow=e2e-tests.yml

# View latest workflow logs
gh run view --log

# Re-run failed workflow
gh run rerun --failed
```
