# Quick Start: E2E Tests with Clerk Authentication

## 🚀 Quick Setup (5 minutes)

### 1. Install Dependencies

```bash
cd apps/web
npm install
```

This installs:
- `@clerk/testing` - Clerk authentication for tests
- `@playwright/test` - Browser automation
- `dotenv` - Environment variable loading

### 2. Configure Clerk Credentials

Create `.env.test` file in `apps/web/`:

```bash
# Test user credentials
E2E_CLERK_USER_USERNAME=test@pajamadot.com
E2E_CLERK_USER_PASSWORD=playwright@pajamadot

# Clerk API keys (get from your .env.local or Clerk Dashboard)
CLERK_PUBLISHABLE_KEY=your_publishable_key_here
CLERK_SECRET_KEY=your_secret_key_here
```

**Where to find Clerk keys:**
1. Open your `.env.local` file (copy keys from there)
2. OR go to [Clerk Dashboard](https://dashboard.clerk.com/) → API Keys

### 3. Install Playwright Browsers

```bash
npx playwright install chromium firefox
```

### 4. Run Tests

```bash
# Run all E2E tests (authenticated)
npm run test:e2e

# Run with UI (visual debugger)
npm run test:e2e:ui

# Run in headed mode (see browser)
npm run test:e2e:headed

# Debug specific test
npm run test:e2e:debug
```

## ✅ Verify Setup

Test that authentication works:

```bash
# Run only authentication setup
npx playwright test --grep "global setup"
```

You should see:
```
✓ Clerk testing token initialized
✓ Successfully signed in
✓ Authentication verified
✓ Authentication state saved
```

## 📁 What Got Created

```
apps/web/
├── .env.test                          # Your test credentials (gitignored)
├── playwright/.clerk/
│   └── user.json                     # Stored auth session (gitignored)
├── playwright.config.ts               # Playwright configuration
└── app/__tests__/e2e/
    ├── setup/
    │   └── global.setup.ts           # Handles authentication
    ├── workflows/
    │   ├── basic-geometry-creation.spec.ts  (28 tests)
    │   ├── ai-generation.spec.ts            (19 tests)
    │   └── export-import.spec.ts            (22 tests)
    ├── visual/
    │   └── primitives-rendering.spec.ts     (20 tests)
    ├── performance/
    │   └── large-graphs.spec.ts             (15 tests)
    └── helpers/
        └── editor-helpers.ts                (Helper functions)
```

## 🎯 Test Execution Flow

1. **Global Setup** (Runs once before all tests)
   - Authenticates with Clerk using test credentials
   - Saves session to `playwright/.clerk/user.json`

2. **Tests Run** (All tests use saved session)
   - Already authenticated
   - No login required
   - Fast execution

3. **Test Reports** (Generated after tests)
   - HTML report: `playwright-report/index.html`
   - Screenshots/videos on failure

## 🧪 Running Different Test Suites

```bash
# Run specific test file
npx playwright test workflows/basic-geometry-creation.spec.ts

# Run specific test category
npx playwright test workflows/
npx playwright test visual/
npx playwright test performance/

# Run only on Chromium
npx playwright test --project=chromium

# Run with specific timeout
npx playwright test --timeout=120000

# Run and update visual snapshots
npx playwright test --update-snapshots
```

## 🐛 Debugging

### View Test Report

```bash
npm run test:e2e:report
```

### Debug Mode (Inspector)

```bash
npm run test:e2e:debug
```

### Headed Mode (See Browser)

```bash
npm run test:e2e:headed
```

### Verbose Logging

```bash
DEBUG=pw:api npx playwright test
```

## ⚡ Quick Commands

```bash
# Development workflow
npm run dev                    # Start dev server (terminal 1)
npm run test:e2e:ui           # Run E2E tests with UI (terminal 2)

# Pre-commit checks
npm test                       # Unit tests
npm run test:e2e              # E2E tests
npm run lint                  # Linting

# CI/CD simulation
npm run test:coverage         # Unit test coverage
npm run test:e2e              # E2E tests
```

## 📊 Test Coverage

| Category | Tests | Description |
|----------|-------|-------------|
| **Workflows** | 69 | Complete user journeys |
| **Visual** | 20 | Rendering consistency |
| **Performance** | 15 | FPS & memory tests |
| **TOTAL** | **104** | Full E2E coverage |

## 🔧 Troubleshooting

### "Missing E2E_CLERK_USER_USERNAME"

**Fix:** Create `.env.test` with credentials:
```bash
cat > .env.test << EOF
E2E_CLERK_USER_USERNAME=test@pajamadot.com
E2E_CLERK_USER_PASSWORD=playwright@pajamadot
CLERK_PUBLISHABLE_KEY=your_key
CLERK_SECRET_KEY=your_key
EOF
```

### "Authentication file was not created"

**Fix:** Run authentication setup:
```bash
rm -rf playwright/.clerk/
npx playwright test --grep "global setup"
```

### "Test user doesn't exist"

**Fix:** Verify test user in [Clerk Dashboard](https://dashboard.clerk.com/):
1. Go to **Users** section
2. Check that `test@pajamadot.com` exists
3. Verify user is active (not suspended)

### Tests timeout/hang

**Fix:** Increase timeouts in `playwright.config.ts`:
```typescript
timeout: 120 * 1000,  // 2 minutes per test
```

## 📚 Documentation

- **E2E_CLERK_SETUP.md** - Detailed Clerk authentication setup
- **E2E_TESTING_GUIDE.md** - Complete testing guide (500+ lines)
- **COMPLETE_TESTING_STRATEGY.md** - Overall testing strategy

## 🎓 Example Test

```typescript
import { test, expect } from '@playwright/test';
import { EditorHelpers } from '../helpers/editor-helpers';

test('create and modify geometry', async ({ page }) => {
  // Helper provides high-level functions
  const editor = new EditorHelpers(page);

  // Navigate (already authenticated!)
  await editor.navigateToEditor();

  // Create nodes
  await editor.createNode('Box');
  await editor.setNodeParameter('box', 'width', 2);

  // Execute and verify
  await editor.executeGraph();
  const stats = await editor.getGeometryStats();

  expect(stats.vertices).toBeGreaterThan(0);
});
```

## 🚀 Next Steps

1. ✅ Run `npm run test:e2e` to verify everything works
2. ✅ Explore tests in `app/__tests__/e2e/workflows/`
3. ✅ Check visual snapshots in `app/__tests__/e2e/visual/`
4. ✅ Review performance tests in `app/__tests__/e2e/performance/`
5. ✅ Write your own tests using the helper functions

## 💡 Tips

- Use `test:e2e:ui` for interactive development
- Update snapshots with `--update-snapshots` when rendering changes
- Run performance tests separately (they're slow)
- Use `--grep` to run specific test suites
- Check `playwright-report/` after failures for detailed info

## 🎉 You're Ready!

Your E2E testing infrastructure is now set up and ready to use. All tests run with Clerk authentication automatically. Happy testing! 🚀
