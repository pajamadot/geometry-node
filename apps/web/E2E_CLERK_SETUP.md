# Clerk Authentication Setup for E2E Tests

## Overview

The E2E tests use Clerk's testing utilities to authenticate once during global setup, then reuse the session state across all tests. This eliminates repetitive login steps and speeds up test execution.

## Prerequisites

1. **Clerk Account**: You need a Clerk application set up
2. **Test User**: A test user created in your Clerk dashboard
3. **API Keys**: Your Clerk publishable and secret keys

## Setup Steps

### 1. Install Dependencies

```bash
cd apps/web
npm install @clerk/testing dotenv --save-dev
```

### 2. Configure Environment Variables

Create or update `.env.test` in `apps/web/`:

```bash
# E2E Test Environment Variables

# Test user credentials
E2E_CLERK_USER_USERNAME=test@pajamadot.com
E2E_CLERK_USER_PASSWORD=playwright@pajamadot

# Clerk API keys (copy from .env.local or Clerk Dashboard)
CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx
```

**Getting Clerk API Keys:**
1. Go to [Clerk Dashboard](https://dashboard.clerk.com/)
2. Select your application
3. Navigate to **API Keys** section
4. Copy the `Publishable key` and `Secret key`
5. Paste them into `.env.test`

### 3. Create Test User in Clerk

If you don't have a test user yet:

1. Go to Clerk Dashboard → **Users**
2. Click **Create User**
3. Use the credentials:
   - Email: `test@pajamadot.com`
   - Password: `playwright@pajamadot`
4. Verify the user is active

**Important:** This test user should:
- Have a simple password (for testing only)
- Not require email verification (disable in Clerk settings)
- Have appropriate permissions for your app

### 4. Configure Clerk for Testing

In your Clerk Dashboard, configure these settings for the test environment:

**Email/Phone → Email Settings:**
- ✅ Disable "Verify email address" for test environment
- Or use a pre-verified test user

**Authentication → Sign-in options:**
- ✅ Enable "Email address" with password
- ⚠️ Disable 2FA/MFA for test users

**Sessions:**
- Set longer session lifetime for testing (e.g., 24 hours)
- This prevents re-authentication during test runs

### 5. Verify Setup

Test the authentication setup:

```bash
# Run only the global setup
npx playwright test --grep "global setup"

# Check if authentication file was created
ls -la playwright/.clerk/user.json
```

If successful, you should see:
```
✓ Clerk testing token initialized
✓ Successfully signed in
✓ Authentication verified
✓ Authentication state saved
✓ Authentication file verified
```

## How It Works

### Global Setup Process

1. **Initialize Clerk Testing** (`global.setup.ts`)
   - Calls `clerkSetup()` to get testing token
   - Bypasses bot detection and rate limiting

2. **Authenticate User**
   - Uses `clerk.signIn()` with test credentials
   - Navigates through Clerk's sign-in flow
   - Waits for authentication to complete

3. **Save Session State**
   - Extracts cookies and localStorage
   - Saves to `playwright/.clerk/user.json`
   - This file contains the authenticated session

4. **Reuse in Tests**
   - All test projects load the saved state
   - Tests start already authenticated
   - No need to sign in for each test

### File Structure

```
apps/web/
├── .env.test                          # Test credentials (gitignored)
├── playwright.config.ts               # Loads auth state
├── playwright/.clerk/
│   └── user.json                     # Stored session (gitignored)
└── app/__tests__/e2e/
    ├── setup/
    │   └── global.setup.ts           # Authentication logic
    └── workflows/
        └── *.spec.ts                 # Tests (already authenticated)
```

## Usage in Tests

### Automatic Authentication (Default)

Most tests automatically use the stored authentication:

```typescript
import { test, expect } from '@playwright/test';
import { EditorHelpers } from '../helpers/editor-helpers';

test('should create geometry', async ({ page }) => {
  // Already authenticated!
  const editor = new EditorHelpers(page);
  await editor.navigateToEditor();

  // User is signed in, can access protected routes
  await editor.createNode('Box');
});
```

### Manual Token Injection (Advanced)

For tests that need to refresh the token:

```typescript
import { setupClerkTestingToken } from '@clerk/testing/playwright';

test('advanced test', async ({ page }) => {
  await setupClerkTestingToken({ page });
  // Proceed with test
});
```

## Troubleshooting

### Error: "Missing E2E_CLERK_USER_USERNAME"

**Solution:** Ensure `.env.test` exists with correct variables

```bash
# Check file exists
cat apps/web/.env.test

# Should contain:
E2E_CLERK_USER_USERNAME=test@pajamadot.com
E2E_CLERK_USER_PASSWORD=playwright@pajamadot
```

### Error: "Authentication file was not created"

**Possible causes:**
1. Clerk credentials are incorrect
2. Test user doesn't exist in Clerk
3. Network issues connecting to Clerk

**Solution:**
```bash
# Run with debug
DEBUG=clerk:* npx playwright test --grep "global setup" --headed

# Check Clerk dashboard for user
# Verify credentials are correct
```

### Error: "Authentication state file is empty"

**Solution:** Clear cache and re-authenticate

```bash
# Remove old auth file
rm -rf apps/web/playwright/.clerk/user.json

# Re-run global setup
npx playwright test --grep "global setup"
```

### Error: "User requires email verification"

**Solution:** In Clerk Dashboard:
- Go to **Email Settings**
- Disable email verification for test environment
- Or manually verify the test user

### Tests Fail with "Unauthorized"

**Possible causes:**
1. Session expired (rare with testing tokens)
2. Authentication state corrupted

**Solution:**
```bash
# Clear and regenerate auth
rm -rf apps/web/playwright/.clerk/user.json
npx playwright test --grep "global setup"

# Run tests again
npm run test:e2e
```

## CI/CD Configuration

### GitHub Actions

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - uses: actions/setup-node@v3
        with:
          node-version: 22

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright
        run: npx playwright install --with-deps chromium

      - name: Run E2E tests
        run: npm run test:e2e
        env:
          # Test user credentials (from GitHub Secrets)
          E2E_CLERK_USER_USERNAME: ${{ secrets.E2E_CLERK_USER_USERNAME }}
          E2E_CLERK_USER_PASSWORD: ${{ secrets.E2E_CLERK_USER_PASSWORD }}
          # Clerk API keys (from GitHub Secrets)
          CLERK_PUBLISHABLE_KEY: ${{ secrets.CLERK_PUBLISHABLE_KEY }}
          CLERK_SECRET_KEY: ${{ secrets.CLERK_SECRET_KEY }}

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
```

### Setting GitHub Secrets

1. Go to repository **Settings → Secrets → Actions**
2. Add the following secrets:
   - `E2E_CLERK_USER_USERNAME`
   - `E2E_CLERK_USER_PASSWORD`
   - `CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`

## Security Considerations

### Test User Security

- ✅ Use a dedicated test user (not your personal account)
- ✅ Use a simple, non-sensitive password (it's for testing)
- ✅ Restrict test user permissions if possible
- ✅ Don't use production API keys for testing

### Credential Storage

- ✅ `.env.test` is gitignored (never commit)
- ✅ Use GitHub Secrets for CI/CD
- ✅ `playwright/.clerk/user.json` is gitignored
- ⚠️ Test credentials should only work in test environment

### Best Practices

1. **Separate Test Environment**
   - Use Clerk's test environment/project
   - Don't test against production

2. **Rotate Credentials**
   - Change test user password periodically
   - Rotate API keys regularly

3. **Access Control**
   - Limit who has access to test credentials
   - Use different credentials for different CI environments

## Advanced Configuration

### Multiple Test Users

For testing different user roles:

```typescript
// global.setup.ts
setup('authenticate admin user', async ({ page }) => {
  await clerk.signIn({
    page,
    signInParams: {
      strategy: 'password',
      identifier: process.env.E2E_CLERK_ADMIN_USERNAME!,
      password: process.env.E2E_CLERK_ADMIN_PASSWORD!,
    },
  });
  await page.context().storageState({ path: 'playwright/.clerk/admin.json' });
});
```

Then in `playwright.config.ts`:

```typescript
projects: [
  {
    name: 'user tests',
    storageState: 'playwright/.clerk/user.json',
  },
  {
    name: 'admin tests',
    storageState: 'playwright/.clerk/admin.json',
  },
]
```

### Custom Authentication Flows

For OAuth or custom providers:

```typescript
await clerk.signIn({
  page,
  signInParams: {
    strategy: 'oauth_google',
    redirectUrl: 'http://localhost:3000/callback',
  },
});
```

## Resources

- [Clerk Testing Documentation](https://clerk.com/docs/testing/playwright)
- [Playwright Authentication Guide](https://playwright.dev/docs/auth)
- [@clerk/testing Package](https://www.npmjs.com/package/@clerk/testing)

## Support

If you encounter issues:

1. Check this guide's troubleshooting section
2. Review Clerk's [testing documentation](https://clerk.com/docs/testing)
3. Check Playwright's [debugging guide](https://playwright.dev/docs/debug)
4. Verify test user exists and is active in Clerk Dashboard
