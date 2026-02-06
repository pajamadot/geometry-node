/**
 * Playwright Global Setup
 * Handles Clerk authentication and stores session state
 */

import { clerk, clerkSetup } from '@clerk/testing/playwright';
import { test as setup, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

// Ensure .clerk directory exists
const clerkDir = path.join(__dirname, '../../playwright/.clerk');
if (!fs.existsSync(clerkDir)) {
  fs.mkdirSync(clerkDir, { recursive: true });
}

const authFile = path.join(clerkDir, 'user.json');

setup.describe.configure({ mode: 'serial' });

/**
 * Initialize Clerk testing token
 */
setup('initialize clerk testing', async ({}) => {
  await clerkSetup();
  console.log('✓ Clerk testing token initialized');
});

/**
 * Authenticate test user and save session state
 */
setup('authenticate and save state', async ({ page }) => {
  // Verify environment variables are set
  if (!process.env.E2E_CLERK_USER_USERNAME || !process.env.E2E_CLERK_USER_PASSWORD) {
    throw new Error(
      'Missing E2E_CLERK_USER_USERNAME or E2E_CLERK_USER_PASSWORD environment variables. ' +
      'Please set them in .env.test or your environment.'
    );
  }

  console.log('Authenticating test user:', process.env.E2E_CLERK_USER_USERNAME);

  // Navigate to home page
  await page.goto('/');

  // Check if already signed in
  const isSignedIn = await page.locator('[data-testid="user-button"]').isVisible().catch(() => false);

  if (!isSignedIn) {
    // Sign in with Clerk
    await clerk.signIn({
      page,
      signInParams: {
        strategy: 'password',
        identifier: process.env.E2E_CLERK_USER_USERNAME!,
        password: process.env.E2E_CLERK_USER_PASSWORD!,
      },
    });

    console.log('✓ Successfully signed in');
  } else {
    console.log('✓ Already signed in');
  }

  // Wait for authentication to complete
  await page.waitForLoadState('networkidle');

  // Verify we're authenticated by checking for user button or protected route
  await page.goto('/');

  // Wait for either user button or redirect to sign-in
  try {
    await page.waitForSelector('[data-testid="user-button"], [data-clerk-loaded="true"]', {
      timeout: 10000,
    });
    console.log('✓ Authentication verified');
  } catch (error) {
    console.error('Failed to verify authentication');
    throw error;
  }

  // Save authenticated state
  await page.context().storageState({ path: authFile });
  console.log('✓ Authentication state saved to:', authFile);
});

/**
 * Verify the authentication file was created
 */
setup('verify authentication file', async ({}) => {
  if (!fs.existsSync(authFile)) {
    throw new Error(`Authentication file was not created at ${authFile}`);
  }

  const state = JSON.parse(fs.readFileSync(authFile, 'utf8'));

  // Verify we have cookies/storage
  if ((!state.cookies || state.cookies.length === 0) &&
      (!state.origins || state.origins.length === 0)) {
    throw new Error('Authentication state file is empty or invalid');
  }

  console.log('✓ Authentication file verified');
  console.log(`  - Cookies: ${state.cookies?.length || 0}`);
  console.log(`  - Origins: ${state.origins?.length || 0}`);
});
